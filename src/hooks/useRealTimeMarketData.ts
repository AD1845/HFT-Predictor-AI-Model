
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface RealTimeMarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  timestamp: string
}

export const useRealTimeMarketData = (symbols: string[], refreshInterval = 5000) => {
  const [data, setData] = useState<RealTimeMarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMarketData = async () => {
    try {
      setError(null)
      
      // First try to get cached data from database (reduced cache time for more real-time updates)
      const { data: cachedData, error: dbError } = await supabase
        .from('market_data')
        .select('*')
        .in('symbol', symbols)
        .eq('data_source', 'real_time_hft')
        .order('last_updated', { ascending: false })

      if (dbError) {
        console.error('Database error:', dbError)
      }

      // Check if we need fresh data (older than 10 seconds for high-frequency updates)
      const needsFreshData = !cachedData || cachedData.length === 0 || 
        cachedData.some(item => {
          const lastUpdate = new Date(item.last_updated).getTime()
          const now = Date.now()
          return now - lastUpdate > 10000 // 10 seconds for real-time accuracy
        })

      if (needsFreshData) {
        // Fetch fresh data from enhanced real-time endpoint with global market coverage
        const { data: freshData, error: functionError } = await supabase.functions.invoke('real-time-hft-data', {
          body: { 
            symbols,
            markets: ['stocks', 'crypto', 'forex', 'etf'],
            realtime: true
          }
        })

        if (functionError) {
          throw functionError
        }

        if (freshData?.success && freshData?.data) {
          const formattedData = freshData.data.map((item: any) => ({
            symbol: item.symbol,
            price: item.price,
            change: item.change,
            changePercent: item.changePercent,
            volume: item.volume,
            marketCap: item.marketCap,
            timestamp: item.timestamp
          }))
          setData(formattedData)
        }
      } else {
        // Use cached data
        const formattedData = cachedData.map(item => ({
          symbol: item.symbol,
          price: Number(item.price),
          change: Number(item.change_amount),
          changePercent: Number(item.change_percent),
          volume: Number(item.volume),
          marketCap: item.market_cap ? Number(item.market_cap) : undefined,
          timestamp: item.last_updated
        }))
        setData(formattedData)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error fetching market data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch market data')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketData()

    // Set up interval for periodic updates
    const interval = setInterval(fetchMarketData, refreshInterval)

    return () => clearInterval(interval)
  }, [symbols.join(','), refreshInterval])

  return { data, loading, error, refetch: fetchMarketData }
}

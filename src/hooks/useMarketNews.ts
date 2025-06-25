
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface MarketNews {
  id: string
  title: string
  description: string
  url: string
  published_at: string
  source: string
  symbols: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
}

export const useMarketNews = (refreshInterval = 300000) => { // 5 minutes
  const [news, setNews] = useState<MarketNews[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNews = async () => {
    try {
      setError(null)
      
      const { data, error } = await supabase.functions.invoke('fetch-market-news')

      if (error) {
        throw error
      }

      if (data?.success && data?.data) {
        setNews(data.data)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error fetching market news:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch market news')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()

    const interval = setInterval(fetchNews, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  return { news, loading, error, refetch: fetchNews }
}

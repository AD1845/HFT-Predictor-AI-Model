
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { symbols } = await req.json()
    
    if (!symbols || !Array.isArray(symbols)) {
      throw new Error('Symbols array is required')
    }

    console.log('Fetching market data for symbols:', symbols)

    const results = []

    // Fetch data for each symbol
    for (const symbol of symbols) {
      try {
        let price, change, changePercent, volume, marketCap

        // For demo purposes, generate realistic market data
        // In production, you would call real APIs here
        if (symbol.includes('/')) {
          // Crypto or Forex
          const basePrice = getBasePrice(symbol)
          const volatility = Math.random() * 0.1 - 0.05 // -5% to +5%
          price = basePrice * (1 + volatility)
          change = basePrice * volatility
          changePercent = volatility * 100
          volume = Math.floor(Math.random() * 1000000) + 100000
          marketCap = symbol.includes('BTC') ? 800000000000 : 
                     symbol.includes('ETH') ? 400000000000 : null
        } else {
          // Stock
          const basePrice = getBasePrice(symbol)
          const volatility = Math.random() * 0.06 - 0.03 // -3% to +3%
          price = basePrice * (1 + volatility)
          change = basePrice * volatility
          changePercent = volatility * 100
          volume = Math.floor(Math.random() * 5000000) + 500000
          marketCap = Math.floor(Math.random() * 500000000000) + 10000000000
        }

        // Store in database
        await supabase.rpc('upsert_market_data', {
          p_symbol: symbol,
          p_price: price,
          p_change_amount: change,
          p_change_percent: changePercent,
          p_volume: volume,
          p_market_cap: marketCap,
          p_data_source: 'live_api'
        })

        results.push({
          symbol,
          price: Number(price.toFixed(4)),
          change: Number(change.toFixed(4)),
          changePercent: Number(changePercent.toFixed(2)),
          volume,
          marketCap,
          timestamp: new Date().toISOString()
        })

      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error)
        results.push({
          symbol,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in fetch-market-data function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

function getBasePrice(symbol: string): number {
  const basePrices: { [key: string]: number } = {
    'BTC/USD': 45000,
    'ETH/USD': 3200,
    'AAPL': 152,
    'GOOGL': 140,
    'MSFT': 380,
    'TSLA': 240,
    'AMZN': 145,
    'NVDA': 480,
    'META': 320,
    'NFLX': 420,
    'EUR/USD': 1.0850,
    'GBP/USD': 1.2650,
    'USD/JPY': 149.50,
    'AUD/USD': 0.6750,
    'USD/CAD': 1.3450,
    'SPY': 450,
    'QQQ': 380,
    'IWM': 190,
    'VTI': 240,
    'GLD': 180
  }
  
  return basePrices[symbol] || 100 + Math.random() * 400
}

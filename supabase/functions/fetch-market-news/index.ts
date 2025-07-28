
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://aqsqtsjiplzjilhtkhnw.supabase.co',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Fetching market news...')

    // Generate sample news data
    // In production, you would call real news APIs here
    const sampleNews = [
      {
        title: "Bitcoin Surges as Institutional Adoption Continues",
        description: "Major corporations announce new Bitcoin treasury allocations, driving price momentum.",
        url: "https://example.com/btc-news-1",
        published_at: new Date(Date.now() - 3600000).toISOString(),
        source: "CryptoNews",
        symbols: ["BTC/USD"],
        sentiment: "positive"
      },
      {
        title: "Tech Stocks Rally on Strong Earnings Outlook",
        description: "Technology sector shows resilience with better-than-expected quarterly results.",
        url: "https://example.com/tech-news-1",
        published_at: new Date(Date.now() - 7200000).toISOString(),
        source: "MarketWatch",
        symbols: ["AAPL", "GOOGL", "MSFT"],
        sentiment: "positive"
      },
      {
        title: "Federal Reserve Signals Potential Rate Adjustments",
        description: "Fed officials hint at monetary policy changes in upcoming meetings.",
        url: "https://example.com/fed-news-1",
        published_at: new Date(Date.now() - 10800000).toISOString(),
        source: "Financial Times",
        symbols: ["SPY", "EUR/USD", "GBP/USD"],
        sentiment: "neutral"
      },
      {
        title: "Ethereum Network Upgrade Shows Promise",
        description: "Latest protocol improvements enhance scalability and reduce transaction costs.",
        url: "https://example.com/eth-news-1",
        published_at: new Date(Date.now() - 14400000).toISOString(),
        source: "CoinDesk",
        symbols: ["ETH/USD"],
        sentiment: "positive"
      },
      {
        title: "Tesla Production Numbers Beat Expectations",
        description: "Electric vehicle manufacturer reports strong quarterly delivery figures.",
        url: "https://example.com/tsla-news-1",
        published_at: new Date(Date.now() - 18000000).toISOString(),
        source: "Reuters",
        symbols: ["TSLA"],
        sentiment: "positive"
      }
    ]

    // Store news in database
    for (const news of sampleNews) {
      const { error } = await supabase
        .from('market_news')
        .upsert(news)

      if (error) {
        console.error('Error storing news:', error)
      }
    }

    // Fetch latest news from database
    const { data: latestNews, error } = await supabase
      .from('market_news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: latestNews 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in fetch-market-news function:', error)
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

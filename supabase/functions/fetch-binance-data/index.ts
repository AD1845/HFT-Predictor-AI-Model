import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BinanceTickerData {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  volume: string;
  quoteVolume: string;
}

interface AlpacaBarData {
  symbol: string;
  close: number;
  volume: number;
  vwap: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols, source = 'binance', interval = '1m' } = await req.json();
    
    console.log(`Fetching ${source} data for symbols:`, symbols);
    
    let marketData: any[] = [];

    if (source === 'binance') {
      // Fetch from Binance API
      const binanceSymbols = symbols
        .map((s: string) => s.replace('/', ''))
        .filter((s: string) => s.includes('USD') || s.includes('BTC') || s.includes('ETH'));

      if (binanceSymbols.length > 0) {
        const binanceUrl = `https://api.binance.com/api/v3/ticker/24hr`;
        const response = await fetch(binanceUrl);
        const allTickers: BinanceTickerData[] = await response.json();
        
        const relevantTickers = allTickers.filter(ticker => 
          binanceSymbols.some(symbol => ticker.symbol === symbol.replace('/', ''))
        );

        marketData = relevantTickers.map(ticker => ({
          symbol: ticker.symbol.includes('USDT') ? `${ticker.symbol.replace('USDT', '')}/USD` : ticker.symbol,
          price: parseFloat(ticker.price),
          change: parseFloat(ticker.priceChange),
          changePercent: parseFloat(ticker.priceChangePercent),
          volume: parseFloat(ticker.volume),
          quoteVolume: parseFloat(ticker.quoteVolume),
          timestamp: new Date().toISOString(),
          source: 'binance'
        }));
      }

      // Add stock symbols with simulated data for demo
      const stockSymbols = symbols.filter((s: string) => 
        !s.includes('/') && ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'META'].includes(s)
      );

      for (const symbol of stockSymbols) {
        const basePrice = getBasePrice(symbol);
        const change = (Math.random() - 0.5) * basePrice * 0.02;
        const changePercent = (change / basePrice) * 100;

        marketData.push({
          symbol,
          price: basePrice + change,
          change,
          changePercent,
          volume: Math.floor(Math.random() * 10000000) + 1000000,
          timestamp: new Date().toISOString(),
          source: 'simulated'
        });
      }
    } else if (source === 'alpaca') {
      // Alpaca integration would go here
      // For demo, using simulated data
      for (const symbol of symbols) {
        const basePrice = getBasePrice(symbol);
        const change = (Math.random() - 0.5) * basePrice * 0.015;
        
        marketData.push({
          symbol,
          price: basePrice + change,
          change,
          changePercent: (change / basePrice) * 100,
          volume: Math.floor(Math.random() * 5000000) + 500000,
          vwap: basePrice + change * 0.8,
          timestamp: new Date().toISOString(),
          source: 'alpaca'
        });
      }
    }

    // Store in database for caching
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    for (const data of marketData) {
      await supabase
        .from('market_data')
        .upsert({
          symbol: data.symbol,
          price: data.price,
          change_amount: data.change,
          change_percent: data.changePercent,
          volume: data.volume,
          market_cap: data.quoteVolume || null,
          data_source: data.source,
          last_updated: data.timestamp
        }, {
          onConflict: 'symbol,data_source'
        });
    }

    console.log(`Successfully fetched and cached ${marketData.length} symbols`);

    return new Response(
      JSON.stringify({
        success: true,
        data: marketData,
        count: marketData.length,
        source,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error fetching market data:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    'BTC/USD': 43000,
    'ETH/USD': 2600,
    'AAPL': 180,
    'GOOGL': 140,
    'MSFT': 380,
    'TSLA': 240,
    'NVDA': 480,
    'META': 320,
    'BTCUSDT': 43000,
    'ETHUSDT': 2600
  };
  
  return prices[symbol] || Math.random() * 1000 + 100;
}
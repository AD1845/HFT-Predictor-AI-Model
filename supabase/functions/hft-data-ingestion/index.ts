import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://aqsqtsjiplzjilhtkhnw.supabase.co',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TickData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
  exchange: string;
  bid?: number;
  ask?: number;
  spread?: number;
}

interface OrderBookData {
  symbol: string;
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
  exchange: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { symbols, exchanges } = await req.json();
    console.log(`Starting data ingestion for symbols: ${symbols}, exchanges: ${exchanges}`);

    const allTickData: TickData[] = [];
    const allOrderBookData: OrderBookData[] = [];
    const feedStatus = new Map<string, any>();

    // Binance Data Ingestion
    if (exchanges.includes('binance')) {
      try {
        const binanceData = await fetchBinanceData(symbols);
        allTickData.push(...binanceData.ticks);
        allOrderBookData.push(...binanceData.orderBooks);
        feedStatus.set('binance', { status: 'connected', latency: binanceData.latency, messageCount: binanceData.ticks.length });
      } catch (error) {
        console.error('Binance fetch error:', error);
        feedStatus.set('binance', { status: 'error', latency: 0, messageCount: 0 });
      }
    }

    // Alpaca Data Ingestion (simulated)
    if (exchanges.includes('alpaca')) {
      try {
        const alpacaData = await fetchAlpacaData(symbols);
        allTickData.push(...alpacaData.ticks);
        feedStatus.set('alpaca', { status: 'connected', latency: alpacaData.latency, messageCount: alpacaData.ticks.length });
      } catch (error) {
        console.error('Alpaca fetch error:', error);
        feedStatus.set('alpaca', { status: 'error', latency: 0, messageCount: 0 });
      }
    }

    // Polygon.io Data Ingestion (simulated)
    if (exchanges.includes('polygon')) {
      try {
        const polygonData = await fetchPolygonData(symbols);
        allTickData.push(...polygonData.ticks);
        feedStatus.set('polygon', { status: 'connected', latency: polygonData.latency, messageCount: polygonData.ticks.length });
      } catch (error) {
        console.error('Polygon fetch error:', error);
        feedStatus.set('polygon', { status: 'error', latency: 0, messageCount: 0 });
      }
    }

    // Timestamp alignment and deduplication
    const alignedData = timestampAlignmentAndDedup(allTickData);
    const alignedOrderBooks = deduplicateOrderBooks(allOrderBookData);

    // Store in database
    await storeTicks(supabase, alignedData);
    await storeOrderBooks(supabase, alignedOrderBooks);

    console.log(`Processed ${alignedData.length} tick records and ${alignedOrderBooks.length} order book updates`);

    return new Response(
      JSON.stringify({
        success: true,
        tickCount: alignedData.length,
        orderBookCount: alignedOrderBooks.length,
        feedStatus: Object.fromEntries(feedStatus),
        timestamp: Date.now()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('HFT data ingestion error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function fetchBinanceData(symbols: string[]) {
  const startTime = Date.now();
  const ticks: TickData[] = [];
  const orderBooks: OrderBookData[] = [];

  try {
    // Fetch 24hr ticker data
    const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    const tickerData = await tickerResponse.json();

    // Fetch order book data
    for (const symbol of symbols) {
      const binanceSymbol = symbol.replace('/', '').replace('USD', 'USDT');
      
      try {
        const bookResponse = await fetch(`https://api.binance.com/api/v3/depth?symbol=${binanceSymbol}&limit=10`);
        const bookData = await bookResponse.json();
        
        const ticker = tickerData.find((t: any) => t.symbol === binanceSymbol);
        if (ticker) {
          ticks.push({
            symbol,
            price: parseFloat(ticker.lastPrice),
            volume: parseFloat(ticker.volume),
            timestamp: Date.now(),
            exchange: 'binance',
            bid: parseFloat(bookData.bids[0]?.[0] || ticker.bidPrice),
            ask: parseFloat(bookData.asks[0]?.[0] || ticker.askPrice),
            spread: parseFloat(bookData.asks[0]?.[0] || ticker.askPrice) - parseFloat(bookData.bids[0]?.[0] || ticker.bidPrice)
          });

          orderBooks.push({
            symbol,
            bids: bookData.bids.slice(0, 5).map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
            asks: bookData.asks.slice(0, 5).map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
            timestamp: Date.now(),
            exchange: 'binance'
          });
        }
      } catch (error) {
        console.error(`Error fetching ${symbol} from Binance:`, error);
      }
    }
  } catch (error) {
    console.error('Binance API error:', error);
  }

  return { ticks, orderBooks, latency: Date.now() - startTime };
}

async function fetchAlpacaData(symbols: string[]) {
  const startTime = Date.now();
  const ticks: TickData[] = [];

  // Simulated Alpaca data for demo
  for (const symbol of symbols) {
    const basePrice = getBasePrice(symbol);
    const price = basePrice * (1 + (Math.random() - 0.5) * 0.01);
    
    ticks.push({
      symbol,
      price,
      volume: Math.floor(Math.random() * 100000) + 10000,
      timestamp: Date.now(),
      exchange: 'alpaca',
      bid: price * 0.9995,
      ask: price * 1.0005,
      spread: price * 0.001
    });
  }

  return { ticks, latency: Date.now() - startTime };
}

async function fetchPolygonData(symbols: string[]) {
  const startTime = Date.now();
  const ticks: TickData[] = [];

  // Simulated Polygon data for demo
  for (const symbol of symbols) {
    const basePrice = getBasePrice(symbol);
    const price = basePrice * (1 + (Math.random() - 0.5) * 0.005);
    
    ticks.push({
      symbol,
      price,
      volume: Math.floor(Math.random() * 50000) + 5000,
      timestamp: Date.now(),
      exchange: 'polygon',
      bid: price * 0.9998,
      ask: price * 1.0002,
      spread: price * 0.0004
    });
  }

  return { ticks, latency: Date.now() - startTime };
}

function timestampAlignmentAndDedup(ticks: TickData[]): TickData[] {
  // Sort by timestamp
  ticks.sort((a, b) => a.timestamp - b.timestamp);
  
  // Deduplicate based on symbol, exchange, and timestamp (within 1ms tolerance)
  const deduped: TickData[] = [];
  const seen = new Set<string>();
  
  for (const tick of ticks) {
    const key = `${tick.symbol}-${tick.exchange}-${Math.floor(tick.timestamp / 10)}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(tick);
    }
  }
  
  return deduped;
}

function deduplicateOrderBooks(orderBooks: OrderBookData[]): OrderBookData[] {
  const latest = new Map<string, OrderBookData>();
  
  for (const book of orderBooks) {
    const key = `${book.symbol}-${book.exchange}`;
    if (!latest.has(key) || latest.get(key)!.timestamp < book.timestamp) {
      latest.set(key, book);
    }
  }
  
  return Array.from(latest.values());
}

async function storeTicks(supabase: any, ticks: TickData[]) {
  if (ticks.length === 0) return;
  
  const { error } = await supabase
    .from('tick_data')
    .upsert(ticks.map(tick => ({
      symbol: tick.symbol,
      price: tick.price,
      volume: tick.volume,
      timestamp: new Date(tick.timestamp).toISOString(),
      exchange: tick.exchange,
      bid: tick.bid,
      ask: tick.ask,
      spread: tick.spread
    })));
    
  if (error) {
    console.error('Error storing ticks:', error);
  }
}

async function storeOrderBooks(supabase: any, orderBooks: OrderBookData[]) {
  if (orderBooks.length === 0) return;
  
  const { error } = await supabase
    .from('order_book_data')
    .upsert(orderBooks.map(book => ({
      symbol: book.symbol,
      bids: book.bids,
      asks: book.asks,
      timestamp: new Date(book.timestamp).toISOString(),
      exchange: book.exchange
    })));
    
  if (error) {
    console.error('Error storing order books:', error);
  }
}

function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    'BTC/USD': 43000,
    'ETH/USD': 2600,
    'AAPL': 180,
    'GOOGL': 140,
    'MSFT': 380,
    'TSLA': 240,
    'NVDA': 480,
    'META': 320
  };
  
  return prices[symbol] || 100;
}
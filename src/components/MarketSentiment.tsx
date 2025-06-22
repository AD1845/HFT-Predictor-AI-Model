
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, MessageCircle, Users, BarChart3 } from 'lucide-react';
import { MarketSentiment as SentimentData, generateMarketSentiment, marketAssets } from '../utils/hftData';

const MarketSentiment = () => {
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);

  useEffect(() => {
    const cryptoSymbols = Object.keys(marketAssets).filter(symbol => 
      marketAssets[symbol as keyof typeof marketAssets].type === 'crypto'
    ).slice(0, 6);

    const generateSentiments = () => {
      const sentiments = cryptoSymbols.map(symbol => generateMarketSentiment(symbol));
      setSentimentData(sentiments);
    };

    generateSentiments();
    const interval = setInterval(generateSentiments, 5000);

    return () => clearInterval(interval);
  }, []);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-trading-green bg-trading-green/10 border-trading-green/20';
      case 'bearish': return 'text-trading-red bg-trading-red/10 border-trading-red/20';
      default: return 'text-trading-yellow bg-trading-yellow/10 border-trading-yellow/20';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="w-4 h-4" />;
      case 'bearish': return <TrendingDown className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-6 h-6 text-trading-orange" />
          <div>
            <h2 className="text-lg font-semibold text-trading-text">Market Sentiment</h2>
            <div className="text-sm text-trading-muted">Social & news analysis</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sentimentData.map((data) => (
          <div 
            key={data.symbol}
            className="bg-trading-bg rounded-lg p-4 border border-trading-border hover:border-trading-orange/50 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-trading-text">{data.symbol}</span>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getSentimentColor(data.sentiment)}`}>
                  {getSentimentIcon(data.sentiment)}
                  <span className="capitalize">{data.sentiment}</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-trading-muted">Score</div>
                <div className={`font-mono font-bold ${
                  data.score > 0 ? 'text-trading-green' : 
                  data.score < 0 ? 'text-trading-red' : 'text-trading-muted'
                }`}>
                  {data.score > 0 ? '+' : ''}{data.score.toFixed(0)}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3 text-trading-muted" />
                  <span className="text-trading-muted">Social:</span>
                  <span className="font-mono text-trading-text">{data.socialMentions.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <BarChart3 className="w-3 h-3 text-trading-muted" />
                  <span className="text-trading-muted">Volume 24h:</span>
                  <span className="font-mono text-trading-cyan">${(data.volume24h / 1e6).toFixed(1)}M</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketSentiment;

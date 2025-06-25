
import React from 'react';
import { TrendingUp, TrendingDown, MessageCircle, Users, BarChart3, ExternalLink } from 'lucide-react';
import { useMarketNews } from '../hooks/useMarketNews';

const MarketSentiment = () => {
  const { news, loading, error } = useMarketNews();

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-trading-green bg-trading-green/10 border-trading-green/20';
      case 'negative': return 'text-trading-red bg-trading-red/10 border-trading-red/20';
      default: return 'text-trading-yellow bg-trading-yellow/10 border-trading-yellow/20';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4" />;
      case 'negative': return <TrendingDown className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-trading-surface rounded-lg border border-trading-border p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-trading-orange" />
            <div>
              <h2 className="text-lg font-semibold text-trading-text">Market Sentiment</h2>
              <div className="text-sm text-trading-muted">Loading news & analysis...</div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-trading-bg rounded-lg p-4 border border-trading-border animate-pulse">
              <div className="h-4 bg-trading-border rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-trading-border rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-trading-surface rounded-lg border border-trading-border p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-trading-orange" />
            <div>
              <h2 className="text-lg font-semibold text-trading-text">Market Sentiment</h2>
              <div className="text-sm text-trading-red">Error loading news: {error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-6 h-6 text-trading-orange" />
          <div>
            <h2 className="text-lg font-semibold text-trading-text">Market Sentiment</h2>
            <div className="text-sm text-trading-muted">Live news & analysis</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {news.slice(0, 6).map((item) => (
          <div 
            key={item.id}
            className="bg-trading-bg rounded-lg p-4 border border-trading-border hover:border-trading-orange/50 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getSentimentColor(item.sentiment)}`}>
                    {getSentimentIcon(item.sentiment)}
                    <span className="capitalize">{item.sentiment}</span>
                  </div>
                  <div className="text-xs text-trading-muted">
                    {item.source} • {new Date(item.published_at).toLocaleDateString()}
                  </div>
                </div>
                
                <h3 className="font-medium text-trading-text text-sm mb-2 line-clamp-2">
                  {item.title}
                </h3>
                
                {item.description && (
                  <p className="text-xs text-trading-muted mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {item.symbols && item.symbols.length > 0 && (
                      <div className="flex space-x-1">
                        {item.symbols.slice(0, 3).map((symbol) => (
                          <span 
                            key={symbol}
                            className="px-2 py-1 bg-trading-surface rounded text-xs font-mono text-trading-cyan"
                          >
                            {symbol}
                          </span>
                        ))}
                        {item.symbols.length > 3 && (
                          <span className="text-xs text-trading-muted">
                            +{item.symbols.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-trading-blue hover:text-trading-blue/80 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {news.length === 0 && (
        <div className="text-center py-4 text-trading-muted">
          No recent news available
        </div>
      )}
    </div>
  );
};

export default MarketSentiment;

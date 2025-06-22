
import React from 'react';
import TradingHeader from '../components/TradingHeader';
import MarketOverview from '../components/MarketOverview';
import PredictionPanel from '../components/PredictionPanel';
import StrategyPanel from '../components/StrategyPanel';
import RealTimeChart from '../components/RealTimeChart';
import MarketSentiment from '../components/MarketSentiment';

const Index = () => {
  return (
    <div className="min-h-screen bg-trading-bg">
      <TradingHeader />
      
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Market Overview */}
        <MarketOverview />
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Chart - Takes 2 columns on xl screens */}
          <div className="xl:col-span-2">
            <RealTimeChart />
          </div>
          
          {/* Predictions */}
          <div className="xl:col-span-1">
            <PredictionPanel />
          </div>
          
          {/* Market Sentiment */}
          <div className="xl:col-span-1">
            <MarketSentiment />
          </div>
        </div>
        
        {/* Strategy Panel */}
        <StrategyPanel />
      </div>
    </div>
  );
};

export default Index;

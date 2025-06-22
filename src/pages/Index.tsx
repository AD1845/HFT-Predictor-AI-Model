
import React from 'react';
import TradingHeader from '../components/TradingHeader';
import MarketOverview from '../components/MarketOverview';
import PredictionPanel from '../components/PredictionPanel';
import StrategyPanel from '../components/StrategyPanel';
import RealTimeChart from '../components/RealTimeChart';

const Index = () => {
  return (
    <div className="min-h-screen bg-trading-bg">
      <TradingHeader />
      
      <div className="p-6 space-y-6">
        {/* Market Overview */}
        <MarketOverview />
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <RealTimeChart />
          </div>
          
          {/* Predictions */}
          <div>
            <PredictionPanel />
          </div>
        </div>
        
        {/* Strategy Panel */}
        <StrategyPanel />
      </div>
    </div>
  );
};

export default Index;

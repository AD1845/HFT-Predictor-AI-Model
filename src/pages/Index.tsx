
import React from 'react';
import TradingHeader from '../components/TradingHeader';
import MarketOverview from '../components/MarketOverview';
import RealTimeChart from '../components/Real-TimeChart';
import HFTPredictor from '../components/HFTPredictor';
import LiveDataDashboard from '../components/LiveDataDashboard';
import MarketSentiment from '../components/MarketSentiment';
import PortfolioAnalytics from '../components/PortfolioAnalytics';
import LiveTradingPanel from '../components/LiveTradingPanel';
import AITradingBot from '../components/AITradingBot';
import PredictionPanel from '../components/PredictionPanel';
import StrategyPanel from '../components/StrategyPanel';
import SecureTradingForm from '../components/SecureTradingForm';
import NotificationSystem from '../components/NotificationSystem';

const Index = () => {
  return (
    <div className="min-h-screen bg-trading-bg">
      <TradingHeader />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* HFT AI Predictor - Main Feature */}
        <HFTPredictor />
        
        {/* Live Data Dashboard */}
        <LiveDataDashboard />
        
        {/* Market Overview and Real-time Chart */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <MarketOverview />
          <RealTimeChart />
        </div>
        
        {/* Market Sentiment and Portfolio Analytics */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <MarketSentiment />
          <PortfolioAnalytics />
        </div>
        
        {/* Trading Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <LiveTradingPanel />
          <AITradingBot />
          <PredictionPanel />
        </div>
        
        {/* Strategy and Trading Forms */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <StrategyPanel />
          <SecureTradingForm />
        </div>
      </div>
      
      <NotificationSystem />
    </div>
  );
};

export default Index;

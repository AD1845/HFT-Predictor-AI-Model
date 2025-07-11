
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
import { useToast } from '../components/ui/use-toast';

const Index = () => {
  const { toast } = useToast();

  const handleTradeSubmit = async (trade: { symbol: string; amount: number; type: 'buy' | 'sell' }) => {
    try {
      console.log('Executing trade:', trade);
      
      // Simulate trade execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Trade Executed Successfully',
        description: `${trade.type.toUpperCase()} order for $${trade.amount.toLocaleString()} of ${trade.symbol} has been processed.`,
      });
    } catch (error) {
      console.error('Trade execution failed:', error);
      throw error;
    }
  };

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
          <SecureTradingForm onSubmit={handleTradeSubmit} />
        </div>
      </div>
      
      <NotificationSystem />
    </div>
  );
};

export default Index;

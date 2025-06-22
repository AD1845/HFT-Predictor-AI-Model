
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, HelpCircle, TrendingUp, AlertTriangle, BarChart3, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: number;
  category?: 'analysis' | 'strategy' | 'risk' | 'general';
}

const AITradingBot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m your HFT Trading AI Assistant. I can help you with market analysis, trading strategies, risk management, and technical questions. How can I assist you today?',
      timestamp: Date.now(),
      category: 'general'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickCommands = [
    { label: 'Market Analysis', command: 'Analyze current market conditions for BTC/USD', icon: BarChart3 },
    { label: 'Risk Assessment', command: 'What are the current risk factors I should consider?', icon: AlertTriangle },
    { label: 'Strategy Help', command: 'Suggest an optimal HFT strategy for current volatility', icon: TrendingUp },
    { label: 'Technical Support', command: 'Help me understand order book imbalances', icon: HelpCircle }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = (userMessage: string): Message => {
    const lowerMessage = userMessage.toLowerCase();
    let response = '';
    let category: 'analysis' | 'strategy' | 'risk' | 'general' = 'general';

    if (lowerMessage.includes('risk') || lowerMessage.includes('loss') || lowerMessage.includes('manage')) {
      category = 'risk';
      response = `🛡️ **Risk Management Insights:**

For HFT trading, consider these key risk factors:

• **Position Sizing**: Never risk more than 1-2% per trade
• **Stop Loss**: Set tight stops at 0.1-0.3% for HFT strategies  
• **Market Volatility**: Current VIX indicates ${Math.random() > 0.5 ? 'elevated' : 'moderate'} risk
• **Liquidity Risk**: Monitor bid-ask spreads closely during volatile periods
• **Technology Risk**: Ensure low-latency execution and backup systems

**Current Risk Level**: ${Math.random() > 0.3 ? 'MODERATE' : 'HIGH'} - Adjust position sizes accordingly.`;

    } else if (lowerMessage.includes('strategy') || lowerMessage.includes('trading') || lowerMessage.includes('hft')) {
      category = 'strategy';
      response = `⚡ **HFT Strategy Recommendations:**

Based on current market microstructure:

• **Momentum Scalping** - ${Math.random() > 0.5 ? '✅ Favorable' : '⚠️ Cautious'} conditions
  - Target: 2-5 tick profits on high-volume pairs
  - Timeframe: 1-15 seconds

• **Mean Reversion** - Market showing ${Math.random() > 0.5 ? 'strong' : 'weak'} reversion patterns
  - Focus on: Oversold/overbought levels
  - Best pairs: Major crypto pairs with high liquidity

• **Arbitrage Opportunities** - Cross-exchange spreads detected
  - Current spread: ${(Math.random() * 0.05).toFixed(3)}%
  - Execution window: 2-8 seconds

**AI Recommendation**: Focus on momentum strategies during high volatility periods.`;

    } else if (lowerMessage.includes('market') || lowerMessage.includes('analysis') || lowerMessage.includes('btc') || lowerMessage.includes('price')) {
      category = 'analysis';
      response = `📊 **Real-Time Market Analysis:**

**BTC/USD Current Status:**
• Price Action: ${Math.random() > 0.5 ? 'Bullish momentum building' : 'Consolidating near support'}
• Volume: ${Math.random() > 0.6 ? 'Above average' : 'Below average'} - ${(Math.random() * 50 + 50).toFixed(0)}% of 24h avg
• Order Book: ${Math.random() > 0.5 ? 'Buy wall' : 'Sell wall'} detected at ${Math.random() > 0.5 ? 'support' : 'resistance'}

**Key Levels:**
• Support: $${(67500 - Math.random() * 500).toFixed(0)}
• Resistance: $${(67500 + Math.random() * 500).toFixed(0)}
• Next target: ${Math.random() > 0.5 ? 'Upside' : 'Downside'} to $${(67500 + (Math.random() - 0.5) * 1000).toFixed(0)}

**Microstructure Indicators:**
• Bid-Ask Spread: ${(Math.random() * 0.02 + 0.01).toFixed(3)}%
• Market Impact: ${Math.random() > 0.5 ? 'Low' : 'Moderate'}
• Liquidity: ${Math.random() > 0.7 ? 'Excellent' : 'Good'}`;

    } else if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
      response = `🤖 **HFT Trading Assistant Help:**

I can assist you with:

**📈 Market Analysis**
- Real-time price analysis and predictions
- Order book and liquidity analysis
- Volatility and momentum indicators

**⚡ Trading Strategies** 
- HFT strategy recommendations
- Entry/exit signal analysis
- Cross-asset arbitrage opportunities

**🛡️ Risk Management**
- Position sizing guidance
- Stop-loss recommendations  
- Risk assessment and alerts

**🔧 Technical Support**
- Platform features and tools
- API integration help
- Algorithm optimization tips

**Quick Commands:**
- Type "analyze [symbol]" for price analysis
- Type "risk check" for risk assessment
- Type "strategy help" for trading recommendations
- Type "alerts" to set up notifications

What specific area would you like help with?`;

    } else {
      const responses = [
        `I understand you're asking about "${userMessage}". In HFT trading, this relates to market microstructure analysis. Current market conditions show ${Math.random() > 0.5 ? 'favorable' : 'challenging'} opportunities for high-frequency strategies.`,
        
        `Based on your query about "${userMessage}", I recommend focusing on ${Math.random() > 0.5 ? 'momentum-based' : 'mean-reversion'} strategies. The current volatility environment is ${Math.random() > 0.6 ? 'optimal' : 'moderate'} for HFT approaches.`,
        
        `Regarding "${userMessage}" - this is a key factor in HFT success. I suggest monitoring the order flow patterns and maintaining tight risk controls. Current market efficiency is ${(Math.random() * 0.3 + 0.7).toFixed(2)} on our proprietary scale.`
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
    }

    return {
      id: Date.now().toString(),
      type: 'bot',
      content: response,
      timestamp: Date.now(),
      category
    };
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI processing time
    setTimeout(() => {
      const botResponse = generateBotResponse(inputMessage);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleQuickCommand = (command: string) => {
    setInputMessage(command);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'analysis': return <BarChart3 className="w-4 h-4 text-trading-cyan" />;
      case 'strategy': return <TrendingUp className="w-4 h-4 text-trading-green" />;
      case 'risk': return <AlertTriangle className="w-4 h-4 text-trading-yellow" />;
      default: return <MessageCircle className="w-4 h-4 text-trading-purple" />;
    }
  };

  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Bot className="w-6 h-6 text-trading-purple" />
          <div>
            <h2 className="text-lg font-semibold text-trading-text">AI Trading Assistant</h2>
            <div className="text-sm text-trading-muted">HFT strategy & market insights</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-trading-green rounded-full animate-pulse"></div>
          <span className="text-xs text-trading-green">Online</span>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {quickCommands.map((cmd, index) => {
          const IconComponent = cmd.icon;
          return (
            <button
              key={index}
              onClick={() => handleQuickCommand(cmd.command)}
              className="flex items-center space-x-2 p-2 bg-trading-bg hover:bg-trading-border/50 rounded border border-trading-border/50 transition-colors text-left"
            >
              <IconComponent className="w-3 h-3 text-trading-muted" />
              <span className="text-xs text-trading-text truncate">{cmd.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-96">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-trading-blue text-white'
                  : 'bg-trading-bg border border-trading-border text-trading-text'
              }`}
            >
              {message.type === 'bot' && (
                <div className="flex items-center space-x-2 mb-2">
                  {getCategoryIcon(message.category)}
                  <span className="text-xs text-trading-muted uppercase tracking-wide">
                    AI Assistant
                  </span>
                </div>
              )}
              <div className="text-sm whitespace-pre-line">{message.content}</div>
              <div className="text-xs opacity-70 mt-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-trading-bg border border-trading-border p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-trading-purple" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-trading-purple rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-trading-purple rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-trading-purple rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about HFT strategies, market analysis, or risk management..."
          className="flex-1 bg-trading-bg border border-trading-border rounded px-3 py-2 text-trading-text placeholder-trading-muted focus:outline-none focus:border-trading-blue"
        />
        <button
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isTyping}
          className="bg-trading-blue hover:bg-trading-blue/80 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AITradingBot;

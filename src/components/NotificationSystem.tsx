
import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, TrendingUp, Info, CheckCircle } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
  action?: string;
}

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Simulate real-time notifications
    const generateNotification = () => {
      const types: Notification['type'][] = ['success', 'warning', 'error', 'info'];
      const messages = [
        {
          type: 'success' as const,
          title: 'Trade Executed',
          message: 'BTC/USD long position opened at $67,450. Target: $68,200',
          action: 'View Position'
        },
        {
          type: 'warning' as const,
          title: 'Market Volatility Alert',
          message: 'Unusual volume spike detected in ETH/USD. Exercise caution.',
          action: 'Check Analysis'
        },
        {
          type: 'info' as const,
          title: 'Strategy Update',
          message: 'Mean reversion strategy adjusted for current market conditions.',
          action: 'View Details'
        },
        {
          type: 'error' as const,
          title: 'Connection Issue',
          message: 'Brief connection interruption detected. Reconnected successfully.',
          action: 'Check Status'
        },
        {
          type: 'success' as const,
          title: 'Profit Target Hit',
          message: 'AAPL position closed with +$156.50 profit (+2.3%)',
          action: 'View Trade'
        },
        {
          type: 'warning' as const,
          title: 'Risk Limit Approaching',
          message: 'Daily risk limit at 75%. Consider reducing position sizes.',
          action: 'Adjust Risk'
        }
      ];

      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      const newNotification: Notification = {
        id: Date.now().toString(),
        ...randomMessage,
        timestamp: Date.now()
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10 notifications
    };

    // Generate initial notification
    generateNotification();

    // Generate random notifications
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 10 seconds
        generateNotification();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-trading-green" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-trading-yellow" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-trading-red" />;
      case 'info': return <Info className="w-4 h-4 text-trading-cyan" />;
    }
  };

  const getNotificationBorder = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'border-l-trading-green';
      case 'warning': return 'border-l-trading-yellow';
      case 'error': return 'border-l-trading-red';
      case 'info': return 'border-l-trading-cyan';
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-trading-muted hover:text-trading-text transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-trading-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-trading-surface border border-trading-border rounded-lg shadow-2xl z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-trading-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-trading-text">Notifications</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-trading-muted">{unreadCount} new</span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-trading-muted hover:text-trading-text"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-trading-muted">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-trading-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-trading-bg/50 transition-colors border-l-4 ${getNotificationBorder(notification.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-trading-text text-sm">
                              {notification.title}
                            </div>
                            <div className="text-xs text-trading-muted mt-1 leading-relaxed">
                              {notification.message}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-trading-muted">
                                {new Date(notification.timestamp).toLocaleTimeString()}
                              </span>
                              {notification.action && (
                                <button className="text-xs text-trading-cyan hover:text-trading-cyan/80 font-medium">
                                  {notification.action}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="text-trading-muted hover:text-trading-text ml-2 flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-trading-border">
                <button
                  onClick={() => setNotifications([])}
                  className="w-full text-xs text-trading-muted hover:text-trading-text transition-colors"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationSystem;

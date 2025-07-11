
import React, { useState } from 'react';
import { Activity, Database, Globe, TrendingUp, Wifi, RefreshCw } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';

interface DataSource {
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastUpdate: string;
  recordsCount: number;
  type: 'stocks' | 'crypto' | 'forex' | 'news';
}

const LiveDataDashboard = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      name: 'Yahoo Finance API',
      status: 'active',
      lastUpdate: new Date().toISOString(),
      recordsCount: 2847,
      type: 'stocks'
    },
    {
      name: 'Alpha Vantage',
      status: 'active',
      lastUpdate: new Date().toISOString(),
      recordsCount: 1523,
      type: 'stocks'
    },
    {
      name: 'CoinGecko',
      status: 'active',
      lastUpdate: new Date().toISOString(),
      recordsCount: 456,
      type: 'crypto'
    },
    {
      name: 'CryptoCompare',
      status: 'active',
      lastUpdate: new Date().toISOString(),
      recordsCount: 234,
      type: 'crypto'
    },
    {
      name: 'Deutsche Börse',
      status: 'inactive',
      lastUpdate: new Date(Date.now() - 3600000).toISOString(),
      recordsCount: 892,
      type: 'stocks'
    },
    {
      name: 'NYSE TAQ',
      status: 'active',
      lastUpdate: new Date().toISOString(),
      recordsCount: 5673,
      type: 'stocks'
    }
  ]);

  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-trading-green';
      case 'inactive': return 'text-trading-yellow';
      case 'error': return 'text-trading-red';
      default: return 'text-trading-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Wifi className="w-4 h-4" />;
      case 'inactive': return <Activity className="w-4 h-4" />;
      case 'error': return <RefreshCw className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'stocks': return 'bg-trading-blue/10 text-trading-blue border-trading-blue/20';
      case 'crypto': return 'bg-trading-orange/10 text-trading-orange border-trading-orange/20';
      case 'forex': return 'bg-trading-purple/10 text-trading-purple border-trading-purple/20';
      case 'news': return 'bg-trading-green/10 text-trading-green border-trading-green/20';
      default: return 'bg-trading-muted/10 text-trading-muted border-trading-muted/20';
    }
  };

  const refreshDataSources = async () => {
    setLoading(true);
    try {
      // Simulate API call to refresh data sources
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update data sources with new timestamps
      setDataSources(prev => prev.map(source => ({
        ...source,
        lastUpdate: new Date().toISOString(),
        recordsCount: source.recordsCount + Math.floor(Math.random() * 100)
      })));
    } catch (error) {
      console.error('Error refreshing data sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const testDataSource = async (sourceName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-live-data', {
        body: { 
          symbols: ['AAPL', 'BTC/USD'], 
          sources: [sourceName.toLowerCase().replace(/\s+/g, '')] 
        }
      });

      if (error) throw error;
      
      console.log(`Test successful for ${sourceName}:`, data);
    } catch (error) {
      console.error(`Test failed for ${sourceName}:`, error);
    }
  };

  return (
    <div className="bg-trading-surface rounded-lg border border-trading-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Globe className="w-6 h-6 text-trading-cyan" />
          <div>
            <h2 className="text-xl font-semibold text-trading-text">Live Data Sources</h2>
            <div className="text-sm text-trading-muted">
              Real-time market data integration
            </div>
          </div>
        </div>
        
        <Button
          onClick={refreshDataSources}
          disabled={loading}
          className="bg-trading-cyan/20 text-trading-cyan border-trading-cyan/30 hover:bg-trading-cyan/30"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataSources.map((source) => (
          <Card key={source.name} className="bg-trading-bg border-trading-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-1 ${getStatusColor(source.status)}`}>
                  {getStatusIcon(source.status)}
                  <span className="text-xs font-medium capitalize">{source.status}</span>
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor(source.type)}`}>
                {source.type.toUpperCase()}
              </div>
            </div>
            
            <div className="mb-3">
              <h3 className="font-semibold text-trading-text mb-1">{source.name}</h3>
              <div className="text-sm text-trading-muted">
                {source.recordsCount.toLocaleString()} records
              </div>
            </div>
            
            <div className="space-y-2 text-xs text-trading-muted">
              <div className="flex justify-between">
                <span>Last Update:</span>
                <span>{new Date(source.lastUpdate).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Frequency:</span>
                <span>Real-time</span>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-trading-border/50">
              <Button
                onClick={() => testDataSource(source.name)}
                size="sm"
                className="w-full bg-trading-blue/20 text-trading-blue border-trading-blue/30 hover:bg-trading-blue/30"
              >
                <TrendingUp className="w-3 h-3 mr-2" />
                Test Connection
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-trading-bg rounded-lg border border-trading-border/50">
        <h3 className="font-semibold text-trading-text mb-2 flex items-center">
          <Database className="w-4 h-4 mr-2 text-trading-cyan" />
          Data Pipeline Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-trading-muted">Total Sources:</span>
            <span className="text-trading-text font-medium">{dataSources.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-trading-muted">Active:</span>
            <span className="text-trading-green font-medium">
              {dataSources.filter(s => s.status === 'active').length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-trading-muted">Total Records:</span>
            <span className="text-trading-text font-medium">
              {dataSources.reduce((sum, source) => sum + source.recordsCount, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDataDashboard;

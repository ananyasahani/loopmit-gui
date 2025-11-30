'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Thermometer, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TempData {
  temperature: number;
  timestamp: number;
  time?: string;
}

export default function TempDisplay() {
  const [currentTemp, setCurrentTemp] = useState<number>(0);
  const [historyData, setHistoryData] = useState<TempData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [minTemp, setMinTemp] = useState<number>(0);
  const [maxTemp, setMaxTemp] = useState<number>(0);
  const [avgTemp, setAvgTemp] = useState<number>(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setConnectionStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const data: TempData = JSON.parse(event.data);
        setCurrentTemp(data.temperature);

        const dataPoint = {
          ...data,
          time: new Date(data.timestamp).toLocaleTimeString()
        };

        setHistoryData((prev) => {
          const newHistory = [...prev, dataPoint];
          const limited = newHistory.slice(-20);
          
          // Calculate statistics
          if (limited.length > 0) {
            const temps = limited.map(d => d.temperature);
            setMinTemp(Math.min(...temps));
            setMaxTemp(Math.max(...temps));
            setAvgTemp(temps.reduce((a, b) => a + b, 0) / temps.length);
            
            // Determine trend
            if (limited.length >= 2) {
              const recent = limited.slice(-3).map(d => d.temperature);
              const diff = recent[recent.length - 1] - recent[0];
              setTrend(diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'stable');
            }
          }
          return limited;
        });
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setConnectionStatus('disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  const getTempColor = (temp: number) => {
    if (temp < 20) return 'from-blue-500 to-cyan-500';
    if (temp < 25) return 'from-green-500 to-emerald-500';
    if (temp < 30) return 'from-yellow-500 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold">{payload[0].payload.time}</p>
          <p className="text-blue-400 font-bold text-lg">
            {payload[0].value.toFixed(2)}°C
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Temperature Monitor</h1>
            <p className="text-gray-400">Real-time ESP32 sensor data</p>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-3 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-700">
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              connectionStatus === 'connected' ? 'bg-green-500 shadow-lg shadow-green-500/50' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' :
              'bg-red-500 shadow-lg shadow-red-500/50'
            }`} />
            <span className="text-sm font-medium text-white">
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               'Disconnected'}
            </span>
          </div>
        </div>

        {/* Main Temperature Display */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getTempColor(currentTemp)} p-8 shadow-2xl`}>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Thermometer className="w-8 h-8 text-white" />
              <span className="text-white/80 text-lg font-medium">Current Temperature</span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-7xl font-bold text-white">
                {currentTemp.toFixed(1)}
              </span>
              <span className="text-4xl text-white/80">°C</span>
              <div className="ml-auto">
                {trend === 'up' && <TrendingUp className="w-12 h-12 text-white" />}
                {trend === 'down' && <TrendingDown className="w-12 h-12 text-white" />}
                {trend === 'stable' && <Minus className="w-12 h-12 text-white" />}
              </div>
            </div>
            <div className="mt-4 text-white/70 text-sm">
              {trend === 'up' && 'Temperature rising'}
              {trend === 'down' && 'Temperature falling'}
              {trend === 'stable' && 'Temperature stable'}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Min Temperature */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:bg-gray-800/70 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-blue-400 text-sm font-medium">MINIMUM</span>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">{minTemp.toFixed(1)}°C</div>
            <div className="text-gray-400 text-sm mt-2">Lowest recorded</div>
          </div>

          {/* Max Temperature */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:bg-gray-800/70 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-red-400 text-sm font-medium">MAXIMUM</span>
              <Activity className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-white">{maxTemp.toFixed(1)}°C</div>
            <div className="text-gray-400 text-sm mt-2">Highest recorded</div>
          </div>

          {/* Average Temperature */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:bg-gray-800/70 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-green-400 text-sm font-medium">AVERAGE</span>
              <Activity className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white">{avgTemp.toFixed(1)}°C</div>
            <div className="text-gray-400 text-sm mt-2">Mean temperature</div>
          </div>
        </div>

        {/* Temperature Graph */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">Temperature History</h2>
            <p className="text-gray-400 text-sm">Last 20 readings</p>
          </div>
          
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="temperature" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fill="url(#colorTemp)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Data Points Counter */}
        <div className="text-center text-gray-400 text-sm">
          {historyData.length} data points collected
        </div>
      </div>
    </div>
  );
}
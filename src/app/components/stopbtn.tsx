"use client";
import { useState } from 'react';
import { motion } from 'motion/react';
import { Power, Zap, Radio, Settings, AlertTriangle } from 'lucide-react';
import { useESP } from '../context/ESPContext';
import React from 'react';


interface RelayConfig {
  id: 1 | 2 | 3 | 4;
  name: string;
  icon: React.ReactNode;
  description: string;
}

export function StopBtn() {
  const relayConfigs: RelayConfig[] = [
    { id: 1, name: 'C2000', icon: <Power className="size-5" />, description: 'Controller for inverter' },]
  const { turnAllOff, toggleRelay } = useESP();
  
  return(
    <div className="flex gap-4">
      <button
        onClick={() => toggleRelay(2)}
        className="group relative px-6 py-3 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
      >
        <AlertTriangle className="size-5 animate-pulse" />
        <span> Emergency Stop</span>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      
      <button 
        onClick={turnAllOff} 
        className="group relative px-6 py-3 bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-xl font-semibold shadow-lg shadow-slate-900/30 hover:shadow-xl hover:shadow-emerald-500/20 hover:from-emerald-600 hover:to-emerald-700 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
      >
        <Power className="size-5" />
        <span>Stop</span>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  )
}
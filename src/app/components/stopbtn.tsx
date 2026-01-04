"use client";
import { useState } from 'react';
import { motion } from 'motion/react';
import { Power, Zap, Radio, Settings } from 'lucide-react';
import { useESP } from '../context/ESPContext';
import React from 'react';


interface RelayConfig {
  id: 1 | 2 | 3 | 4;
  name: string;
  icon: React.ReactNode;
  description: string;
}

export function StopBtn() {
  const { turnAllOff } = useESP();
  return(
    <button
      onClick={turnAllOff}
      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
    >
      Stop
    </button>
  )
}
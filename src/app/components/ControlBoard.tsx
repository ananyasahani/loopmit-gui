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

export function ControlBoard() {
  const [isOpen, setIsOpen] = useState(false);
  const { relayStates, toggleRelay, turnAllOn, turnAllOff, isConnected } = useESP();

  const relayConfigs: RelayConfig[] = [
    { id: 1, name: 'Main Power', icon: <Power className="size-5" />, description: 'Primary power system' },
    { id: 2, name: 'Propulsion', icon: <Zap className="size-5" />, description: 'Propulsion control' },
    { id: 3, name: 'Levitation', icon: <Radio className="size-5" />, description: 'Magnetic levitation' },
    { id: 4, name: 'Auxiliary', icon: <Settings className="size-5" />, description: 'Auxiliary systems' },
  ];

  return (
    <>
      {/* Hover trigger area */}
      <div
        className="fixed bottom-0 left-0 right-0 h-8 z-40"
        onMouseEnter={() => setIsOpen(true)}
      />

      {/* Control board panel */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
        initial={{ y: '100%' }}
        animate={{ y: isOpen ? 0 : 'calc(100% - 2rem)' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Handle bar */}
        <div className="h-8 flex items-center justify-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Control content */}
        <div className="px-8 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground">Relay Control Board</h3>
            {isConnected && (
              <div className="flex gap-2">
                <button
                  onClick={turnAllOn}
                  className="px-3 py-1 text-sm bg-green-500/20 text-green-500 rounded hover:bg-green-500/30 transition-colors"
                >
                  All ON
                </button>
                <button
                  onClick={turnAllOff}
                  className="px-3 py-1 text-sm bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors"
                >
                  All OFF
                </button>
              </div>
            )}
          </div>

          {!isConnected ? (
            <div className="text-center py-8 text-muted-foreground">
              Connect to ESP32 to control relays
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {relayConfigs.map((relay) => {
                const isActive = relayStates[`relay${relay.id}` as keyof typeof relayStates];
                return (
                  <button
                    key={relay.id}
                    onClick={() => toggleRelay(relay.id)}
                    className={`p-4 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-card-foreground border-border hover:bg-accent'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {relay.icon}
                      <span className="font-medium">{relay.name}</span>
                      <span className="text-xs opacity-75">{relay.description}</span>
                      <div className={`mt-2 px-2 py-1 rounded text-xs ${
                        isActive ? 'bg-primary-foreground/20' : 'bg-muted'
                      }`}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
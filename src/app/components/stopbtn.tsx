"use client";
import { useEffect } from 'react';
import { useESP } from '../context/ESPContext';
import React from 'react';

export function StopBtn() {
  const { turnAllOff } = useESP();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        turnAllOff();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [turnAllOff]);

  return (
    <button
      onClick={turnAllOff}
      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
      title="Emergency Stop (Ctrl+Space)"
    >
      Emergency Stop
    </button>
  );
}
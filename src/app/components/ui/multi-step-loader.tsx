"use client";

import React, { useEffect, useState } from "react";
import { cn } from "./utils";

interface LoadingState {
  text: string;
}

interface MultiStepLoaderProps {
  loadingStates: LoadingState[];
  loading: boolean;
  duration?: number;
  loop?: boolean;
}

export function MultiStepLoader({
  loadingStates,
  loading,
  duration = 2000,
  loop = false,
}: MultiStepLoaderProps) {
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentState((prev) => {
        if (prev === loadingStates.length - 1) {
          if (loop) {
            return 0;
          }
          return prev;
        }
        return prev + 1;
      });
    }, duration);

    return () => clearInterval(interval);
  }, [loading, loadingStates.length, duration, loop]);

  if (!loading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-75 animate-pulse blur-xl"></div>
          <div className="relative rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-1">
            <div className="rounded-full bg-black p-4">
              <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-white text-xl font-semibold">
            {loadingStates[currentState]?.text || "Loading..."}
          </p>
          <div className="mt-2 flex gap-1 justify-center">
            {loadingStates.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1 w-8 rounded-full transition-all duration-500",
                  index === currentState
                    ? "bg-blue-500"
                    : index < currentState
                    ? "bg-blue-500/50"
                    : "bg-gray-700"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


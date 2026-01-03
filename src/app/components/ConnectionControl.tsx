import { useESP } from '../context/ESPContext';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import React from 'react';

export function ConnectionControl() {
  const { isConnected, isConnecting, error, connect, disconnect } = useESP();

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isConnected ? (
            <Wifi className="size-6 text-green-500" />
          ) : (
            <WifiOff className="size-6 text-muted-foreground" />
          )}
          <div>
            <h3 className="text-foreground">ESP8266 Connection</h3>
            <p className="text-sm text-muted-foreground">
              {isConnected ? 'Connected via Serial' : 'Not connected'}
            </p>
          </div>
        </div>

        {!isConnected ? (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Disconnect
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/50 rounded-lg">
          <AlertCircle className="size-5 text-destructive mt-0.5" />
          <div>
            <p className="text-sm text-destructive font-medium">Connection Error</p>
            <p className="text-xs text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {!isConnected && !error && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            Click "Connect" to select your ESP8266 serial port. Make sure the device is plugged in via USB.
          </p>
        </div>
      )}
    </div>
  );
}

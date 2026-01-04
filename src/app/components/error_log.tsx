import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import React from 'react';
import { useESP } from '../context/ESPContext';

export const Error_log = () => {
  const { errorLog, clearErrorLog } = useESP();
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getErrorTypeColor = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return 'text-destructive border-destructive/50 bg-destructive/10';
      case 'warning':
        return 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10';
      case 'info':
        return 'text-blue-500 border-blue-500/50 bg-blue-500/10';
      default:
        return 'text-muted-foreground border-border bg-muted/50';
    }
  };

  const errorCount = errorLog.length;

  return (
    <>
      {/* Error Log Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg shadow-lg hover:bg-destructive/90 transition-colors"
      >
        <AlertTriangle className="size-5" />
        <span className="font-medium">Error Log</span>
        {errorCount > 0 && (
          <span className="px-2 py-0.5 bg-destructive-foreground/20 rounded-full text-xs font-bold">
            {errorCount}
          </span>
        )}
      </button>

      {/* Side Panel Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Side Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="size-6 text-destructive" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Error Log</h2>
                    <p className="text-sm text-muted-foreground">
                      {errorCount} {errorCount === 1 ? 'error' : 'errors'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {errorCount > 0 && (
                    <button
                      onClick={clearErrorLog}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Clear all errors"
                    >
                      <Trash2 className="size-5 text-muted-foreground" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="size-5 text-foreground" />
                  </button>
                </div>
              </div>

              {/* Error List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {errorCount === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <AlertTriangle className="size-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No errors logged</p>
                    <p className="text-sm text-muted-foreground/70 mt-2">
                      Errors will appear here when they occur
                    </p>
                  </div>
                ) : (
                  errorLog
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border ${getErrorTypeColor(entry.type)}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <AlertTriangle className="size-4 flex-shrink-0 mt-0.5" />
                            <span className="text-xs font-medium uppercase">{entry.type}</span>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(entry.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm break-words">{entry.message}</p>
                      </motion.div>
                    ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
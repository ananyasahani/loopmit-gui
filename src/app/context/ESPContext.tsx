import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ============================================================================
// 0. WEB SERIAL API TYPE DEFINITIONS
// ============================================================================

declare global {
  interface SerialPort extends EventTarget {
    readonly readable: ReadableStream<Uint8Array>;
    readonly writable: WritableStream<Uint8Array>;
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
  }

  interface SerialOptions {
    baudRate: number;
    dataBits?: 7 | 8;
    stopBits?: 1 | 2;
    parity?: 'none' | 'even' | 'odd';
    bufferSize?: number;
    flowControl?: 'none' | 'hardware';
  }

  interface SerialPortRequestOptions {
    filters?: SerialPortFilter[];
  }

  interface SerialPortFilter {
    usbVendorId?: number;
    usbProductId?: number;
  }

  interface Navigator {
    serial: {
      requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
      getPorts(): Promise<SerialPort[]>;
    };
  }
}

// ============================================================================
// 1. TYPE DEFINITIONS
// ============================================================================

interface SensorData {
  gapHeight: number;
  objectTemp: number; // Keep for backward compatibility
  temperatures: number[]; // Array of 4 temperature sensor values
  voltage: number;
  orientation: { x: number; y: number; z: number };
  acceleration: { x: number; y: number; z: number; magnitude: number };
  calibration: { gyro: number; sys: number; magneto: number };
  bno_health: number;
  icg_health: number;
}

interface RelayState {
  relay1: boolean;
  relay2: boolean;
  relay3: boolean;
  relay4: boolean;
}

interface HistoryPoint {
  timestamp: number;
  value: number;
}

interface ErrorLogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'error' | 'warning' | 'info';
}

// ============================================================================
// 2. SERIAL PORT MANAGER
// ============================================================================

class SerialPortManager {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader | null = null;
  private writer: WritableStreamDefaultWriter | null = null;
  private onDataReceived: ((data: string) => void) | null = null;
  private onError: ((error: string) => void) | null = null;

  setErrorCallback(callback: (error: string) => void): void {
    this.onError = callback;
  }

  private logError(message: string): void {
    if (this.onError) {
      this.onError(message);
    }
  }

  async connect(baudRate: number = 115200): Promise<void> {
    if (!('serial' in navigator)) {
      const errorMsg = 'Web Serial API not supported in this browser';
      this.logError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate });

      const textDecoder = new TextDecoderStream();
      this.port.readable.pipeTo(textDecoder.writable);
      this.reader = textDecoder.readable.getReader();

      const textEncoder = new TextEncoderStream();
      textEncoder.readable.pipeTo(this.port.writable);
      this.writer = textEncoder.writable.getWriter();

      this.startReading();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError(`Connection error: ${errorMessage}`);
      throw error; // Re-throw so caller knows connection failed
    }
  }

  async disconnect(): Promise<void> {
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }
    if (this.writer) {
      await this.writer.close();
      this.writer = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
  }

  async send(command: string): Promise<void> {
    if (!this.writer) {
      const error = 'Cannot send command: Not connected to serial port';
      this.logError(error);
      throw new Error(error);  // ✅ Throw instead of return
    }
  
    try {
      await this.writer.write(command + '\n');
      console.log('Sent:', command);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError(`Send command error: ${errorMessage}`);
      throw error;  // ✅ Re-throw to propagate the error
    }
  }

  onData(callback: (data: string) => void): void {
    this.onDataReceived = callback;
  }

  private async startReading(): Promise<void> {
    if (!this.reader) return;

    let buffer = '';

    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break;

        buffer += value;

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.substring(0, newlineIndex).trim();
          buffer = buffer.substring(newlineIndex + 1);

          if (line && this.onDataReceived) {
            this.onDataReceived(line);
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError(`Serial reading error: ${errorMessage}`);
    }
  }

  isConnected(): boolean {
    return this.port !== null && this.writer !== null;
  }
}

// ============================================================================
// 3. DATA PARSER
// ============================================================================

class DataParser {
  private onError: ((error: string) => void) | null = null;

  setErrorCallback(callback: (error: string) => void): void {
    this.onError = callback;
  }

  private logError(message: string): void {
    if (this.onError) {
      this.onError(message);
    }
  }

  parseJSON(line: string): any | null {
    if (!line.startsWith('{')) return null;
    
    try {
      return JSON.parse(line);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError(`JSON parse error: ${errorMessage} - Line: ${line.substring(0, 100)}`);
      return null;
    }
  }

  parseRelayState(line: string): RelayState | null {
    if (!line.includes('STATE:')) return null;

    const stateStr = line.split('STATE:')[1].trim();
    const states = stateStr.split(',');
    
    if (states.length === 4) {
      return {
        relay1: states[0] === '1',
        relay2: states[1] === '1',
        relay3: states[2] === '1',
        relay4: states[3] === '1',
      };
    }
    return null;
  }

  extractSensorData(rawData: any): Partial<SensorData> {
    try {
      const result: Partial<SensorData> = {};

      if (rawData.gap_height !== undefined) {
        result.gapHeight = rawData.gap_height;
      }
      if (rawData.bno_health !== undefined) {
        result.bno_health = rawData.bno_health;
      }
      if (rawData.icg_health !== undefined) {
        result.icg_health = rawData.icg_health;
      }

      if (rawData.object_temp !== undefined) {
        result.objectTemp = rawData.object_temp;
      }

      // Extract multiple temperature sensors
      // Support array format: temp_sensors: [t1, t2, t3, t4]
      if (Array.isArray(rawData.temp_sensors) && rawData.temp_sensors.length >= 4) {
        result.temperatures = rawData.temp_sensors.slice(0, 4);
        // Also set objectTemp to first sensor for backward compatibility
        if (!result.objectTemp) {
          result.objectTemp = rawData.temp_sensors[0];
        }
      }
      // Support individual fields: temp1, temp2, temp3, temp4
      else if (rawData.temp1 !== undefined || rawData.temp2 !== undefined || 
               rawData.temp3 !== undefined || rawData.temp4 !== undefined) {
        result.temperatures = [
          rawData.temp1 ?? 0,
          rawData.temp2 ?? 0,
          rawData.temp3 ?? 0,
          rawData.temp4 ?? 0,
        ];
        if (!result.objectTemp && rawData.temp1 !== undefined) {
          result.objectTemp = rawData.temp1;
        }
      }
      // Fallback to single object_temp if available
      else if (rawData.object_temp !== undefined) {
        result.temperatures = [rawData.object_temp, 0, 0, 0];
      }

      if (rawData.voltage !== undefined) {
        result.voltage = rawData.voltage;
      }

      if (Array.isArray(rawData.orientation) && rawData.orientation.length >= 3) {
        result.orientation = {
          x: rawData.orientation[0],
          y: rawData.orientation[1],
          z: rawData.orientation[2],
        };
      }

      if (Array.isArray(rawData.acceleration) && rawData.acceleration.length >= 3) {
        const [x, y, z] = rawData.acceleration;
        result.acceleration = {
          x, y, z,
          magnitude: Math.sqrt(x * x + y * y + z * z),
        };
      }

      if (Array.isArray(rawData.calibration) && rawData.calibration.length >= 3) {
        result.calibration = {
          gyro: rawData.calibration[0],
          sys: rawData.calibration[1],
          magneto: rawData.calibration[2],
        };
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError(`Sensor data extraction error: ${errorMessage}`);
      return {};
    }
  }
}

// ============================================================================
// 4. HISTORY MANAGER
// ============================================================================

class HistoryManager {
  private maxPoints: number = 120;
  private timeWindow: number = 120000; // 2 minutes

  addPoint(history: HistoryPoint[], value: number): HistoryPoint[] {
    const newHistory = [...history, { timestamp: Date.now(), value }];
    return this.cleanup(newHistory);
  }

  cleanup(history: HistoryPoint[]): HistoryPoint[] {
    const now = Date.now();
    return history
      .filter(point => now - point.timestamp < this.timeWindow)
      .slice(-this.maxPoints);
  }

  clear(): HistoryPoint[] {
    return [];
  }
}

// ============================================================================
// 5. RELAY CONTROLLER
// ============================================================================

class RelayController {
  constructor(private serialManager: SerialPortManager) {}

  async toggle(relayNum: 1 | 2 | 3 | 4, currentState: boolean): Promise<boolean> {
    const newState = !currentState;
    const command = `RELAY${relayNum}_${newState ? 'ON' : 'OFF'}`;
    await this.serialManager.send(command);
    return newState;
  }

  async turnAllOn(): Promise<void> {
    await this.serialManager.send('ALL_ON');
  }

  async turnAllOff(): Promise<void> {
    await this.serialManager.send('ALL_OFF');
  }

  async getStatus(): Promise<void> {
    await this.serialManager.send('STATUS');
  }
}

// ============================================================================
// 6. REACT CONTEXT
// ============================================================================

interface ESPContextType {
  isConnected: boolean;
  isConnecting: boolean;
  error: string;
  errorLog: ErrorLogEntry[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  sensorData: SensorData;
  
  relayStates: RelayState;
  toggleRelay: (num: 1 | 2 | 3 | 4) => Promise<void>;
  turnAllOn: () => Promise<void>;
  turnAllOff: () => Promise<void>;
  
  temperatureHistory: HistoryPoint[]; // Keep for backward compatibility
  temperatureHistories: HistoryPoint[][]; // Array of 4 temperature sensor histories
  gapHeightHistory: HistoryPoint[];
  voltageHistory: HistoryPoint[];
  clearHistory: () => void;
  clearErrorLog: () => void;
}

const ESPContext = createContext<ESPContextType | undefined>(undefined);

export const useESP = () => {
  const context = useContext(ESPContext);
  if (!context) throw new Error('useESP must be used within ESPProvider');
  return context;
};

// ============================================================================
// 7. PROVIDER COMPONENT
// ============================================================================

export const ESPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serialManager] = useState(() => new SerialPortManager());
  const [dataParser] = useState(() => new DataParser());
  const [historyManager] = useState(() => new HistoryManager());
  const [relayController] = useState(() => new RelayController(serialManager));

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [errorLog, setErrorLog] = useState<ErrorLogEntry[]>([]);

  // Set up error callbacks
  const addError = useCallback((message: string, type: 'error' | 'warning' | 'info' = 'error') => {
    const entry: ErrorLogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      message,
      type,
    };
    setErrorLog(prev => {
      const updated = [...prev, entry];
      // Keep only last 1000 entries
      return updated.slice(-1000);
    });
  }, []);

  useEffect(() => {
    serialManager.setErrorCallback(addError);
    dataParser.setErrorCallback(addError);
  }, [serialManager, dataParser, addError]);

  const [sensorData, setSensorData] = useState<SensorData>({
    gapHeight: 0,
    objectTemp: 0,
    temperatures: [0, 0, 0, 0],
    voltage: 0,
    orientation: { x: 0, y: 0, z: 0 },
    acceleration: { x: 0, y: 0, z: 0, magnitude: 0 },
    calibration: { gyro: 0, sys: 0, magneto: 0 },
    bno_health:0,
    icg_health:0,
  });

  const [relayStates, setRelayStates] = useState<RelayState>({
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false,
  });

  const [temperatureHistory, setTemperatureHistory] = useState<HistoryPoint[]>([]); // Backward compatibility
  const [temperatureHistories, setTemperatureHistories] = useState<HistoryPoint[][]>([
    [], [], [], [] // 4 separate histories for 4 sensors
  ]);
  const [gapHeightHistory, setGapHeightHistory] = useState<HistoryPoint[]>([]);
  const [voltageHistory, setVoltageHistory] = useState<HistoryPoint[]>([]);

  const handleIncomingData = useCallback((line: string) => {
    try {
      const jsonData = dataParser.parseJSON(line);
      if (jsonData) {
        const extracted = dataParser.extractSensorData(jsonData);
        
        setSensorData(prev => ({ ...prev, ...extracted }));

        // Update temperature histories for multiple sensors
        if (extracted.temperatures && Array.isArray(extracted.temperatures)) {
          setTemperatureHistories(prev => 
            prev.map((history, index) => 
              extracted.temperatures![index] !== undefined
                ? historyManager.addPoint(history, extracted.temperatures![index])
                : history
            )
          );
          // Also update single history for backward compatibility (use first sensor)
          if (extracted.temperatures[0] !== undefined) {
            setTemperatureHistory(prev => 
              historyManager.addPoint(prev, extracted.temperatures![0])
            );
          }
        } else if (extracted.objectTemp !== undefined) {
          // Fallback: if only objectTemp is provided, update first sensor
          setTemperatureHistory(prev => 
            historyManager.addPoint(prev, extracted.objectTemp!)
          );
          setTemperatureHistories(prev => {
            const newHistories = [...prev];
            newHistories[0] = historyManager.addPoint(newHistories[0], extracted.objectTemp!);
            return newHistories;
          });
        }
        if (extracted.gapHeight !== undefined) {
          setGapHeightHistory(prev => 
            historyManager.addPoint(prev, extracted.gapHeight!)
          );
        }
        if (extracted.voltage !== undefined) {
          setVoltageHistory(prev => 
            historyManager.addPoint(prev, extracted.voltage!)
          );
        }

        if (jsonData.relayStates) {
          setRelayStates(jsonData.relayStates);
        }
      }

      const relayState = dataParser.parseRelayState(line);
      if (relayState) {
        setRelayStates(relayState);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const entry: ErrorLogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        message: `Data handling error: ${errorMessage}`,
        type: 'error',
      };
      setErrorLog(prev => [...prev, entry].slice(-1000));
    }
  }, [dataParser, historyManager]);

  useEffect(() => {
    serialManager.onData(handleIncomingData);
  }, [serialManager, handleIncomingData]);

  const connect = async () => {
    try {
      setIsConnecting(true);
      setError('');
      await serialManager.connect(115200);
      setIsConnected(true);
      try {
        await relayController.getStatus();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const entry: ErrorLogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          message: `Failed to get relay status: ${errorMessage}`,
          type: 'warning',
        };
        setErrorLog(prev => [...prev, entry].slice(-1000));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Connection failed: ${errorMessage}`);
      setIsConnected(false);
      const entry: ErrorLogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        message: `Connection failed: ${errorMessage}`,
        type: 'error',
      };
      setErrorLog(prev => [...prev, entry].slice(-1000));
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await serialManager.disconnect();
      setIsConnected(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Disconnect failed: ${errorMessage}`);
      const entry: ErrorLogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        message: `Disconnect failed: ${errorMessage}`,
        type: 'error',
      };
      setErrorLog(prev => [...prev, entry].slice(-1000));
    }
  };

  const toggleRelay = async (num: 1 | 2 | 3 | 4) => {
    try {
      const key = `relay${num}` as keyof RelayState;
      const newState = await relayController.toggle(num, relayStates[key]);
      setRelayStates(prev => ({ ...prev, [key]: newState }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const entry: ErrorLogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        message: `Failed to toggle relay ${num}: ${errorMessage}`,
        type: 'error',
      };
      setErrorLog(prev => [...prev, entry].slice(-1000));
    }
  };

  const turnAllOn = async () => {
    try {
      await relayController.turnAllOn();
      setRelayStates({ relay1: true, relay2: true, relay3: true, relay4: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const entry: ErrorLogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        message: `Failed to turn all relays on: ${errorMessage}`,
        type: 'error',
      };
      setErrorLog(prev => [...prev, entry].slice(-1000));
    }
  };

  const turnAllOff = async () => {
    try {
      await relayController.turnAllOff();
      setRelayStates({ relay1: false, relay2: false, relay3: false, relay4: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const entry: ErrorLogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        message: `Failed to turn all relays off: ${errorMessage}`,
        type: 'error',
      };
      setErrorLog(prev => [...prev, entry].slice(-1000));
    }
  };

  const clearHistory = () => {
    setTemperatureHistory(historyManager.clear());
    setTemperatureHistories([[],[],[],[]]);
    setGapHeightHistory(historyManager.clear());
    setVoltageHistory(historyManager.clear());
  };

  const clearErrorLog = () => {
    setErrorLog([]);
  };

  const value: ESPContextType = {
    isConnected,
    isConnecting,
    error,
    errorLog,
    connect,
    disconnect,
    sensorData,
    relayStates,
    toggleRelay,
    turnAllOn,
    turnAllOff,
    temperatureHistory,
    temperatureHistories,
    gapHeightHistory,
    voltageHistory,
    clearHistory,
    clearErrorLog,
  };

  return <ESPContext.Provider value={value}>{children}</ESPContext.Provider>;
};


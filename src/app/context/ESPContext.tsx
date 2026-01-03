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

// ============================================================================
// 2. SERIAL PORT MANAGER
// ============================================================================

class SerialPortManager {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader | null = null;
  private writer: WritableStreamDefaultWriter | null = null;
  private onDataReceived: ((data: string) => void) | null = null;

  async connect(baudRate: number = 115200): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API not supported in this browser');
    }

    this.port = await (navigator as any).serial.requestPort();
    await this.port.open({ baudRate });

    const textDecoder = new TextDecoderStream();
    this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    const textEncoder = new TextEncoderStream();
    textEncoder.readable.pipeTo(this.port.writable);
    this.writer = textEncoder.writable.getWriter();

    this.startReading();
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
      throw new Error('Not connected to serial port');
    }
    await this.writer.write(command + '\n');
    console.log('Sent:', command);
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
      console.error('Reading error:', error);
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
  parseJSON(line: string): any | null {
    if (!line.startsWith('{')) return null;
    
    try {
      return JSON.parse(line);
    } catch (error) {
      console.error('JSON parse error:', error);
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
    const result: Partial<SensorData> = {};

    if (rawData.gap_height !== undefined) {
      result.gapHeight = rawData.gap_height;
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

  const [sensorData, setSensorData] = useState<SensorData>({
    gapHeight: 0,
    objectTemp: 0,
    temperatures: [0, 0, 0, 0],
    voltage: 0,
    orientation: { x: 0, y: 0, z: 0 },
    acceleration: { x: 0, y: 0, z: 0, magnitude: 0 },
    calibration: { gyro: 0, sys: 0, magneto: 0 },
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
      await relayController.getStatus();
    } catch (err) {
      setError(`Connection failed: ${err}`);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await serialManager.disconnect();
      setIsConnected(false);
    } catch (err) {
      setError(`Disconnect failed: ${err}`);
    }
  };

  const toggleRelay = async (num: 1 | 2 | 3 | 4) => {
    const key = `relay${num}` as keyof RelayState;
    const newState = await relayController.toggle(num, relayStates[key]);
    setRelayStates(prev => ({ ...prev, [key]: newState }));
  };

  const turnAllOn = async () => {
    await relayController.turnAllOn();
    setRelayStates({ relay1: true, relay2: true, relay3: true, relay4: true });
  };

  const turnAllOff = async () => {
    await relayController.turnAllOff();
    setRelayStates({ relay1: false, relay2: false, relay3: false, relay4: false });
  };

  const clearHistory = () => {
    setTemperatureHistory(historyManager.clear());
    setTemperatureHistories([[],[],[],[]]);
    setGapHeightHistory(historyManager.clear());
    setVoltageHistory(historyManager.clear());
  };

  const value: ESPContextType = {
    isConnected,
    isConnecting,
    error,
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
  };

  return <ESPContext.Provider value={value}>{children}</ESPContext.Provider>;
};

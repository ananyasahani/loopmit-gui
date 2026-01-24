import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ============================================================================
// 0. WEB SERIAL API TYPE DEFINITIONS
// ============================================================================
const EMERGENCY_REASONS = {
  EMR_NONE: 0,
  EMR_IMU_FAIL: 1 << 0,
  EMR_LIDAR1_FAIL: 1 << 1,
  EMR_LIDAR2_FAIL: 1 << 2,
  EMR_VOLTAGE1_FAIL: 1 << 3,
  EMR_VOLTAGE2_FAIL: 1 << 4,
  EMR_VOLTAGE3_FAIL: 1 << 5,
  EMR_TEMP1_FAIL: 1 << 6,
  EMR_TEMP2_FAIL: 1 << 7,
  EMR_TEMP3_FAIL: 1 << 8,
  EMR_PRESSURE_FAIL: 1 << 9,
  EMR_ORIENTATION: 1 << 10,
  EMR_ACCELERATION: 1 << 11,
  EMR_LIDAR_GAP: 1 << 12,
  EMR_MANUAL_ESTOP: 1 << 13,
} as const;

const EMERGENCY_MESSAGES: Record<number, { message: string; type: 'error' | 'warning' | 'info' }> = {
  [EMERGENCY_REASONS.EMR_IMU_FAIL]: {
    message: 'IMU sensor failure detected',
    type: 'error',
  },
  [EMERGENCY_REASONS.EMR_LIDAR1_FAIL]: {
    message: 'LIDAR 1 sensor failure detected',
    type: 'error',
  },
  [EMERGENCY_REASONS.EMR_LIDAR2_FAIL]: {
    message: 'LIDAR 2 sensor failure detected',
    type: 'error',
  },
  [EMERGENCY_REASONS.EMR_VOLTAGE1_FAIL]: {
    message: 'Voltage sensor 1 failure detected',
    type: 'error',
  },
  [EMERGENCY_REASONS.EMR_VOLTAGE2_FAIL]: {
    message: 'Voltage sensor 2 failure detected',
    type: 'error',
  },
  [EMERGENCY_REASONS.EMR_VOLTAGE3_FAIL]: {
    message: 'Voltage sensor 3 failure detected',
    type: 'error',
  },
  [EMERGENCY_REASONS.EMR_TEMP1_FAIL]: {
    message: 'Temperature sensor 1 failure detected',
    type: 'error',
  },
  [EMERGENCY_REASONS.EMR_TEMP2_FAIL]: {
    message: 'Temperature sensor 2 failure detected',
    type: 'error',
  },
  [EMERGENCY_REASONS.EMR_TEMP3_FAIL]: {
    message: 'Temperature sensor 3 failure detected',
    type: 'error',
  },
  [EMERGENCY_REASONS.EMR_PRESSURE_FAIL]: {
    message: 'Pressure sensor failure detected',
    type: 'error',
  },
  [EMERGENCY_REASONS.EMR_ORIENTATION]: {
    message: 'Orientation out of acceptable range',
    type: 'warning',
  },
  [EMERGENCY_REASONS.EMR_ACCELERATION]: {
    message: 'Acceleration limit exceeded',
    type: 'warning',
  },
  [EMERGENCY_REASONS.EMR_LIDAR_GAP]: {
    message: 'LIDAR gap detection warning',
    type: 'warning',
  },
  [EMERGENCY_REASONS.EMR_MANUAL_ESTOP]: {
    message: 'Manual emergency stop activated',
    type: 'error',
  },
};
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
  
  // IMU - Orientation
  orientation: { x: number; y: number; z: number }; // [heading, pitch, roll] - array format
  object_temp:number;
  calibration: { gyro: number; sys: number; magneto: number };

  
  // IMU - Acceleration
  acceleration: { x: number; y: number; z: number; magnitude: number }; // [accel_x, accel_y, accel_z] - array format
  
  // IMU Health
  bno_health: number;
  icg_health: number;
  
  // LIDAR
  gap_height: number;
  lidar_health: number;
  gap_height2: number;
  lidar2_health: number;
  
  temperatures: number[];//
  temp1_health: number;
  temp2_health: number;
  temp3_health: number;
  
  // Voltages
  voltage1: number;
  voltage1_health: number;
  voltage2: number;
  voltage2_health: number;
  voltage3: number;
  voltage3_health: number;
  
  // Pressure
  pressure: number;
  pressure_health: number;
  
  // System State
  emergency_reason_mask: number; // Binary string like "0000000000000000"

 //safety esp
  wiring_health:number;
  heartbeat_count:number;
  last_heartbeat_ms:number;
  
  
  // master-to-pilot
  safety_heartbeat_health: number;
  safety_hb_last_time: number;
  timestamp: number;
  safety_heartbeat_count: number;
  //safety-to-pilot
  master_heartbeat_health:number;
  heartbeat_health:number;



  //state info
  current_state:string;
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
        result.gap_height = rawData.gap_height;
      }
      if (rawData.gap_height2 !== undefined) {
        result.gap_height2 = rawData.gap_height2;
      }
      if (rawData.lidar_health !== undefined) {
        result.lidar_health = rawData.lidar_health;
      }
      if (rawData.current_state !== undefined) {
        result.current_state = rawData.current_state;
      }
      if (rawData.lidar2_health !== undefined) {
        result.lidar2_health = rawData.lidar2_health;
      }
      if (rawData.object_temp !== undefined) {
        result.object_temp = rawData.object_temp;
      }
  
      // IMU Health
      if (rawData.bno_health !== undefined) {
        result.bno_health = rawData.bno_health;
      }
      if (rawData.icg_health !== undefined) {
        result.icg_health = rawData.icg_health;
      }
  
      // Voltages
      if (rawData.voltage1 !== undefined) {
        result.voltage1 = rawData.voltage1;
      }
      if (rawData.voltage1_health !== undefined) {
        result.voltage1_health = rawData.voltage1_health;
      }
      if (rawData.voltage2 !== undefined) {
        result.voltage2 = rawData.voltage2;
      }
      if (rawData.voltage2_health !== undefined) {
        result.voltage2_health = rawData.voltage2_health;
      }
      if (rawData.voltage3 !== undefined) {
        result.voltage3 = rawData.voltage3;
      }
      if (rawData.voltage3_health !== undefined) {
        result.voltage3_health = rawData.voltage3_health;
      }
  
      // Temperature Health
      if (rawData.temp1_health !== undefined) {
        result.temp1_health = rawData.temp1_health;
      }
      if (rawData.temp2_health !== undefined) {
        result.temp2_health = rawData.temp2_health;
      }
      if (rawData.temp3_health !== undefined) {
        result.temp3_health = rawData.temp3_health;
      }
  
      // Pressure
      if (rawData.pressure !== undefined) {
        result.pressure = rawData.pressure;
      }
      if (rawData.pressure_health !== undefined) {
        result.pressure_health = rawData.pressure_health;
      }
  
      // System State
      if (rawData.emergency_reason_mask !== undefined) {
        result.emergency_reason_mask = rawData.emergency_reason_mask;
      }
  
      // Safety ESP
      if (rawData.wiring_health !== undefined) {
        result.wiring_health = rawData.wiring_health;
      }
      if (rawData.heartbeat_count !== undefined) {
        result.heartbeat_count = rawData.heartbeat_count;
      }
      if (rawData.last_heartbeat_ms !== undefined){
        result.last_heartbeat_ms = rawData.last_heartbeat_ms;
      }
  
      // Safety & Heartbeat
      if (rawData.safety_heartbeat_health !== undefined) {
        result.safety_heartbeat_health = rawData.safety_heartbeat_health;
      }

      if (rawData.master_heartbeat_health !== undefined) {
        result.master_heartbeat_health = rawData.master_heartbeat_health;
      }
      if (rawData.safety_hb_last_time !== undefined) {
        result.safety_hb_last_time = rawData.safety_hb_last_time;
      }
      if (rawData.timestamp !== undefined) {
        result.timestamp = rawData.timestamp;
      }

      // Extract multiple temperature sensors
      // Support array format: temp_sensors: [t1, t2, t3, t4]
      if (Array.isArray(rawData.temp_sensors) && rawData.temp_sensors.length >= 2) {
        result.temperatures = rawData.temp_sensors.slice(0, 4);
        // Also set objectTemp to first sensor for backward compatibility
        if (!result.object_temp) {
          result.object_temp = rawData.temp_sensors[0];
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
        if (!result.object_temp && rawData.temp1 !== undefined) {
          result.object_temp = rawData.temp1;
        }
      }
      // Fallback to single object_temp if available
      else if (rawData.object_temp !== undefined) {
        result.temperatures = [rawData.object_temp, 0, 0, 0];
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
    // LIDAR
    gap_height: 0,
    gap_height2: 0,
    lidar_health: 0,
    lidar2_health: 0,
    object_temp:0,
    
    
    // IMU - Orientation & Acceleration
    orientation: { x: 0, y: 0, z: 0 },
    acceleration: { x: 0, y: 0, z: 0, magnitude: 0 },
    calibration: { gyro: 0, sys: 0,magneto: 0 },

    
    // IMU Health
    bno_health: 0,
    icg_health: 0,
    
    // Temperatures
    temperatures: [0, 0, 0],
    temp1_health: 0,
    temp2_health: 0,
    temp3_health: 0,
    
    // Voltages
    voltage1: 0,
    voltage1_health: 0,
    voltage2: 0,
    voltage2_health: 0,
    voltage3: 0,
    voltage3_health: 0,
    
    // Pressure
    pressure: 0,
    pressure_health: 0,
    
    // System State
    emergency_reason_mask: 0,
    
    // Safety ESP
    wiring_health: 0,
    heartbeat_count: 0,
    last_heartbeat_ms: 0,
    
    // Safety & Heartbeat
    safety_heartbeat_health: 0,
    safety_hb_last_time: 0,
    timestamp: 0,
    safety_heartbeat_count: 0,

    //current state info
    current_state:"",
    //safety
    master_heartbeat_health:0,
    heartbeat_health:0,
  });
  
  // Track which errors have already been logged to prevent duplicates
  const [loggedEmergencies, setLoggedEmergencies] = useState<Set<number>>(new Set());

  // Function to check and log emergency reasons
  const checkEmergencyReasons = useCallback((mask: number) => {
    if (mask === EMERGENCY_REASONS.EMR_NONE) {
      // Clear logged emergencies when mask is zero
      setLoggedEmergencies(new Set());
      return;
    }

    const newEmergencies = new Set<number>();
    
    // Check each bit in the mask
    Object.entries(EMERGENCY_REASONS).forEach(([key, bitValue]) => {
      if (key === 'EMR_NONE') return;
      
      // Check if this bit is set in the mask
      if ((mask & bitValue) !== 0) {
        newEmergencies.add(bitValue);
        
        // Only log if this emergency hasn't been logged yet
        if (!loggedEmergencies.has(bitValue)) {
          const errorInfo = EMERGENCY_MESSAGES[bitValue];
          if (errorInfo) {
            addError(errorInfo.message, errorInfo.type);
          }
        }
      }
    });
    
    // Update the logged emergencies set
    setLoggedEmergencies(newEmergencies);
  }, [loggedEmergencies, addError]);

  // Monitor emergency_reason_mask changes
  useEffect(() => {
    if (sensorData.emergency_reason_mask !== undefined) {
      checkEmergencyReasons(sensorData.emergency_reason_mask);
    }
  }, [sensorData.emergency_reason_mask, checkEmergencyReasons]);

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
        } else if (extracted.object_temp !== undefined) {
          // Fallback: if only objectTemp is provided, update first sensor
          setTemperatureHistory(prev => 
            historyManager.addPoint(prev, extracted.object_temp!)
          );
          setTemperatureHistories(prev => {
            const newHistories = [...prev];
            newHistories[0] = historyManager.addPoint(newHistories[0], extracted.object_temp!);
            return newHistories;
          });
        }
        if (extracted.gap_height !== undefined) {
          setGapHeightHistory(prev => 
            historyManager.addPoint(prev, extracted.gap_height!)
          );
        }
        if (extracted.voltage1 !== undefined) {
          setVoltageHistory(prev => 
            historyManager.addPoint(prev, extracted.voltage1!)
          );
        }
  
        // ✅ FIXED: Update relay states from JSON with functional update
        if (jsonData.relayStates) {
          setRelayStates(prev => ({ ...prev, ...jsonData.relayStates }));
        }
      }
  
      // ✅ FIXED: Update relay states from STATE: format with functional update
      const relayState = dataParser.parseRelayState(line);
      if (relayState) {
        setRelayStates(prev => ({ ...prev, ...relayState }));
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
      setRelayStates(prev => ({ ...prev , relay1: false, relay3: false, relay4: false }));
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


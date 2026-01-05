# ESPContext System Diagrams

This document contains sequence, state, and class diagrams for the ESPContext system.

## 1. Sequence Diagram - Connection and Data Flow

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant Provider as ESPProvider
    participant SerialMgr as SerialPortManager
    participant Parser as DataParser
    participant HistoryMgr as HistoryManager
    participant RelayCtrl as RelayController
    participant ESP as ESP8266 Device

    Note over UI,ESP: Connection Sequence
    UI->>Provider: connect()
    Provider->>Provider: setIsConnecting(true)
    Provider->>SerialMgr: connect(115200)
    SerialMgr->>ESP: requestPort()
    ESP-->>SerialMgr: SerialPort
    SerialMgr->>ESP: open({ baudRate: 115200 })
    SerialMgr->>SerialMgr: startReading()
    Provider->>Provider: setIsConnected(true)
    Provider->>RelayCtrl: getStatus()
    RelayCtrl->>SerialMgr: send("STATUS")
    SerialMgr->>ESP: "STATUS\n"
    Provider->>Provider: setIsConnecting(false)

    Note over UI,ESP: Data Reception Sequence
    ESP->>SerialMgr: Raw data stream
    SerialMgr->>SerialMgr: Buffer lines
    SerialMgr->>Provider: handleIncomingData(line)
    Provider->>Parser: parseJSON(line)
    Parser-->>Provider: jsonData
    
    alt JSON Data Received
        Provider->>Parser: extractSensorData(jsonData)
        Parser-->>Provider: extracted data
        Provider->>Provider: setSensorData(extracted)
        
        alt Temperature Data
            Provider->>HistoryMgr: addPoint(history, temp)
            HistoryMgr-->>Provider: updated history
            Provider->>Provider: setTemperatureHistories()
        end
        
        alt Gap Height Data
            Provider->>HistoryMgr: addPoint(history, gapHeight)
            HistoryMgr-->>Provider: updated history
            Provider->>Provider: setGapHeightHistory()
        end
        
        alt Voltage Data
            Provider->>HistoryMgr: addPoint(history, voltage)
            HistoryMgr-->>Provider: updated history
            Provider->>Provider: setVoltageHistory()
        end
    end
    
    alt Relay State Line
        Provider->>Parser: parseRelayState(line)
        Parser-->>Provider: relayState
        Provider->>Provider: setRelayStates(relayState)
    end

    Note over UI,ESP: Relay Control Sequence
    UI->>Provider: toggleRelay(num)
    Provider->>RelayCtrl: toggle(num, currentState)
    RelayCtrl->>SerialMgr: send("RELAY{num}_{ON/OFF}")
    SerialMgr->>ESP: Command
    ESP-->>SerialMgr: Response
    SerialMgr->>Provider: handleIncomingData()
    Provider->>Provider: setRelayStates(updated)

    Note over UI,ESP: Disconnection Sequence
    UI->>Provider: disconnect()
    Provider->>SerialMgr: disconnect()
    SerialMgr->>SerialMgr: cancel reader
    SerialMgr->>SerialMgr: close writer
    SerialMgr->>ESP: close()
    Provider->>Provider: setIsConnected(false)
```

## 2. State Diagram - System States

```mermaid
stateDiagram-v2
    [*] --> Disconnected: Initial State
    
    state Disconnected {
        [*] --> Idle
        Idle --> Connecting: connect()
        Connecting --> Connected: Success
        Connecting --> Error: Failure
        Error --> Idle: Retry
    }
    
    state Connected {
        [*] --> Listening
        Listening --> Processing: Data Received
        Processing --> Listening: Update Complete
        Listening --> RelayControl: toggleRelay()
        RelayControl --> Listening: Command Sent
        Listening --> Disconnecting: disconnect()
    }
    
    Disconnected --> Connected: Connection Established
    Connected --> Disconnected: Disconnection
    
    state "Data Processing" as Processing {
        [*] --> Parsing
        Parsing --> Extracting: JSON Valid
        Parsing --> RelayParsing: Relay State Line
        Extracting --> Updating: Extract Complete
        Updating --> HistoryUpdate: Sensor Data
        HistoryUpdate --> [*]
        RelayParsing --> StateUpdate: Parse Complete
        StateUpdate --> [*]
    }
    
    state "History Management" as HistoryUpdate {
        [*] --> AddPoint
        AddPoint --> Cleanup
        Cleanup --> FilterTimeWindow
        FilterTimeWindow --> LimitPoints
        LimitPoints --> [*]
    }
    
    note right of Connected
        States: isConnected=true
        isConnecting=false
    end note
    
    note right of Disconnected
        States: isConnected=false
        isConnecting=false
    end note
    
    note right of Processing
        Handles: Temperature, Gap Height,
        Voltage, Orientation, Acceleration
    end note
```

## 3. Class Diagram - System Architecture

```mermaid
classDiagram
    class ESPProvider {
        -SerialPortManager serialManager
        -DataParser dataParser
        -HistoryManager historyManager
        -RelayController relayController
        -boolean isConnected
        -boolean isConnecting
        -string error
        -SensorData sensorData
        -RelayState relayStates
        -HistoryPoint[] temperatureHistory
        -HistoryPoint[][] temperatureHistories
        -HistoryPoint[] gapHeightHistory
        -HistoryPoint[] voltageHistory
        +connect() Promise~void~
        +disconnect() Promise~void~
        +toggleRelay(num) Promise~void~
        +turnAllOn() Promise~void~
        +turnAllOff() Promise~void~
        +clearHistory() void
        -handleIncomingData(line) void
    }
    
    class SerialPortManager {
        -SerialPort port
        -ReadableStreamDefaultReader reader
        -WritableStreamDefaultWriter writer
        -Function onDataReceived
        +connect(baudRate) Promise~void~
        +disconnect() Promise~void~
        +send(command) Promise~void~
        +onData(callback) void
        +isConnected() boolean
        -startReading() Promise~void~
    }
    
    class DataParser {
        +parseJSON(line) any
        +parseRelayState(line) RelayState
        +extractSensorData(rawData) Partial~SensorData~
    }
    
    class HistoryManager {
        -number maxPoints
        -number timeWindow
        +addPoint(history, value) HistoryPoint[]
        +cleanup(history) HistoryPoint[]
        +clear() HistoryPoint[]
    }
    
    class RelayController {
        -SerialPortManager serialManager
        +toggle(relayNum, currentState) Promise~boolean~
        +turnAllOn() Promise~void~
        +turnAllOff() Promise~void~
        +getStatus() Promise~void~
    }
    
    class SensorData {
        +number gapHeight
        +number objectTemp
        +number[] temperatures
        +number voltage
        +object orientation
        +object acceleration
        +object calibration
    }
    
    class RelayState {
        +boolean relay1
        +boolean relay2
        +boolean relay3
        +boolean relay4
    }
    
    class HistoryPoint {
        +number timestamp
        +number value
    }
    
    class ESPContextType {
        <<interface>>
        +boolean isConnected
        +boolean isConnecting
        +string error
        +SensorData sensorData
        +RelayState relayStates
        +HistoryPoint[] temperatureHistory
        +HistoryPoint[][] temperatureHistories
        +HistoryPoint[] gapHeightHistory
        +HistoryPoint[] voltageHistory
        +connect() Promise~void~
        +disconnect() Promise~void~
        +toggleRelay(num) Promise~void~
        +turnAllOn() Promise~void~
        +turnAllOff() Promise~void~
        +clearHistory() void
    }
    
    ESPProvider ..|> ESPContextType : implements
    ESPProvider --> SerialPortManager : uses
    ESPProvider --> DataParser : uses
    ESPProvider --> HistoryManager : uses
    ESPProvider --> RelayController : uses
    RelayController --> SerialPortManager : uses
    ESPProvider --> SensorData : manages
    ESPProvider --> RelayState : manages
    ESPProvider --> HistoryPoint : manages
    HistoryManager --> HistoryPoint : manages
    DataParser --> SensorData : creates
    DataParser --> RelayState : creates
```

## 4. Sequence Diagram - Relay Control Flow

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant Provider as ESPProvider
    participant RelayCtrl as RelayController
    participant SerialMgr as SerialPortManager
    participant ESP as ESP8266 Device

    Note over UI,ESP: Single Relay Toggle
    UI->>Provider: toggleRelay(2)
    Provider->>RelayCtrl: toggle(2, false)
    RelayCtrl->>RelayCtrl: newState = !false = true
    RelayCtrl->>SerialMgr: send("RELAY2_ON")
    SerialMgr->>ESP: "RELAY2_ON\n"
    ESP-->>SerialMgr: Acknowledgment
    RelayCtrl-->>Provider: true (newState)
    Provider->>Provider: setRelayStates({relay2: true})
    Provider-->>UI: State Updated

    Note over UI,ESP: Turn All Relays On
    UI->>Provider: turnAllOn()
    Provider->>RelayCtrl: turnAllOn()
    RelayCtrl->>SerialMgr: send("ALL_ON")
    SerialMgr->>ESP: "ALL_ON\n"
    ESP-->>SerialMgr: Response
    Provider->>Provider: setRelayStates({all: true})
    Provider-->>UI: All Relays On

    Note over UI,ESP: Turn All Relays Off
    UI->>Provider: turnAllOff()
    Provider->>RelayCtrl: turnAllOff()
    RelayCtrl->>SerialMgr: send("ALL_OFF")
    SerialMgr->>ESP: "ALL_OFF\n"
    ESP-->>SerialMgr: Response
    Provider->>Provider: setRelayStates({all: false})
    Provider-->>UI: All Relays Off
```

## 5. Sequence Diagram - Temperature Data Processing

```mermaid
sequenceDiagram
    participant ESP as ESP8266 Device
    participant SerialMgr as SerialPortManager
    participant Provider as ESPProvider
    participant Parser as DataParser
    participant HistoryMgr as HistoryManager

    Note over ESP,HistoryMgr: Multi-Sensor Temperature Data Flow
    
    ESP->>SerialMgr: JSON: {"temp_sensors": [25.3, 26.1, 24.8, 25.9]}
    SerialMgr->>Provider: handleIncomingData(line)
    Provider->>Parser: parseJSON(line)
    Parser-->>Provider: {temp_sensors: [25.3, 26.1, 24.8, 25.9]}
    
    Provider->>Parser: extractSensorData(jsonData)
    Parser->>Parser: Extract temperatures array
    Parser-->>Provider: {temperatures: [25.3, 26.1, 24.8, 25.9], objectTemp: 25.3}
    
    Provider->>Provider: setSensorData(extracted)
    
    loop For each temperature sensor (4 sensors)
        Provider->>HistoryMgr: addPoint(history[i], temp[i])
        HistoryMgr->>HistoryMgr: Add {timestamp, value}
        HistoryMgr->>HistoryMgr: cleanup()
        HistoryMgr->>HistoryMgr: Filter by timeWindow
        HistoryMgr->>HistoryMgr: Limit to maxPoints
        HistoryMgr-->>Provider: Updated history[i]
    end
    
    Provider->>Provider: setTemperatureHistories([hist0, hist1, hist2, hist3])
    Provider->>Provider: setTemperatureHistory(hist0) [backward compat]
    
    Note over ESP,HistoryMgr: Alternative: Individual Temperature Fields
    ESP->>SerialMgr: JSON: {"temp1": 25.3, "temp2": 26.1, "temp3": 24.8, "temp4": 25.9}
    SerialMgr->>Provider: handleIncomingData(line)
    Provider->>Parser: parseJSON(line)
    Parser-->>Provider: {temp1: 25.3, temp2: 26.1, temp3: 24.8, temp4: 25.9}
    Provider->>Parser: extractSensorData(jsonData)
    Parser->>Parser: Extract individual temp fields
    Parser-->>Provider: {temperatures: [25.3, 26.1, 24.8, 25.9]}
    Provider->>Provider: Update histories (same as above)
```

## Diagram Notes

### Sequence Diagrams
- Show the interaction flow between components
- Demonstrate async operations and callbacks
- Illustrate data transformation pipeline

### State Diagram
- Represents system lifecycle states
- Shows transitions between connection states
- Includes nested states for data processing

### Class Diagram
- Shows class structure and relationships
- Displays dependencies and associations
- Illustrates data flow through the system

### Key Components
1. **ESPProvider**: Main React context provider managing all state
2. **SerialPortManager**: Handles Web Serial API communication
3. **DataParser**: Parses incoming JSON and relay state data
4. **HistoryManager**: Manages time-series data with cleanup
5. **RelayController**: Controls relay operations via serial commands




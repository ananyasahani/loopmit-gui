# LoopMIT - Hyperloop Pod Control Dashboard

This repository contains the code for the **LoopMIT Hyperloop Pod Control Dashboard**, a sophisticated interface designed to monitor and control the Hyperloop pod's subsystems in real-time. It provides critical data visualization, hardware control, and safety monitoring capabilities.

## Key Features

*   **Real-Time Sensor Monitoring**: Instant visualization of critical telemetry including:
    *   **Temperature**: Multi-point thermal monitoring of pod systems.
    *   **Gap Height**: Precise levitation gap measurements via LIDAR.
    *   **Voltage**: Battery and power system voltage levels.
    *   **IMU Data**: Orientation (Pitch, Roll, Yaw) and Acceleration monitoring.
*   **Relay Control System**: Direct manual and automated control of on-board electrical relays to manage power distribution to subsystems.
*   **3D Visualization**: Interactive 3D representation of the pod's orientation and state using `react-three-fiber`.
*   **Safety & Error Logging**: robust error detection system with bitmask-based failure identification and historical logging.
*   **Hardware Integration**: Seamless communication with the ESP8266 microcontroller via the **Web Serial API**, eliminating the need for intermediate backend servers.
*   **Secure Access**: Role-based authentication and user management powered by **Clerk**.

## Technical Stack

*   **Frontend**: React, Vite, Tailwind CSS
*   **3D Graphics**: React Three Fiber
*   **Hardware Communication**: Web Serial API
*   **Authentication**: Clerk
*   **State Management**: React Context API (`ESPContext`)

---

## Error Logging System

The system implements a robust error detection mechanism based on a binary bitmask `emergency_reason_mask`. This allows efficient transmission of multiple error states simultaneously from the hardware to the dashboard.

### How it Works

1.  **Bitmask Transmission**: The ESP8266 sends a single integer (`emergency_reason_mask`) where each bit represents a specific error condition.
2.  **Decoding**: The dashboard performs a bitwise AND operation (e.g., `mask & (1 << n)`) to check which specific errors are active.
3.  **Logging**: Detected errors are logged to the `ErrorLog` state with timestamps and severity levels, which are then displayed in the UI's error history panel.

### Error Codes Mapping

The following table details the error bitmask mapping:

| Bit Index | Hex Value | Decimal | Error Description | Severity |
| :--- | :--- | :--- | :--- | :--- |
| 0 | `0x0001` | 1 | **IMU Sensor Failure** | Error |
| 1 | `0x0002` | 2 | **LIDAR 1 Sensor Failure** | Error |
| 2 | `0x0004` | 4 | **LIDAR 2 Sensor Failure** | Error |
| 3 | `0x0008` | 8 | **Voltage Sensor 1 Failure** | Error |
| 4 | `0x0010` | 16 | **Voltage Sensor 2 Failure** | Error |
| 5 | `0x0020` | 32 | **Voltage Sensor 3 Failure** | Error |
| 6 | `0x0040` | 64 | **Temperature Sensor 1 Failure** | Error |
| 7 | `0x0080` | 128 | **Temperature Sensor 2 Failure** | Error |
| 8 | `0x0100` | 256 | **Temperature Sensor 3 Failure** | Error |
| 9 | `0x0200` | 512 | **Pressure Sensor Failure** | Error |
| 10 | `0x0400` | 1024 | **Orientation Out of Range** | Warning |
| 11 | `0x0800` | 2048 | **Acceleration Limit Exceeded** | Warning |
| 12 | `0x1000` | 4096 | **LIDAR Gap Warning** | Warning |
| 13 | `0x2000` | 8192 | **Manual Emergency Stop** | Error |

---

## System Diagrams

### 1. Sequence Diagram - Connection and Data Flow

This diagram illustrates how the dashboard connects to the hardware and processes incoming telemetry.

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

### 2. State Diagram - System States

Shows the lifecycle states of the application, from disconnected to active monitoring.

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

### 3. Class Diagram - System Architecture

Visualizes the relationship between the key classes: `ESPProvider`, `SerialPortManager`, `DataParser`, and others.

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

### 4. Sequence Diagram - Relay Control Flow

Details the request-response cycle when a relay is toggled.

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

### 5. Sequence Diagram - Temperature Data Processing

Shows how multi-sensor temperature data is parsed and stored in history.

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

## Running the Code

1.  **Install Dependencies**:
    ```bash
    npm i
    ```
2.  **Start Development Server**:
    ```bash
    npm run dev
    ```

---
**Note**: This README is auto-generated for project presentation purposes.
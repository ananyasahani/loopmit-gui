# ESPContext - Real-Time IoT Sensor Dashboard

A modern web-based dashboard for monitoring and controlling ESP8266-connected sensors and relays in real-time using the Web Serial API.

## 📸 Screenshots

### System Overview
![loopMIT Control Center - System Health Dashboard](./Screenshot%202026-01-22%20200358.png)

### Multi-Sensor Monitoring
![Sensor Grid - Voltage, Gap Height, Acceleration, and Orientation](./Screenshot%202026-01-22%20200455.png)
*Real-time monitoring of voltage levels, gap height sensors, acceleration data, orientation, temperature sensors, and pressure readings*

### Temperature Analytics
![Temperature Monitoring with Multi-Sensor Display](./Screenshot%202026-01-22%20201334.png)
*Live temperature tracking across 4 sensors with configurable threshold alerts and historical data visualization*

## 🎯 Project Goals

This project demonstrates:

- **Real-Time IoT Communication**: Seamless bidirectional communication between web applications and hardware devices using the Web Serial API
- **Complex State Management**: Efficient handling of multiple sensor streams, historical data, and device states in a React application
- **Modern Web Architecture**: Implementation of context-based state management patterns for scalable IoT applications
- **Data Visualization**: Real-time charting and monitoring of temperature, voltage, and positioning sensors
- **Hardware Integration**: Direct browser-to-device communication without backend infrastructure requirements

## 🛠️ Technologies Used

### Frontend
- **React** - Component-based UI architecture
- **TypeScript** - Type-safe development
- **React Context API** - Global state management
- **shadcn/ui** - Modern UI component library
- **Recharts** - Data visualization and real-time charting

### Hardware Integration
- **Web Serial API** - Direct browser-to-device communication
- **ESP8266** - Microcontroller platform
- **JSON Protocol** - Structured data exchange format

### Development Tools
- **Vite** - Fast build tooling and development server
- **Mermaid** - System architecture documentation

## 📊 System Architecture

The application follows a modular architecture with clear separation of concerns:

### Core Components

1. **ESPProvider** - Central state management and coordination layer
2. **SerialPortManager** - Web Serial API abstraction and data streaming
3. **DataParser** - JSON parsing and sensor data extraction
4. **HistoryManager** - Time-series data management with automatic cleanup
5. **RelayController** - Device control command interface

### Key Features

- **Multi-Sensor Support**: Monitors up to 4 temperature sensors simultaneously
- **Historical Data Tracking**: Maintains time-windowed history for temperature, gap height, and voltage readings
- **Relay Control**: Toggle individual relays or control all relays at once
- **Automatic Reconnection**: Robust error handling and connection management
- **Real-Time Updates**: Live sensor data streaming with configurable update rates

## 🔄 Data Flow

```
ESP8266 Device → Serial Port → SerialPortManager → ESPProvider
                                                        ↓
                                                   DataParser
                                                        ↓
                                                HistoryManager
                                                        ↓
                                              UI Components
```

## 📡 Supported Sensors & Data

- **Temperature Sensors**: Multi-point temperature monitoring (MLX90614)
- **Gap Height Sensor**: Positioning data via ultrasonic measurement
- **Voltage Monitoring**: Real-time voltage tracking
- **Orientation**: 3-axis orientation data (pitch, roll, yaw)
- **Acceleration**: 3-axis accelerometer readings

## 🎮 Relay Control

- Individual relay toggle (4 independent channels)
- Bulk operations (All On/All Off)
- Real-time state feedback
- Command acknowledgment system

## 📈 Performance Optimizations

- **Efficient Buffer Management**: Streaming data buffering with line-based parsing
- **History Cleanup**: Automatic time-window filtering and point limiting
- **State Batching**: Optimized React state updates to minimize re-renders
- **Memory Management**: Configurable history limits to prevent memory leaks

## 🔒 Browser Compatibility

This application requires a browser with Web Serial API support:
- Chrome 89+
- Edge 89+
- Opera 75+

## 📚 Documentation

Comprehensive system diagrams are available in `ESPContext_Diagrams.md`, including:

- Sequence diagrams for connection, data flow, and relay control
- State diagrams showing system lifecycle
- Class diagrams illustrating component relationships
- Temperature data processing workflows

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔌 Hardware Setup

The system communicates with ESP8266 devices at 115200 baud rate using a simple text-based protocol:

**Commands:**
- `STATUS` - Request current relay states
- `RELAY{n}_ON` - Turn on relay n (1-4)
- `RELAY{n}_OFF` - Turn off relay n (1-4)
- `ALL_ON` - Activate all relays
- `ALL_OFF` - Deactivate all relays

**Data Format:**
- JSON objects for sensor data
- Plain text for relay state responses

## 💡 Key Technical Achievements

- **Zero-Backend Architecture**: Direct browser-to-hardware communication eliminates server requirements
- **Scalable State Management**: Context-based architecture supports easy feature expansion
- **Type Safety**: Full TypeScript implementation prevents runtime errors
- **Modular Design**: Clean separation enables independent component testing and maintenance
- **Real-Time Performance**: Sub-second data updates with efficient rendering

## 📄 License

Components from [shadcn/ui](https://ui.shadcn.com/) used under [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).

Photos from [Unsplash](https://unsplash.com) used under [license](https://unsplash.com/license).

---

**Note for Recruiters**: This project showcases modern web development practices, hardware integration skills, and the ability to create production-ready IoT applications. The codebase demonstrates proficiency in React ecosystem, TypeScript, real-time data handling, and browser APIs.

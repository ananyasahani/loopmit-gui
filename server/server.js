const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const WebSocket = require('ws');

const app = express();
const HTTP_PORT = 3001; // Different from Next.js (3000)
const WS_PORT = 8080;

// Create HTTP server
const server = app.listen(HTTP_PORT, () => {
  console.log(`HTTP Server running on port ${HTTP_PORT}`);
});

// Create WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`WebSocket server running on port ${WS_PORT}`);

// Configure Serial Port (COM11 for Windows)
const port = new SerialPort({ 
  path: 'COM3',  // Change this to your COM portk
  baudRate: 115200 
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Read data from ESP32 and broadcast to all clients
parser.on('data', (data) => {
  try {
    console.log('Received from ESP32:', data);
    
    // Parse the data (assuming ESP32 sends JSON like: {"temperature": 25.5})
    const tempData = JSON.parse(data);
    
    // Add timestamp
    const dataWithTime = {
      ...tempData,
      timestamp: Date.now()
    };
    
    // Broadcast to all connected WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(dataWithTime));
      }
    });
  } catch (error) {
    console.error('Error parsing data:', error);
  }

});


port.on('error', (err) => {
  console.error('Serial port error:', err.message);
});
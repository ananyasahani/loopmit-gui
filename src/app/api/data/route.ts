import express from 'express';
const app = express();

app.get('/api/data', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  let timeCounter = 0;
  
  const interval = setInterval(() => {
    timeCounter += 0.1;
    
    const dummyData = {
      isConnected: true,
      isConnecting: false,
      sensorData: {
        gap_height: parseFloat((30.0 + 20.0 * Math.sin(timeCounter)).toFixed(1)),
        objectTemp: 0,
        temperatures: [
          parseFloat((25.0 + 5.0 * Math.sin(timeCounter * 0.5)).toFixed(1)),
          parseFloat((25.0 + 5.0 * Math.sin(timeCounter * 0.5)).toFixed(1)),
          parseFloat((25.0 + 5.0 * Math.sin(timeCounter * 0.5)).toFixed(1)),
          parseFloat((25.0 + 5.0 * Math.sin(timeCounter * 0.5)).toFixed(1))
        ],
        voltage: parseFloat((3.7 + 0.5 * Math.sin(timeCounter * 0.1)).toFixed(2)),
        orientation: {
          x: parseFloat((180.0 * Math.sin(timeCounter * 0.3)).toFixed(2)),
          y: parseFloat((90.0 * Math.cos(timeCounter * 0.2)).toFixed(2)),
          z: parseFloat((45.0 * Math.sin(timeCounter * 0.4)).toFixed(2))
        },
        acceleration: {
          x: parseFloat((0.5 * Math.sin(timeCounter)).toFixed(3)),
          y: parseFloat((0.3 * Math.cos(timeCounter)).toFixed(3)),
          z: 9.8,
          magnitude: 0
        },
        calibration: {
          gyro: Math.floor(Math.random() * 4),
          sys: Math.floor(Math.random() * 4),
          magneto: Math.floor(Math.random() * 4)
        }
      }
    };
    
    res.write(`data: ${JSON.stringify(dummyData)}\n\n`);
  }, 1000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

app.listen(3001, () => {
  console.log('API server running on http://localhost:3001');
});
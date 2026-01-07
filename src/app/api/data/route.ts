
// Vite API route handler for Server-Sent Events
export default function handler(req: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let interval: ReturnType<typeof setInterval>;
      let timeCounter = 0;
      
      interval = setInterval(() => {
        try {
          // Increment time counter for sinusoidal patterns
          timeCounter += 0.1;
          
          const dummyData = {
            gap_height: parseFloat((30.0 + 20.0 * Math.sin(timeCounter)).toFixed(1)),
            object_temp: parseFloat((25.0 + 5.0 * Math.sin(timeCounter * 0.5)).toFixed(1)),
            orientX: parseFloat((180.0 * Math.sin(timeCounter * 0.3)).toFixed(2)),
            orientY: parseFloat((90.0 * Math.cos(timeCounter * 0.2)).toFixed(2)),
            orientZ: parseFloat((45.0 * Math.sin(timeCounter * 0.4)).toFixed(2)),
            accelX: parseFloat((0.5 * Math.sin(timeCounter)).toFixed(3)),
            accelY: parseFloat((0.3 * Math.cos(timeCounter)).toFixed(3)),
            accelZ: 9.8,
            gyro: Math.floor(Math.random() * 4),
            sys: Math.floor(Math.random() * 4),
            mag: Math.floor(Math.random() * 4),
            voltage: parseFloat((3.7 + 0.5 * Math.sin(timeCounter * 0.1)).toFixed(2)),
            mode: "MOCK_MODE",
            time: Date.now()
          };
          
          const message = `data: ${JSON.stringify(dummyData)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          clearInterval(interval);
        }
      }, 1000);
      
      // Cleanup function
      req.signal?.addEventListener('abort', () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch (e) {
          // Controller might already be closed
        }
        console.log('Mock stream closed');
      });
    },
    cancel() {
      console.log('Client cancelled the stream');
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    // Custom plugin to handle API routes
    {
      name: 'api-routes',
      configureServer(server) {
        server.middlewares.use('/api/data', async (req, res, next) => {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            
            const encoder = new TextEncoder();
            let interval: ReturnType<typeof setInterval>;
            
            interval = setInterval(() => {
              try {
                const dummyData = {
                  gap_height: Math.floor(Math.random() * 100) + 50,
                  object_temp: (Math.random() * 10 + 20).toFixed(1),
                  mode: "MOCK_MODE",
                  time: Date.now()
                };
                
                const message = `data: ${JSON.stringify(dummyData)}\n\n`;
                res.write(message);
              } catch (error) {
                clearInterval(interval);
                res.end();
              }
            }, 1000);
            
            req.on('close', () => {
              clearInterval(interval);
              res.end();
              console.log('Mock stream closed');
            });
          } else {
            next();
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
})

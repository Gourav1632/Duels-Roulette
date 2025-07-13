import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './socketHandlers';
import dotenv from 'dotenv';

dotenv.config(); // Load .env variables

function startServer() {
  const app = express();
  const httpServer = createServer(app);

  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  registerSocketHandlers(io);

  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
    console.log(`🌐 CORS origin allowed: ${allowedOrigin}`);
  });
}

export default startServer;

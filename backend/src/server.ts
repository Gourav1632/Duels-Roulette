import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {registerSocketHandlers} from './socketHandlers';

function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  registerSocketHandlers(io);

  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
  });
}

export default startServer;

import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (process.env.FRONTEND_URL || 'http://localhost:5173').trim(),
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Guild-specific rooms for real-time updates
    socket.on('join_guild_room', (guildId) => {
      socket.join(`guild_${guildId}`);
      console.log(`Socket ${socket.id} joined guild room: ${guildId}`);
    });

    // Admin Sync
    socket.on('guild_sync_response', (data) => {
      console.log('Received guild sync from bot.');
      // This will be used to enrich the globalGuildsCache in admin.js
      // We can also emit this to any admin clients
      io.emit('admin_guild_update', data.guilds);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

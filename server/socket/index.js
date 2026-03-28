const { Server } = require('socket.io');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? true : (process.env.CLIENT_URL || 'http://localhost:5173'),
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connecté:', socket.id);

    socket.on('join_admin', () => {
      socket.join('admin');
      console.log('Admin rejoint:', socket.id);
    });

    socket.on('join_order', (orderNumber) => {
      socket.join(`order_${orderNumber}`);
    });

    socket.on('disconnect', () => {
      console.log('Client déconnecté:', socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io non initialisé');
  return io;
}

module.exports = { initSocket, getIO };

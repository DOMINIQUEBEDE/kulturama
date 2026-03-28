import { io } from 'socket.io-client';

const socket = io('/', {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

export function connectSocket() {
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  socket.disconnect();
}

export function joinAdmin() {
  socket.emit('join_admin');
}

export function joinOrder(orderNumber) {
  socket.emit('join_order', orderNumber);
}

export default socket;

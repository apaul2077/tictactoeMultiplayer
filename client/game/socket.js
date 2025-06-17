import { io } from 'socket.io-client';

// For development
const clientSideSocket = io('http://localhost:3000', {
  withCredentials: true,
  transports: ['websocket'],
});

// For production:
// const clientSideSocket = io('https://tic-tac-toe-multiplayer-epyb.onrender.com', {
//   withCredentials: true,
//   transports: ['websocket'],
// });

export default clientSideSocket;

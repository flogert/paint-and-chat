import { Server } from 'socket.io';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const server = res.socket.server;

    if (!server.io) {
      const io = new Server(server, {
        path: '/api/socket',
        addTrailingSlash: false,
      });

      io.on('connection', (socket) => {
        console.log('a user connected');

        socket.on('draw', (data) => {
          socket.broadcast.emit('draw', data);
        });

        socket.on('chat', (message) => {
          socket.broadcast.emit('chat', message);
        });

        socket.on('disconnect', () => {
          console.log('user disconnected');
        });
      });

      server.io = io;
    }
    res.end();
  }
}

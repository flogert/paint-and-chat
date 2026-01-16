const express = require("express");
const next = require("next");
const socketIo = require("socket.io");
const http = require("http");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Room management
const rooms = new Map(); // roomCode -> { players: Map<socketId, playerInfo>, createdAt: Date }
const MAX_PLAYERS_PER_ROOM = 4;

// Generate a random 6-character room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get unique room code
function getUniqueRoomCode() {
  let code;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));
  return code;
}

// Clean up empty rooms periodically
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (room.players.size === 0 && now - room.createdAt > 60000) { // 1 minute
      rooms.delete(code);
      console.log(`Room ${code} deleted (empty)`);
    }
  }
}, 30000);

app.prepare().then(() => {
  const expressApp = express();
  const server = http.createServer(expressApp);
  const io = socketIo(server, {
    path: '/api/socket',
  });

  // Handle socket connections
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    
    let currentRoom = null;
    let playerName = null;
    let playerNumber = null;

    // Create a new room
    socket.on("createRoom", (data, callback) => {
      const roomCode = getUniqueRoomCode();
      playerName = data.name || 'Player 1';
      playerNumber = 1;
      
      rooms.set(roomCode, {
        players: new Map([[socket.id, { name: playerName, number: playerNumber, side: 'left' }]]),
        createdAt: Date.now(),
      });
      
      socket.join(roomCode);
      currentRoom = roomCode;
      
      console.log(`Room ${roomCode} created by ${playerName}`);
      
      callback({
        success: true,
        roomCode,
        playerNumber,
        players: [{ id: socket.id, name: playerName, number: playerNumber, side: 'left' }]
      });
    });

    // Join an existing room
    socket.on("joinRoom", (data, callback) => {
      const { roomCode, name } = data;
      const room = rooms.get(roomCode.toUpperCase());
      
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }
      
      if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
        callback({ success: false, error: 'Room is full' });
        return;
      }
      
      playerNumber = room.players.size + 1;
      playerName = name || `Player ${playerNumber}`;
      const side = playerNumber % 2 === 1 ? 'left' : 'right';
      
      room.players.set(socket.id, { name: playerName, number: playerNumber, side });
      
      socket.join(roomCode.toUpperCase());
      currentRoom = roomCode.toUpperCase();
      
      // Get all players in room
      const players = Array.from(room.players.entries()).map(([id, info]) => ({
        id, name: info.name, number: info.number, side: info.side
      }));
      
      console.log(`${playerName} joined room ${currentRoom}`);
      
      // Notify others in room
      socket.to(currentRoom).emit('playerJoined', {
        id: socket.id,
        name: playerName,
        number: playerNumber,
        side,
        players
      });
      
      callback({
        success: true,
        roomCode: currentRoom,
        playerNumber,
        side,
        players
      });
    });

    // Handle cursor movement
    socket.on('cursor-move', (data) => {
      if (currentRoom) {
        socket.to(currentRoom).emit('cursor-move', { ...data, id: socket.id });
      }
    });

    // Leave room
    socket.on("leaveRoom", () => {
      if (currentRoom && rooms.has(currentRoom)) {
        const room = rooms.get(currentRoom);
        room.players.delete(socket.id);
        
        socket.to(currentRoom).emit('playerLeft', {
          id: socket.id,
          name: playerName,
          players: Array.from(room.players.entries()).map(([id, info]) => ({
            id, name: info.name, number: info.number, side: info.side
          }))
        });
        
        socket.leave(currentRoom);
        console.log(`${playerName} left room ${currentRoom}`);
        
        currentRoom = null;
        playerName = null;
        playerNumber = null;
      }
    });

    socket.on("disconnect", () => {
      if (currentRoom && rooms.has(currentRoom)) {
        const room = rooms.get(currentRoom);
        room.players.delete(socket.id);
        
        socket.to(currentRoom).emit('playerLeft', {
          id: socket.id,
          name: playerName,
          players: Array.from(room.players.entries()).map(([id, info]) => ({
            id, name: info.name, number: info.number, side: info.side
          }))
        });
        
        console.log(`${playerName} disconnected from room ${currentRoom}`);
      }
      console.log("User disconnected:", socket.id);
    });

    // Handle drawing events - only to room members
    socket.on("draw", (data) => {
      if (currentRoom) {
        socket.to(currentRoom).emit("draw", data);
      }
    });

    // Handle chat events - only to room members
    socket.on("chat", (message) => {
      if (currentRoom) {
        socket.to(currentRoom).emit("chat", { text: message, sender: playerName });
      }
    });

    // Pong game events
    socket.on("pongPaddle", (data) => {
      if (currentRoom) {
        socket.to(currentRoom).emit("pongPaddle", data);
      }
    });

    socket.on("pongBall", (data) => {
      if (currentRoom) {
        socket.to(currentRoom).emit("pongBall", data);
      }
    });

    socket.on("pongScore", (data) => {
      if (currentRoom) {
        socket.to(currentRoom).emit("pongScore", data);
      }
    });

    // Pong Ready/Start logic (Updated for image support)
    socket.on('pong-ready', ({ side, paddleImage }) => {
      if (!currentRoom || !rooms.has(currentRoom)) return;
      const room = rooms.get(currentRoom);
      
      if (!room.pong) room.pong = { ready: { left: false, right: false }, players: {} };
      room.pong.ready[side] = true;
      room.pong.players[side] = { paddleImage };
      
      io.to(currentRoom).emit('pong-player-ready', { side });
      
      if (room.pong.ready.left && room.pong.ready.right) {
        io.to(currentRoom).emit('pong-start', { 
          leftPaddle: room.pong.players.left.paddleImage,
          rightPaddle: room.pong.players.right.paddleImage
        });
        room.pong.ready = { left: false, right: false };
      }
    });

    socket.on("pongEnd", () => {
      if (currentRoom) {
        io.to(currentRoom).emit("pongEnd");
      }
    });

    // --- Galaga Game Events ---
    socket.on('galaga-ready', ({ side, shipImage }) => {
      if (!currentRoom || !rooms.has(currentRoom)) return;
      const room = rooms.get(currentRoom);
      
      if (!room.galaga) room.galaga = { ready: { left: false, right: false }, players: {} };
      room.galaga.ready[side] = true;
      room.galaga.players[side] = { shipImage };
      
      io.to(currentRoom).emit('galaga-player-ready', { side });
      
      // If both ready, start
      if (room.galaga.ready.left && room.galaga.ready.right) {
        io.to(currentRoom).emit('galaga-start', { 
          leftShip: room.galaga.players.left.shipImage,
          rightShip: room.galaga.players.right.shipImage
        });
        // Reset ready state for next time
        room.galaga.ready = { left: false, right: false };
      }
    });

    socket.on('galaga-move', ({ side, x }) => {
      if (currentRoom) socket.to(currentRoom).emit('galaga-move', { side, x });
    });

    socket.on('galaga-shoot', ({ side, x, y }) => {
      if (currentRoom) io.to(currentRoom).emit('galaga-shoot', { side, x, y });
    });

    socket.on('galaga-hit-enemy', ({ enemyId, side }) => {
      if (currentRoom) io.to(currentRoom).emit('galaga-enemy-destroyed', { enemyId, side });
    });

    socket.on('galaga-game-over', ({ score }) => {
      if (currentRoom) io.to(currentRoom).emit('galaga-game-over', { score });
    });

    // Host sends enemy updates to sync everyone
    socket.on('galaga-sync-enemies', ({ enemies }) => {
      if (currentRoom) socket.to(currentRoom).emit('galaga-sync-enemies', { enemies });
    });

    // --- Tron Game Events ---
    socket.on('tron-ready', ({ side, boatImage }) => {
      if (!currentRoom || !rooms.has(currentRoom)) return;
      const room = rooms.get(currentRoom);
      
      if (!room.tron) room.tron = { ready: { left: false, right: false }, players: {} };
      room.tron.ready[side] = true;
      room.tron.players[side] = { boatImage };
      
      io.to(currentRoom).emit('tron-player-ready', { side });
      
      if (room.tron.ready.left && room.tron.ready.right) {
        io.to(currentRoom).emit('tron-start', { 
          leftBoat: room.tron.players.left.boatImage,
          rightBoat: room.tron.players.right.boatImage
        });
        room.tron.ready = { left: false, right: false }; // Reset for replay
      }
    });

    socket.on('tron-move', ({ side, direction, x, y }) => {
       if (currentRoom) socket.to(currentRoom).emit('tron-move', { side, direction, x, y });
    });

    socket.on('tron-died', ({ side }) => {
       if (currentRoom) io.to(currentRoom).emit('tron-died', { side }); // Broadcast death
    });
    
    // --- Pacman Game Events ---
    socket.on('pacman-ready', ({ side, pacmanImage }) => {
      if (!currentRoom || !rooms.has(currentRoom)) return;
      const room = rooms.get(currentRoom);
      
      if (!room.pacman) room.pacman = { ready: { left: false, right: false }, players: {} };
      room.pacman.ready[side] = true;
      room.pacman.players[side] = { pacmanImage };
      
      io.to(currentRoom).emit('pacman-player-ready', { side });
      
      if (room.pacman.ready.left && room.pacman.ready.right) {
        io.to(currentRoom).emit('pacman-start', { 
          leftPacman: room.pacman.players.left.pacmanImage,
          rightPacman: room.pacman.players.right.pacmanImage
        });
        room.pacman.ready = { left: false, right: false }; 
      }
    });

    socket.on('pacman-move', ({ side, dir, x, y }) => {
       if (currentRoom) socket.to(currentRoom).emit('pacman-move', { side, dir, x, y });
    });
    
    socket.on('pacman-eat', ({ pelletIndex, side }) => {
       if (currentRoom) socket.to(currentRoom).emit('pacman-eat', { pelletIndex, side });
    });

    // Get room info
    socket.on("getRoomInfo", (callback) => {
      if (currentRoom && rooms.has(currentRoom)) {
        const room = rooms.get(currentRoom);
        const players = Array.from(room.players.entries()).map(([id, info]) => ({
          id, name: info.name, number: info.number, side: info.side
        }));
        callback({ success: true, roomCode: currentRoom, players, playerNumber });
      } else {
        callback({ success: false });
      }
    });
  });

  // Next.js custom routing
  expressApp.all("*", (req, res) => {
    return handle(req, res);
  });

  // Start the server
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});

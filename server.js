const express = require("express");
const next = require("next");
const socketIo = require("socket.io");
const http = require("http");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = http.createServer(expressApp);
  const io = socketIo(server, {
    path: '/api/socket',
  });

  // Handle socket connections
  io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });

    // Handle drawing events
    socket.on("draw", (data) => {
      socket.broadcast.emit("draw", data);
    });

    // Handle chat events
    socket.on("chat", (message) => {
      socket.broadcast.emit("chat", message);
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

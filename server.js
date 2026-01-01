const express = require("express");
const next = require("next");
const socketIo = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Create the socket.io server
  const io = socketIo(server);

  // Handle socket connections
  io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });

    // Add your custom socket event listeners here
    socket.on("draw", (data) => {
      console.log("draw event received", data);
      socket.broadcast.emit("draw", data);  // Broadcast the drawing to other clients
    });
  });

  // Next.js custom routing
  server.all("*", (req, res) => {
    return handle(req, res);
  });

  // Start the server
  server.listen(3000, (err) => {
    if (err) throw err;
    console.log("> Ready on http://localhost:3000");
  });
});

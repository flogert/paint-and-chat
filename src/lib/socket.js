// src/lib/socket.js
import { io } from 'socket.io-client'

const socket = io({
  path: '/api/socket',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
})

export default socket


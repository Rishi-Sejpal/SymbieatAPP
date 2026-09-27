import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

let io = null;

/**
 * Initializes socket.io. Clients authenticate via JWT in the handshake and
 * join a personal room + a role room for targeted broadcasts.
 */
export function initRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.clientUrl, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.data.userId = String(decoded.sub || decoded.id);
      socket.data.role = decoded.role;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, role } = socket.data;
    socket.join(`user:${userId}`);
    if (role) socket.join(`role:${role}`);
    socket.join('kitchen'); // shared live-queue room for staff/chef/admin
    socket.emit('connected', { userId, role });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

// ── Broadcast helpers ────────────────────────────────────────────────
export const emitToUser = (userId, event, payload) =>
  io?.to(`user:${userId}`).emit(event, payload);

export const emitToRoles = (roles, event, payload) =>
  roles.forEach((r) => io?.to(`role:${r}`).emit(event, payload));

export const emitToKitchen = (event, payload) => io?.to('kitchen').emit(event, payload);

export const emitToAll = (event, payload) => io?.emit(event, payload);

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [orderEvents, setOrderEvents] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return undefined;
    const token = localStorage.getItem('symbieat-token');
    const socket = io('/', { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('notification:new', (n) => setNotifications((prev) => [n, ...prev].slice(0, 50)));
    socket.on('order:status', (p) => setOrderEvents((prev) => [p, ...prev].slice(0, 30)));
    socket.on('order:new', (p) => setOrderEvents((prev) => [{ ...p, __new: true }, ...prev].slice(0, 30)));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id || user?.id]);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      notifications,
      orderEvents,
      pushLocalNotification: (n) => setNotifications((prev) => [n, ...prev].slice(0, 50)),
      clearOrderEvents: () => setOrderEvents([]),
    }),
    [notifications, orderEvents]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);

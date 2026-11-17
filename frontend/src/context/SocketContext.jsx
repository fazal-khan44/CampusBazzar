import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext({
  socket: null,
  onlineCount: 0,
  onlineUserIds: [],
  isUserOnline: () => false,
});

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const socketUrl = import.meta.env.VITE_API_BASE_URL
        ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
        : 'http://localhost:5000';

      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        // Register current user
        newSocket.emit('register_user', user._id);
        newSocket.emit('get_online_stats');
      });

      newSocket.on('online_users_update', (data) => {
        if (data) {
          setOnlineCount(data.onlineCount || 0);
          setOnlineUserIds(data.onlineUserIds || []);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      setOnlineCount(0);
      setOnlineUserIds([]);
    }
  }, [user]);

  const isUserOnline = (userId) => {
    if (!userId) return false;
    const uid = typeof userId === 'object' && userId._id ? userId._id.toString() : userId.toString();
    return onlineUserIds.includes(uid);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineCount,
        onlineUserIds,
        isUserOnline,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

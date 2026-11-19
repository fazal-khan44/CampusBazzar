import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const SocketContext = createContext({
  socket: null,
  onlineCount: 0,
  onlineUserIds: [],
  isUserOnline: () => false,
  unreadCounts: {},
  totalUnread: 0,
  globalUnread: 0,
  markConversationRead: () => {},
  markGlobalRead: () => {},
});

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  // { [conversationId]: number }
  const [unreadCounts, setUnreadCounts] = useState({});
  const [globalUnread, setGlobalUnread] = useState(0);
  const { user } = useAuth();

  // Fetch initial unread counts from server
  const fetchUnreadCounts = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/chat/unread-counts');
      if (data) {
        setUnreadCounts(data.conversations || {});
        setGlobalUnread(data.global || 0);
      }
    } catch (err) {
      // silent
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUnreadCounts();

      const socketUrl = import.meta.env.VITE_API_BASE_URL
        ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
        : 'http://localhost:5000';

      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        newSocket.emit('register_user', user._id);
        newSocket.emit('get_online_stats');
      });

      newSocket.on('online_users_update', (data) => {
        if (data) {
          setOnlineCount(data.onlineCount || 0);
          setOnlineUserIds(data.onlineUserIds || []);
        }
      });

      // Server emits this targeted event only to the recipient's sockets
      newSocket.on('new_unread', ({ conversationId }) => {
        setUnreadCounts((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1,
        }));
      });

      // Global campus message listener for unread badge
      newSocket.on('receive_global_message', (msg) => {
        const senderId = msg?.sender?._id || msg?.sender;
        const myId = user._id?.toString();
        if (senderId?.toString() === myId) return;

        // If user is currently looking at global chat tab, don't increment
        const isViewingGlobal =
          window.location.pathname === '/chat' &&
          window.location.search.includes('tab=global');
        if (!isViewingGlobal) {
          setGlobalUnread((prev) => prev + 1);
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
      setUnreadCounts({});
      setGlobalUnread(0);
    }
  }, [user]);

  const isUserOnline = (userId) => {
    if (!userId) return false;
    const uid = typeof userId === 'object' && userId._id ? userId._id.toString() : userId.toString();
    return onlineUserIds.includes(uid);
  };

  // Call this when user opens a conversation — clears badge + marks as read on server
  const markConversationRead = useCallback(async (conversationId) => {
    if (!conversationId) return;
    setUnreadCounts((prev) => {
      if (!prev[conversationId]) return prev;
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
    try {
      await api.put(`/chat/messages/read/${conversationId}`);
    } catch (err) {
      // silent
    }
  }, []);

  // Call this when user opens global chat — clears badge + marks as read on server
  const markGlobalRead = useCallback(async () => {
    setGlobalUnread(0);
    try {
      await api.put('/chat/global/read');
    } catch (err) {
      // silent
    }
  }, []);

  const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + (Number(n) || 0), 0);

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineCount,
        onlineUserIds,
        isUserOnline,
        unreadCounts,
        totalUnread,
        globalUnread,
        markConversationRead,
        markGlobalRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

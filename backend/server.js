const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// Active registered users tracking: userId (string) -> Set of socket.id
const onlineUsers = new Map();
app.set('onlineUsers', onlineUsers);

const broadcastOnlineStatus = () => {
  const userIds = Array.from(onlineUsers.keys());
  io.emit('online_users_update', {
    onlineCount: userIds.length,
    onlineUserIds: userIds,
  });
};

io.on('connection', (socket) => {
  // Register active user
  socket.on('register_user', (userId) => {
    if (!userId) return;
    const uid = userId.toString();
    socket.userId = uid;
    if (!onlineUsers.has(uid)) {
      onlineUsers.set(uid, new Set());
    }
    onlineUsers.get(uid).add(socket.id);
    broadcastOnlineStatus();
  });

  socket.on('get_online_stats', () => {
    const userIds = Array.from(onlineUsers.keys());
    socket.emit('online_users_update', {
      onlineCount: userIds.length,
      onlineUserIds: userIds,
    });
  });

  // Global Chat room / events
  socket.on('join_global_chat', () => {
    socket.join('global_campus_chat');
  });

  socket.on('leave_global_chat', () => {
    socket.leave('global_campus_chat');
  });

  socket.on('send_global_message', (data) => {
    io.emit('receive_global_message', data);
  });

  // Join conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
  });

  socket.on('send_message', (data) => {
    // Broadcast to everyone in room including sender or other clients
    io.to(data.conversationId).emit('receive_message', data);
  });

  // Notify the recipient of a new unread message
  socket.on('notify_unread', ({ recipientId, conversationId }) => {
    if (!recipientId || !conversationId) return;
    const rid = recipientId.toString();
    if (onlineUsers.has(rid)) {
      onlineUsers.get(rid).forEach((sid) => {
        io.to(sid).emit('new_unread', { conversationId });
      });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId && onlineUsers.has(socket.userId)) {
      const userSockets = onlineUsers.get(socket.userId);
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(socket.userId);
      }
      broadcastOnlineStatus();
    }
  });
});

// Standard Middlewares
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hostel Buy & Sell API with Live Chat is running' });
});

// App Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/payment', require('./src/routes/paymentRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/chat', require('./src/routes/chatRoutes'));

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
    console.error(`👉 Solution: Run 'lsof -ti:${PORT} | xargs kill -9' in terminal to free port ${PORT}.\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, () => {
  console.log(`Server & Socket.io running on port ${PORT}`);
});

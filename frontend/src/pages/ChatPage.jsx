import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Send,
  MessageSquare,
  Building,
  Hash,
  ArrowLeft,
  User,
  ShieldCheck,
  Package,
  Globe,
  Users,
  GraduationCap,
  Sparkles,
  Check,
  CheckCheck,
} from 'lucide-react';

const ChatPage = () => {
  const { user } = useAuth();
  const {
    socket,
    onlineCount,
    onlineUserIds,
    isUserOnline,
    markConversationRead,
    unreadCounts,
    totalUnread,
    globalUnread,
    markGlobalRead,
  } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  // Mode: 'global' or 'direct'
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('tab') === 'global' ? 'global' : 'direct';
  const [chatMode, setChatMode] = useState(initialMode);

  // Direct conversations state
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Global chat state
  const [globalMessages, setGlobalMessages] = useState([]);
  const [globalMsgInput, setGlobalMsgInput] = useState('');
  const [globalLoading, setGlobalLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const globalMessagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToGlobalBottom = () => {
    globalMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sync mode with query param changes
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab === 'global') {
      setChatMode('global');
      markGlobalRead();
    }
  }, [location.search, markGlobalRead]);

  // Fetch all direct conversations of user
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await api.get('/chat/conversations');
        setConversations(data);

        // If redirected from product details with a specific conversation
        if (location.state?.activeConversation) {
          setActiveConv(location.state.activeConversation);
          setChatMode('direct');
        } else if (data.length > 0 && !activeConv && chatMode === 'direct') {
          setActiveConv(data[0]);
        }
      } catch (err) {
        console.error('Failed to load conversations', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchConversations();
    }
  }, [user, location.state]);

  // Fetch global messages on load
  useEffect(() => {
    const fetchGlobalMessages = async () => {
      try {
        setGlobalLoading(true);
        const { data } = await api.get('/chat/global/messages');
        setGlobalMessages(data);
      } catch (err) {
        console.error('Failed to fetch global messages', err);
      } finally {
        setGlobalLoading(false);
      }
    };

    if (user) {
      fetchGlobalMessages();
    }
  }, [user]);

  // Global chat socket listener
  useEffect(() => {
    if (!socket) return;

    socket.emit('join_global_chat');

    const handleReceiveGlobal = (msg) => {
      setGlobalMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        const updated = [...prev, msg];
        if (updated.length >= 100) return [];
        return updated;
      });
    };

    const handleGlobalReset = () => {
      setGlobalMessages([]);
    };

    socket.on('receive_global_message', handleReceiveGlobal);
    socket.on('global_chat_reset', handleGlobalReset);

    return () => {
      socket.emit('leave_global_chat');
      socket.off('receive_global_message', handleReceiveGlobal);
      socket.off('global_chat_reset', handleGlobalReset);
    };
  }, [socket]);

  useEffect(() => {
    if (chatMode === 'global') {
      scrollToGlobalBottom();
    }
  }, [globalMessages, chatMode]);

  // Fetch messages for active direct conversation & join socket room
  useEffect(() => {
    if (!activeConv || chatMode !== 'direct') return;

    const fetchMessages = async () => {
      try {
        const { data } = await api.get(`/chat/messages/${activeConv._id}`);
        setMessages(data);
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    };

    fetchMessages();
    // Mark as read when conversation is opened
    markConversationRead(activeConv._id);

    if (socket) {
      socket.emit('join_conversation', activeConv._id);

      const handleReceive = (msg) => {
        if (msg.conversationId === activeConv._id) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
          // Mark as read immediately since we're viewing this conversation
          markConversationRead(activeConv._id);
        }
      };

      // Update read status on our sent messages when recipient reads them
      const handleMessagesRead = ({ conversationId }) => {
        if (conversationId === activeConv._id) {
          setMessages((prev) =>
            prev.map((m) => {
              const senderId = m.sender?._id || m.sender;
              if (senderId?.toString() === user._id?.toString()) {
                return { ...m, readByOther: true };
              }
              return m;
            })
          );
        }
      };

      socket.on('receive_message', handleReceive);
      socket.on('messages_read', handleMessagesRead);

      return () => {
        socket.emit('leave_conversation', activeConv._id);
        socket.off('receive_message', handleReceive);
        socket.off('messages_read', handleMessagesRead);
      };
    }
  }, [activeConv, socket, chatMode]);

  useEffect(() => {
    if (chatMode === 'direct') {
      scrollToBottom();
    }
  }, [messages, chatMode]);

  // Send Direct Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv) return;

    const messageText = newMsg.trim();
    setNewMsg('');

    try {
      const { data } = await api.post('/chat/messages', {
        conversationId: activeConv._id,
        text: messageText,
      });

      // Update local message list immediately
      setMessages((prev) => {
        if (prev.some((m) => m._id === data._id)) return prev;
        return [...prev, data];
      });

      // Update conversation list preview
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConv._id
            ? { ...c, lastMessage: { text: messageText, createdAt: new Date() } }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // Send Global Campus Message
  const handleSendGlobalMessage = async (e) => {
    e.preventDefault();
    if (!globalMsgInput.trim()) return;

    const text = globalMsgInput.trim();
    setGlobalMsgInput('');

    try {
      const { data } = await api.post('/chat/global/messages', { text });
      if (data.chatReset) {
        setGlobalMessages([]);
      } else {
        setGlobalMessages((prev) => {
          if (prev.some((m) => m._id === data._id)) return prev;
          const updated = [...prev, data];
          if (updated.length >= 100) return [];
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to send global message', err);
    }
  };

  const getOtherParticipant = (conv) => {
    return conv.participants?.find((p) => p._id !== user?._id) || {};
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <MessageSquare className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Sign in to Chat</h2>
        <p className="text-sm text-slate-500 mb-6">
          You need to be signed in to connect with hostellers, buyers, and sellers.
        </p>
        <Link
          to="/login"
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const otherUser = activeConv ? getOtherParticipant(activeConv) : null;
  const isOtherUserOnline = otherUser?._id ? isUserOnline(otherUser._id) : false;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-5rem)] flex flex-col">
      {/* Top Main Mode Switcher Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <button
            onClick={() => {
              setChatMode('global');
              markGlobalRead();
              navigate('/chat?tab=global', { replace: true });
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              chatMode === 'global'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Campus Global Chat</span>
            {globalUnread > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                {globalUnread > 99 ? '99+' : globalUnread}
              </span>
            )}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                chatMode === 'global'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1"></span>
              {onlineCount} Online
            </span>
          </button>

          <button
            onClick={() => {
              setChatMode('direct');
              navigate('/chat', { replace: true });
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              chatMode === 'direct'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Direct Chats (P2P)</span>
            {totalUnread > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            ) : conversations.length > 0 ? (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  chatMode === 'direct'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {conversations.length}
              </span>
            ) : null}
          </button>
        </div>

        {/* Global Live Presence Indicator */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {onlineCount} {onlineCount === 1 ? 'Registered User' : 'Registered Users'} Active
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row">
        
        {/* ======================================================== */}
        {/* MODE 1: GLOBAL CAMPUS CHAT                               */}
        {/* ======================================================== */}
        {chatMode === 'global' ? (
          <div className="flex-1 flex flex-col h-full bg-slate-50/30 dark:bg-slate-950/20">
            {/* Global Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center border border-orange-500/30">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Campus Community Global Chat
                    </h3>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{onlineCount} Active Online</span>
                    </span>
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <span>{globalMessages.length}/100 messages</span>
                      <span className="text-[10px] text-slate-400">• Resets at 100</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time discussions, marketplace inquiries, hostel queries & notices across NIT Patna
                  </p>
                </div>
              </div>

              <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Visible to all registered students & sellers</span>
              </div>
            </div>

            {/* Global Messages Stream */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              {globalLoading ? (
                <div className="text-center py-20 text-slate-400 text-sm">
                  Loading campus messages...
                </div>
              ) : globalMessages.length === 0 ? (
                <div className="text-center py-20 max-w-sm mx-auto text-slate-400">
                  <Globe className="w-12 h-12 text-orange-400 opacity-60 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                    No global messages yet!
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Be the first to post a campus announcement, asking for a product, or greeting fellow hostellers!
                  </p>
                </div>
              ) : (
                globalMessages.map((msg) => {
                  const isMe = msg.sender?._id === user._id || msg.sender === user._id;
                  const senderOnline = msg.sender?._id ? isUserOnline(msg.sender._id) : false;

                  return (
                    <div
                      key={msg._id}
                      className={`flex items-start space-x-3 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
                    >
                      {/* Avatar with live online dot */}
                      <div className="relative shrink-0">
                        <img
                          src={
                            msg.sender?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              msg.sender?.name || 'User'
                            )}&background=F27A1A&color=fff&size=100`
                          }
                          alt={msg.sender?.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                            senderOnline ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                          title={senderOnline ? 'Active Online' : 'Offline'}
                        />
                      </div>

                      {/* Message Bubble & Meta */}
                      <div className={`max-w-[80%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {/* Sender info header */}
                        <div className="flex items-center space-x-1.5 mb-1 px-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {isMe ? 'You' : msg.sender?.name}
                          </span>

                          {msg.sender?.isNitpStudent && (
                            <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              NITP
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            • {msg.sender?.hostelName || 'Campus'}
                            {msg.sender?.roomNumber ? ` (Rm ${msg.sender.roomNumber})` : ''}
                          </span>

                          {senderOnline && (
                            <span className="text-[10px] text-emerald-500 font-semibold">• Active</span>
                          )}
                        </div>

                        {/* Content */}
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-orange-500 text-white rounded-tr-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-xs'
                          }`}
                        >
                          <p className="break-words">{msg.text}</p>
                          <span
                            className={`block text-[10px] mt-1 text-right ${
                              isMe ? 'text-orange-100' : 'text-slate-400'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={globalMessagesEndRef} />
            </div>

            {/* Global Message Input Bar */}
            <form
              onSubmit={handleSendGlobalMessage}
              className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2"
            >
              <input
                type="text"
                value={globalMsgInput}
                onChange={(e) => setGlobalMsgInput(e.target.value)}
                placeholder="Broadcast a message to everyone on campus (questions, offers, items wanted)..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm"
              />
              <button
                type="submit"
                disabled={!globalMsgInput.trim()}
                className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md shadow-orange-500/30 flex items-center space-x-1.5"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* ======================================================== */
          /* MODE 2: DIRECT PERSON-TO-PERSON (P2P) CHAT               */
          /* ======================================================== */
          <>
            {/* Left Sidebar: Conversations List */}
            <div
              className={`w-full sm:w-80 md:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col ${
                activeConv ? 'hidden sm:flex' : 'flex'
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Direct Purchases
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Buyer-to-Seller private messaging
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-200 dark:border-indigo-800">
                  {conversations.length} Active
                </span>
              </div>

              {/* Conversations Scrollable List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Loading conversations...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      No direct chats yet
                    </p>
                    <p className="mt-1 text-slate-400">
                      Browse listings and click "Connect on Chat" to purchase an item from a seller.
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const participant = getOtherParticipant(conv);
                    const isSelected = activeConv?._id === conv._id;
                    const participantOnline = participant?._id ? isUserOnline(participant._id) : false;
                    const convUnread = unreadCounts[conv._id] || 0;

                    return (
                      <button
                        key={conv._id}
                        onClick={() => {
                          setActiveConv(conv);
                          markConversationRead(conv._id);
                        }}
                        className={`w-full p-4 flex items-start space-x-3 text-left transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-l-4 border-indigo-600'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Avatar with Real-time Online Indicator */}
                        <div className="relative shrink-0">
                          <img
                            src={
                              participant.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                participant.name || 'User'
                              )}&background=1E2A3A&color=fff&size=100`
                            }
                            alt={participant.name}
                            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                              participantOnline ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                            title={participantOnline ? 'Active Online' : 'Offline'}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                              {participant.name}
                            </h4>
                            <div className="flex items-center space-x-1.5 shrink-0">
                              {convUnread > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black min-w-[18px] text-center shadow-xs">
                                  {convUnread > 99 ? '99+' : convUnread}
                                </span>
                              )}
                              {conv.lastMessage?.createdAt && (
                                <span className="text-[10px] text-slate-400">
                                  {new Date(conv.lastMessage.createdAt).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Online Status Label & Hostel */}
                          <div className="flex items-center space-x-1.5 text-[11px] mb-1">
                            <span className="text-slate-500 dark:text-slate-400 truncate">
                              {participant.hostelName || 'Hostel'}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            {participantOnline ? (
                              <span className="text-emerald-500 font-semibold flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Active now</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">Offline</span>
                            )}
                          </div>

                          {/* Product Reference */}
                          {conv.product && (
                            <div className="flex items-center space-x-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 truncate bg-indigo-50/50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/50 mb-1">
                              <Package className="w-3 h-3 shrink-0" />
                              <span className="truncate">{conv.product.title}</span>
                              <span className="font-bold shrink-0">₹{conv.product.price}</span>
                            </div>
                          )}

                          {/* Last message preview */}
                          <p
                            className={`text-xs truncate ${
                              convUnread > 0
                                ? 'font-bold text-slate-900 dark:text-slate-100'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {conv.lastMessage?.text || 'Started a conversation...'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Pane: Active P2P Chat */}
            <div
              className={`flex-1 flex flex-col h-full bg-slate-50/20 dark:bg-slate-950/20 ${
                !activeConv ? 'hidden sm:flex' : 'flex'
              }`}
            >
              {activeConv ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Mobile Back Button */}
                      <button
                        onClick={() => setActiveConv(null)}
                        className="sm:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      {/* Participant Avatar with Online Indicator */}
                      <div className="relative">
                        <img
                          src={
                            otherUser?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              otherUser?.name || 'User'
                            )}&background=1E2A3A&color=fff&size=100`
                          }
                          alt={otherUser?.name}
                          className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                            isOtherUserOnline ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                          title={isOtherUserOnline ? 'Active Online' : 'Offline'}
                        />
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                            {otherUser?.name}
                          </h4>
                          {/* Live Online Badge */}
                          {isOtherUserOnline ? (
                            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>Active Now</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              <span>Offline</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {otherUser?.hostelName || 'Campus'}
                          {otherUser?.roomNumber ? ` • Room ${otherUser?.roomNumber}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Product Reference Pill */}
                    {activeConv.product && (
                      <Link
                        to={`/products/${activeConv.product._id}`}
                        className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-indigo-500 transition-colors shadow-xs"
                      >
                        <Package className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="truncate max-w-[140px]">{activeConv.product.title}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                          ₹{activeConv.product.price}
                        </span>
                      </Link>
                    )}
                  </div>

                  {/* Chat Messages Area */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/20 dark:bg-slate-950/30">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-400">
                        <p>No messages yet.</p>
                        <p className="mt-1">
                          Say hello, negotiate price, or arrange a hostel meetup spot!
                        </p>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isMe = m.sender?._id === user._id || m.sender === user._id;
                        const isReadByOther = Boolean(
                          m.readByOther ||
                          (m.readBy && m.readBy.some((id) => {
                            const readId = typeof id === 'object' && id?._id ? id._id.toString() : id?.toString();
                            const myId = user._id.toString();
                            return readId && readId !== myId;
                          }))
                        );

                        return (
                          <div
                            key={m._id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                                isMe
                                  ? 'bg-indigo-600 text-white rounded-br-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs'
                              }`}
                            >
                              <p className="break-words">{m.text}</p>
                              <div
                                className={`flex items-center justify-end space-x-1.5 text-[10px] mt-1 ${
                                  isMe ? 'text-indigo-200' : 'text-slate-400'
                                }`}
                              >
                                <span>
                                  {new Date(m.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {isMe && (
                                  <span
                                    className={`inline-flex items-center space-x-0.5 font-medium ml-1 ${
                                      isReadByOther ? 'text-sky-300' : 'text-indigo-200/80'
                                    }`}
                                    title={isReadByOther ? 'Read by recipient' : 'Sent / Unread'}
                                  >
                                    {isReadByOther ? (
                                      <>
                                        <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                                        <span>Read</span>
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-indigo-200/80" />
                                        <span>Unread</span>
                                      </>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Box */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2"
                  >
                    <input
                      type="text"
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      placeholder="Type a message (e.g. Is price negotiable? Can we meet at Ganga mess?)..."
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!newMsg.trim()}
                      className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all shadow-md shadow-indigo-600/30"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <MessageSquare className="w-12 h-12 mb-3 text-indigo-400 opacity-60" />
                  <h3 className="font-bold text-base text-slate-700 dark:text-slate-200">
                    Select a Conversation
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Chat with hostellers in real-time to discuss product condition, price negotiation, and pickup spots.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;

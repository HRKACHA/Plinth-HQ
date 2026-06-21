import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { chatApi, uploadApi, mediaUrl } from '../api/index.js';
import { getAccessToken } from '../api/axios.js';
import AppLayout from '../components/layout/AppLayout';
import VoiceInput from '../components/common/VoiceInput';
import { useTranslation } from '../hooks/useTranslation';
import { Send, Hash, Users, Circle, MessageCircle, ChevronUp, Loader2, MessageSquare, Shield, X, Languages, Camera, Image as ImageIcon } from 'lucide-react';

const ROLE_BADGE_COLORS = {
  site_engineer: 'bg-blue-500/20 text-blue-300',
  accounts: 'bg-amber-500/20 text-amber-300',
  owner: 'bg-purple-500/20 text-purple-300',
  project_manager: 'bg-emerald-500/20 text-emerald-300',
  admin: 'bg-red-500/20 text-red-300',
  PM: 'bg-emerald-500/20 text-emerald-300',
  SuperAdmin: 'bg-red-500/20 text-red-300',
  Engineer: 'bg-blue-500/20 text-blue-300',
  Owner: 'bg-purple-500/20 text-purple-300',
  Accounts: 'bg-amber-500/20 text-amber-300',
};

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
  const d = new Date(date);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ChatBox() {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState('');
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [roomMembers, setRoomMembers] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const { translateText, isTranslating } = useTranslation();

  const handleVoiceInput = useCallback((text) => {
    setInput(text);
  }, []);

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !socket || !activeRoom) return;
    
    try {
      setIsUploading(true);
      const data = await uploadApi.photos(files);
      if (data && data.length > 0) {
        socket.emit('send-message', { message: 'Photo attached', room: activeRoom, imageUrl: data[0].url });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload photo');
    } finally {
      setIsUploading(false);
      e.target.value = null; // Reset input
    }
  };

  // Connect socket
  useEffect(() => {
    const token = getAccessToken() || sessionStorage.getItem('plinthhq_token');
    if (!token) return;

    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    const s = io(serverUrl, { auth: { token }, transports: ['websocket', 'polling'] });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.on('new-message', (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    s.on('user:typing', ({ userId, name, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          if (prev.some((u) => u.userId === userId)) return prev;
          return [...prev, { userId, name }];
        }
        return prev.filter((u) => u.userId !== userId);
      });
    });

    s.on('user:online', ({ userId, name, role, onlineCount: count }) => {
      setOnlineCount(count);
      setOnlineUsers((prev) => {
        if (prev.some((u) => u.userId === userId)) return prev;
        return [...prev, { userId, name, role }];
      });
    });

    s.on('user:offline', ({ userId, onlineCount: count }) => {
      setOnlineCount(count);
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    s.on('message:delete', ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    });

    s.on('chat:clear', ({ room }) => {
      setMessages((prev) => prev.filter((m) => m.room !== room));
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  // Load rooms
  useEffect(() => {
    chatApi.getRooms().then((r) => {
      setRooms(r);
      if (r.length > 0) {
        setActiveRoom(prev => prev || r[0].name);
      }
    }).catch(console.error);
  }, []);

  // Join room & load messages
  useEffect(() => {
    if (!socket || !activeRoom) return;

    socket.emit('join-room', { room: activeRoom });
    setMessages([]);

    chatApi.getMessages({ room: activeRoom, limit: 50 })
      .then(({ messages: msgs, hasMore: more }) => {
        setMessages(msgs);
        setHasMore(more);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
      })
      .catch(console.error);

    chatApi.getRoomMembers(activeRoom)
      .then(setRoomMembers)
      .catch(console.error);

    return () => { socket.emit('leave-room', { room: activeRoom }); };
  }, [socket, activeRoom]);

  // Auto-scroll on new messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load older messages
  const loadOlder = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const { messages: older, hasMore: more } = await chatApi.getMessages({
        room: activeRoom, limit: 50, before: messages[0]._id,
      });
      setMessages((prev) => [...older, ...prev]);
      setHasMore(more);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, messages, activeRoom]);

  // Send message
  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('send-message', { message: input.trim(), room: activeRoom });
    setInput('');
    socket.emit('typing', { room: activeRoom, isTyping: false });
  };

  const handleDeleteMessage = (messageId) => {
    if (!socket) return;
    if (window.confirm('Are you sure you want to delete this message?')) {
      socket.emit('delete-message', { messageId, room: activeRoom });
    }
  };

  const handleClearChat = () => {
    if (!socket) return;
    if (window.confirm(`Are you sure you want to clear all messages in ${activeRoom.replace('_', ' ')}? This cannot be undone.`)) {
      socket.emit('clear-chat', { room: activeRoom });
    }
  };


  // Typing indicator
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    socket.emit('typing', { room: activeRoom, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { room: activeRoom, isTyping: false });
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  const isMyMessage = (msg) => {
    const senderId = msg.sender?._id || msg.sender;
    return senderId === user?.id;
  };

  const getRoomIcon = (roomName) => {
    if (roomName.includes('general')) return <Hash size={16} className="text-blue-400" />;
    if (roomName.includes('management')) return <Shield size={16} className="text-purple-400" />;
    return <MessageSquare size={16} className="text-muted" />;
  };

  return (
    <AppLayout noPadding={true}>
      <div className="flex flex-col h-[calc(100dvh-64px)] p-2 sm:p-4 lg:p-6">
        <div className="flex flex-col md:flex-row flex-1 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl overflow-hidden shadow-2xl">

          {/* ── Left: Room List (Desktop) ── */}
          <div className="w-[280px] bg-card border-r border-white/[0.06] flex-col shrink-0 hidden md:flex">
            <div className="p-4 border-b border-white/[0.06]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageCircle size={20} className="text-blue-400" /> Chat
              </h2>
              <p className="text-xs text-muted mt-1">
                <Circle size={8} className={`inline mr-1 ${connected ? 'text-emerald-400 fill-emerald-400' : 'text-red-400 fill-red-400'}`} />
                {onlineCount} online
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {rooms.map((room) => (
                <button
                  key={room.name}
                  onClick={() => setActiveRoom(room.name)}
                  className={`w-full text-left px-4 py-3 border-b border-white/[0.04] transition hover:bg-white/[0.03] ${activeRoom === room.name ? 'bg-white/[0.06] border-l-2 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white flex items-center gap-2.5">
                      {getRoomIcon(room.name)} <span className="capitalize">{room.label || room.name.replace('_', ' ')}</span>
                    </span>
                    {room.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded-full min-w-[18px] text-center">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                  {room.lastMessage && (
                    <p className="text-xs text-muted mt-1 truncate">
                      <span className="text-white/60">{room.lastMessage.sender}:</span> {room.lastMessage.text}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Mobile Room Selector Strip ── */}
          <div className="md:hidden flex w-full items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-card overflow-x-auto shrink-0 scrollbar-none">
            {rooms.map((room) => (
              <button
                key={room.name}
                onClick={() => setActiveRoom(room.name)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition shrink-0 ${activeRoom === room.name
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-white/50 hover:bg-white/5 border border-transparent'
                  }`}
              >
                {getRoomIcon(room.name)}
                <span className="capitalize">{room.label || room.name.replace('_', ' ')}</span>
                {room.unreadCount > 0 && (
                  <span className="px-1 py-0.5 text-[9px] font-bold bg-blue-500 text-white rounded-full min-w-[14px] text-center leading-none">
                    {room.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Center: Messages ── */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Room Header */}
            {activeRoom ? (
              <div className="px-3 sm:px-6 py-2 sm:py-3 bg-card border-b border-white/[0.06] flex items-center justify-between shrink-0">
                <div className="min-w-0">
                  <h3 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-lg capitalize truncate">
                    {getRoomIcon(activeRoom)} {rooms.find((r) => r.name === activeRoom)?.label || 'Project Chat'}
                  </h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-[10px] sm:text-xs text-muted truncate">{rooms.find((r) => r.name === activeRoom)?.description || 'Team Conversation'}</p>
                    <p className="text-[10px] sm:text-xs text-emerald-400/80 flex items-center gap-1 shrink-0">
                      <Circle size={6} className="fill-emerald-400" /> {onlineCount} online
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {['admin', 'project_manager', 'PM', 'SuperAdmin', 'owner', 'Owner'].includes(user?.role) && (
                    <button
                      onClick={handleClearChat}
                      className="text-xs font-semibold text-danger/80 hover:text-danger bg-danger/10 hover:bg-danger/20 px-3 py-1.5 rounded-lg transition"
                    >
                      Clear Chat
                    </button>
                  )}
                  <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 rounded-lg hover:bg-white/5 text-muted transition">
                    <Users size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-4 bg-card border-b border-white/[0.06] text-muted">Select a project to start chatting</div>
            )}

            {/* Messages Area */}
            {activeRoom && (
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 space-y-1">
                {/* Load More */}
                {hasMore && (
                  <div className="text-center py-2">
                    <button
                      onClick={loadOlder}
                      disabled={loadingMore}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mx-auto"
                    >
                      {loadingMore ? <Loader2 size={12} className="animate-spin" /> : <ChevronUp size={12} />}
                      Load older messages
                    </button>
                  </div>
                )}

                {/* Empty State / Info */}
                {!loadingMore && messages.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 mt-10">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                      {getRoomIcon(activeRoom)}
                    </div>
                    <h4 className="text-white font-semibold text-lg capitalize mb-2">Welcome to {rooms.find((r) => r.name === activeRoom)?.label || 'Chat'}</h4>
                    <p className="text-sm text-muted max-w-md leading-relaxed">
                      This is the start of your real-time team conversation.
                      Messages here are securely end-to-end encrypted and visible to everyone with access to this channel.
                      Say hello to your team!
                    </p>
                  </div>
                )}

                {/* Date Groups */}
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="flex items-center justify-center my-4">
                      <span className="px-3 py-1 text-[11px] bg-white/5 text-muted rounded-full">{date}</span>
                    </div>
                    {msgs.map((msg) => {
                      const mine = isMyMessage(msg);
                      return (
                        <div key={msg._id} className={`flex mb-4 gap-3 ${mine ? 'justify-end' : 'justify-start'}`}>
                          {/* Avatar */}
                          {!mine && (
                            <div className="shrink-0 mt-0.5">
                              {msg.sender?.avatarUrl ? (
                                <img
                                  src={mediaUrl(msg.sender.avatarUrl)}
                                  alt={msg.senderName}
                                  className="w-8 h-8 rounded-full object-cover bg-white/5"
                                  onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                                />
                              ) : null}
                              <div
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold"
                                style={{ display: msg.sender?.avatarUrl ? 'none' : 'flex' }}
                              >
                                {msg.senderName?.charAt(0)?.toUpperCase()}
                              </div>
                            </div>
                          )}

                          <div className={`max-w-[85%] sm:max-w-[75%] ${mine ? 'order-2' : ''}`}>
                            {!mine && (
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-white">{msg.senderName}</span>
                                <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${ROLE_BADGE_COLORS[msg.senderRole] || 'bg-gray-500/20 text-gray-300'}`}>
                                  {msg.senderRole?.replace('_', ' ')}
                                </span>
                              </div>
                            )}
                            <div
                              onDoubleClick={() => handleDeleteMessage(msg._id)}
                              className={`group relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-sm text-sm sm:text-[15px] cursor-pointer transition-transform hover:scale-[1.01] ${mine
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-white/5 text-white rounded-bl-sm border border-white/10'
                                }`}
                              title="Double click to delete message"
                            >
                              <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                              {msg.imageUrl && (
                                <div className="mt-2 relative rounded-lg overflow-hidden max-w-[200px] sm:max-w-[250px]">
                                  <img src={mediaUrl(msg.imageUrl)} alt="Attachment" className="w-full h-auto object-cover rounded-md" />
                                </div>
                              )}
                              <div className={`flex items-center gap-1 mt-1 ${mine ? 'justify-end' : ''}`}>
                                <span className={`text-[10px] ${mine ? 'text-blue-200' : 'text-muted'}`}>
                                  {formatTime(msg.createdAt)}
                                </span>
                                {mine && (
                                  <span className="text-[10px] text-blue-200">
                                    {msg.readBy?.length > 1 ? '✓✓' : '✓'}
                                  </span>
                                )}
                                {!mine && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (msg.translated) {
                                        // toggle back
                                        msg.translated = false;
                                        setMessages([...messages]);
                                      } else {
                                        msg.isTranslating = true;
                                        setMessages([...messages]);
                                        try {
                                          msg.translatedText = await translateText(msg.message, 'hi', 'en'); // Simplified demo
                                          msg.translated = true;
                                        } finally {
                                          msg.isTranslating = false;
                                          setMessages([...messages]);
                                        }
                                      }
                                    }}
                                    className="ml-2 text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    {msg.isTranslating ? <Loader2 size={10} className="animate-spin" /> : <Languages size={10} />}
                                    {msg.translated ? 'Original' : 'Translate'}
                                  </button>
                                )}
                              </div>
                              {msg.translated && (
                                <p className="mt-1 pt-1 border-t border-white/10 text-xs italic text-white/80">
                                  {msg.translatedText}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* User Avatar for Mine */}
                          {mine && (
                            <div className="shrink-0 order-3 mt-0.5">
                              {user?.avatarUrl ? (
                                <img
                                  src={mediaUrl(user.avatarUrl)}
                                  alt={user.name}
                                  className="w-8 h-8 rounded-full object-cover bg-white/5"
                                  onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                                />
                              ) : null}
                              <div
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold"
                                style={{ display: user?.avatarUrl ? 'none' : 'flex' }}
                              >
                                {user?.name?.charAt(0)?.toUpperCase()}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-muted italic">
                      {typingUsers.map((u) => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input Area */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 bg-card border-t border-white/[0.06] shrink-0 pb-[env(safe-area-inset-bottom,0.75rem)]">
              
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="flex-1 relative flex">
                    <textarea
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={activeRoom ? `Message ${rooms.find(r => r.name === activeRoom)?.label || 'Project Chat'}...` : "Select a project to start"}
                      disabled={!activeRoom}
                      rows={1}
                      className="w-full px-4 py-3 bg-surface border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition resize-none text-sm"
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                    />
                    {input.length > 1800 && (
                      <span className={`absolute bottom-1 right-2 text-[10px] ${input.length > 2000 ? 'text-red-400' : 'text-muted'}`}>
                        {input.length}/2000
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || input.length > 2000 || isUploading}
                      className="h-11 w-11 flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full hover:from-blue-500 hover:to-blue-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-lg"
                    >
                      {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    ref={cameraInputRef} 
                    onChange={handlePhotoUpload} 
                    className="hidden" 
                  />
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                    className="hidden" 
                  />
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={!activeRoom || isUploading}
                    className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center"
                    title="Take Photo"
                  >
                    <Camera size={18} />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!activeRoom || isUploading}
                    className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center"
                    title="Attach File"
                  >
                    <ImageIcon size={18} />
                  </button>
                  
                  <div className="h-5 w-px bg-white/10 mx-1"></div>
                  
                  <VoiceInput onTranscript={handleVoiceInput} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Team Members ── */}
          {showSidebar && (
            <>
              {/* Mobile overlay backdrop */}
              <div className="lg:hidden absolute inset-0 bg-black/50 z-40" onClick={() => setShowSidebar(false)} />

              {/* Sidebar */}
              <div className="absolute lg:relative right-0 top-0 bottom-0 z-50 w-[220px] bg-card/95 lg:bg-card backdrop-blur-xl border-l border-white/[0.06] flex flex-col shrink-0 animate-slideUp lg:animate-none">
                <div className="p-4 border-b border-white/[0.06] flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-white">Project Team</h3>
                  <button className="lg:hidden p-1 text-muted hover:text-white" onClick={() => setShowSidebar(false)}>
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                  {roomMembers.map((u) => {
                    const isOnline = onlineUsers.some(ou => ou.userId === u.userId);
                    return (
                      <div key={u.userId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition group">
                        <div className="relative shrink-0">
                          {u.avatarUrl ? (
                            <img
                              src={mediaUrl(u.avatarUrl)}
                              alt={u.name}
                              className="w-7 h-7 rounded-full object-cover bg-white/5"
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                            />
                          ) : null}
                          <div
                            className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold"
                            style={{ display: u.avatarUrl ? 'none' : 'flex' }}
                          >
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          {isOnline && (
                            <Circle size={8} className="absolute -bottom-0.5 -right-0.5 text-emerald-400 fill-emerald-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-white truncate">{u.name} {u.userId === user?.id ? '(You)' : ''}</p>
                          <span className={`text-[10px] px-1 py-0.5 rounded ${ROLE_BADGE_COLORS[u.role] || 'bg-gray-500/20 text-gray-300'}`}>
                            {u.roleLabel || u.role?.replace('_', ' ')}
                          </span>
                          {u.invitedBy && (
                            <p className="text-[9px] text-white/50 truncate mt-0.5">
                              Invited by: {u.invitedBy}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {roomMembers.length === 0 && (
                    <p className="text-xs text-muted text-center py-4">No team members</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { MessageCircle, X, Send, ChevronDown, ThumbsUp, ThumbsDown, Sparkles, Zap, BookOpen, ClipboardList, Loader2, AlertCircle, Minus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { plinthaiApi } from '../../api/index';
import VoiceInput from './VoiceInput';

// Generate a unique session ID per widget mount
function generateSessionId() {
  return 'sess_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

// Simple markdown-like rendering for chat messages
function renderMessage(text) {
  if (!text) return null;
  
  // Split into lines and process
  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let codeLanguage = '';
  let listBuffer = [];
  let listType = null;
  let inTable = false;
  let tableBuffer = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      const Tag = listType === 'ol' ? 'ol' : 'ul';
      elements.push(
        <Tag key={`list-${elements.length}`} className={`my-2 ml-4 space-y-0.5 ${listType === 'ol' ? 'list-decimal' : 'list-disc'}`}>
          {listBuffer.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </Tag>
      );
      listBuffer = [];
      listType = null;
    }
  };

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      const parseRow = (str) => {
        let parts = str.split('|');
        if (parts.length > 0 && parts[0].trim() === '') parts.shift();
        if (parts.length > 0 && parts[parts.length - 1].trim() === '') parts.pop();
        return parts.map(s => s.trim());
      };
      
      const headers = parseRow(tableBuffer[0]);
      // Skip the separator line (e.g. |---|---|)
      const rows = tableBuffer.slice(2).map(parseRow);
      
      elements.push(
        <div key={`table-${elements.length}`} className="my-3 w-full overflow-x-auto rounded-lg border border-[var(--color-glass-border)] bg-navy/5 dark:bg-white/5 dark:bg-navy/5 dark:bg-white/5">
          <table className="w-full text-left text-sm text-navy">
            <thead className="bg-navy/10 dark:bg-white/10 dark:bg-navy/10 dark:bg-white/10 text-xs font-semibold uppercase tracking-wider">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 border-b border-[var(--color-glass-border)]" dangerouslySetInnerHTML={{ __html: inlineFormat(h) }} />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-glass-border)]">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-navy/5 dark:hover:bg-white/5 transition-colors">
                  {headers.map((_, j) => (
                    <td key={j} className="px-3 py-2 whitespace-nowrap" dangerouslySetInnerHTML={{ __html: inlineFormat(row[j] || '') }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableBuffer = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${elements.length}`} className="my-2 rounded-lg bg-navy/5 dark:bg-white/5 dark:bg-navy/5 dark:bg-white/5 p-3 overflow-x-auto border border-[var(--color-glass-border)]">
            <code className="text-xs font-mono text-navy">{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
        codeLanguage = line.trim().slice(3);
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Tables
    if (line.trim().startsWith('|') || (inTable && line.includes('|'))) {
      if (!inTable) {
        flushList();
        inTable = true;
      }
      tableBuffer.push(line.trim());
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Headers
    if (line.startsWith('### ')) {
      flushList();
      elements.push(<h4 key={`h4-${i}`} className="text-sm font-bold text-navy mt-3 mb-1">{line.slice(4)}</h4>);
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(<h3 key={`h3-${i}`} className="text-sm font-bold text-navy mt-3 mb-1">{line.slice(3)}</h3>);
      continue;
    }
    if (line.startsWith('# ')) {
      flushList();
      elements.push(<h2 key={`h2-${i}`} className="font-bold text-navy mt-3 mb-1">{line.slice(2)}</h2>);
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---' || line.trim() === '***') {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="my-3 border-[var(--color-glass-border)]" />);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^(\s*)[*\-•]\s+(.+)/);
    if (ulMatch) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listBuffer.push(ulMatch[2]);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)\d+[.)]\s+(.+)/);
    if (olMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listBuffer.push(olMatch[2]);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushList();
      elements.push(<div key={`br-${i}`} className="h-2" />);
      continue;
    }

    // Normal paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
    );
  }

  flushList();
  flushTable();

  return <>{elements}</>;
}

function inlineFormat(text) {
  // Bold
  let result = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-navy">$1</strong>');
  // Italic
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  result = result.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-navy/5 dark:bg-white/5 dark:bg-navy/10 dark:bg-white/10 text-xs font-mono">$1</code>');
  // Citation markers like [IS 456:2000 §26.5.1.1]
  result = result.replace(/\[([A-Z][A-Z\s\d:.§/()–-]+)\]/g, '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange/10 text-orange-dark text-[11px] font-semibold cursor-help border border-orange/20" title="$1">📋 $1</span>');
  return result;
}

const quickActions = [
  { label: 'My tasks today', icon: ClipboardList, prompt: 'What are my tasks and recent activities?' },
  { label: 'Project summary', icon: Sparkles, prompt: 'Give me a summary of my projects with their current progress.' },
  { label: 'Construction rules', icon: BookOpen, prompt: 'What are the key IS code requirements for concrete curing?' },
  { label: 'Help me navigate', icon: Zap, prompt: 'How do I use the different features of PlinthHQ?' },
];

export default function PlinthAIChatbot() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const [initData, setInitData] = useState(null);
  const [initLoading, setInitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  const currentInputValueRef = useRef('');
  useEffect(() => {
    currentInputValueRef.current = input;
    if (inputRef.current) {
      if (!input) {
        inputRef.current.style.height = 'auto'; // Reset to default CSS height
      } else {
        inputRef.current.style.height = '24px';
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 96) + 'px';
      }
    }
  }, [input]);

  const baseInputRef = useRef('');

  const handleVoiceStart = useCallback(() => {
    baseInputRef.current = currentInputValueRef.current;
  }, []);

  const handleVoiceInput = useCallback((text) => {
    const newValue = (baseInputRef.current ? baseInputRef.current + ' ' : '') + text;
    setInput(newValue);
  }, []);

  // Don't render if not authenticated
  if (!isAuthenticated) return null;

  // Initialize session when widget opens
  const initializeSession = useCallback(async () => {
    if (initData) return;
    setInitLoading(true);
    try {
      const data = await plinthaiApi.init();
      setInitData(data);
      // Add welcome message
      const firstName = data.user?.first_name || user?.name?.split(' ')[0] || 'there';
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hey ${firstName}! 👋 I'm **PlinthAI**, your construction management assistant.\n\nI can help you with:\n- 📊 **Project progress & summaries**\n- 📝 **Your tasks & daily logs**\n- 👥 **Team management & invites**\n- 💬 **Real-time team chat**\n- 🧱 **Material & inventory tracking**\n- 💰 **Budget & expense details**\n- 🏗️ **Construction standards (IS codes, CPWD)**\n- ❓ **Navigating PlinthHQ**\n\nWhat would you like to know?`,
        timestamp: new Date(),
      }]);
    } catch (err) {
      setError('Failed to initialize PlinthAI. Please try again.');
    } finally {
      setInitLoading(false);
    }
  }, [initData, user]);

  useEffect(() => {
    if (isOpen && !initData) {
      initializeSession();
    }
  }, [isOpen, initializeSession, initData]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Track scroll position for "scroll to bottom" button
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = chatContainerRef.current;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send message
  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const data = await plinthaiApi.chat(sessionId, trimmed);
      const assistantMsg = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'error',
          content: errMsg,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      // Focus input after response
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFeedback = async (messageId, rating) => {
    try {
      await plinthaiApi.feedback(sessionId, messageId, rating);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback: rating } : m))
      );
    } catch {
      // Silently fail feedback
    }
  };

  const toggleOpen = () => {
    if (isMinimized) {
      setIsMinimized(false);
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleMinimize = (e) => {
    e.stopPropagation();
    setIsMinimized(true);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    setIsMinimized(false);
  };

  const controls = useAnimation();

  const handleDragEnd = (event, info) => {
    // Determine whether to snap to left or right edge based on the final pointer position
    const screenWidth = window.innerWidth;
    const isLeftHalf = info.point.x < screenWidth / 2;
    // Assume button is about 64px wide, and its original position is right-4 (16px) or right-6 (24px).
    // Let's use an approximate offset for the left side (e.g., negative offset from right)
    const offset = isLeftHalf ? -(screenWidth - 64 - 32) : 0;
    
    controls.start({
      x: offset,
      transition: { type: 'spring', stiffness: 300, damping: 25 }
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        drag
        dragMomentum={false}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
        onClick={toggleOpen}
        id="plinthai-fab"
        className={`fixed z-[90] flex items-center justify-center rounded-full shadow-elevated transition-colors transition-shadow duration-500 hover:scale-105 group ${
          isOpen && !isMinimized
            ? 'bottom-20 right-4 sm:bottom-6 sm:right-6 h-11 w-11 sm:h-14 sm:w-14 bg-white/90 dark:bg-navy/80 backdrop-blur-xl border border-[var(--color-glass-border)]'
            : 'bottom-24 right-4 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-orange to-orange-dark shadow-[0_8px_32px_rgba(184,151,106,0.3)]'
        }`}
        aria-label={isOpen ? 'Close PlinthAI' : 'Open PlinthAI'}
      >
        {isOpen && !isMinimized ? (
          <X className="h-5 w-5 sm:h-6 sm:w-6 text-navy dark:text-white transition-transform duration-300" />
        ) : (
          <>
            <img
              src="/chatbot-logo.png"
              alt="PlinthAI"
              className="h-7 w-7 sm:h-10 sm:w-10 rounded-full object-cover transition-transform duration-300 group-hover:rotate-12 pointer-events-none"
            />
            {/* Pulse ring */}
            {!isOpen && (
              <span className="absolute inset-0 rounded-full border-2 border-orange animate-pulse_ring pointer-events-none" />
            )}
          </>
        )}
      </motion.button>

      {/* Chat Panel */}
      {isOpen && !isMinimized && (
        <div
          className="fixed z-[89] flex flex-col overflow-hidden animate-slideUp
            inset-0 sm:inset-auto sm:bottom-20 sm:right-4 md:right-6
            sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:h-[600px] sm:max-h-[calc(100vh-8rem)] sm:rounded-2xl
            border-0 sm:border border-[var(--color-glass-border)] bg-card/80 backdrop-blur-[24px] shadow-elevated"
          style={{
            background: 'color-mix(in srgb, rgb(var(--color-card)) 75%, transparent)',
          }}
          role="dialog"
          aria-label="PlinthAI Chat"
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-glass-border)]"
            style={{
              background: 'linear-gradient(135deg, rgba(184,151,106,0.08) 0%, rgba(163,132,90,0.05) 100%)',
            }}
          >
            <div className="relative">
              <img
                src="/chatbot-logo.png"
                alt="PlinthAI"
                className="h-9 w-9 rounded-full object-cover ring-2 ring-orange/30"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-navy flex items-center gap-1.5">
                PlinthAI
                <span className="px-1.5 py-0.5 rounded-full bg-orange/10 text-orange text-[9px] font-bold tracking-wider uppercase">AI</span>
              </h3>
              <p className="text-[11px] text-muted truncate">
                {initData?.active_projects?.length
                  ? `${initData.active_projects.length} project${initData.active_projects.length > 1 ? 's' : ''} active`
                  : 'Your construction assistant'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMinimize}
                className="rounded-lg p-1.5 text-muted hover:bg-navy/5 dark:hover:bg-white/5 hover:text-navy transition"
                title="Minimize"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger transition"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            role="log"
            aria-live="polite"
          >
            {initLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange/20 border-t-orange" />
                  <span className="text-xs text-muted">Initializing PlinthAI...</span>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-slideUp`}
              >
                {/* Avatar */}
                {msg.role === 'assistant' && (
                  <div className="shrink-0 mt-0.5">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-orange to-orange-dark flex items-center justify-center shadow-md">
                      <Sparkles className="h-3.5 w-3.5 text-navy dark:text-white" />
                    </div>
                  </div>
                )}
                {msg.role === 'error' && (
                  <div className="shrink-0 mt-0.5">
                    <div className="h-7 w-7 rounded-full bg-danger/20 flex items-center justify-center">
                      <AlertCircle className="h-3.5 w-3.5 text-danger" />
                    </div>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-orange to-orange-dark text-white rounded-br-md shadow-md shadow-orange/20'
                      : msg.role === 'error'
                      ? 'bg-danger/10 text-danger border border-danger/20 rounded-bl-md'
                      : 'bg-surface border border-[var(--color-glass-border)] rounded-bl-md'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : msg.role === 'error' ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <div className="text-navy">{renderMessage(msg.content)}</div>
                  )}

                  {/* Timestamp & Feedback */}
                  {msg.role === 'assistant' && msg.id !== 'welcome' && (
                    <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-[var(--color-glass-border)]">
                      <span className="text-[10px] text-muted flex-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => handleFeedback(msg.id, 'up')}
                        className={`p-1 rounded transition ${
                          msg.feedback === 'up' ? 'text-success bg-success/10' : 'text-muted hover:text-success hover:bg-success/10'
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, 'down')}
                        className={`p-1 rounded transition ${
                          msg.feedback === 'down' ? 'text-danger bg-danger/10' : 'text-muted hover:text-danger hover:bg-danger/10'
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2.5 animate-slideUp">
                <div className="shrink-0 mt-0.5">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-orange to-orange-dark flex items-center justify-center shadow-md">
                    <Sparkles className="h-3.5 w-3.5 text-navy dark:text-white" />
                  </div>
                </div>
                <div className="bg-surface border border-[var(--color-glass-border)] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 text-orange animate-spin" />
                    <span className="text-xs text-muted">PlinthAI is thinking...</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-orange/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-orange/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-[76px] left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-full bg-card/90 border border-[var(--color-glass-border)] backdrop-blur-lg px-3 py-1.5 text-xs text-muted shadow-elevated hover:text-navy transition animate-slideUp"
            >
              <ChevronDown className="h-3 w-3" /> New messages
            </button>
          )}

          {/* Quick Actions (only show when few messages) */}
          {messages.length <= 1 && !loading && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--color-glass-border)] bg-surface/50 px-3 py-1.5 text-[11px] font-medium text-navy backdrop-blur-sm transition-all hover:bg-orange/10 hover:border-orange/30 hover:text-orange active:scale-95"
                  >
                    <action.icon className="h-3 w-3" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-[var(--color-glass-border)] p-3">
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-glass-border)] bg-surface/50 backdrop-blur-sm px-3 py-2 transition-all focus-within:border-orange focus-within:shadow-[0_0_0_1px_rgb(var(--color-orange))] outline-none">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask PlinthAI anything..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-navy outline-none border-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none placeholder:text-muted/50 max-h-24 py-1.5"
                style={{ minHeight: '32px' }}
                disabled={loading}
                onInput={(e) => {
                  e.target.style.height = '32px';
                  e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                }}
              />
              <div className="flex items-center gap-1 shrink-0">
                <VoiceInput onStart={handleVoiceStart} onTranscript={handleVoiceInput} position="bottom" />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className={`flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300 ${
                    input.trim() && !loading
                      ? 'bg-gradient-to-br from-orange to-orange-dark text-white shadow-md shadow-orange/20 hover:shadow-lg hover:scale-105 active:scale-95 pr-[2px]'
                      : 'bg-navy/5 dark:bg-white/5 text-navy/70 dark:text-white/70 cursor-not-allowed'
                  }`}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-[10px] text-center text-muted/50">
              PlinthAI may make mistakes. Verify important information.
            </p>
          </div>
        </div>
      )}

      {/* Minimized state */}
      {isOpen && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-[89] flex items-center gap-3 rounded-2xl border border-[var(--color-glass-border)] bg-card/80 backdrop-blur-[24px] shadow-elevated px-4 py-3 transition-all hover:shadow-lg animate-slideUp cursor-pointer group"
          style={{
            background: 'color-mix(in srgb, rgb(var(--color-card)) 75%, transparent)',
          }}
        >
          <div className="relative">
            <img src="/chatbot-logo.png" alt="PlinthAI" className="h-8 w-8 rounded-full object-cover ring-2 ring-orange/30" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-navy">PlinthAI</p>
            <p className="text-[11px] text-muted">{messages.length > 0 ? 'Chat in progress...' : 'Ready to help'}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted group-hover:text-navy transition rotate-180" />
        </button>
      )}
    </>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bot, User, ArrowUp, Loader2, SplitSquareHorizontal, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api.js';
import { useChat } from '../store/index.js';
import ReactMarkdown from "react-markdown";

function Message({ msg, isLast, streaming }) {
  const ai = msg.role === 'assistant';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
      className={`flex gap-3 ${ai ? '' : 'flex-row-reverse'}`}>
      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
        ai ? 'bg-clay/10 text-clay' : 'bg-sand-100 text-sand-500'}`}>
        {ai ? <Bot size={13} /> : <User size={13} />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        ai ? 'bg-white border border-sand-200 text-gray-800' : 'bg-clay text-white'}`}>
        {ai && isLast && streaming && msg.content === '' ? (
          <span className="flex gap-1 items-center h-4">
            {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-sand-300 animate-bounce" style={{ animationDelay: i*0.1+'s' }} />)}
          </span>
        ) : (
          <ReactMarkdown
  components={{
    h3: (props) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
  }}
>
  {msg.content}
</ReactMarkdown>
        )}
      </div>
    </motion.div>
  );
}

function ChatPane({ chatId, placeholder, compact }) {
  const { messages, pushMessage, appendDelta, setMessages, streaming, setStreaming } = useChat();
  const [input, setInput] = useState('');
  const ref = useRef(null);
  const bottomRef = useRef(null);
  const msgs = messages[chatId] || [];

  useEffect(() => {
    if (!chatId) return;
    api.get(`/chat/${chatId}`).then(d => setMessages(chatId, d.session.messages)).catch(() => {});
  }, [chatId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || !chatId || streaming) return;
    setInput(''); if (ref.current) ref.current.style.height = 'auto';
    pushMessage(chatId, { role: 'user', content: text });
    pushMessage(chatId, { role: 'assistant', content: '' });
    setStreaming(true);
    await api.stream(`/chat/${chatId}/stream`, { content: text }, d => appendDelta(chatId, d), () => setStreaming(false));
  };

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const onInput = e => {
    setInput(e.target.value);
    if (ref.current) { ref.current.style.height = 'auto'; ref.current.style.height = Math.min(ref.current.scrollHeight, 140) + 'px'; }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        <AnimatePresence initial={false}>
          {msgs.map((m, i) => <Message key={i} msg={m} isLast={i === msgs.length - 1} streaming={streaming} />)}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
      <div className={`border-t border-sand-200 bg-white ${compact ? 'px-3 py-3' : 'px-4 py-4'}`}>
        <div className="flex items-end gap-2 bg-sand-50 border border-sand-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-clay/20 focus-within:border-clay transition-all">
          <textarea ref={ref} value={input} onChange={onInput} onKeyDown={onKey}
            rows={1} placeholder={placeholder || 'Message RealMind AI…'}
            className={`flex-1 bg-transparent outline-none resize-none placeholder:text-sand-400 text-gray-800 min-h-5 ${compact ? 'text-xs' : 'text-sm'}`} />
          <button onClick={send} disabled={!input.trim() || streaming}
            className="w-7 h-7 rounded-lg bg-clay text-white flex items-center justify-center flex-shrink-0 hover:bg-clay-hover disabled:opacity-40 transition-colors">
            <ArrowUp size={13} />
          </button>
        </div>
        <p className={`text-center text-sand-400 mt-1.5 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { sessions, setSessions, setActiveChatId } = useChat();
  const [analyzeId, setAnalyzeId] = useState(null);

  const newChat = async () => {
    const { session } = await api.post('/chat/session', { type: 'primary' });
    setSessions([session, ...sessions]);
    setActiveChatId(session._id);
    nav(`/chat/${session._id}`);
  };

  const openAnalysis = async () => {
    const { session } = await api.post('/chat/session', { type: 'secondary', linkedChatId: id });
    setAnalyzeId(session._id);
  };

  if (!id) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-clay/10 flex items-center justify-center">
        <Bot size={22} className="text-clay" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Start a conversation</h2>
        <p className="text-sm text-sand-400 max-w-xs">Ask about 3D modeling, engineering concepts, or generate Blender scripts.</p>
      </div>
      <button onClick={newChat} className="btn-primary mt-2"><Plus size={14} />New Chat</button>
    </div>
  );

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0">
        <div className="h-12 px-4 flex items-center justify-between border-b border-sand-200 bg-white flex-shrink-0">
          <span className="text-sm font-medium text-gray-800">Chat</span>
          {!analyzeId && (
            <button onClick={openAnalysis} className="btn-ghost text-xs gap-1.5">
              <SplitSquareHorizontal size={13} />Analyze
            </button>
          )}
        </div>
        <ChatPane chatId={id} />
      </div>

      <AnimatePresence>
        {analyzeId && (
          <motion.div initial={{ width: 0 }} animate={{ width: 360 }} exit={{ width: 0 }} transition={{ duration: 0.2 }}
            className="flex flex-col border-l border-sand-200 bg-sand-50 overflow-hidden flex-shrink-0">
            <div className="h-12 px-4 flex items-center justify-between border-b border-sand-200 bg-white flex-shrink-0">
              <div>
                <p className="text-xs font-semibold text-gray-800">Analysis</p>
                <p className="text-[10px] text-sand-400">Secondary AI · Reviews your output</p>
              </div>
              <button onClick={() => setAnalyzeId(null)} className="p-1 rounded hover:bg-sand-100 text-sand-400">
                <X size={13} />
              </button>
            </div>
            <ChatPane chatId={analyzeId} placeholder="Ask about structure, improvements…" compact />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

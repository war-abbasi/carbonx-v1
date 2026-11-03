import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, User, Plus, Trash2,
  MessageSquare, ChevronLeft, ChevronRight,
  Copy, Check, RefreshCw, Pencil, X, Leaf, Loader2, Sun, Moon,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import iconImg from '../../assets/carbonx-icon.png';
import api from '../../api/axios';
import { carbonApi } from '../../api/carbonApi';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/* ─── helpers ─────────────────────────────────── */
function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function relativeDate(iso) {
  const d    = new Date(iso);
  const diff = (Date.now() - d) / 86400000;
  if (diff < 1)   return 'Today';
  if (diff < 2)   return 'Yesterday';
  if (diff < 7)   return 'This Week';
  if (diff < 30)  return 'This Month';
  return d.toLocaleString('en', { month: 'short', year: 'numeric' });
}
function groupByDate(convs) {
  const groups = {};
  convs.forEach(c => {
    const label = relativeDate(c.updatedAt);
    if (!groups[label]) groups[label] = [];
    groups[label].push(c);
  });
  return groups;
}

const QUICK_PROMPTS = [
  "What's my biggest emission source?",
  "I drove 30km to work today",
  "Explain Scope 3 emissions",
  "I used 200 kWh electricity this month",
  "Give me a 30-day reduction plan",
  "Flew Lahore to Dubai today",
];

const CAT_EMOJI = {
  commute:              '🚗',
  energy:               '⚡',
  travel:               '✈️',
  food:                 '🍽️',
  industry:             '🏭',
  agriculture:          '🌾',
  purchased_goods:      '📦',
  upstream_transport:   '🚢',
  waste:                '♻️',
  downstream_transport: '🚚',
  end_of_life:          '🗑️',
};

/* ─── Activity confirm card ───────────────────── */
function ActivityConfirmCard({ card, onConfirm, onDismiss, state }) {
  const emoji = CAT_EMOJI[card.category] ?? '📊';
  const isHigh = card.valueKg > 5;

  if (state === 'confirmed') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2.5 mt-2 px-4 py-3 rounded-xl"
        style={{ background: '#EAF4EE', border: '1px solid #C0DDD0', maxWidth: 320 }}>
        <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#2D6A4F' }} />
        <p className="text-xs font-semibold" style={{ color: '#1B4332' }}>
          Logged {card.valueKg} kg CO₂e — {card.label}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="mt-2 rounded-xl overflow-hidden"
      style={{ border: '1px solid #C0DDD0', maxWidth: 320, background: '#fff' }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5"
        style={{ background: '#EAF4EE', borderBottom: '1px solid #C0DDD0' }}>
        <Leaf className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#2D6A4F' }} />
        <span className="text-xs font-bold" style={{ color: '#1B4332' }}>Activity detected — log it?</span>
        <button onClick={onDismiss} className="ml-auto p-0.5 rounded hover:bg-white/50" style={{ color: '#7A9E8E' }}>
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{emoji}</span>
          <div>
            <p className="text-sm font-semibold capitalize" style={{ color: '#1A2118' }}>{card.label}</p>
            <p className="text-xs" style={{ color: '#9BAEA5' }}>
              {card.quantity} {card.unit} · {card.scope}
            </p>
          </div>
        </div>
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-2xl font-bold" style={{ color: isHigh ? '#DC2626' : '#2D6A4F' }}>
            {card.valueKg.toFixed(3)}
          </span>
          <span className="text-sm" style={{ color: '#9BAEA5' }}>kg CO₂e</span>
          {isHigh && <span className="text-sm ml-1">⚠️</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={onConfirm} disabled={state === 'logging'}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: '#2D6A4F' }}>
            {state === 'logging'
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Logging…</>
              : <><Check className="h-3.5 w-3.5" /> Log Entry</>}
          </button>
          <button onClick={onDismiss}
            className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: '#F4F6F4', color: '#7A9E8E' }}>
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Markdown renderer ───────────────────────── */
function MsgText({ text }) {
  return (
    <div className="text-sm leading-relaxed space-y-1" style={{ color: 'inherit' }}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts    = line.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((p, j) =>
          j % 2 === 1 ? <strong key={j} style={{ color: 'inherit' }}>{p}</strong> : p
        );
        if (/^[•\-] /.test(line)) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: '#2D6A4F' }} />
              <span>{rendered.map((r, j) => j === 0 && typeof r === 'string' ? r.replace(/^[•\-] /, '') : r)}</span>
            </div>
          );
        }
        return <p key={i}>{rendered}</p>;
      })}
    </div>
  );
}

/* ─── Copy button ─────────────────────────────── */
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded transition-opacity opacity-0 group-hover:opacity-100" style={{ color: '#9BAEA5' }}>
      {copied ? <Check className="h-3 w-3" style={{ color: '#2D6A4F' }} /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

/* ─── Typing dots ─────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: '#EAF4EE', border: '1.5px solid #C0DDD0' }}>
        <Sparkles className="h-3.5 w-3.5" style={{ color: '#2D6A4F' }} />
      </div>
      <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
        style={{ background: '#ffffff', border: '1px solid #E5EAE8', borderBottomLeftRadius: '6px' }}>
        {[0,1,2].map(i => (
          <motion.span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: '#9BAEA5' }}
            animate={{ y: [0,-5,0] }} transition={{ duration: 0.55, delay: i * 0.12, repeat: Infinity }} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */
export default function ChatPage() {
  const { token }           = useAuthStore();
  const [convs,       setConvs]       = useState([]);
  const [activeId,    setActiveId]    = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [streaming,   setStreaming]   = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs,  setLoadingMsgs]  = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId,   setEditingId]   = useState(null);
  const [editTitle,   setEditTitle]   = useState('');
  const [apiOk,       setApiOk]       = useState(true);
  const [dark,        setDark]        = useState(false);
  // activityCards: { [assistantMsgId]: { card, state: 'pending'|'logging'|'confirmed'|'dismissed' } }
  const [activityCards, setActivityCards] = useState({});

  const bottomRef  = useRef(null);
  const abortRef   = useRef(null);
  const inputRef   = useRef(null);
  const editRef    = useRef(null);

  /* scroll to bottom on new messages */
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* focus edit input */
  useEffect(() => { if (editingId) editRef.current?.focus(); }, [editingId]);

  /* ── Load conversation list ── */
  const loadConvs = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const { data: res } = await api.get('/conversations');
      setConvs(res.data ?? []);
    } catch { toast.error('Could not load chat history'); }
    finally { setLoadingConvs(false); }
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  /* ── Load messages for a conversation ── */
  const openConv = useCallback(async (id) => {
    setActiveId(id);
    setMessages([]);
    setLoadingMsgs(true);
    try {
      const { data: res } = await api.get(`/conversations/${id}`);
      const msgs = (res.data?.messages ?? []).map(m => ({
        id:   m.id,
        role: m.role,
        text: m.content,
        time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        done: true,
      }));
      setMessages(msgs);
    } catch { toast.error('Could not load messages'); }
    finally { setLoadingMsgs(false); }
  }, []);

  /* ── New chat ── */
  const newChat = () => {
    abortRef.current?.abort();
    setActiveId(null);
    setMessages([]);
    setInput('');
    setStreaming(false);
    inputRef.current?.focus();
  };

  /* ── Delete conversation ── */
  const deleteConv = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/conversations/${id}`);
      setConvs(prev => prev.filter(c => c.id !== id));
      if (activeId === id) newChat();
    } catch { toast.error('Could not delete conversation'); }
  };

  /* ── Rename ── */
  const saveRename = async (id) => {
    const title = editTitle.trim();
    if (!title) { setEditingId(null); return; }
    try {
      await api.patch(`/conversations/${id}`, { title });
      setConvs(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    } catch { toast.error('Could not rename'); }
    setEditingId(null);
  };

  /* ── Send message ── */
  const send = useCallback(async (text) => {
    const msg = text.trim();
    if (!msg || streaming) return;
    setInput('');

    const userMsg      = { id: Date.now(),     role: 'user',      text: msg, time: now(), done: true };
    const assistantId  = Date.now() + 1;
    const placeholder  = { id: assistantId,    role: 'assistant', text: '',  time: now(), done: false };

    setMessages(prev => [...prev, userMsg, placeholder]);
    setStreaming(true);

    try {
      /* Build history from current messages + new user msg */
      const history = [...messages.filter(m => m.done), userMsg].map(m => ({
        role: m.role, text: m.text,
      }));

      const controller = new AbortController();
      abortRef.current = controller;

      const resp = await fetch(`${API_BASE}/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ messages: history, conversationId: activeId }),
        signal:  controller.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ message: 'AI service error' }));
        if (resp.status === 503) setApiOk(false);
        throw new Error(err.message ?? `HTTP ${resp.status}`);
      }

      setApiOk(true);
      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let newConvId   = activeId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split('\n')
          .filter(l => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));

            /* First event: server tells us the conversationId */
            if (data.init) {
              newConvId = data.conversationId;
              setActiveId(data.conversationId);
              loadConvs();
            }

            /* Activity card detected by extraction model */
            if (data.activityCard) {
              setActivityCards(prev => ({
                ...prev,
                [assistantId]: { card: data.activityCard, state: 'pending' },
              }));
            }

            if (data.text) {
              accumulated += data.text;
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, text: accumulated } : m
              ));
            }

            if (data.done) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, done: true } : m
              ));
              loadConvs();
            }

            if (data.error) throw new Error(data.error);
          } catch (parseErr) { /* skip malformed */ }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      const errText = err.message ?? 'Something went wrong.';
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, text: `⚠️ ${errText}`, done: true } : m
      ));
      toast.error(errText.length > 60 ? errText.slice(0, 60) + '…' : errText);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }, [messages, streaming, token, activeId, loadConvs]);

  /* ── Confirm an activity card ── */
  const confirmActivity = useCallback(async (msgId) => {
    const entry = activityCards[msgId];
    if (!entry) return;
    setActivityCards(prev => ({ ...prev, [msgId]: { ...prev[msgId], state: 'logging' } }));
    try {
      await carbonApi.submitEntry({
        category:    entry.card.category,
        subCategory: entry.card.subCategory,
        quantity:    entry.card.quantity,
      });
      setActivityCards(prev => ({ ...prev, [msgId]: { ...prev[msgId], state: 'confirmed' } }));
      toast.success(`${entry.card.valueKg} kg CO₂e logged!`);
    } catch {
      setActivityCards(prev => ({ ...prev, [msgId]: { ...prev[msgId], state: 'pending' } }));
      toast.error('Could not log entry. Try again.');
    }
  }, [activityCards]);

  const dismissActivity = useCallback((msgId) => {
    setActivityCards(prev => ({ ...prev, [msgId]: { ...prev[msgId], state: 'dismissed' } }));
  }, []);

  /* ─── group conversations by date ─── */
  const groups = groupByDate(convs);
  const GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'This Month'];
  const allGroups = [
    ...GROUP_ORDER.filter(g => groups[g]),
    ...Object.keys(groups).filter(g => !GROUP_ORDER.includes(g)),
  ];

  /* ═══════════════════ RENDER ════════════════════ */
  // Local light/dark palette for the chat interface panel
  const C = dark
    ? { panel: '#161D16', bar: '#1E261D', border: '#2E3A2C', msgBg: '#12180F',
        text: '#EAF2E8', sub: '#8FB89E', bubble: '#1E261D', bubbleBorder: '#2E3A2C',
        inputBg: '#1E261D', strip: '#1A211A' }
    : { panel: '#ffffff', bar: '#ffffff', border: '#E5EAE8', msgBg: '#F8FAF8',
        text: '#1A2118', sub: '#7A9E8E', bubble: '#ffffff', bubbleBorder: '#E5EAE8',
        inputBg: '#ffffff', strip: '#ffffff' };

  return (
    <div className="flex rounded-xl overflow-hidden animate-fade-in"
      style={{ height: 'calc(100vh - 7rem)', border: `1px solid ${C.border}` }}>

      {/* ══════════════════════════════════════
          LEFT SIDEBAR
      ══════════════════════════════════════ */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-shrink-0 overflow-hidden"
            style={{ background: '#F8FAF8', borderRight: '1px solid #E5EAE8' }}>

            {/* Sidebar header */}
            <div className="flex items-center gap-2 px-3 py-3"
              style={{ borderBottom: '1px solid #E5EAE8' }}>
              <img src={iconImg} alt="" className="h-5 w-5 object-contain flex-shrink-0" />
              <span className="text-xs font-bold flex-1 truncate" style={{ color: '#1A2118' }}>CarbonX AI</span>
              <button onClick={() => setSidebarOpen(false)}
                className="p-1 rounded hover:bg-gray-200 transition-colors" style={{ color: '#9BAEA5' }}>
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            {/* New Chat button */}
            <div className="px-3 py-2">
              <button onClick={newChat}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: '#2D6A4F', color: '#ffffff' }}>
                <Plus className="h-4 w-4" /> New Chat
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-2 py-1 space-y-3">
              {loadingConvs ? (
                <p className="text-xs text-center py-6" style={{ color: '#9BAEA5' }}>Loading…</p>
              ) : convs.length === 0 ? (
                <div className="flex flex-col items-center py-8 px-4 text-center">
                  <MessageSquare className="h-8 w-8 mb-2" style={{ color: '#C0DDD0' }} />
                  <p className="text-xs" style={{ color: '#9BAEA5' }}>No conversations yet</p>
                  <p className="text-xs mt-1" style={{ color: '#BFCDC7' }}>Start chatting below</p>
                </div>
              ) : (
                allGroups.map(group => (
                  <div key={group}>
                    <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: '#9BAEA5' }}>{group}</p>
                    {groups[group].map(conv => (
                      <div key={conv.id}
                        onClick={() => openConv(conv.id)}
                        className="group relative flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all mb-0.5"
                        style={conv.id === activeId
                          ? { background: '#EAF4EE', borderLeft: '3px solid #2D6A4F' }
                          : { borderLeft: '3px solid transparent' }}>

                        {editingId === conv.id ? (
                          <input ref={editRef}
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onBlur={() => saveRename(conv.id)}
                            onKeyDown={e => { if (e.key === 'Enter') saveRename(conv.id); if (e.key === 'Escape') setEditingId(null); }}
                            onClick={e => e.stopPropagation()}
                            className="flex-1 text-xs outline-none rounded px-1 py-0.5"
                            style={{ background: '#fff', border: '1px solid #2D6A4F', color: '#1A2118' }} />
                        ) : (
                          <>
                            <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" style={{ color: conv.id === activeId ? '#2D6A4F' : '#9BAEA5' }} />
                            <span className="flex-1 text-xs truncate"
                              style={{ color: conv.id === activeId ? '#1B4332' : '#3D5247', fontWeight: conv.id === activeId ? 600 : 400 }}>
                              {conv.title}
                            </span>
                          </>
                        )}

                        {/* Action icons — show on hover */}
                        {editingId !== conv.id && (
                          <div className="absolute right-1.5 hidden group-hover:flex items-center gap-0.5"
                            style={{ background: conv.id === activeId ? '#EAF4EE' : '#F8FAF8' }}>
                            <button onClick={e => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title); }}
                              className="p-1 rounded hover:bg-white transition-colors" style={{ color: '#9BAEA5' }}>
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button onClick={e => deleteConv(e, conv.id)}
                              className="p-1 rounded hover:bg-red-50 transition-colors" style={{ color: '#9BAEA5' }}>
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          RIGHT PANEL — messages
      ══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: C.panel }}>

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${C.border}`, background: C.bar }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg transition-colors" style={{ color: C.sub }}>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#EAF4EE', border: '2px solid #C0DDD0' }}>
              <img src={iconImg} alt="AI" className="h-4 w-4 object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: C.text }}>CarbonX AI</p>
              <p className="text-[10px] flex items-center gap-1" style={{ color: apiOk ? '#2D6A4F' : '#C4952A' }}>
                <span className={`h-1.5 w-1.5 rounded-full ${apiOk ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
                {apiOk ? 'Online · ready to help' : 'AI offline · set LLM_API_KEY'}
              </p>
            </div>
          </div>
          {/* Light / dark toggle */}
          <button onClick={() => setDark(v => !v)} title={dark ? 'Switch to light' : 'Switch to dark'}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: dark ? '#1E261D' : '#F4F6F4', color: dark ? '#F0D879' : '#5A7A6D', border: `1px solid ${C.border}` }}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button onClick={newChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: dark ? '#1E261D' : '#F4F6F4', color: dark ? '#8FB89E' : '#5A7A6D', border: `1px solid ${C.border}` }}>
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          style={{ background: C.msgBg }}>

          {/* Welcome screen when no active conversation */}
          {!activeId && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: '#EAF4EE', border: '2px solid #C0DDD0' }}>
                <img src={iconImg} alt="" className="h-8 w-8 object-contain" />
              </div>
              <h2 className="text-lg font-bold mb-2" style={{ color: C.text }}>CarbonX AI</h2>
              <p className="text-sm max-w-sm leading-relaxed" style={{ color: C.sub }}>
                Your personal carbon management assistant. I know your emission data and can answer in
                <strong style={{ color: '#52B788' }}> English</strong> or
                <strong style={{ color: '#52B788' }}> Roman Urdu</strong>.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-md">
                {QUICK_PROMPTS.map(p => (
                  <button key={p} onClick={() => send(p)}
                    className="text-xs text-left px-3 py-2.5 rounded-xl transition-all hover:opacity-80"
                    style={{ background: C.bubble, border: `1px solid ${C.bubbleBorder}`, color: dark ? '#CFE0D2' : '#3D5247' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading messages spinner */}
          {loadingMsgs && (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="h-5 w-5 animate-spin" style={{ color: '#9BAEA5' }} />
            </div>
          )}

          {/* Message bubbles */}
          <AnimatePresence initial={false}>
            {messages.map(m => (
              <motion.div key={m.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>

                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={m.role === 'assistant'
                    ? { background: '#EAF4EE', border: '1.5px solid #C0DDD0' }
                    : { background: '#2D6A4F' }}>
                  {m.role === 'assistant'
                    ? <Sparkles className="h-3.5 w-3.5" style={{ color: '#2D6A4F' }} />
                    : <User className="h-3.5 w-3.5 text-white" />}
                </div>

                <div className={`max-w-[78%] flex flex-col group ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="px-4 py-3 rounded-2xl"
                    style={m.role === 'assistant'
                      ? { background: C.bubble, border: `1px solid ${C.bubbleBorder}`, borderBottomLeftRadius: '6px', color: C.text }
                      : { background: '#2D6A4F', borderBottomRightRadius: '6px' }}>
                    {m.role === 'assistant' ? (
                      <>
                        {m.text ? <MsgText text={m.text} /> : null}
                        {!m.done && (
                          <motion.span className="inline-block w-0.5 h-4 ml-0.5 align-middle rounded"
                            style={{ background: '#9BAEA5' }}
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity }} />
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-white leading-relaxed">{m.text}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 px-1">
                    <span className="text-[10px]" style={{ color: '#BFCDC7' }}>{m.time}</span>
                    {m.role === 'assistant' && m.done && m.text && <CopyBtn text={m.text} />}
                  </div>
                  {/* Activity confirm card — shown below assistant bubbles only */}
                  {m.role === 'assistant' && activityCards[m.id] && activityCards[m.id].state !== 'dismissed' && (
                    <ActivityConfirmCard
                      card={activityCards[m.id].card}
                      state={activityCards[m.id].state}
                      onConfirm={() => confirmActivity(m.id)}
                      onDismiss={() => dismissActivity(m.id)}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing dots while waiting for first token */}
          {streaming && messages[messages.length - 1]?.text === '' && <TypingDots />}

          <div ref={bottomRef} />
        </div>

        {/* Quick prompts strip (only when conversation active) */}
        {(activeId || messages.length > 0) && (
          <div className="px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0"
            style={{ borderTop: `1px solid ${C.border}`, background: C.strip }}>
            {QUICK_PROMPTS.slice(0, 4).map(p => (
              <button key={p} onClick={() => send(p)} disabled={streaming}
                className="text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0 transition-all hover:opacity-80 disabled:opacity-40"
                style={{ background: '#EAF4EE', color: '#2D6A4F', border: '1px solid #C0DDD0' }}>
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: C.inputBg, borderTop: `1px solid ${C.border}` }}>
          <input ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }}}
            placeholder="Ask in English or Roman Urdu…"
            className="flex-1 text-sm outline-none bg-transparent placeholder:opacity-60"
            style={{ color: C.text }}
            disabled={streaming} />
          {streaming && (
            <button onClick={() => abortRef.current?.abort()}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
              Stop
            </button>
          )}
          <button onClick={() => send(input)} disabled={!input.trim() || streaming}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 hover:opacity-90"
            style={{ background: '#2D6A4F' }}>
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

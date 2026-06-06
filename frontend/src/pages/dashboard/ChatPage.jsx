import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, RefreshCw, Copy, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import iconImg from '../../assets/carbonx-icon.png';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/* ── Initial greeting ─────────────────────────── */
function makeGreeting() {
  return {
    id: 'init', role: 'assistant', done: true,
    text: "Hello! I'm **CarbonX AI**, your carbon management assistant.\n\nI have access to your real emission data and can help you:\n• Understand your biggest emission sources\n• Explain GHG Protocol and carbon accounting\n• Suggest specific reduction strategies\n• Analyse your sustainability progress\n\nAap **Roman Urdu** mein bhi pooch sakte hain — main samajhta hoon! 🌿\n\nWhat would you like to know?",
    time: now(),
  };
}

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ── Quick prompts ───────────────────────────── */
const QUICK_PROMPTS = [
  "What's my biggest emission source?",
  "Mera footprint kam karne ke liye kya karun?",
  "Explain Scope 3 emissions",
  "Aaj ke liye 3 tips do carbon reduce karne ki",
  "Compare my emission categories",
  "What is net-zero?",
];

/* ── Markdown renderer ───────────────────────── */
function MsgText({ text }) {
  return (
    <div className="text-sm leading-relaxed space-y-1" style={{ color: '#3D5247' }}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((p, j) =>
          j % 2 === 1
            ? <strong key={j} style={{ color: '#1A2118' }}>{p}</strong>
            : p
        );
        if (line.startsWith('• ') || line.startsWith('- ')) {
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

/* ── Copy button ─────────────────────────────── */
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className="p-1 rounded transition-opacity opacity-0 group-hover:opacity-100"
      style={{ color: '#9BAEA5' }} title="Copy">
      {copied ? <Check className="h-3 w-3" style={{ color: '#2D6A4F' }} /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */
export default function ChatPage() {
  const { token, user }  = useAuthStore();
  const [messages,  setMessages]  = useState([makeGreeting()]);
  const [input,     setInput]     = useState('');
  const [streaming, setStreaming] = useState(false);
  const [apiOk,     setApiOk]     = useState(true);
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const abortRef    = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async (text) => {
    const msg = text.trim();
    if (!msg || streaming) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', text: msg, time: now(), done: true };
    const assistantId = Date.now() + 1;
    const assistantMsg = { id: assistantId, role: 'assistant', text: '', time: now(), done: false };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    try {
      /* Build history excluding the empty placeholder we just added */
      const history = [...messages, userMsg].filter(m => m.done).map(m => ({
        role: m.role, text: m.text,
      }));

      const controller = new AbortController();
      abortRef.current = controller;

      const resp = await fetch(`${API_BASE}/chat`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body:   JSON.stringify({ messages: history }),
        signal: controller.signal,
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
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
            }
            if (data.error) throw new Error(data.error);
          } catch (parseErr) { /* skip malformed chunk */ }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      const errText = err.message ?? 'Something went wrong. Please try again.';
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, text: `⚠️ ${errText}`, done: true }
          : m
      ));
      toast.error(errText.length > 60 ? errText.slice(0, 60) + '…' : errText);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }, [messages, streaming, token]);

  const reset = () => {
    abortRef.current?.abort();
    setMessages([makeGreeting()]);
    setStreaming(false);
    setInput('');
  };

  return (
    <div className="flex flex-col animate-fade-in" style={{ height: 'calc(100vh - 7rem)' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-t-xl"
        style={{ background:'#ffffff', border:'1px solid #E5EAE8', borderBottom:'none' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background:'#EAF4EE', border:'2px solid #C0DDD0' }}>
          <img src={iconImg} alt="AI" className="h-5 w-5 object-contain" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color:'#1A2118' }}>CarbonX AI</p>
          <p className="text-xs flex items-center gap-1.5" style={{ color: apiOk ? '#2D6A4F' : '#C4952A' }}>
            <span className={`h-1.5 w-1.5 rounded-full ${apiOk ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
            {apiOk ? 'Powered by LLaMA 3.3 · Roman Urdu · aware of your data' : 'GROQ_API_KEY not configured'}
          </p>
        </div>
        <button onClick={reset}
          className="p-2 rounded-lg transition-colors hover:bg-gray-50"
          style={{ color:'#9BAEA5' }} title="New conversation">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        style={{ background:'#F8FAF8', border:'1px solid #E5EAE8', borderTop:'none', borderBottom:'none' }}>

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div key={m.id}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.25 }}
              className={`flex gap-3 ${m.role==='user'?'flex-row-reverse':''}`}>

              {/* Avatar */}
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={m.role==='assistant'
                  ? { background:'#EAF4EE', border:'1.5px solid #C0DDD0' }
                  : { background:'#2D6A4F' }}>
                {m.role==='assistant'
                  ? <Sparkles className="h-3.5 w-3.5" style={{ color:'#2D6A4F' }} />
                  : <User className="h-3.5 w-3.5 text-white" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[78%] flex flex-col group ${m.role==='user'?'items-end':'items-start'}`}>
                <div className="px-4 py-3 rounded-2xl"
                  style={m.role==='assistant'
                    ? { background:'#ffffff', border:'1px solid #E5EAE8', borderBottomLeftRadius:'6px' }
                    : { background:'#2D6A4F', borderBottomRightRadius:'6px' }}>
                  {m.role==='assistant'
                    ? <>
                        <MsgText text={m.text} />
                        {/* Streaming cursor */}
                        {!m.done && (
                          <motion.span className="inline-block w-0.5 h-4 ml-0.5 align-middle rounded"
                            style={{ background:'#9BAEA5' }}
                            animate={{ opacity:[1,0] }}
                            transition={{ duration:0.6, repeat:Infinity }} />
                        )}
                      </>
                    : <p className="text-sm text-white">{m.text}</p>
                  }
                </div>
                <div className="flex items-center gap-1.5 mt-1 px-1">
                  <span className="text-[10px]" style={{ color:'#BFCDC7' }}>{m.time}</span>
                  {m.role==='assistant' && m.done && m.text && <CopyBtn text={m.text} />}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing dots while waiting for first chunk */}
        {streaming && messages[messages.length-1]?.text === '' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background:'#EAF4EE', border:'1.5px solid #C0DDD0' }}>
              <Sparkles className="h-3.5 w-3.5" style={{ color:'#2D6A4F' }} />
            </div>
            <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
              style={{ background:'#ffffff', border:'1px solid #E5EAE8', borderBottomLeftRadius:'6px' }}>
              {[0,1,2].map(i=>(
                <motion.span key={i} className="h-1.5 w-1.5 rounded-full"
                  style={{ background:'#9BAEA5' }}
                  animate={{ y:[0,-5,0] }}
                  transition={{ duration:0.55, delay:i*0.12, repeat:Infinity }} />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Quick prompts ── */}
      <div className="px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide"
        style={{ background:'#ffffff', border:'1px solid #E5EAE8', borderTop:'1px solid #F0EDE4', borderBottom:'none' }}>
        {QUICK_PROMPTS.map(p=>(
          <button key={p} onClick={()=>send(p)} disabled={streaming}
            className="text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0 transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background:'#EAF4EE', color:'#2D6A4F', border:'1px solid #C0DDD0' }}>
            {p}
          </button>
        ))}
      </div>

      {/* ── Input ── */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-b-xl"
        style={{ background:'#ffffff', border:'1px solid #E5EAE8', borderTop:'none' }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(input); }}}
          placeholder="Ask anything about your carbon footprint…"
          className="flex-1 text-sm outline-none bg-transparent"
          style={{ color:'#1A2118' }}
          disabled={streaming}
        />
        {streaming && (
          <button onClick={()=>abortRef.current?.abort()}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ background:'#FEF2F2', color:'#DC2626', border:'1px solid #FECACA' }}>
            Stop
          </button>
        )}
        <button onClick={()=>send(input)}
          disabled={!input.trim()||streaming}
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
          style={{ background:'#2D6A4F' }}>
          <Send className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}

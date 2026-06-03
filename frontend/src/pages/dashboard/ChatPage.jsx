import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Info } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import iconImg from '../../assets/carbonx-icon.png';

const INITIAL_MESSAGES = [
  {
    id: 1, role: 'assistant',
    text: "Hello! I'm the CarbonX AI assistant. I can help you understand your emissions data, explain carbon accounting concepts, and suggest reduction strategies.\n\nOnce you connect a data source, I'll have access to your real emission figures and provide personalised insights. For now, ask me anything about carbon management!",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

const QUICK_PROMPTS = [
  'What is Scope 3 emissions?',
  'How do I reduce my carbon footprint?',
  'Explain the GHG Protocol',
  'What is net-zero?',
];

const MOCK_REPLIES = {
  default: "That's a great question. Once your data source is connected, I'll be able to give you a precise, personalised answer based on your actual emission figures. In the meantime, I can share general guidance — carbon accounting best practices, GHG Protocol methodology, or reduction strategy frameworks. What would you like to explore?",
  scope: "**Scope 3 emissions** are indirect emissions that occur in a company's value chain — both upstream and downstream.\n\n• **Upstream**: Purchased goods, business travel, employee commuting\n• **Downstream**: Use of sold products, end-of-life treatment, investments\n\nScope 3 typically represents 70–90% of a company's total footprint, making it the biggest opportunity for reduction. The GHG Protocol Corporate Value Chain Standard provides the framework for measurement.",
  ghg: "The **GHG Protocol** is the world's most widely used greenhouse gas accounting standard.\n\nIt provides guidance for measuring and managing emissions across three scopes (1, 2, 3) and is used by over 90% of Fortune 500 companies. CarbonX is fully aligned with GHG Protocol methodology for all reporting.",
  netzero: "**Net-zero** means balancing the amount of greenhouse gases emitted with an equivalent amount removed from the atmosphere.\n\nAchieving net-zero requires:\n1. Deep emission reductions (at least 90%)\n2. Neutralising residual emissions via carbon removal\n3. Setting science-based targets aligned with 1.5°C pathway\n\nMany countries and companies have committed to net-zero by 2050.",
  reduce: "Here are the highest-impact reduction strategies:\n\n**Energy** — Switch to renewable electricity (Scope 2), improve building efficiency\n**Transport** — Electrify fleet, reduce business air travel, enable remote work\n**Supply chain** — Engage suppliers on emission reduction, redesign logistics\n**Procurement** — Buy low-carbon materials, extend product lifetimes\n\nCarbonX's AI Insights module will prioritise these specifically for your organisation once data is connected.",
};

function pickReply(text) {
  const t = text.toLowerCase();
  if (t.includes('scope 3') || t.includes('scope3')) return MOCK_REPLIES.scope;
  if (t.includes('ghg') || t.includes('protocol')) return MOCK_REPLIES.ghg;
  if (t.includes('net-zero') || t.includes('net zero')) return MOCK_REPLIES.netzero;
  if (t.includes('reduce') || t.includes('reduction') || t.includes('footprint')) return MOCK_REPLIES.reduce;
  return MOCK_REPLIES.default;
}

/* Render markdown-ish text */
function MsgText({ text }) {
  return (
    <div className="text-sm leading-relaxed" style={{ color: '#3D5247' }}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        // bold
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="mb-0.5">
            {parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#1A2118' }}>{p}</strong> : p)}
          </p>
        );
      })}
    </div>
  );
}

export default function ChatPage() {
  const { user }   = useAuthStore();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const bottomRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((m) => [...m, { id: Date.now(), role: 'user', text: msg, time: now }]);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 800));
    setLoading(false);
    setMessages((m) => [...m, {
      id: Date.now() + 1, role: 'assistant',
      text: pickReply(msg),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] animate-fade-in">

      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-t-xl"
        style={{ background: '#ffffff', border: '1px solid #E5EAE8', borderBottom: 'none' }}
      >
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#EAF4EE', border: '2px solid #C0DDD0' }}>
          <img src={iconImg} alt="AI" className="h-5 w-5 object-contain" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#1A2118' }}>CarbonX AI Assistant</p>
          <p className="text-xs flex items-center gap-1.5" style={{ color: '#2D6A4F' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Online · AI-powered
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
          style={{ background: '#FDF5E6', color: '#C4952A', border: '1px solid #F5E3C0' }}>
          <Info className="h-3 w-3" /> Demo mode
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        style={{ background: '#F8FAF8', border: '1px solid #E5EAE8', borderTop: 'none', borderBottom: 'none' }}
      >
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={m.role === 'assistant'
                  ? { background: '#EAF4EE', border: '1.5px solid #C0DDD0' }
                  : { background: '#2D6A4F' }
                }
              >
                {m.role === 'assistant'
                  ? <Sparkles className="h-3.5 w-3.5" style={{ color: '#2D6A4F' }} />
                  : <User className="h-3.5 w-3.5 text-white" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[75%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className="px-4 py-3 rounded-2xl"
                  style={m.role === 'assistant'
                    ? { background: '#ffffff', border: '1px solid #E5EAE8', borderBottomLeftRadius: '6px' }
                    : { background: '#2D6A4F', borderBottomRightRadius: '6px' }
                  }
                >
                  {m.role === 'assistant'
                    ? <MsgText text={m.text} />
                    : <p className="text-sm text-white">{m.text}</p>
                  }
                </div>
                <span className="text-[10px] mt-1 px-1" style={{ color: '#BFCDC7' }}>{m.time}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#EAF4EE', border: '1.5px solid #C0DDD0' }}>
              <Sparkles className="h-3.5 w-3.5" style={{ color: '#2D6A4F' }} />
            </div>
            <div className="px-4 py-3 rounded-2xl flex items-center gap-1"
              style={{ background: '#ffffff', border: '1px solid #E5EAE8', borderBottomLeftRadius: '6px' }}>
              {[0,1,2].map((i) => (
                <motion.span
                  key={i} className="h-1.5 w-1.5 rounded-full"
                  style={{ background: '#9BAEA5' }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div
        className="px-5 py-2.5 flex gap-2 overflow-x-auto"
        style={{ background: '#ffffff', border: '1px solid #E5EAE8', borderTop: '1px solid #F0EDE4', borderBottom: 'none' }}
      >
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => send(p)}
            className="text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0 transition-all hover:opacity-80"
            style={{ background: '#EAF4EE', color: '#2D6A4F', border: '1px solid #C0DDD0' }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-b-xl"
        style={{ background: '#ffffff', border: '1px solid #E5EAE8', borderTop: 'none' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder="Ask anything about carbon management…"
          className="flex-1 text-sm outline-none bg-transparent"
          style={{ color: '#1A2118' }}
          disabled={loading}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
          style={{ background: '#2D6A4F' }}
        >
          <Send className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}

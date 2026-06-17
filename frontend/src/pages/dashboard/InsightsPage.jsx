import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Target, Leaf,
  TrendingDown, TrendingUp, Minus,
  Loader2, AlertCircle, CheckCircle, RefreshCw,
  Trophy, Flame, Clock, ChevronRight, Calculator,
  ExternalLink, Info, Zap, FileText, Download, Lightbulb,
} from 'lucide-react';
import { insightsApi } from '../../api/insightsApi';
import { goalsApi }    from '../../api/goalsApi';
import { useAuthStore } from '../../store/authStore';
import { useNavigate }  from 'react-router-dom';
import toast            from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/* ─── Shared card ─────────────────────────────── */
function Card({ className = '', style = {}, children, ...rest }) {
  return (
    <div className={`rounded-xl ${className}`}
      style={{ background: '#ffffff', border: '1px solid #E5EAE8', ...style }}
      {...rest}>
      {children}
    </div>
  );
}

/* ─── Priority badge ──────────────────────────── */
const PRIORITY = {
  high:   { bg: '#FEF2F2', color: '#DC2626', label: 'High Priority' },
  medium: { bg: '#FDF5E6', color: '#C4952A', label: 'Medium'        },
  low:    { bg: '#EAF4EE', color: '#2D6A4F', label: 'Low'           },
};
const CAT_COLORS = {
  commute: '#2D6A4F', energy: '#C4952A', food: '#8B5E3C',
  travel: '#52B788', organisation: '#6B5EAF', general: '#9BAEA5',
};

/* ─── Difficulty badge ────────────────────────── */
const DIFF = {
  easy:   { bg: '#EAF4EE', color: '#2D6A4F', label: 'Easy'   },
  medium: { bg: '#FDF5E6', color: '#C4952A', label: 'Medium' },
  hard:   { bg: '#FEF2F2', color: '#DC2626', label: 'Hard'   },
};

/* ─── Mini markdown renderer ──────────────────── */
function MdText({ text, className = '', style = {} }) {
  return (
    <span className={className} style={style}>
      {text.split(/\*\*(.*?)\*\*/g).map((p, i) =>
        i % 2 === 1 ? <strong key={i} style={{ color: '#1A2118' }}>{p}</strong> : p
      )}
    </span>
  );
}

/* ════════════════════════════════════════════════
   TAB 1 — RECOMMENDATIONS
════════════════════════════════════════════════ */
function RecommendationsTab() {
  const { user }        = useAuthStore();
  const navigate        = useNavigate();
  const [data,  setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await insightsApi.getRecommendations();
      setData(res.data);
    } catch { toast.error('Could not load recommendations'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#9BAEA5' }} />
    </div>
  );

  if (!data?.dataAvailable) return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: '#EAF4EE' }}>
        <Sparkles className="h-7 w-7" style={{ color: '#2D6A4F' }} />
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: '#1A2118' }}>No data yet</h3>
      <p className="text-sm max-w-xs mb-5" style={{ color: '#9BAEA5' }}>
        Log at least one carbon entry to receive personalised, data-driven recommendations.
      </p>
      <button onClick={() => navigate('/dashboard/activities')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
        style={{ background: '#2D6A4F' }}>
        <Calculator className="h-4 w-4" /> Log First Entry
      </button>
    </div>
  );

  const highCount = data.recommendations.filter(r => r.priority === 'high').length;

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: '#EAF4EE', color: '#2D6A4F', border: '1px solid #C0DDD0' }}>
            <Sparkles className="h-3.5 w-3.5" />
            {data.recommendations.length} personalised recommendations
          </div>
          {highCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
              <AlertCircle className="h-3.5 w-3.5" />
              {highCount} high-priority action{highCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#9BAEA5' }}>
          <RefreshCw className="h-3 w-3" />
          Based on last {data.period} · {data.totalKg} kg CO₂e logged
        </div>
      </div>

      {/* Recommendation cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.recommendations.map((rec, i) => {
          const p   = PRIORITY[rec.priority] ?? PRIORITY.medium;
          const c   = CAT_COLORS[rec.category] ?? '#9BAEA5';
          return (
            <motion.div key={rec.id}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}>
              <Card className="p-5 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${c}18` }}>
                    {rec.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: p.bg, color: p.color }}>{p.label}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{ background: `${c}18`, color: c }}>{rec.category}</span>
                  </div>
                </div>

                <h3 className="text-sm font-semibold mb-2" style={{ color: '#1A2118' }}>{rec.title}</h3>
                <p className="text-xs leading-relaxed flex-1" style={{ color: '#7A9E8E' }}>
                  <MdText text={rec.summary} />
                </p>

                {/* Steps */}
                <div className="mt-4 pt-3 space-y-1.5" style={{ borderTop: '1px solid #F0EDE4' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9BAEA5' }}>Action steps</p>
                  {rec.steps.map((step, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${c}18`, color: c }}>{j+1}</span>
                      <span className="text-xs" style={{ color: '#5A7A6D' }}>{step}</span>
                    </div>
                  ))}
                </div>

                {/* Impact */}
                <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid #F0EDE4' }}>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#9BAEA5' }}>Estimated impact</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: c }}>{rec.impact}</p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: '#F4F6F4', color: '#9BAEA5' }}>
                    {rec.effort}
                  </span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   TAB 2 — CHALLENGES
════════════════════════════════════════════════ */
function ChallengesTab() {
  const [challenges,  setChallenges]  = useState([]);
  const [suggestion,  setSuggestion]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [acting,      setActing]      = useState(null); // challengeId being actioned

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await insightsApi.getChallenges();
      setChallenges(res.data ?? []);
    } catch { toast.error('Could not load challenges'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    // Load suggested challenge
    insightsApi.suggestChallenge()
      .then(({ data: res }) => setSuggestion(res.data?.suggestion))
      .catch(() => {}); // Silently fail, it's optional
  }, [load]);

  const doJoin = async (id) => {
    setActing(id);
    try {
      await insightsApi.joinChallenge(id);
      toast.success('Challenge joined! Good luck 💪');
      load();
    } catch (e) { toast.error(e?.response?.data?.message ?? 'Could not join'); }
    finally { setActing(null); }
  };

  const doComplete = async (id) => {
    setActing(id);
    try {
      const { data: res } = await insightsApi.completeChallenge(id);
      toast.success(res.message);
      load();
    } catch (e) { toast.error(e?.response?.data?.message ?? 'Could not complete'); }
    finally { setActing(null); }
  };

  const doLeave = async (id) => {
    setActing(id);
    try {
      await insightsApi.leaveChallenge(id);
      toast('Left challenge', { icon: '👋' });
      load();
    } catch { toast.error('Could not leave'); }
    finally { setActing(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#9BAEA5' }} />
    </div>
  );

  const active    = challenges.filter(c => c.userStatus === 'active');
  const completed = challenges.filter(c => c.userStatus === 'completed');
  const available = challenges.filter(c => !c.userStatus || c.userStatus === 'abandoned');

  const totalSaved = completed.reduce((s, c) => s + c.targetKg, 0);

  return (
    <div className="space-y-6">

      {/* AI Suggested Challenge */}
      {suggestion && !active.find(c => c.id === suggestion.challengeId) && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="p-5 border-2" style={{ borderColor: '#C4952A', background: '#FDF5E6' }}>
            <div className="flex items-start gap-4">
              <div className="text-3xl flex-shrink-0">{suggestion.challenge?.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-base font-bold" style={{ color: '#1A2118' }}>{suggestion.challenge?.title}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#2D6A4F', color: '#fff' }}>
                    🤖 Recommended for you
                  </span>
                </div>
                <p className="text-xs mb-3 leading-relaxed" style={{ color: '#5A7A6D' }}>{suggestion.reasoning}</p>
                <button onClick={() => doJoin(suggestion.challengeId)} disabled={acting === suggestion.challengeId}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: suggestion.challenge?.category === 'commute' ? '#2D6A4F' : '#52B788' }}>
                  {acting === suggestion.challengeId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  Join Challenge
                </button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active',    value: active.length,    icon: Flame,       color: '#C4952A', bg: '#FDF5E6' },
          { label: 'Completed', value: completed.length, icon: Trophy,      color: '#2D6A4F', bg: '#EAF4EE' },
          { label: 'kg Saved',  value: totalSaved.toFixed(1), icon: Leaf,   color: '#52B788', bg: '#F0FAF4' },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: s.bg }}>
              <s.icon className="h-4.5 w-4.5" style={{ color: s.color, width:'18px', height:'18px' }} />
            </div>
            <p className="text-xl font-bold" style={{ color: '#1A2118' }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#9BAEA5' }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Active challenges */}
      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#1A2118' }}>
            <Flame className="h-4 w-4" style={{ color: '#C4952A' }} /> Active Challenges
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {active.map(c => (
              <ChallengeCard key={c.id} c={c} onComplete={doComplete} onLeave={doLeave} acting={acting} />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#1A2118' }}>
            <Trophy className="h-4 w-4" style={{ color: '#2D6A4F' }} /> Completed
          </h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {completed.map(c => (
              <ChallengeCard key={c.id} c={c} acting={acting} />
            ))}
          </div>
        </div>
      )}

      {/* Available */}
      {available.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#1A2118' }}>
            <Target className="h-4 w-4" style={{ color: '#2D6A4F' }} />
            Available Challenges
            <span className="text-xs font-normal" style={{ color: '#9BAEA5' }}>
              — Pick one to start reducing
            </span>
          </h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {available.map((c, i) => (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35 }}>
                <ChallengeCard c={c} onJoin={doJoin} acting={acting} />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChallengeCard({ c, onJoin, onComplete, onLeave, acting }) {
  const diff  = DIFF[c.difficulty] ?? DIFF.easy;
  const catC  = CAT_COLORS[c.category] ?? '#9BAEA5';
  const busy  = acting === c.id;
  const isDone = c.userStatus === 'completed';
  const isActive = c.userStatus === 'active';

  const daysLeft = isActive && c.startedAt
    ? Math.max(0, c.durationDays - Math.floor((Date.now() - new Date(c.startedAt)) / 86400000))
    : null;

  return (
    <Card className="p-5 flex flex-col"
      style={isDone ? { background: '#F8FAF8' } : {}}>
      {/* Top */}
      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl">{c.icon}</div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: diff.bg, color: diff.color }}>{diff.label}</span>
          {isDone && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: '#EAF4EE', color: '#2D6A4F' }}>
              <CheckCircle className="h-2.5 w-2.5" /> Done
            </span>
          )}
          {isActive && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: '#FDF5E6', color: '#C4952A' }}>
              <Flame className="h-2.5 w-2.5" /> Active
            </span>
          )}
        </div>
      </div>

      <h3 className="text-sm font-semibold mb-1.5" style={{ color: isDone ? '#7A9E8E' : '#1A2118' }}>
        {c.title}
      </h3>
      <p className="text-xs leading-relaxed flex-1" style={{ color: '#9BAEA5' }}>{c.description}</p>

      {/* Meta */}
      <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: '#9BAEA5' }}>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {daysLeft !== null ? `${daysLeft}d left` : `${c.durationDays} days`}
        </div>
        <div className="flex items-center gap-1">
          <Leaf className="h-3 w-3" />
          ~{c.targetKg} kg saved
        </div>
        <span className="capitalize px-1.5 py-0.5 rounded"
          style={{ background: `${catC}18`, color: catC, fontSize: '10px', fontWeight: 600 }}>
          {c.category}
        </span>
      </div>

      {/* Tips */}
      {!isDone && c.tips && (
        <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid #F0EDE4' }}>
          {c.tips.slice(0, 2).map((t, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs" style={{ color: '#7A9E8E' }}>
              <span className="mt-0.5 h-1 w-1 rounded-full flex-shrink-0" style={{ background: catC, marginTop: '6px' }} />
              {t}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {!isDone && (
        <div className="flex gap-2 mt-4">
          {!isActive && onJoin && (
            <button onClick={() => onJoin(c.id)} disabled={busy}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: catC }}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Join Challenge
            </button>
          )}
          {isActive && onComplete && (
            <button onClick={() => onComplete(c.id)} disabled={busy}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: '#2D6A4F' }}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              Mark Complete
            </button>
          )}
          {isActive && onLeave && (
            <button onClick={() => onLeave(c.id)} disabled={busy}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: '#F4F6F4', color: '#9BAEA5' }}>
              Leave
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

/* ════════════════════════════════════════════════
   TAB 4 — OFFSET PROJECTS  (admin only)
════════════════════════════════════════════════ */
function OffsetTab() {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    insightsApi.getOffsetProjects()
      .then(({ data: res }) => setProjects(res.data ?? []))
      .catch(() => toast.error('Could not load offset projects'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" style={{ color:'#9BAEA5' }} /></div>;

  const SDG_LABELS = { 3:'Good Health',5:'Gender Equality',6:'Clean Water',7:'Clean Energy',11:'Sustainable Cities',13:'Climate Action',14:'Life Below Water',15:'Life on Land' };

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <Card className="p-4 flex items-start gap-3" style={{ background:'#EAF4EE', border:'1px solid #C0DDD0' }}>
        <Leaf className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color:'#2D6A4F' }} />
        <div>
          <p className="text-xs font-bold" style={{ color:'#1B4332' }}>Carbon Offsetting</p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color:'#3D6B56' }}>
            After reducing what you can, offset remaining emissions by funding verified projects.
            Prices shown are indicative USD/tonne CO₂e (2024). Always verify on the registry before purchasing.
          </p>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06, duration:0.4 }}>
            <Card className="p-5 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-lg">{p.flag}</span>
                  <span className="text-xs font-bold ml-2 px-2 py-0.5 rounded-full"
                    style={{ background:'#EAF4EE', color:'#2D6A4F' }}>{p.standard}</span>
                </div>
                {p.verified && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background:'#EAF4EE', color:'#2D6A4F' }}>
                    <CheckCircle className="h-2.5 w-2.5" /> Verified
                  </span>
                )}
              </div>

              <h3 className="text-sm font-semibold mb-1" style={{ color:'#1A2118' }}>{p.name}</h3>
              <p className="text-xs mb-2" style={{ color:'#9BAEA5' }}>
                📍 {p.location} · {p.type}
              </p>
              <p className="text-xs leading-relaxed flex-1" style={{ color:'#7A9E8E' }}>{p.description}</p>

              {/* SDG tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {p.sdgs.map(sdg => (
                  <span key={sdg} className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{ background:'#F4F6F4', color:'#9BAEA5', border:'1px solid #E5EAE8' }}>
                    SDG {sdg}
                  </span>
                ))}
              </div>

              {/* Price + CTA */}
              <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop:'1px solid #F0EDE4' }}>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color:'#9BAEA5' }}>Price</p>
                  <p className="text-sm font-bold" style={{ color:'#1A2118' }}>${p.priceUsdPerTon}/tonne CO₂e</p>
                </div>
                <a href={p.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                  style={{ background:'#EAF4EE', color:'#2D6A4F' }}>
                  View Registry <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   TAB 5 — AI GOALS
════════════════════════════════════════════════ */
function GoalsTab() {
  const [goals,    setGoals]    = useState([]);
  const [monthKg,  setMonthKg]  = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [title,    setTitle]    = useState('');
  const [target,   setTarget]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const [suggests, setSuggests] = useState(null);
  const [sugLoad,  setSugLoad]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await goalsApi.list();
      setGoals(res.data?.goals ?? []);
      setMonthKg(res.data?.currentMonthKg ?? 0);
    } catch { toast.error('Could not load goals'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const addGoal = async (e) => {
    e?.preventDefault();
    if (!title.trim() || !target) { toast.error('Enter a title and target'); return; }
    setSaving(true);
    try {
      await goalsApi.create({ title: title.trim(), targetKg: parseFloat(target) });
      setTitle(''); setTarget('');
      toast.success('Target set!');
      load();
    } catch (e) { toast.error(e?.response?.data?.message ?? 'Could not create goal'); }
    finally { setSaving(false); }
  };

  const removeGoal = async (id) => {
    try { await goalsApi.remove(id); setGoals((g) => g.filter((x) => x.id !== id)); }
    catch { toast.error('Could not delete goal'); }
  };

  const getSuggestions = async () => {
    setSugLoad(true);
    try {
      const { data: res } = await insightsApi.getSuggestedGoals();
      setSuggests(res.data?.goals ?? []);
    } catch { toast.error('Could not fetch AI suggestions'); }
    finally { setSugLoad(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" style={{ color: '#9BAEA5' }} /></div>;

  return (
    <div className="space-y-5">
      {/* This month banner */}
      <Card className="p-4 flex items-center justify-between flex-wrap gap-3" style={{ background: '#F8FAF8' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#EAF4EE' }}>
            <Target className="h-5 w-5" style={{ color: '#2D6A4F' }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: '#9BAEA5' }}>This month's emissions so far</p>
            <p className="text-xl font-bold" style={{ color: '#1A2118' }}>{monthKg.toLocaleString()} <span className="text-sm font-normal" style={{ color:'#9BAEA5' }}>kg CO₂e</span></p>
          </div>
        </div>
        <span className="text-xs" style={{ color: '#9BAEA5' }}>{goals.length} active target{goals.length !== 1 ? 's' : ''}</span>
      </Card>

      {/* Add target form */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-3" style={{ color: '#1A2118' }}>Set a monthly target</p>
        <form onSubmit={addGoal} className="flex flex-col sm:flex-row gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cut commute emissions"
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid #E5EAE8', color: '#1A2118' }} />
          <input value={target} onChange={(e) => setTarget(e.target.value)} type="number" min="1" placeholder="Target kg/mo"
            className="w-full sm:w-40 px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid #E5EAE8', color: '#1A2118' }} />
          <button type="submit" disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#2D6A4F' }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />} Set target
          </button>
        </form>
      </Card>

      {/* Active goals with progress */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-6">
          <Target className="h-10 w-10 mb-3" style={{ color: '#C0DDD0' }} />
          <p className="text-sm" style={{ color: '#9BAEA5' }}>No targets yet — set one above or get an AI suggestion below.</p>
        </div>
      ) : goals.map((g, i) => {
        const pct = Math.min(150, g.progressPct);
        const barColor = g.onTrack ? '#2D6A4F' : '#DC2626';
        return (
          <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.35 }}>
            <Card className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold" style={{ color: '#1A2118' }}>{g.title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#9BAEA5' }}>{g.targetKg.toLocaleString()} kg CO₂e / month</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: g.onTrack ? '#EAF4EE' : '#FEF2F2', color: barColor }}>
                    {g.onTrack ? '✓ On track' : '⚠ Over target'}
                  </span>
                  <button onClick={() => removeGoal(g.id)} className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100" style={{ color: '#9BAEA5' }}>Remove</button>
                </div>
              </div>
              <div className="flex items-end justify-between mb-2">
                <p className="text-2xl font-bold" style={{ color: '#1A2118' }}>
                  {g.currentKg.toLocaleString()} <span className="text-sm font-normal" style={{ color: '#9BAEA5' }}>/ {g.targetKg.toLocaleString()} kg</span>
                </p>
                <p className="text-sm font-bold" style={{ color: barColor }}>{g.progressPct}%</p>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: '#F0EDE4' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
              </div>
              <p className="text-xs mt-2" style={{ color: '#9BAEA5' }}>
                {g.onTrack ? `${g.remainingKg.toLocaleString()} kg of headroom left this month.` : `${Math.abs(g.remainingKg).toLocaleString()} kg over your target.`}
              </p>
            </Card>
          </motion.div>
        );
      })}

      {/* AI suggestions */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: '#C4952A' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#1A2118' }}>AI-suggested targets</h3>
          </div>
          <button onClick={getSuggestions} disabled={sugLoad}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1.5"
            style={{ background: '#FDF5E6', color: '#C4952A' }}>
            {sugLoad ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {suggests ? 'Refresh' : 'Get suggestions'}
          </button>
        </div>
        {suggests && (
          suggests.length ? (
            <div className="space-y-2 mt-3">
              {suggests.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg" style={{ background: '#F8FAF8' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1A2118' }}>{s.period || 'Reduction target'}</p>
                    <p className="text-xs" style={{ color: '#9BAEA5' }}>Target {s.targetKg} kg · {s.strategy}</p>
                  </div>
                  <button onClick={() => { setTitle(s.period || 'Reduction target'); setTarget(String(s.targetKg || '')); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: '#EAF4EE', color: '#2D6A4F' }}>
                    Use
                  </button>
                </div>
              ))}
            </div>
          ) : <p className="text-xs mt-3" style={{ color: '#9BAEA5' }}>Not enough data for suggestions yet — log more entries.</p>
        )}
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════
   TAB 6 — AI REPORT (admin only)
════════════════════════════════════════════════ */
function ReportTab() {
  const [report,  setReport]  = useState('');
  const [loading, setLoading] = useState(false);
  const [stats,   setStats]   = useState(null);

  const generateNow = async () => {
    setLoading(true);
    try {
      const { data: res } = await insightsApi.generateReport();
      setReport(res.data.report);
      setStats(res.data.stats);
      toast.success('Report generated!');
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Report generation failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbonx-report-${new Date().toISOString().slice(0,10)}.md`;
    a.click();
  };

  const downloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 48, maxW = 595 - margin * 2;
      let y = margin;
      const line = (text, size, color, weight = 'normal', gap = 6) => {
        doc.setFont('helvetica', weight); doc.setFontSize(size); doc.setTextColor(...color);
        const wrapped = doc.splitTextToSize(text, maxW);
        wrapped.forEach((w) => {
          if (y > 800) { doc.addPage(); y = margin; }
          doc.text(w, margin, y); y += size + gap;
        });
      };
      // Header band
      doc.setFillColor(45, 106, 79); doc.rect(0, 0, 595, 70, 'F');
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
      doc.text('CarbonX', margin, 34);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
      doc.text(`Sustainability Report · ${new Date().toLocaleDateString()}`, margin, 52);
      y = 96;
      report.split('\n').forEach((l) => {
        if (l.startsWith('# '))       line(l.slice(2), 16, [26, 33, 24], 'bold', 8);
        else if (l.startsWith('## ')) line(l.slice(3), 13, [26, 33, 24], 'bold', 7);
        else if (l.startsWith('- '))  line('•  ' + l.slice(2), 10.5, [60, 82, 71], 'normal', 5);
        else if (l.trim() === '')     { y += 6; }
        else                          line(l, 10.5, [60, 82, 71], 'normal', 5);
      });
      doc.save(`carbonx-report-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch { toast.error('Could not generate PDF.'); }
  };

  return (
    <div className="space-y-5">
      {!report ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <FileText className="h-12 w-12 mb-4" style={{ color: '#C0DDD0' }} />
          <h3 className="text-base font-semibold mb-2" style={{ color: '#1A2118' }}>Generate Organization Report</h3>
          <p className="text-sm max-w-md mb-6" style={{ color: '#9BAEA5' }}>
            Create a professional sustainability report for your organization with AI-powered insights, key findings, and recommendations.
          </p>
          <button onClick={generateNow} disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white disabled:opacity-50"
            style={{ background: '#2D6A4F' }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { l: 'Total Emissions', v: `${stats.totalKg} kg`, icon: '📊' },
                { l: 'Employees', v: stats.employees, icon: '👥' },
                { l: 'Top Category', v: stats.topCategory, icon: '📈' },
                { l: 'Trend', v: stats.trend + '%', icon: '📉' },
              ].map(s => (
                <Card key={s.l} className="p-3 text-center">
                  <p className="text-lg mb-1">{s.icon}</p>
                  <p className="text-sm font-bold" style={{ color: '#1A2118' }}>{s.v}</p>
                  <p className="text-xs" style={{ color: '#9BAEA5' }}>{s.l}</p>
                </Card>
              ))}
            </div>
          )}

          {/* Report content */}
          <Card className="p-6">
            <div className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: report
                  .split('\n').map(l => {
                    if (l.startsWith('# ')) return `<h2 style="color:#1A2118;font-size:24px;font-weight:bold;margin:16px 0 8px">${l.slice(2)}</h2>`;
                    if (l.startsWith('## ')) return `<h3 style="color:#1A2118;font-size:18px;font-weight:bold;margin:12px 0 6px">${l.slice(3)}</h3>`;
                    if (l.startsWith('- ')) return `<li style="color:#5A7A6D;margin:4px 0 4px 20px">${l.slice(2)}</li>`;
                    if (l === '') return '<br />';
                    return `<p style="color:#5A7A6D;margin:8px 0;line-height:1.6">${l}</p>`;
                  }).join('')
              }}
            />
          </Card>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <button onClick={downloadPDF}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#2D6A4F' }}>
              <FileText className="h-4 w-4" /> Download PDF
            </button>
            <button onClick={downloadReport}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#EAF4EE', color: '#2D6A4F', border: '1px solid #C0DDD0' }}>
              <Download className="h-4 w-4" /> Markdown
            </button>
            <button onClick={generateNow} disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#F4F6F4', color: '#9BAEA5', border: '1px solid #E5EAE8' }}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Regenerate
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   PAGE SHELL
════════════════════════════════════════════════ */
export default function InsightsPage() {
  const { user }  = useAuthStore();
  const isAdmin   = user?.role === 'ADMIN';

  const TABS = [
    { id: 'recommendations', label: 'Recommendations', icon: Sparkles },
    { id: 'challenges',      label: 'Challenges',      icon: Target    },
    { id: 'goals',           label: 'My Goals',        icon: Lightbulb  },
    ...(isAdmin ? [
      { id: 'offsets', label: 'Offset Projects', icon: Leaf },
      { id: 'report',  label: 'Org Report',      icon: FileText },
    ] : []),
  ];

  const [tab, setTab] = useState('recommendations');

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold" style={{ color: '#1A2118' }}>AI Insights</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9BAEA5' }}>
          Personalised recommendations · Challenges · Goals
          {isAdmin ? ' · Offset projects' : ''}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl w-fit flex-wrap"
        style={{ background: '#F4F6F4', border: '1px solid #E5EAE8' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === id
              ? { background: '#ffffff', color: '#1B4332', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
              : { color: '#7A9E8E' }}>
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
          {tab === 'recommendations' && <RecommendationsTab />}
          {tab === 'challenges'      && <ChallengesTab />}
          {tab === 'goals'           && <GoalsTab />}
          {tab === 'offsets'         && isAdmin && <OffsetTab />}
          {tab === 'report'          && isAdmin && <ReportTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

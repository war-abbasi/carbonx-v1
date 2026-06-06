import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Target, BrainCircuit, Leaf,
  TrendingDown, TrendingUp, Minus,
  Loader2, AlertCircle, CheckCircle, RefreshCw,
  Trophy, Flame, Clock, ChevronRight, Calculator,
  ExternalLink, Info, Zap, FileText, Download, Lightbulb,
} from 'lucide-react';
import { insightsApi } from '../../api/insightsApi';
import { carbonApi }   from '../../api/carbonApi';
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
   TAB 3 — FORECAST  (embedded from ForecastPage)
════════════════════════════════════════════════ */
const FC_MONTHS = [3, 6, 9, 12];

function ForecastChart({ historical, forecast: fc }) {
  const all = [...historical, ...fc];
  const W=720, H=200, PAD={t:20,b:32,l:12,r:12};
  const iW=W-PAD.l-PAD.r, iH=H-PAD.t-PAD.b;
  const maxVal=Math.max(...historical.map(h=>h.actual),...fc.map(f=>f.upper),0.001);
  const toXY=(i0,val)=>({x:PAD.l+(i0/(all.length-1))*iW,y:PAD.t+iH-(val/maxVal)*iH});
  const hPts=historical.map((h,i)=>({...toXY(i,h.actual),label:h.label,v:h.actual}));
  const fPts=fc.map((f,i)=>({...toXY(historical.length+i,f.predicted),upper:toXY(historical.length+i,f.upper).y,lower:toXY(historical.length+i,f.lower).y,label:f.label,v:f.predicted}));
  const hPath=hPts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fPath=hPts.length?`M${hPts[hPts.length-1].x.toFixed(1)},${hPts[hPts.length-1].y.toFixed(1)} `+fPts.map(p=>`L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '):'';
  const band=fPts.length>=1?fPts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.upper.toFixed(1)}`).join(' ')+' '+fPts.slice().reverse().map(p=>`L${p.x.toFixed(1)},${p.lower.toFixed(1)}`).join(' ')+' Z':'';
  const divX=hPts.length?hPts[hPts.length-1].x:0;
  const step=Math.max(1,Math.ceil(all.length/9));
  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{minWidth:'340px'}}>
        {[0.25,0.5,0.75,1].map(f=><line key={f} x1={PAD.l} y1={PAD.t+iH*(1-f)} x2={W-PAD.r} y2={PAD.t+iH*(1-f)} stroke="#F0EDE4" strokeWidth="1"/>)}
        {band&&<path d={band} fill="#C4952A" opacity="0.12"/>}
        {hPath&&(<><defs><linearGradient id="fcHG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.14"/><stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.01"/></linearGradient></defs><path d={`${hPath} L${hPts[hPts.length-1].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} L${hPts[0].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} Z`} fill="url(#fcHG)"/><path d={hPath} fill="none" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></>)}
        {fPath&&<path d={fPath} fill="none" stroke="#C4952A" strokeWidth="2.5" strokeDasharray="7,4" strokeLinecap="round" strokeLinejoin="round"/>}
        {hPts.length>0&&<line x1={divX.toFixed(1)} y1={PAD.t} x2={divX.toFixed(1)} y2={(PAD.t+iH).toFixed(1)} stroke="#9BAEA5" strokeWidth="1.5" strokeDasharray="5,4"/>}
        {hPts.map((p,i)=><circle key={`h${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4" fill="#2D6A4F" stroke="#fff" strokeWidth="1.5"/>)}
        {fPts.map((p,i)=><circle key={`f${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4" fill="#C4952A" stroke="#fff" strokeWidth="1.5"/>)}
        {all.map((pt,i)=>{if(i%step!==0&&i!==all.length-1)return null;const px=i<historical.length?hPts[i].x:fPts[i-historical.length].x;const isFc=i>=historical.length;return<text key={i} x={px.toFixed(1)} y={H-6} textAnchor="middle" fontSize="9.5" fill={isFc?'#C4952A':'#9BAEA5'} fontFamily="monospace" fontWeight={isFc?'600':'400'}>{pt.label}</text>;})}
        <text x={PAD.l} y={PAD.t-6} fontSize="9" fill="#2D6A4F" fontFamily="sans-serif" fontWeight="600">Historical</text>
        {fPts.length>0&&<text x={fPts[0].x.toFixed(1)} y={PAD.t-6} fontSize="9" fill="#C4952A" fontFamily="sans-serif" fontWeight="600">Predicted →</text>}
      </svg>
    </div>
  );
}

function ForecastTab() {
  const [months,  setMonths]  = useState(6);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await carbonApi.getForecast(months);
      setData(res.data);
    } catch { toast.error('Could not generate forecast'); }
    finally { setLoading(false); }
  }, [months]);

  useEffect(() => { load(); }, [load]);

  const m = data?.model;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold" style={{ color: '#9BAEA5' }}>Forecast horizon:</span>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#F4F6F4', border: '1px solid #E5EAE8' }}>
          {FC_MONTHS.map(n => (
            <button key={n} onClick={() => setMonths(n)}
              className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all"
              style={n === months ? { background: '#2D6A4F', color: '#fff' } : { color: '#7A9E8E' }}>
              +{n} mo
            </button>
          ))}
        </div>
        <button onClick={load} disabled={loading}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"
          style={{ color: '#9BAEA5', border: '1px solid #E5EAE8' }}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Explanation */}
      <Card className="p-4 flex items-start gap-3" style={{ background: '#F8FAF8' }}>
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#2D6A4F' }} />
        <p className="text-xs leading-relaxed" style={{ color: '#5A7A6D' }}>
          <strong style={{ color: '#1A2118' }}>12-month emissions forecast</strong> based on your historical data.
          The shaded band shows the uncertainty range. More months of logging = more accurate predictions.
        </p>
      </Card>

      {loading && <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" style={{ color: '#9BAEA5' }} /></div>}

      {!loading && data && (
        <>
          {(!data.model || data.historical.length < 2) ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-14 text-center px-8">
                <BrainCircuit className="h-10 w-10 mb-3" style={{ color: '#C0DDD0' }} />
                <h3 className="text-base font-semibold mb-2" style={{ color: '#1A2118' }}>Need more data</h3>
                <p className="text-sm max-w-sm" style={{ color: '#9BAEA5' }}>
                  {data.error ?? 'Log carbon entries across at least 2 different months to generate predictions.'}
                </p>
                <p className="text-xs font-mono mt-3 px-3 py-2 rounded-lg" style={{ background: '#F4F6F4', color: '#7A9E8E' }}>
                  Jan=120 kg, Feb=140 kg → predicts Mar=160 kg ✓
                </p>
              </div>
            </Card>
          ) : (
            <>
              {/* Trend indicator */}
              <div className="flex gap-3 flex-wrap items-center">
                <span className="text-sm font-bold" style={{ color: '#1A2118' }}>Your trend:</span>
                <span className="text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  style={{ background: `${m.trendColor}18`, color: m.trendColor }}>
                  {m.trend === 'Increasing' ? '📈' : m.trend === 'Decreasing' ? '📉' : '➡️'}
                  {m.trend} {m.monthlyChange > 0 ? '+' : ''}{m.monthlyChange} kg/month
                </span>
              </div>

              {/* Chart */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color:'#1A2118' }}>Historical + Predicted Emissions</h2>
                    <p className="text-xs mt-0.5" style={{ color:'#9BAEA5' }}>kg CO₂e per month</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5"><div className="w-8 h-0.5" style={{ background:'#2D6A4F' }}/><span style={{ color:'#9BAEA5' }}>Historical</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-8" style={{ height:'2px', borderTop:'2px dashed #C4952A' }}/><span style={{ color:'#9BAEA5' }}>Forecast</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-8 h-3 rounded-sm" style={{ background:'rgba(196,149,42,0.18)' }}/><span style={{ color:'#9BAEA5' }}>90% CI</span></div>
                  </div>
                </div>
                <ForecastChart historical={data.historical} forecast={data.forecast} />
              </Card>

              {/* Month forecast cards */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#1A2118' }}>Next {data.forecast.length} Months</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {data.forecast.map((f, i) => (
                    <motion.div key={f.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06, duration:0.4 }}>
                      <Card className="p-4 text-center">
                        <p className="text-xs font-bold uppercase tracking-wider mb-2 font-mono" style={{ color:'#C4952A' }}>{f.label}</p>
                        <p className="text-2xl font-bold" style={{ color:'#1A2118' }}>
                          {f.predicted>=1000?`${(f.predicted/1000).toFixed(1)}t`:f.predicted}
                        </p>
                        <p className="text-[10px] mb-2" style={{ color:'#9BAEA5' }}>{f.predicted>=1000?'tonnes':'kg'} CO₂e</p>
                        {i>0&&<div className="text-[10px] font-semibold" style={{ color:f.predicted>data.forecast[i-1].predicted?'#DC2626':'#2D6A4F' }}>
                          {f.predicted>data.forecast[i-1].predicted?'↑ +':'↓ −'}{Math.abs(f.predicted-data.forecast[i-1].predicted).toFixed(0)} kg
                        </div>}
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
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
  const [goals,   setGoals]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    insightsApi.getSuggestedGoals()
      .then(({ data: res }) => setGoals(res.data?.goals ?? []))
      .catch(() => toast.error('Could not load goals'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" style={{ color: '#9BAEA5' }} /></div>;

  if (!goals.length) return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <Zap className="h-12 w-12 mb-4" style={{ color: '#C0DDD0' }} />
      <h3 className="text-base font-semibold mb-2" style={{ color: '#1A2118' }}>No goals yet</h3>
      <p className="text-sm max-w-xs" style={{ color: '#9BAEA5' }}>Log carbon entries for a few weeks to get AI-powered reduction goals.</p>
    </div>
  );

  const CONF = { High: '#2D6A4F', Medium: '#C4952A', Low: '#DC2626' };

  return (
    <div className="space-y-5">
      {goals.map((g, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.4 }}>
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: '#1A2118' }}>{g.period}</h3>
                <p className="text-sm mt-1" style={{ color: '#9BAEA5' }}>Realistic reduction target</p>
              </div>
              <span className="text-sm font-bold px-3 py-1 rounded-full"
                style={{ background: `${CONF[g.confidence] || '#9BAEA5'}18`, color: CONF[g.confidence] || '#9BAEA5' }}>
                {g.confidence} confidence
              </span>
            </div>

            {/* Progress visual */}
            <div className="mb-5 p-4 rounded-xl" style={{ background: '#F8FAF8', border: '1px solid #E5EAE8' }}>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#9BAEA5' }}>Current → Target</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#1A2118' }}>
                    {g.currentKg || 0} <span style={{ color: '#9BAEA5', fontSize: '16px' }}>→</span> {g.targetKg}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: '#2D6A4F' }}>−{g.reduction}%</p>
                  <p className="text-xs" style={{ color: '#9BAEA5' }}>reduction</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full" style={{ background: '#E5EAE8' }}>
                <div className="h-full rounded-full transition-all" style={{
                  background: '#2D6A4F',
                  width: `${Math.max(10, 100 * (g.targetKg / (g.currentKg || 1)))}%`,
                }} />
              </div>
            </div>

            {/* Strategy */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9BAEA5' }}>Primary strategy</p>
              <p className="text-sm leading-relaxed" style={{ color: '#5A7A6D' }}>{g.strategy}</p>
              {g.rationale && <p className="text-xs mt-3" style={{ color: '#7A9E8E' }}>💡 {g.rationale}</p>}
            </div>
          </Card>
        </motion.div>
      ))}
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
            <button onClick={downloadReport}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#EAF4EE', color: '#2D6A4F', border: '1px solid #C0DDD0' }}>
              <Download className="h-4 w-4" /> Download
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
    { id: 'forecast',        label: 'AI Forecast',     icon: BrainCircuit },
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
          Personalised recommendations · Challenges · Emission forecast
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
          {tab === 'forecast'        && <ForecastTab />}
          {tab === 'offsets'         && isAdmin && <OffsetTab />}
          {tab === 'report'          && isAdmin && <ReportTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Factory, TrendingDown, TrendingUp, Leaf,
  ArrowRight, Activity, BarChart3, MessageSquare,
  Sparkles, ShieldCheck, ChevronRight, BrainCircuit,
  Trophy, Lightbulb, TreePine, Car, Zap, Crown, Loader2, Globe,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { carbonApi }    from '../../api/carbonApi';
import { formatDate, getInitials } from '../../utils/helpers';

const fade = (i = 0) => ({
  initial:  { opacity: 0, y: 16 },
  animate:  { opacity: 1, y: 0  },
  transition: { duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] },
});

/* ── Decorative leaf SVG ── */
function LeafShape({ size = 26, color = 'rgba(255,255,255,0.5)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C7 4 4 8 4 13c0 4 3 8 8 9 0-6 2-11 8-15-3 .5-7 1.5-9 4 .5-3 .5-6 1-9Z" fill={color} />
      <path d="M12 22c0-6 2-11 8-15" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

/* ── Floating leaves + earth layer for the welcome banner ── */
const BANNER_LEAVES = [
  { top: '18%', left: '40%', size: 22, anim: 'animate-leaf-drift-1', delay: '0s',   op: 0.22 },
  { top: '58%', left: '52%', size: 16, anim: 'animate-leaf-drift-2', delay: '1.5s', op: 0.18 },
  { top: '30%', left: '66%', size: 28, anim: 'animate-leaf-drift-3', delay: '0.8s', op: 0.20 },
  { top: '70%', left: '74%', size: 18, anim: 'animate-leaf-drift-2', delay: '3s',   op: 0.16 },
  { top: '12%', left: '84%', size: 20, anim: 'animate-leaf-drift-1', delay: '2.2s', op: 0.20 },
  { top: '48%', left: '92%', size: 24, anim: 'animate-leaf-drift-3', delay: '1s',   op: 0.18 },
];

function BannerNature() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* slowly spinning earth */}
      <Globe
        className="absolute animate-spin"
        style={{ top: '-40px', right: '-30px', width: 190, height: 190, color: 'rgba(255,255,255,0.06)', animationDuration: '40s' }}
      />
      <Globe
        className="absolute animate-leaf-sway"
        style={{ bottom: '8px', right: '36%', width: 30, height: 30, color: 'rgba(255,255,255,0.14)' }}
      />
      {BANNER_LEAVES.map((l, i) => (
        <div key={i} className={`absolute ${l.anim}`}
          style={{ top: l.top, left: l.left, animationDelay: l.delay, opacity: l.op }}>
          <LeafShape size={l.size} />
        </div>
      ))}
    </div>
  );
}

/* ── Shared white card ── */
function Card({ className = '', style = {}, children }) {
  return (
    <div className={`rounded-xl ${className}`}
      style={{ background: '#ffffff', border: '1px solid #E5EAE8', ...style }}>
      {children}
    </div>
  );
}

/* ── Green tips (rotate every 12s) ── */
const GREEN_TIPS = [
  { icon: '💡', text: 'Switching to LED bulbs cuts lighting energy use by up to 80%.' },
  { icon: '🚲', text: 'Cycling just 10 km a week instead of driving saves ~100 kg CO₂e a year.' },
  { icon: '🌡️', text: 'Lowering your thermostat by 1°C can reduce heating emissions by ~8%.' },
  { icon: '🥗', text: 'One plant-based day a week can save ~200 kg CO₂e annually.' },
  { icon: '🔌', text: 'Unplug idle chargers — phantom load is ~5% of home electricity.' },
  { icon: '✈️', text: 'A single long-haul flight can outweigh a year of careful choices. Travel mindfully.' },
  { icon: '♻️', text: 'Recycling 1 kg of aluminium saves ~9 kg CO₂e vs new production.' },
  { icon: '🚿', text: 'A 4-minute shower instead of 8 saves water and the energy to heat it.' },
  { icon: '🌳', text: 'A mature tree absorbs roughly 21 kg of CO₂ every year.' },
  { icon: '🧺', text: 'Washing clothes in cold water cuts up to 90% of that load’s energy.' },
];

function GreenTipCard({ index = 0 }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % GREEN_TIPS.length), 12000);
    return () => clearInterval(t);
  }, []);
  const tip = GREEN_TIPS[i];
  return (
    <motion.div {...fade(index)}>
      <div className="rounded-xl p-5 h-full relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#EAF4EE 0%,#F4FAF6 100%)', border: '1px solid #C0DDD0' }}>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4" style={{ color: '#2D6A4F' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2D6A4F' }}>Green Tip</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={i}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}>
            <p className="text-3xl mb-2">{tip.icon}</p>
            <p className="text-sm leading-relaxed" style={{ color: '#3D5247' }}>{tip.text}</p>
          </motion.div>
        </AnimatePresence>
        {/* progress dots */}
        <div className="flex gap-1 mt-4">
          {GREEN_TIPS.map((_, j) => (
            <span key={j} className="h-1 rounded-full transition-all duration-300"
              style={{ width: j === i ? 14 : 5, background: j === i ? '#2D6A4F' : '#C0DDD0' }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Stat card ── */
function StatCard({ icon: Icon, label, value, unit, desc, accent, index, trend }) {
  return (
    <motion.div {...fade(index)}>
      <Card className="p-5 h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${accent}14`, border: `1px solid ${accent}28` }}>
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>
          {trend != null && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"
              style={{ background: trend <= 0 ? '#EAF4EE' : '#FEF2F2', color: trend <= 0 ? '#2D6A4F' : '#DC2626' }}>
              {trend <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="text-2xl font-bold mb-0.5" style={{ color: '#1A2118' }}>
          {value}
          <span className="text-sm font-normal ml-1" style={{ color: '#9BAEA5' }}>{unit}</span>
        </p>
        <p className="text-sm font-medium" style={{ color: '#3D5247' }}>{label}</p>
        <p className="text-xs mt-1" style={{ color: '#9BAEA5' }}>{desc}</p>
      </Card>
    </motion.div>
  );
}

/* ── Mini sparkline ── */
function Sparkline({ data, color = '#2D6A4F' }) {
  if (!data || data.length < 2) return <div className="h-16" />;
  const W = 280, H = 64, P = 4;
  const max = Math.max(...data, 0.001);
  const pts = data.map((v, i) => {
    const x = P + (i / (data.length - 1)) * (W - 2 * P);
    const y = P + (H - 2 * P) - (v / max) * (H - 2 * P);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `M${pts[0]} L${pts.join(' L')} L${(W - P).toFixed(1)},${(H - P).toFixed(1)} L${P},${(H - P).toFixed(1)} Z`;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs><linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.22" />
        <stop offset="100%" stopColor={color} stopOpacity="0.01" />
      </linearGradient></defs>
      <path d={area} fill="url(#spark)" />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const fmt = (n) => {
  if (n == null) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}t`;
  return Math.round(n).toLocaleString();
};

const modules = [
  { icon: Activity,      label: 'Activities',  href: '/dashboard/activities', desc: 'Log and review your carbon entries.',         accent: '#2D6A4F', bg: '#EAF4EE' },
  { icon: BarChart3,     label: 'Analytics',   href: '/dashboard/analytics',  desc: 'Emission trends, sources, and scopes.',       accent: '#C4952A', bg: '#FDF5E6' },
  { icon: BrainCircuit,  label: 'CarboncastX', href: '/dashboard/carboncastx',desc: 'AI forecast of your future emissions.',       accent: '#3B6CA8', bg: '#EAF1F8' },
  { icon: MessageSquare, label: 'AI Chat',     href: '/dashboard/chat',       desc: 'Ask the assistant about your footprint.',     accent: '#2D6A4F', bg: '#EAF4EE' },
  { icon: Sparkles,      label: 'AI Insights', href: '/dashboard/insights',   desc: 'Personalised reduction recommendations.',     accent: '#8B5E3C', bg: '#F9F2EC' },
];

export default function DashboardHome() {
  const { user }  = useAuthStore();
  const navigate  = useNavigate();
  const greeting  = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const [loading, setLoading]   = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [leaders, setLeaders]   = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [a, l] = await Promise.allSettled([
      carbonApi.getAnalytics('6months'),
      carbonApi.getLeaderboard('all'),
    ]);
    if (a.status === 'fulfilled') setAnalytics(a.value.data.data);
    if (l.status === 'fulfilled') setLeaders(l.value.data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const kpis      = analytics?.kpis;
  const total     = kpis?.total ?? 0;
  const growth    = kpis?.growth?.total ?? 0;
  const entryCount = kpis?.entryCount ?? 0;
  const series    = (analytics?.timeSeries ?? []).map((t) => t.total);
  const topCat    = analytics?.byCategory?.[0];
  const scopes    = analytics?.scopeBreakdown ?? [];
  const hasData   = entryCount > 0;

  // "You saved" — only when emissions dropped vs previous period
  const prevTotal = growth !== 0 ? total / (1 + growth / 100) : total;
  const saved     = prevTotal - total; // positive when emissions decreased

  // Impact equivalences from total footprint
  const trees  = Math.max(1, Math.round(total / 21));
  const carKm  = Math.round(total / 0.192);
  const charges = Math.round(total / 0.008);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Welcome banner ── */}
      <motion.div {...fade(0)}>
        <div className="rounded-xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)', padding: '28px 32px' }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />
          <BannerNature />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {greeting}, <span className="text-white font-semibold">{user?.name?.split(' ')[0] ?? 'there'}</span>
              </p>
              <h1 className="text-2xl font-bold text-white">Welcome to your Dashboard</h1>
              <p className="text-sm mt-1.5 max-w-md" style={{ color: 'rgba(255,255,255,0.60)' }}>
                {hasData
                  ? (saved > 0
                      ? `Nice work — you cut ${fmt(saved)} kg CO₂e versus the previous period. Keep it going!`
                      : 'Track, forecast, and reduce your carbon footprint — all in one place.')
                  : 'Log your first activities to unlock live insights, forecasts and your green ranking.'}
              </p>
            </div>
            <div className="flex-shrink-0 flex flex-col items-start sm:items-end gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Platform Active
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Member since {formatDate(user?.createdAt ?? new Date())}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stat cards (real data) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard index={1} icon={Factory} accent="#2D6A4F" label="Total Emissions"
          value={loading ? '…' : fmt(total)} unit="kg CO₂e" desc="Last 6 months" trend={hasData ? growth : null} />
        <StatCard index={2} icon={Activity} accent="#C4952A" label="Entries Logged"
          value={loading ? '…' : entryCount.toLocaleString()} unit="" desc="All activities recorded" />
        <StatCard index={3} icon={saved > 0 ? TrendingDown : Leaf} accent="#52B788"
          label={saved > 0 ? 'You Saved' : 'Top Category'}
          value={loading ? '…' : (saved > 0 ? fmt(saved) : (topCat?.category ?? '—'))}
          unit={saved > 0 ? 'kg CO₂e' : ''}
          desc={saved > 0 ? 'vs previous period' : (topCat ? `${topCat.percentage}% of footprint` : 'No data yet')} />
        <StatCard index={4} icon={TreePine} accent="#8B5E3C" label="Trees to Offset"
          value={loading ? '…' : (hasData ? trees.toLocaleString() : '—')} unit="trees/yr"
          desc="To absorb this footprint" />
      </div>

      {/* ── Tip + Analytics + Leaderboard ── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Green tip */}
        <GreenTipCard index={5} />

        {/* Mini analytics */}
        <motion.div {...fade(6)}>
          <Card className="p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold" style={{ color: '#1A2118' }}>Overview</h2>
              <button className="text-xs font-medium flex items-center gap-1" style={{ color: '#2D6A4F' }}
                onClick={() => navigate('/dashboard/analytics')}>
                Details <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs mb-2" style={{ color: '#9BAEA5' }}>Emissions trend · last 6 months</p>

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#9BAEA5' }} />
              </div>
            ) : hasData ? (
              <>
                <Sparkline data={series} />
                <div className="space-y-2 mt-3">
                  {scopes.slice(0, 4).map((s) => (
                    <div key={s.scope}>
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span style={{ color: '#5A7A6D' }}>{s.scope}</span>
                        <span className="font-semibold" style={{ color: '#1A2118' }}>{s.percentage}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: '#F0EDE4' }}>
                        <div className="h-full rounded-full" style={{ width: `${s.percentage}%`, background: s.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <BarChart3 className="h-8 w-8 mb-2" style={{ color: '#C0DDD0' }} />
                <p className="text-xs" style={{ color: '#9BAEA5' }}>No analytics yet — log activities to see trends.</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Leaderboard snippet */}
        <motion.div {...fade(7)}>
          <Card className="p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" style={{ color: '#C4952A' }} />
                <h2 className="text-sm font-semibold" style={{ color: '#1A2118' }}>Green Leaders</h2>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: '#EAF4EE', color: '#2D6A4F' }}>lowest wins</span>
            </div>
            <p className="text-xs mb-3" style={{ color: '#9BAEA5' }}>Smallest footprints across the org</p>

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#9BAEA5' }} />
              </div>
            ) : leaders.length ? (
              <div className="space-y-2 flex-1">
                {leaders.slice(0, 5).map((row) => {
                  const isMe = row.user?.id === user?.id;
                  const medal = row.rank === 1 ? '#C4952A' : row.rank === 2 ? '#9BAEA5' : row.rank === 3 ? '#B07A4A' : null;
                  return (
                    <div key={row.user?.id ?? row.rank}
                      className="flex items-center gap-3 px-2.5 py-2 rounded-lg"
                      style={{ background: isMe ? '#EAF4EE' : 'transparent', border: isMe ? '1px solid #C0DDD0' : '1px solid transparent' }}>
                      <div className="w-6 flex justify-center flex-shrink-0">
                        {medal
                          ? <Crown className="h-4 w-4" style={{ color: medal }} />
                          : <span className="text-xs font-bold" style={{ color: '#9BAEA5' }}>{row.rank}</span>}
                      </div>
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: isMe ? '#2D6A4F' : '#7A9E8E' }}>
                        {getInitials(row.user?.name)}
                      </div>
                      <span className="flex-1 text-sm truncate" style={{ color: '#3D5247', fontWeight: isMe ? 600 : 400 }}>
                        {row.user?.name ?? 'Unknown'}{isMe ? ' (you)' : ''}
                      </span>
                      <span className="text-xs font-semibold flex-shrink-0" style={{ color: '#1A2118' }}>
                        {fmt(row.totalKg)}<span className="text-[10px] font-normal" style={{ color: '#9BAEA5' }}> kg</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <Trophy className="h-8 w-8 mb-2" style={{ color: '#C0DDD0' }} />
                <p className="text-xs" style={{ color: '#9BAEA5' }}>No rankings yet.</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ── Impact equivalence strip ── */}
      {hasData && (
        <motion.div {...fade(8)}>
          <Card className="p-5">
            <h2 className="text-sm font-semibold mb-1" style={{ color: '#1A2118' }}>What your footprint equals</h2>
            <p className="text-xs mb-4" style={{ color: '#9BAEA5' }}>
              Your {fmt(total)} kg CO₂e over the last 6 months is roughly equivalent to:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: TreePine, accent: '#2D6A4F', bg: '#EAF4EE', value: trees.toLocaleString(),   unit: 'trees', desc: 'needed for a year to absorb it' },
                { icon: Car,      accent: '#C4952A', bg: '#FDF5E6', value: carKm.toLocaleString(),   unit: 'km',    desc: 'driven in an average petrol car' },
                { icon: Zap,      accent: '#3B6CA8', bg: '#EAF1F8', value: charges.toLocaleString(), unit: 'charges', desc: 'of a smartphone' },
              ].map((e) => {
                const Icon = e.icon;
                return (
                  <div key={e.unit} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: e.bg }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: '#ffffff' }}>
                      <Icon className="h-5 w-5" style={{ color: e.accent }} />
                    </div>
                    <div>
                      <p className="text-lg font-bold leading-none" style={{ color: '#1A2118' }}>
                        {e.value} <span className="text-xs font-medium" style={{ color: '#7A9E8E' }}>{e.unit}</span>
                      </p>
                      <p className="text-[11px] mt-1" style={{ color: '#9BAEA5' }}>{e.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Platform modules grid ── */}
      <motion.div {...fade(9)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: '#1A2118' }}>Platform Modules</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.label} onClick={() => navigate(m.href)}
                className="rounded-xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                style={{ background: '#ffffff', border: '1px solid #E5EAE8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: m.bg }}>
                  <Icon style={{ color: m.accent, width: '18px', height: '18px' }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#1A2118' }}>{m.label}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#9BAEA5' }}>{m.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: m.accent }}>
                  Open <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

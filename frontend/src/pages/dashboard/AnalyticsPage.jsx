import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown, TrendingUp, BarChart3, Loader2,
  AlertCircle, Calculator, RefreshCw, Minus,
} from 'lucide-react';
import { carbonApi }    from '../../api/carbonApi';
import { useAuthStore } from '../../store/authStore';
import { useNavigate }  from 'react-router-dom';
import { getInitials }  from '../../utils/helpers';

/* ── Shared card ── */
function Card({ className = '', style = {}, children }) {
  return (
    <div className={`rounded-xl ${className}`}
      style={{ background: '#ffffff', border: '1px solid #E5EAE8', ...style }}>
      {children}
    </div>
  );
}

/* ── Growth indicator badge ── */
function Growth({ pct }) {
  if (pct === 0) return (
    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#9BAEA5' }}>
      <Minus className="h-3 w-3" /> No change
    </span>
  );
  const down = pct < 0;
  return (
    <span className="flex items-center gap-1 text-xs font-semibold"
      style={{ color: down ? '#2D6A4F' : '#DC2626' }}>
      {down
        ? <TrendingDown className="h-3.5 w-3.5" />
        : <TrendingUp   className="h-3.5 w-3.5" />}
      {down ? '' : '+'}{pct}% vs prior
    </span>
  );
}

/* ── SVG area / line chart ── */
function AreaChart({ data, color = '#2D6A4F', height = 140 }) {
  if (!data || data.length < 2) return (
    <div className="flex items-center justify-center text-xs" style={{ height, color: '#9BAEA5' }}>
      Not enough data points yet
    </div>
  );

  const W    = 600;
  const H    = height;
  const PAD  = { t: 12, b: 24, l: 8, r: 8 };
  const max  = Math.max(...data.map((d) => d.value), 0.001);
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const pts = data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * innerW,
    y: PAD.t + innerH - (d.value / max) * innerH,
    v: d.value,
    l: d.label,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length-1].x.toFixed(1)},${(PAD.t+innerH).toFixed(1)} L${pts[0].x.toFixed(1)},${(PAD.t+innerH).toFixed(1)} Z`;
  const gradId   = `ag-${color.replace('#','')}`;

  // Show label every N points to avoid crowding
  const step = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="w-full">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.20" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f}
            x1={PAD.l} y1={PAD.t + innerH * (1-f)}
            x2={W - PAD.r} y2={PAD.t + innerH * (1-f)}
            stroke="#E5EAE8" strokeWidth="1" strokeDasharray="4,4" />
        ))}
        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradId})`} />
        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        {/* Data points */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5"
            fill={p.v > 0 ? color : 'none'}
            stroke={p.v > 0 ? '#ffffff' : 'none'} strokeWidth="1.5" />
        ))}
        {/* X-axis labels */}
        {pts.filter((_, i) => i % step === 0 || i === pts.length - 1).map((p, i) => (
          <text key={i} x={p.x.toFixed(1)} y={H - 4}
            textAnchor="middle" fontSize="9" fill="#9BAEA5"
            fontFamily="'JetBrains Mono', monospace">
            {p.l}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ── Bar chart column ── */
function BarCol({ heightPct, color, label, value, delay = 0 }) {
  const disp = value >= 1000 ? `${(value/1000).toFixed(1)}t` : value > 0 ? `${value.toFixed(1)}` : '';
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <span className="text-[9px] font-semibold truncate w-full text-center" style={{ color: '#3D5247', minHeight: '12px' }}>
        {disp}
      </span>
      <div className="w-full flex items-end rounded-md overflow-hidden"
        style={{ height: '100px', background: '#F4F6F4' }}>
        <motion.div className="w-full rounded-t-sm"
          initial={{ height: 0 }}
          animate={{ height: heightPct > 0 ? `${Math.max(heightPct, 2)}%` : '2%' }}
          transition={{ delay, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: color, opacity: heightPct > 0 ? 0.85 : 0.15 }} />
      </div>
      <span className="text-[9px] truncate w-full text-center" style={{ color: '#9BAEA5' }}>{label}</span>
    </div>
  );
}

/* ── Scope progress bar ── */
function ScopeBar({ label, pct, color, kg }) {
  return (
    <div>
      <div className="flex justify-between items-center text-xs mb-1">
        <span style={{ color: '#5A7A6D' }}>{label}</span>
        <div className="flex items-center gap-2">
          <span style={{ color: '#9BAEA5' }}>{kg >= 1000 ? `${(kg/1000).toFixed(2)}t` : `${kg}kg`}</span>
          <span className="font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full" style={{ background: '#F0EDE4' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}

/* ── Sustainability score card ── */
function ScoreCard({ score }) {
  if (!score) return null;
  const circumference = 2 * Math.PI * 40;
  const dash          = circumference * (1 - score.score / 100);

  return (
    <Card className="p-6">
      <h2 className="text-sm font-semibold mb-1" style={{ color: '#1A2118' }}>Sustainability Score</h2>
      <p className="text-xs mb-5" style={{ color: '#9BAEA5' }}>Based on emissions level, trend & consistency</p>
      <div className="flex items-center gap-6">
        {/* Circular progress */}
        <div className="relative flex-shrink-0" style={{ width: 96, height: 96 }}>
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#F0EDE4" strokeWidth="8" />
            <motion.circle
              cx="48" cy="48" r="40" fill="none"
              stroke={score.color} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dash }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: '48px 48px', transform: 'rotate(-90deg)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: score.color }}>{score.score}</span>
            <span className="text-xs font-bold" style={{ color: score.color }}>{score.grade}</span>
          </div>
        </div>
        <div>
          <p className="text-base font-bold mb-1" style={{ color: score.color }}>{score.label}</p>
          <p className="text-xs leading-relaxed" style={{ color: '#7A9E8E' }}>
            {score.score >= 85
              ? 'Outstanding! Your emissions are well below average.'
              : score.score >= 70
              ? 'Good progress. Keep logging and reducing.'
              : score.score >= 55
              ? 'Room for improvement. Try logging more consistently.'
              : score.score >= 40
              ? 'High emissions detected. Review your top sources.'
              : 'Critical level. Immediate reduction recommended.'}
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {['A','B','C','D','F'].map((g) => (
              <span key={g} className="text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: score.grade === g ? score.color : '#F0EDE4',
                         color:      score.grade === g ? '#ffffff' : '#9BAEA5' }}>
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ── Employee comparison (admin) ── */
function EmployeeComparison({ data }) {
  if (!data || !data.length) return null;
  return (
    <Card className="p-6">
      <h2 className="text-sm font-semibold mb-1" style={{ color: '#1A2118' }}>Employee Comparison</h2>
      <p className="text-xs mb-5" style={{ color: '#9BAEA5' }}>CO₂e emitted per employee in selected period</p>
      <div className="space-y-3">
        {data.map((emp, i) => (
          <div key={emp.user.id} className="flex items-center gap-3">
            {/* Rank */}
            <span className="text-xs font-bold w-5 text-right flex-shrink-0"
              style={{ color: i === 0 ? '#C4952A' : '#9BAEA5' }}>
              #{i+1}
            </span>
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white"
              style={{ background: i === 0 ? '#C4952A' : '#8B9E95' }}>
              {getInitials(emp.user.name)}
            </div>
            {/* Name + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold truncate" style={{ color: '#1A2118' }}>{emp.user.name}</span>
                <span className="text-xs font-bold ml-2 flex-shrink-0"
                  style={{ color: i === 0 ? '#C4952A' : '#2D6A4F' }}>
                  {emp.totalKg >= 1000 ? `${(emp.totalKg/1000).toFixed(2)}t` : `${emp.totalKg}kg`}
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: '#F0EDE4' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${emp.barPct}%` }}
                  transition={{ delay: i * 0.06 + 0.3, duration: 0.6 }}
                  className="h-full rounded-full"
                  style={{ background: i === 0 ? '#C4952A' : i < 3 ? '#2D6A4F' : '#52B788' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Empty state ── */
function EmptyState({ navigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: '#EAF4EE' }}>
        <BarChart3 className="h-7 w-7" style={{ color: '#2D6A4F' }} />
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: '#1A2118' }}>No data yet</h3>
      <p className="text-sm max-w-xs mb-5" style={{ color: '#9BAEA5' }}>
        Log carbon entries in the Activities tab to see your analytics here.
      </p>
      <button onClick={() => navigate('/dashboard/activities')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
        style={{ background: '#2D6A4F' }}>
        <Calculator className="h-4 w-4" /> Open Calculator
      </button>
    </div>
  );
}

/* ── Period options ── */
const RANGES = [
  { label: 'Last 7 Days',    period: '7days'   },
  { label: 'Last 30 Days',   period: '30days'  },
  { label: 'Last 6 Months',  period: '6months' },
  { label: 'Last 12 Months', period: 'year'    },
];

const SCOPE_COLORS  = ['#2D6A4F', '#C4952A', '#8B5E3C', '#52B788'];
const CAT_COLORS    = { commute: '#2D6A4F', energy: '#C4952A', travel: '#8B5E3C', food: '#52B788', other: '#9BAEA5' };
const BAR_COLOR     = (i) => i % 3 === 0 ? '#2D6A4F' : i % 3 === 1 ? '#C4952A' : '#8B5E3C';

export default function AnalyticsPage() {
  const { user }   = useAuthStore();
  const navigate   = useNavigate();
  const isAdmin    = user?.role === 'ADMIN';

  const [rangeIdx, setRangeIdx] = useState(2); // default: 6 months
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const period = RANGES[rangeIdx].period;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await carbonApi.getAnalytics(period);
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const maxBar   = data ? Math.max(...data.timeSeries.map((m) => m.total), 0.001) : 0.001;
  const isDaily  = data?.grain === 'day';

  // For line chart: map timeSeries to {label, value}
  const lineData = data?.timeSeries.map((d) => ({ label: d.label, value: d.total })) ?? [];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1A2118' }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9BAEA5' }}>
            {isAdmin ? 'Organisation-wide emission intelligence' : 'Personal emission trends & insights'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={loading}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-40"
            style={{ color: '#7A9E8E', border: '1px solid #E5EAE8' }} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {/* Period selector */}
          <div className="flex gap-1 p-1 rounded-lg flex-wrap"
            style={{ background: '#F4F6F4', border: '1px solid #E5EAE8' }}>
            {RANGES.map((r, i) => (
              <button key={r.period} onClick={() => setRangeIdx(i)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap"
                style={i === rangeIdx
                  ? { background: '#2D6A4F', color: '#fff' }
                  : { color: '#7A9E8E' }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <Card className="p-4 flex items-center gap-3" style={{ border: '1px solid #FECACA' }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#DC2626' }} />
          <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#9BAEA5' }} />
        </div>
      )}

      {!loading && !error && data && (
        <AnimatePresence mode="wait">
          <motion.div key={period}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="space-y-5">

            {/* ── KPI cards with growth ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Emissions',     val: data.kpis.total,  growth: data.kpis.growth.total,  accent: '#2D6A4F' },
                { label: 'Scope 1 — Direct',    val: data.kpis.scope1, growth: data.kpis.growth.scope1, accent: '#2D6A4F' },
                { label: 'Scope 2 — Indirect',  val: data.kpis.scope2, growth: data.kpis.growth.scope2, accent: '#C4952A' },
                { label: 'Scope 3 — Value Chain', val: data.kpis.scope3, growth: data.kpis.growth.scope3, accent: '#8B5E3C' },
              ].map((k, i) => (
                <motion.div key={k.label}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}>
                  <Card className="p-4">
                    <p className="text-xs font-medium mb-2 leading-snug" style={{ color: '#9BAEA5' }}>{k.label}</p>
                    <p className="text-xl font-bold mb-1" style={{ color: '#1A2118' }}>
                      {k.val >= 1000
                        ? <>{(k.val/1000).toFixed(2)} <span className="text-sm font-normal" style={{ color: '#9BAEA5' }}>t</span></>
                        : <>{k.val.toFixed(2)} <span className="text-sm font-normal" style={{ color: '#9BAEA5' }}>kg</span></>
                      }
                    </p>
                    <Growth pct={k.growth} />
                  </Card>
                </motion.div>
              ))}
            </div>

            {data.kpis.entryCount === 0 ? (
              <Card><EmptyState navigate={navigate} /></Card>
            ) : (
              <>
                {/* ── Main chart ── */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-sm font-semibold" style={{ color: '#1A2118' }}>
                        {isDaily ? 'Daily' : 'Monthly'} Emissions Trend
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: '#9BAEA5' }}>
                        {isDaily ? 'kg CO₂e per day' : 'kg CO₂e per month'} · {RANGES[rangeIdx].label}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {[['#2D6A4F','Total']].map(([c,l]) => (
                        <div key={l} className="hidden sm:flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                          <span style={{ color: '#9BAEA5' }}>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isDaily ? (
                    /* Line/area chart for daily data */
                    <AreaChart data={lineData} color="#2D6A4F" height={150} />
                  ) : (
                    /* Bar chart for monthly data */
                    <div className="flex items-end gap-1.5 overflow-x-auto pb-1">
                      {data.timeSeries.map((m, i) => (
                        <BarCol key={m.label}
                          heightPct={(m.total / maxBar) * 100}
                          color={BAR_COLOR(i)}
                          label={m.label}
                          value={m.total}
                          delay={i * 0.03} />
                      ))}
                    </div>
                  )}
                </Card>

                {/* ── Scope + Top sources ── */}
                <div className="grid lg:grid-cols-3 gap-5">
                  {/* Scope breakdown */}
                  <Card className="p-6 lg:col-span-2">
                    <h2 className="text-sm font-semibold mb-5" style={{ color: '#1A2118' }}>Scope Breakdown</h2>
                    <div className="space-y-4">
                      {data.scopeBreakdown.length > 0
                        ? data.scopeBreakdown.map((s, i) => (
                            <ScopeBar key={s.scope} label={s.scope} pct={s.percentage}
                              kg={s.kg} color={SCOPE_COLORS[i % SCOPE_COLORS.length]} />
                          ))
                        : <p className="text-sm text-center py-6" style={{ color: '#9BAEA5' }}>No scope data</p>
                      }
                    </div>
                  </Card>

                  {/* Top sources */}
                  <Card className="p-6">
                    <h2 className="text-sm font-semibold mb-4" style={{ color: '#1A2118' }}>Top Sources</h2>
                    {data.topSources.length > 0 ? (
                      <div className="space-y-0">
                        {data.topSources.map((s) => (
                          <div key={s.source} className="flex justify-between items-center py-2 text-xs capitalize"
                            style={{ borderBottom: '1px solid #F0EDE4' }}>
                            <span style={{ color: '#5A7A6D' }}>{s.source}</span>
                            <div className="flex items-center gap-2">
                              <span style={{ color: '#9BAEA5' }}>
                                {s.totalKg >= 1000 ? `${(s.totalKg/1000).toFixed(2)}t` : `${s.totalKg}kg`}
                              </span>
                              <span className="font-bold" style={{ color: '#1A2118' }}>{s.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm" style={{ color: '#9BAEA5' }}>No data</p>}
                  </Card>
                </div>

                {/* ── Category cards ── */}
                {data.byCategory.length > 0 && (
                  <Card className="p-6">
                    <h2 className="text-sm font-semibold mb-5" style={{ color: '#1A2118' }}>By Category</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {data.byCategory.map((cat) => {
                        const c = CAT_COLORS[cat.category] ?? '#9BAEA5';
                        return (
                          <div key={cat.category} className="rounded-xl p-4"
                            style={{ background: '#F8FAF8', border: '1px solid #E5EAE8' }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold capitalize" style={{ color: '#1A2118' }}>
                                {cat.category}
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: `${c}18`, color: c }}>
                                {cat.percentage}%
                              </span>
                            </div>
                            <p className="text-xl font-bold" style={{ color: '#1A2118' }}>
                              {cat.totalKg >= 1000
                                ? `${(cat.totalKg/1000).toFixed(2)}t`
                                : `${cat.totalKg}kg`}
                            </p>
                            <p className="text-xs mt-0.5 mb-3" style={{ color: '#9BAEA5' }}>CO₂e</p>
                            <div className="h-1.5 rounded-full" style={{ background: '#E5EAE8' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${cat.percentage}%` }}
                                transition={{ delay: 0.3, duration: 0.7 }}
                                className="h-full rounded-full" style={{ background: c }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* ── Sustainability score + Employee comparison ── */}
                <div className={`grid gap-5 ${isAdmin && data.employeeComparison.length > 0 ? 'lg:grid-cols-2' : ''}`}>
                  <ScoreCard score={data.sustainabilityScore} />
                  {isAdmin && <EmployeeComparison data={data.employeeComparison} />}
                </div>

                {/* ── Admin banner ── */}
                {isAdmin && (
                  <Card className="p-4 flex items-center gap-3"
                    style={{ background: '#EAF4EE', border: '1px solid #C0DDD0' }}>
                    <TrendingDown className="h-4 w-4 flex-shrink-0" style={{ color: '#2D6A4F' }} />
                    <p className="text-sm" style={{ color: '#1B4332' }}>
                      <strong>Organisation view</strong> — aggregating all employees' entries.
                      Individual breakdowns and rankings are in the Leaderboard tab.
                    </p>
                  </Card>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

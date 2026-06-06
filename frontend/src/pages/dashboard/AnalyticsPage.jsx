import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown, TrendingUp, BarChart3,
  Loader2, AlertCircle, Calculator, RefreshCw,
} from 'lucide-react';
import { carbonApi }    from '../../api/carbonApi';
import { useAuthStore } from '../../store/authStore';
import { useNavigate }  from 'react-router-dom';

/* ── Shared card ── */
function Card({ className = '', style = {}, children }) {
  return (
    <div className={`rounded-xl ${className}`}
      style={{ background: '#ffffff', border: '1px solid #E5EAE8', ...style }}>
      {children}
    </div>
  );
}

/* ── Animated bar chart column ── */
function BarCol({ heightPct, color, label, value, delay = 0 }) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
      {value > 0 && (
        <span className="text-[9px] font-semibold truncate w-full text-center" style={{ color: '#3D5247' }}>
          {value < 1 ? value.toFixed(2) : value.toFixed(1)}
        </span>
      )}
      {!value && <span className="text-[9px] opacity-0">0</span>}
      <div className="w-full flex items-end rounded-md overflow-hidden"
        style={{ height: '110px', background: '#F4F6F4' }}>
        <motion.div
          className="w-full rounded-t-md"
          initial={{ height: 0 }}
          animate={{ height: heightPct > 0 ? `${Math.max(heightPct, 3)}%` : '0%' }}
          transition={{ delay, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: color, opacity: 0.85 }}
        />
      </div>
      <span className="text-[9px] truncate w-full text-center" style={{ color: '#9BAEA5' }}>{label}</span>
    </div>
  );
}

/* ── Animated progress bar ── */
function ScopeBar({ label, pct, color, kg }) {
  return (
    <div>
      <div className="flex justify-between items-center text-xs mb-1">
        <span style={{ color: '#5A7A6D' }}>{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: '#9BAEA5' }}>{kg} kg</span>
          <span className="font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full" style={{ background: '#F0EDE4' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ navigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: '#EAF4EE' }}>
        <BarChart3 className="h-7 w-7" style={{ color: '#2D6A4F' }} />
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: '#1A2118' }}>No data yet</h3>
      <p className="text-sm max-w-xs mb-5" style={{ color: '#9BAEA5' }}>
        Log your first carbon entries using the calculator, then come back here to see your analytics.
      </p>
      <button
        onClick={() => navigate('/dashboard/activities')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{ background: '#2D6A4F' }}>
        <Calculator className="h-4 w-4" /> Open Calculator
      </button>
    </div>
  );
}

/* ── Period config ── */
const RANGES = [
  { label: 'This Year',      period: 'year'     },
  { label: 'Last 6 Months',  period: '6months'  },
  { label: 'Last 3 Months',  period: '3months'  },
];

const SCOPE_COLORS = ['#2D6A4F', '#C4952A', '#8B5E3C', '#52B788'];
const CAT_COLORS   = { commute: '#2D6A4F', energy: '#C4952A', travel: '#8B5E3C', food: '#52B788', other: '#9BAEA5' };

export default function AnalyticsPage() {
  const { user }    = useAuthStore();
  const navigate    = useNavigate();
  const isAdmin     = user?.role === 'ADMIN';

  const [rangeIdx,  setRangeIdx]  = useState(0);
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

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

  /* Bar chart normalisation */
  const maxMonthly = data ? Math.max(...data.monthly.map((m) => m.total), 0.001) : 0.001;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1A2118' }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9BAEA5' }}>
            {isAdmin ? 'Organisation-wide emissions data' : 'Your personal emission trends'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-40"
            title="Refresh"
            style={{ color: '#7A9E8E', border: '1px solid #E5EAE8' }}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#F4F6F4', border: '1px solid #E5EAE8' }}>
            {RANGES.map((r, i) => (
              <button key={r.period} onClick={() => setRangeIdx(i)}
                className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all"
                style={i === rangeIdx ? { background: '#2D6A4F', color: '#fff' } : { color: '#7A9E8E' }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="p-4 flex items-center gap-3" style={{ border: '1px solid #FECACA' }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#DC2626' }} />
          <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
        </Card>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#9BAEA5' }} />
        </div>
      )}

      {/* Content */}
      {!loading && !error && data && (
        <AnimatePresence mode="wait">
          <motion.div key={period}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="space-y-6">

            {/* ── KPI row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: 'Total Emissions', value: data.kpis.total,      unit: 'kg',  accent: '#2D6A4F' },
                { label: 'Scope 1 — Direct', value: data.kpis.scope1,   unit: 'kg',  accent: '#2D6A4F' },
                { label: 'Scope 2 — Indirect', value: data.kpis.scope2, unit: 'kg',  accent: '#C4952A' },
                { label: 'Scope 3 — Value Chain', value: data.kpis.scope3, unit: 'kg', accent: '#8B5E3C' },
                { label: 'Log Entries',     value: data.kpis.entryCount, unit: 'entries', accent: '#52B788' },
              ].map((k, i) => (
                <motion.div key={k.label}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}>
                  <Card className="p-4">
                    <p className="text-xs font-medium mb-2 leading-snug" style={{ color: '#9BAEA5' }}>{k.label}</p>
                    <p className="text-xl font-bold leading-tight" style={{ color: '#1A2118' }}>
                      {k.unit === 'kg'
                        ? k.value >= 1000
                          ? `${(k.value / 1000).toFixed(2)} t`
                          : `${k.value.toFixed(2)}`
                        : k.value
                      }
                    </p>
                    <p className="text-[10px] mt-0.5 font-medium" style={{ color: k.accent }}>
                      {k.unit === 'kg' ? (k.value >= 1000 ? 'tonnes CO₂e' : 'kg CO₂e') : 'logged'}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* ── No entries → empty state ── */}
            {data.kpis.entryCount === 0 ? (
              <Card><EmptyState navigate={navigate} /></Card>
            ) : (
              <>
                {/* ── Monthly chart + Scope breakdown ── */}
                <div className="grid lg:grid-cols-3 gap-5">

                  {/* Bar chart */}
                  <Card className="lg:col-span-2 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-sm font-semibold" style={{ color: '#1A2118' }}>Monthly Emissions</h2>
                        <p className="text-xs mt-0.5" style={{ color: '#9BAEA5' }}>kg CO₂e per month</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {[['#2D6A4F','Scope 1'],['#C4952A','Scope 2'],['#8B5E3C','Scope 3'],['#52B788','Personal']].map(([c,l]) => (
                          <div key={l} className="hidden sm:flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-sm flex-shrink-0" style={{ background: c }} />
                            <span style={{ color: '#9BAEA5' }}>{l}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-end gap-1.5 overflow-x-auto pb-1">
                      {data.monthly.map((m, i) => {
                        const dominant = m.scope1 >= m.scope2 && m.scope1 >= m.scope3 ? '#2D6A4F'
                          : m.scope2 >= m.scope3 ? '#C4952A'
                          : m.scope3 > 0 ? '#8B5E3C' : '#52B788';
                        return (
                          <BarCol
                            key={`${m.year}-${m.month}`}
                            heightPct={(m.total / maxMonthly) * 100}
                            color={dominant}
                            label={m.label}
                            value={m.total}
                            delay={i * 0.03}
                          />
                        );
                      })}
                    </div>
                  </Card>

                  {/* Scope breakdown */}
                  <Card className="p-6">
                    <h2 className="text-sm font-semibold mb-5" style={{ color: '#1A2118' }}>Scope Breakdown</h2>
                    {data.scopeBreakdown.length > 0 ? (
                      <div className="space-y-4">
                        {data.scopeBreakdown.map((s, i) => (
                          <ScopeBar
                            key={s.scope}
                            label={s.scope}
                            pct={s.percentage}
                            kg={s.kg}
                            color={SCOPE_COLORS[i % SCOPE_COLORS.length]}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-center py-8" style={{ color: '#9BAEA5' }}>No scope data</p>
                    )}

                    {/* Top sources */}
                    {data.topSources.length > 0 && (
                      <div className="mt-6 pt-5" style={{ borderTop: '1px solid #E5EAE8' }}>
                        <h3 className="text-[10px] font-bold uppercase tracking-wider mb-3"
                          style={{ color: '#9BAEA5' }}>Top Sources</h3>
                        {data.topSources.map((s) => (
                          <div key={s.source} className="flex justify-between items-center py-1.5 text-xs capitalize"
                            style={{ borderBottom: '1px solid #F0EDE4' }}>
                            <span style={{ color: '#5A7A6D' }}>{s.source}</span>
                            <div className="flex items-center gap-2">
                              <span style={{ color: '#9BAEA5' }}>{s.totalKg} kg</span>
                              <span className="font-bold" style={{ color: '#1A2118' }}>{s.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

                {/* ── Category breakdown ── */}
                {data.byCategory.length > 0 && (
                  <Card className="p-6">
                    <h2 className="text-sm font-semibold mb-5" style={{ color: '#1A2118' }}>
                      Emissions by Category
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {data.byCategory.map((cat) => (
                        <div key={cat.category}
                          className="rounded-xl p-4 flex flex-col gap-3"
                          style={{ background: '#F8FAF8', border: '1px solid #E5EAE8' }}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold capitalize" style={{ color: '#1A2118' }}>
                              {cat.category}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: `${CAT_COLORS[cat.category] ?? '#9BAEA5'}18`,
                                       color: CAT_COLORS[cat.category] ?? '#9BAEA5' }}>
                              {cat.percentage}%
                            </span>
                          </div>
                          <div>
                            <p className="text-xl font-bold" style={{ color: '#1A2118' }}>
                              {cat.totalKg >= 1000
                                ? `${(cat.totalKg / 1000).toFixed(2)} t`
                                : `${cat.totalKg} kg`}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: '#9BAEA5' }}>CO₂e</p>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: '#E5EAE8' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${cat.percentage}%` }}
                              transition={{ delay: 0.3, duration: 0.7 }}
                              className="h-full rounded-full"
                              style={{ background: CAT_COLORS[cat.category] ?? '#9BAEA5' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* ── Admin org-wide badge ── */}
                {isAdmin && (
                  <Card className="p-4 flex items-center gap-3"
                    style={{ background: '#EAF4EE', border: '1px solid #C0DDD0' }}>
                    <TrendingDown className="h-4 w-4 flex-shrink-0" style={{ color: '#2D6A4F' }} />
                    <p className="text-sm" style={{ color: '#1B4332' }}>
                      <strong>Organisation view</strong> — showing combined data from all employees.
                      Individual breakdowns are available on the Leaderboard.
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

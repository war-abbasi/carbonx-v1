import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus,
  Loader2, AlertCircle, Calculator,
  BrainCircuit, Info, RefreshCw,
} from 'lucide-react';
import { carbonApi }   from '../../api/carbonApi';
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

/* ════════════════════════════════════════════════
   SVG Forecast Chart
   Historical = solid green line
   Forecast   = dashed amber line + CI band
════════════════════════════════════════════════ */
function ForecastChart({ historical, forecast }) {
  const all   = [...historical, ...forecast];
  const W     = 720;
  const H     = 200;
  const PAD   = { t: 20, b: 32, l: 12, r: 12 };
  const iW    = W - PAD.l - PAD.r;
  const iH    = H - PAD.t - PAD.b;

  const maxVal = Math.max(
    ...historical.map((h) => h.actual),
    ...forecast.map((f) => f.upper),
    0.001,
  );

  const toXY = (idx0based, val) => ({
    x: PAD.l + (idx0based / (all.length - 1)) * iW,
    y: PAD.t + iH - (val / maxVal) * iH,
  });

  // Historical points (index 0…n-1)
  const hPts = historical.map((h, i) => ({ ...toXY(i, h.actual), label: h.label, v: h.actual }));
  // Forecast points (index n…n+m-1)
  const fPts = forecast.map((f, i) => ({
    ...toXY(historical.length + i, f.predicted),
    upper: toXY(historical.length + i, f.upper).y,
    lower: toXY(historical.length + i, f.lower).y,
    label: f.label,
    v: f.predicted,
    lo: f.lower,
    hi: f.upper,
  }));

  const hPath = hPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Forecast line starts from last historical point
  const fPath = hPts.length
    ? `M${hPts[hPts.length-1].x.toFixed(1)},${hPts[hPts.length-1].y.toFixed(1)} ` +
      fPts.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    : '';

  // Confidence band
  const bandPath = fPts.length >= 1
    ? fPts.map((p, i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.upper.toFixed(1)}`).join(' ')
      + ' ' + fPts.slice().reverse().map((p) => `L${p.x.toFixed(1)},${p.lower.toFixed(1)}`).join(' ') + ' Z'
    : '';

  // Divider x
  const divX = hPts.length ? hPts[hPts.length-1].x : 0;

  // X-axis label step
  const totalPts = all.length;
  const step     = Math.max(1, Math.ceil(totalPts / 9));

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
        style={{ minWidth: '360px' }}>

        {/* Horizontal grid */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f}
            x1={PAD.l} y1={PAD.t + iH * (1-f)}
            x2={W - PAD.r} y2={PAD.t + iH * (1-f)}
            stroke="#F0EDE4" strokeWidth="1" />
        ))}

        {/* Confidence band */}
        {bandPath && <path d={bandPath} fill="#C4952A" opacity="0.12" />}

        {/* Historical area fill */}
        {hPath && (
          <>
            <defs>
              <linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#2D6A4F" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.01" />
              </linearGradient>
            </defs>
            <path d={`${hPath} L${hPts[hPts.length-1].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} L${hPts[0].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} Z`}
              fill="url(#hGrad)" />
          </>
        )}

        {/* Historical line */}
        {hPath && (
          <path d={hPath} fill="none" stroke="#2D6A4F" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Forecast line — dashed amber */}
        {fPath && (
          <path d={fPath} fill="none" stroke="#C4952A" strokeWidth="2.5"
            strokeDasharray="7,4" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Divider between historical and forecast */}
        {hPts.length > 0 && (
          <line x1={divX.toFixed(1)} y1={PAD.t}
            x2={divX.toFixed(1)} y2={(PAD.t + iH).toFixed(1)}
            stroke="#9BAEA5" strokeWidth="1.5" strokeDasharray="5,4" />
        )}

        {/* Historical dots */}
        {hPts.map((p, i) => (
          <circle key={`h${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4"
            fill="#2D6A4F" stroke="#ffffff" strokeWidth="1.5" />
        ))}

        {/* Forecast dots */}
        {fPts.map((p, i) => (
          <circle key={`f${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4"
            fill="#C4952A" stroke="#ffffff" strokeWidth="1.5" />
        ))}

        {/* X-axis labels */}
        {all.map((pt, i) => {
          if (i % step !== 0 && i !== all.length - 1) return null;
          const px = i < historical.length
            ? hPts[i].x
            : fPts[i - historical.length].x;
          const isFc = i >= historical.length;
          return (
            <text key={i} x={px.toFixed(1)} y={H - 6}
              textAnchor="middle" fontSize="9.5" fill={isFc ? '#C4952A' : '#9BAEA5'}
              fontFamily="'JetBrains Mono', monospace" fontWeight={isFc ? '600' : '400'}>
              {pt.label}
            </text>
          );
        })}

        {/* Legend labels */}
        <text x={PAD.l} y={PAD.t - 6} fontSize="9" fill="#2D6A4F" fontFamily="sans-serif" fontWeight="600">Historical</text>
        {fPts.length > 0 && (
          <text x={fPts[0].x.toFixed(1)} y={PAD.t - 6} fontSize="9" fill="#C4952A"
            fontFamily="sans-serif" fontWeight="600">Predicted →</text>
        )}
      </svg>
    </div>
  );
}

/* ── Model quality badge ── */
function R2Badge({ r2Pct, confidence }) {
  const color = r2Pct >= 90 ? '#2D6A4F' : r2Pct >= 70 ? '#52B788' : r2Pct >= 50 ? '#C4952A' : '#DC2626';
  const bg    = r2Pct >= 90 ? '#EAF4EE' : r2Pct >= 70 ? '#EAF4EE' : r2Pct >= 50 ? '#FDF5E6' : '#FEF2F2';
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: bg, color }}>
      R² = {r2Pct}% · {confidence} accuracy
    </span>
  );
}

/* ── Trend pill ── */
function TrendPill({ trend, monthlyChange, trendColor }) {
  const Icon = trend === 'Increasing' ? TrendingUp : trend === 'Decreasing' ? TrendingDown : Minus;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: `${trendColor}14`, color: trendColor }}>
      <Icon className="h-3.5 w-3.5" />
      {trend} · {monthlyChange > 0 ? '+' : ''}{monthlyChange} kg/month
    </span>
  );
}

/* ── Empty / low-data state ── */
function NotEnoughData({ error, navigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-8">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: '#EAF4EE' }}>
        <BrainCircuit className="h-7 w-7" style={{ color: '#2D6A4F' }} />
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: '#1A2118' }}>
        Not enough data to predict
      </h3>
      <p className="text-sm max-w-sm mb-2" style={{ color: '#9BAEA5' }}>
        {error ?? 'Log carbon entries across at least 2 months to generate predictions.'}
      </p>
      <p className="text-xs mb-6 font-mono px-3 py-2 rounded-lg"
        style={{ background: '#F4F6F4', color: '#7A9E8E' }}>
        Jan=120, Feb=140 → predicts Mar=160 ✓
      </p>
      <button onClick={() => navigate('/dashboard/activities')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
        style={{ background: '#2D6A4F' }}>
        <Calculator className="h-4 w-4" /> Log Entries
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════
   Page
════════════════════════════════════════════════ */
const MONTH_OPTIONS = [3, 6, 9, 12];

export default function ForecastPage() {
  const { user }  = useAuthStore();
  const navigate  = useNavigate();
  const isAdmin   = user?.role === 'ADMIN';

  const [months,  setMonths]  = useState(6);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await carbonApi.getForecast(months);
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to generate forecast.');
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => { fetchForecast(); }, [fetchForecast]);

  const m = data?.model;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1A2118' }}>
            <BrainCircuit className="h-5 w-5" style={{ color: '#2D6A4F' }} />
            Emission Forecast
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#9BAEA5' }}>
            {isAdmin
              ? 'Organisation-wide emission prediction using Linear Regression'
              : 'Personal emission prediction using Linear Regression'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchForecast} disabled={loading}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-40"
            style={{ color: '#7A9E8E', border: '1px solid #E5EAE8' }}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {/* Forecast horizon selector */}
          <div className="flex gap-1 p-1 rounded-lg"
            style={{ background: '#F4F6F4', border: '1px solid #E5EAE8' }}>
            {MONTH_OPTIONS.map((n) => (
              <button key={n} onClick={() => setMonths(n)}
                className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all whitespace-nowrap"
                style={n === months
                  ? { background: '#2D6A4F', color: '#fff' }
                  : { color: '#7A9E8E' }}>
                +{n}mo
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Model explanation banner */}
      <Card className="p-4 flex items-start gap-3"
        style={{ background: '#F8FAF8', border: '1px solid #E5EAE8' }}>
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#2D6A4F' }} />
        <div className="text-xs leading-relaxed" style={{ color: '#5A7A6D' }}>
          <strong style={{ color: '#1A2118' }}>How it works:</strong>{' '}
          Ordinary Least Squares linear regression is fitted on your full historical monthly emissions
          (X = month index, Y = kg CO₂e). The model learns the slope (trend) and intercept,
          then extrapolates for the next <strong>{months} months</strong>.
          The shaded band shows the 90% prediction interval — wider bands = more uncertainty.
          More historical data → higher R² → more accurate predictions.
        </div>
      </Card>

      {error && (
        <Card className="p-4 flex items-center gap-3" style={{ border: '1px solid #FECACA' }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#DC2626' }} />
          <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#9BAEA5' }} />
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Not enough data */}
          {(data.model === null || data.historical.length < 2) ? (
            <Card><NotEnoughData error={data.error} navigate={navigate} /></Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5">

              {/* Model quality row */}
              <div className="flex flex-wrap items-center gap-3">
                <R2Badge r2Pct={m.r2Pct} confidence={m.confidence} />
                <TrendPill trend={m.trend} monthlyChange={m.monthlyChange} trendColor={m.trendColor} />
                <span className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background: '#F4F6F4', color: '#9BAEA5', border: '1px solid #E5EAE8' }}>
                  {m.dataPoints} historical months · {m.forecastMonths} predicted
                </span>
              </div>

              {/* ── Main forecast chart ── */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color: '#1A2118' }}>
                      Historical + Predicted Emissions
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: '#9BAEA5' }}>kg CO₂e per month</p>
                  </div>
                  <div className="flex items-center gap-5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 rounded" style={{ background: '#2D6A4F' }} />
                      <span style={{ color: '#9BAEA5' }}>Historical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 rounded" style={{ background: '#C4952A', borderTop: '2px dashed #C4952A', borderBottom: 'none', height: '2px' }} />
                      <span style={{ color: '#9BAEA5' }}>Forecast</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-3 rounded-sm" style={{ background: 'rgba(196,149,42,0.18)' }} />
                      <span style={{ color: '#9BAEA5' }}>90% CI</span>
                    </div>
                  </div>
                </div>

                <ForecastChart historical={data.historical} forecast={data.forecast} />
              </Card>

              {/* ── Predicted month cards ── */}
              <div>
                <h2 className="text-sm font-semibold mb-3" style={{ color: '#1A2118' }}>
                  Month-by-Month Predictions
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {data.forecast.map((f, i) => (
                    <motion.div key={f.label}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.4 }}>
                      <Card className="p-4 text-center">
                        <p className="text-xs font-bold uppercase tracking-wider mb-2"
                          style={{ color: '#C4952A', fontFamily: "'JetBrains Mono', monospace" }}>
                          {f.label}
                        </p>
                        <p className="text-2xl font-bold mb-0.5" style={{ color: '#1A2118' }}>
                          {f.predicted >= 1000 ? `${(f.predicted/1000).toFixed(2)}t` : `${f.predicted}`}
                        </p>
                        <p className="text-[10px] mb-3" style={{ color: '#9BAEA5' }}>
                          {f.predicted >= 1000 ? 'tonnes' : 'kg'} CO₂e
                        </p>
                        {/* Confidence range */}
                        <div className="text-[10px] pt-2.5" style={{ borderTop: '1px solid #F0EDE4', color: '#9BAEA5' }}>
                          <div className="flex justify-between">
                            <span>Low</span><span>High</span>
                          </div>
                          <div className="flex justify-between font-semibold mt-0.5"
                            style={{ color: '#7A9E8E' }}>
                            <span>{f.lower >= 1000 ? `${(f.lower/1000).toFixed(1)}t` : f.lower}</span>
                            <span>{f.upper >= 1000 ? `${(f.upper/1000).toFixed(1)}t` : f.upper}</span>
                          </div>
                        </div>
                        {/* vs prior prediction trend */}
                        {i > 0 && (
                          <div className="mt-2 text-[10px] font-semibold"
                            style={{ color: f.predicted > data.forecast[i-1].predicted ? '#DC2626' : '#2D6A4F' }}>
                            {f.predicted > data.forecast[i-1].predicted ? '↑' : '↓'}{' '}
                            {Math.abs(f.predicted - data.forecast[i-1].predicted).toFixed(1)} kg
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── Model details card ── */}
              <Card className="p-6">
                <h2 className="text-sm font-semibold mb-4" style={{ color: '#1A2118' }}>
                  Model Details
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Model Type',         value: 'Linear Regression (OLS)',  sub: 'Ordinary Least Squares' },
                    { label: 'R² Accuracy',         value: `${m.r2Pct}%`,              sub: `${m.confidence} confidence` },
                    { label: 'Slope (trend)',       value: `${m.slope > 0 ? '+' : ''}${m.slope} kg/mo`, sub: m.trend },
                    { label: 'Intercept (base)',    value: `${m.intercept} kg`,        sub: 'Regression constant' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl p-4"
                      style={{ background: '#F8FAF8', border: '1px solid #E5EAE8' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                        style={{ color: '#9BAEA5' }}>{s.label}</p>
                      <p className="text-sm font-bold" style={{ color: '#1A2118' }}>{s.value}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#9BAEA5' }}>{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Equation */}
                <div className="mt-4 p-3 rounded-xl font-mono text-sm text-center"
                  style={{ background: '#F4F6F4', border: '1px solid #E5EAE8', color: '#2D6A4F' }}>
                  ŷ = {m.slope > 0 ? '+' : ''}{m.slope} × month + {m.intercept}
                </div>

                {/* R² interpretation */}
                <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: '#EAF4EE', color: '#3D5247' }}>
                  <strong>R² = {m.r2Pct}%</strong> means the model explains {m.r2Pct}% of the variance in your
                  emission data. {m.r2Pct >= 85
                    ? 'Excellent fit — predictions are highly reliable.'
                    : m.r2Pct >= 65
                    ? 'Good fit — predictions are generally reliable but log more data to improve accuracy.'
                    : 'Moderate fit — log emissions consistently over more months for better predictions.'}
                </div>
              </Card>

              {/* Dataset guidance */}
              <Card className="p-5" style={{ background: '#FDF5E6', border: '1px solid #F5E3C0' }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"
                  style={{ color: '#7C5A10' }}>
                  <Info className="h-4 w-4" /> Want more accurate predictions?
                </h3>
                <p className="text-xs leading-relaxed mb-3" style={{ color: '#9C7020' }}>
                  The model improves with more historical data points. Log entries every day or week
                  across multiple months. For industry-level benchmarking, these open datasets are available:
                </p>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { name: 'Our World in Data', url: 'ourworldindata.org/co2-emissions', desc: 'Pakistan CO₂ historical data (free CSV)' },
                    { name: 'IEA Data',           url: 'iea.org/data-and-statistics',      desc: 'International energy & emissions data' },
                    { name: 'World Bank Climate', url: 'data.worldbank.org/topic/19',       desc: 'Pakistan climate change indicators' },
                    { name: 'GHG Protocol',       url: 'ghgprotocol.org',                  desc: 'Sector emission benchmarks' },
                  ].map((ds) => (
                    <div key={ds.name} className="flex items-start gap-2 p-2.5 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid #F5E3C0' }}>
                      <div>
                        <p className="font-semibold" style={{ color: '#7C5A10' }}>{ds.name}</p>
                        <p style={{ color: '#9C7020' }}>{ds.desc}</p>
                        <p className="font-mono mt-0.5" style={{ color: '#C4952A', fontSize: '0.65rem' }}>
                          {ds.url}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

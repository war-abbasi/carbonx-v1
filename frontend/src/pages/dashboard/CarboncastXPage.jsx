import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BrainCircuit, Loader2, RefreshCw, AlertCircle, Sparkles,
  TrendingUp, TrendingDown, Activity, CalendarClock,
} from 'lucide-react';
import { insightsApi } from '../../api/insightsApi';

/* ─── Shared card ─────────────────────────────── */
function Card({ className = '', style = {}, children, ...rest }) {
  return (
    <div className={`rounded-xl ${className}`}
      style={{ background: '#ffffff', border: '1px solid #E5EAE8', ...style }} {...rest}>
      {children}
    </div>
  );
}

function monthLabel(ym) {
  if (!ym || typeof ym !== 'string') return ym || '';
  const [y, m] = ym.split('-');
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const idx = parseInt(m, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx > 11) return ym;
  return `${names[idx]} '${(y || '').slice(2)}`;
}
const fmtKg = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}t` : `${Math.round(n)}`);

/* ── Smooth (Catmull-Rom → bezier) path through points ── */
function smoothPath(pts) {
  if (pts.length < 2) return pts.length ? `M${pts[0].x},${pts[0].y}` : '';
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

/* ════════════════════════════════════════════════
   Forecast chart  (historical solid + forecast dashed + CI band)
════════════════════════════════════════════════ */
function ForecastChart({ historical, forecast: fc }) {
  const all = [...historical, ...fc];
  const W=720, H=260, PAD={t:24,b:34,l:40,r:14};
  const iW=W-PAD.l-PAD.r, iH=H-PAD.t-PAD.b;
  const maxVal=Math.max(...historical.map(h=>h.actual),...fc.map(f=>f.upper),0.001);
  const toXY=(i0,val)=>({x:PAD.l+(i0/(all.length-1))*iW,y:PAD.t+iH-(val/maxVal)*iH});
  const hPts=historical.map((h,i)=>({...toXY(i,h.actual),label:h.label,v:h.actual}));
  const fPts=fc.map((f,i)=>({...toXY(historical.length+i,f.predicted),upper:toXY(historical.length+i,f.upper).y,lower:toXY(historical.length+i,f.lower).y,label:f.label,v:f.predicted}));
  // continuous forecast line starts at last historical point
  const fLinePts = hPts.length ? [hPts[hPts.length-1], ...fPts] : fPts;
  const hPath=smoothPath(hPts);
  const fPath=smoothPath(fLinePts);
  const upperPath=smoothPath(fPts.map(p=>({x:p.x,y:p.upper})));
  const lowerPts=fPts.map(p=>({x:p.x,y:p.lower})).reverse();
  const band=fPts.length>=1 ? `${upperPath} L${lowerPts[0].x.toFixed(1)},${lowerPts[0].y.toFixed(1)} ${smoothPath(lowerPts).replace(/^M[^C]*/, '')} Z` : '';
  const divX=hPts.length?hPts[hPts.length-1].x:0;
  const step=Math.max(1,Math.ceil(all.length/9));
  const fmtY=(v)=>v>=1000?`${(v/1000).toFixed(1)}t`:Math.round(v);
  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{minWidth:'340px'}}>
        <defs>
          <linearGradient id="fcHG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.22"/>
            <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.01"/>
          </linearGradient>
          <linearGradient id="fcLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2D6A4F"/><stop offset="100%" stopColor="#52B788"/>
          </linearGradient>
        </defs>
        {/* gridlines + y labels */}
        {[0,0.25,0.5,0.75,1].map(f=>(
          <g key={f}>
            <line x1={PAD.l} y1={PAD.t+iH*(1-f)} x2={W-PAD.r} y2={PAD.t+iH*(1-f)} stroke="#F0EDE4" strokeWidth="1"/>
            <text x={PAD.l-8} y={PAD.t+iH*(1-f)+3} textAnchor="end" fontSize="9" fill="#BFCDC7" fontFamily="monospace">{fmtY(maxVal*f)}</text>
          </g>
        ))}
        {band&&<path d={band} fill="#52B788" opacity="0.10"/>}
        {hPts.length&&<path d={`${hPath} L${hPts[hPts.length-1].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} L${hPts[0].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} Z`} fill="url(#fcHG)"/>}
        {hPath&&<path d={hPath} fill="none" stroke="url(#fcLine)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>}
        {fPath&&<path d={fPath} fill="none" stroke="#C4952A" strokeWidth="3" strokeDasharray="2,6" strokeLinecap="round" strokeLinejoin="round"/>}
        {hPts.length>0&&<line x1={divX.toFixed(1)} y1={PAD.t} x2={divX.toFixed(1)} y2={(PAD.t+iH).toFixed(1)} stroke="#D8E2DC" strokeWidth="1.5" strokeDasharray="4,4"/>}
        {hPts.map((p,i)=><circle key={`h${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3" fill="#2D6A4F" stroke="#fff" strokeWidth="1.5"/>)}
        {fPts.map((p,i)=><circle key={`f${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5" fill="#fff" stroke="#C4952A" strokeWidth="2"/>)}
        {all.map((pt,i)=>{if(i%step!==0&&i!==all.length-1)return null;const px=i<historical.length?hPts[i].x:fPts[i-historical.length].x;const isFc=i>=historical.length;return<text key={i} x={px.toFixed(1)} y={H-8} textAnchor="middle" fontSize="9.5" fill={isFc?'#C4952A':'#9BAEA5'} fontFamily="monospace" fontWeight={isFc?'600':'400'}>{pt.label}</text>;})}
        <text x={PAD.l} y={PAD.t-8} fontSize="9" fill="#2D6A4F" fontFamily="sans-serif" fontWeight="600">Your emissions</text>
        {fPts.length>0&&<text x={fPts[0].x.toFixed(1)} y={PAD.t-8} fontSize="9" fill="#C4952A" fontFamily="sans-serif" fontWeight="600">Projected →</text>}
      </svg>
    </div>
  );
}

/* ─── Small KPI tile ─── */
function Kpi({ icon: Icon, label, value, sub, accent }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}16` }}>
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#9BAEA5' }}>{label}</span>
      </div>
      <p className="text-xl font-bold" style={{ color: '#1A2118' }}>{value}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: '#9BAEA5' }}>{sub}</p>}
    </Card>
  );
}

export default function CarboncastXPage() {
  const [months,  setMonths]  = useState(12);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errMsg,  setErrMsg]  = useState('');

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setErrMsg('');
    try {
      const { data: res } = await insightsApi.getForecast(months, refresh);
      setPayload(res.data);
    } catch (e) {
      const apiData = e?.response?.data;
      if (apiData?.data) setPayload(apiData.data);
      else { setErrMsg(apiData?.message || 'Could not generate forecast.'); setPayload(null); }
    } finally { setLoading(false); setRefreshing(false); }
  }, [months]);

  useEffect(() => { load(false); }, [load]);

  // Parse ML response
  const ml         = payload?.forecast;
  const bestKey    = ml?.best_model;
  const models     = ml?.models || {};
  const bestModel  = bestKey ? models[bestKey] : null;
  const insufficient = payload && (payload.success === false || !bestModel);

  const histRaw    = payload?.historical || [];
  const chartHist  = histRaw.map(h => ({ actual: h.value, label: monthLabel(h.month) }));
  const fcItems    = bestModel?.forecast || [];
  const chartFc    = fcItems.map(f => ({
    predicted: Math.round(f.predicted_emissions),
    upper: Math.round(f.upper_bound), lower: Math.round(f.lower_bound),
    label: monthLabel(f.month), month: f.month,
  }));

  // ── Derived insights ──
  const lastHist   = chartHist.length ? chartHist[chartHist.length - 1].actual : 0;
  const nextPred   = chartFc.length ? chartFc[0].predicted : 0;
  const avgFc      = chartFc.length ? Math.round(chartFc.reduce((s, f) => s + f.predicted, 0) / chartFc.length) : 0;
  const totalFc    = chartFc.reduce((s, f) => s + f.predicted, 0);
  const peak       = chartFc.length ? chartFc.reduce((a, b) => (b.predicted > a.predicted ? b : a)) : null;
  const trough     = chartFc.length ? chartFc.reduce((a, b) => (b.predicted < a.predicted ? b : a)) : null;
  const endPred    = chartFc.length ? chartFc[chartFc.length - 1].predicted : 0;
  const overallChg = lastHist > 0 ? Math.round(((endPred - lastHist) / lastHist) * 100) : 0;
  const rising     = overallChg > 2, falling = overallChg < -2;
  const annualFc   = avgFc * 12;          // run-rate annual projection
  const treesEq    = Math.max(0, Math.round(annualFc / 21)); // ~21 kg CO₂ absorbed per tree/yr

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Hero header ── */}
      <div className="rounded-xl overflow-hidden relative"
        style={{ background: 'linear-gradient(120deg,#1B4332 0%,#2D6A4F 55%,#3B6CA8 130%)', padding: '24px 28px' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                CarboncastX
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>AI ENGINE</span>
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Smart emission forecasting to guide your climate decisions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.12)' }}>
              {[6, 12, 24].map(n => (
                <button key={n} onClick={() => setMonths(n)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all"
                  style={n === months ? { background: '#fff', color: '#1B4332' } : { color: 'rgba(255,255,255,0.8)' }}>
                  {n}m
                </button>
              ))}
            </div>
            <button onClick={() => load(true)} disabled={refreshing || loading}
              title="Retrain models on latest data"
              className="p-2 rounded-lg transition-all disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin mb-3" style={{ color: '#2D6A4F' }} />
          <p className="text-sm" style={{ color: '#9BAEA5' }}>Analysing your emission trends…</p>
        </div>
      )}

      {!loading && errMsg && (
        <Card className="p-4 flex items-start gap-3" style={{ background:'#FEF2F2', border:'1px solid #FCA5A5' }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color:'#DC2626' }} />
          <p className="text-sm" style={{ color:'#991B1B' }}>{errMsg}</p>
        </Card>
      )}

      {!loading && payload && insufficient && (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center px-8">
            <BrainCircuit className="h-12 w-12 mb-3" style={{ color: '#C0DDD0' }} />
            <h3 className="text-base font-semibold mb-2" style={{ color: '#1A2118' }}>Need more data to forecast</h3>
            <p className="text-sm max-w-sm" style={{ color: '#9BAEA5' }}>
              {payload.error ?? 'Log carbon entries across at least 2 different months to unlock AI forecasting.'}
            </p>
          </div>
        </Card>
      )}

      {!loading && payload && !insufficient && (
        <>
          {/* ── AI insight banner ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="rounded-xl p-5 flex items-start gap-4"
              style={{ background: 'linear-gradient(135deg,#EAF4EE,#EAF1F8)', border: '1px solid #C0DDD0' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: '#fff' }}>
                <Sparkles className="h-5 w-5" style={{ color: '#C4952A' }} />
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#1A2118' }}>AI Insight</p>
                <p className="text-sm leading-relaxed" style={{ color: '#3D5247' }}>
                  Based on <strong>{chartHist.length} months</strong> of your activity, emissions over the next{' '}
                  <strong>{chartFc.length} months</strong> are projected to{' '}
                  {rising ? <span style={{ color: '#DC2626', fontWeight: 600 }}>rise ~{Math.abs(overallChg)}% 📈</span>
                    : falling ? <span style={{ color: '#2D6A4F', fontWeight: 600 }}>fall ~{Math.abs(overallChg)}% 📉</span>
                    : <span style={{ color: '#7A9E8E', fontWeight: 600 }}>stay roughly flat ➡️</span>}
                  {peak && <>, peaking around <strong>{peak.label}</strong> (~{fmtKg(peak.predicted)} kg).</>}
                  {' '}Total projected: <strong>{fmtKg(totalFc)} kg CO₂e</strong>.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── KPI row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi icon={CalendarClock} accent="#C4952A" label="Next month"
              value={`${fmtKg(nextPred)} kg`} sub={chartFc[0]?.label} />
            <Kpi icon={Activity} accent="#3B6CA8" label="Avg / month"
              value={`${fmtKg(avgFc)} kg`} sub={`over ${chartFc.length} months`} />
            <Kpi icon={rising ? TrendingUp : TrendingDown} accent={rising ? '#DC2626' : '#2D6A4F'}
              label="Projected change" value={`${overallChg > 0 ? '+' : ''}${overallChg}%`} sub="end vs now" />
            <Kpi icon={CalendarClock} accent="#2D6A4F" label="Annual outlook"
              value={`${fmtKg(annualFc)} kg`} sub="projected 12-month run-rate" />
          </div>

          {/* ── Chart + accuracy ── */}
          <div className="grid lg:grid-cols-3 gap-5">
            <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Card className="p-6 h-full">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color:'#1A2118' }}>Your Emissions Outlook</h2>
                    <p className="text-xs mt-0.5" style={{ color:'#9BAEA5' }}>
                      kg CO₂e / month · history &amp; projection
                      {payload.cached && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]" style={{ background:'#F4F6F4', color:'#9BAEA5' }}>cached</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5"><div className="w-7 h-0.5" style={{ background:'#2D6A4F' }}/><span style={{ color:'#9BAEA5' }}>History</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-7" style={{ height:'2px', borderTop:'2px dashed #C4952A' }}/><span style={{ color:'#9BAEA5' }}>Forecast</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-7 h-3 rounded-sm" style={{ background:'rgba(196,149,42,0.18)' }}/><span style={{ color:'#9BAEA5' }}>90% CI</span></div>
                  </div>
                </div>
                {chartHist.length >= 1
                  ? <ForecastChart historical={chartHist} forecast={chartFc} />
                  : <p className="text-xs text-center py-8" style={{ color:'#9BAEA5' }}>No historical series to plot.</p>}
              </Card>
            </motion.div>

            {/* What this means for your company */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <Card className="p-6 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4" style={{ color: '#C4952A' }} />
                  <h2 className="text-sm font-semibold" style={{ color:'#1A2118' }}>What this means for you</h2>
                </div>

                {/* Annual run-rate highlight */}
                <div className="rounded-xl p-4 mb-4" style={{ background: '#EAF4EE', border: '1px solid #C0DDD0' }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#2D6A4F' }}>Projected annual footprint</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#1A2118' }}>{fmtKg(annualFc)} kg CO₂e</p>
                  <p className="text-[11px] mt-1" style={{ color: '#5A7A6D' }}>
                    ≈ the carbon <strong>{treesEq.toLocaleString()} trees</strong> absorb in a year 🌳
                  </p>
                </div>

                {/* Actionable insights */}
                <div className="space-y-3">
                  {[
                    rising
                      ? { icon: TrendingUp, c: '#DC2626', t: `Emissions are trending up ~${Math.abs(overallChg)}%. Prioritise your largest source now to bend the curve.` }
                      : falling
                      ? { icon: TrendingDown, c: '#2D6A4F', t: `You're on a downward path (~${Math.abs(overallChg)}%). Keep the momentum — lock in these reductions as targets.` }
                      : { icon: Activity, c: '#7A9E8E', t: 'Emissions are holding steady. A focused reduction goal could turn this flat line into a decline.' },
                    peak
                      ? { icon: CalendarClock, c: '#C4952A', t: `Expect a seasonal peak around ${peak.label}. Plan offsets or efficiency measures ahead of it.` }
                      : null,
                    { icon: Sparkles, c: '#3B6CA8', t: 'Log more activity each month — richer data sharpens these projections and unlocks better recommendations.' },
                  ].filter(Boolean).map((ins, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${ins.c}16` }}>
                        <ins.icon className="h-3.5 w-3.5" style={{ color: ins.c }} />
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: '#3D5247' }}>{ins.t}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* ── Month-by-month cards ── */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#1A2118' }}>Month-by-month projection</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {chartFc.map((f, i) => {
                const isPeak = peak && f.month === peak.month;
                const isLow  = trough && f.month === trough.month && !isPeak;
                return (
                  <motion.div key={f.label + i} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03, duration:0.35 }}>
                    <Card className="p-4 text-center" style={isPeak ? { border:'1px solid #F0B5B5' } : isLow ? { border:'1px solid #BFE3CF' } : {}}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2 font-mono" style={{ color:'#C4952A' }}>{f.label}</p>
                      <p className="text-2xl font-bold" style={{ color:'#1A2118' }}>
                        {f.predicted>=1000?`${(f.predicted/1000).toFixed(1)}t`:f.predicted}
                      </p>
                      <p className="text-[10px] mb-1" style={{ color:'#9BAEA5' }}>{f.predicted>=1000?'tonnes':'kg'} CO₂e</p>
                      <p className="text-[9px] font-mono" style={{ color:'#C0CCC6' }}>{f.lower}–{f.upper}</p>
                      {isPeak && <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'#FEF2F2', color:'#DC2626' }}>PEAK</span>}
                      {isLow && <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'#EAF4EE', color:'#2D6A4F' }}>LOWEST</span>}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

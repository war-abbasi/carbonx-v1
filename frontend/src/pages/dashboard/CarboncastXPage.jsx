import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BrainCircuit, Loader2, RefreshCw, AlertCircle, Sparkles,
  TrendingUp, TrendingDown, Activity,
  Gauge, Layers, Zap, CalendarClock, Award,
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

const MODEL_META = {
  prophet:      { name: 'Prophet',      color: '#2D6A4F', blurb: 'Trend + seasonality (Meta)' },
  xgboost:      { name: 'XGBoost',      color: '#C4952A', blurb: 'Gradient-boosted trees' },
  holt_winters: { name: 'Holt-Winters', color: '#3B6CA8', blurb: 'Exponential smoothing' },
};

const FEATURE_LABELS = {
  lag_1: 'Last month', lag_3: '3 months ago', lag_6: '6 months ago', lag_12: 'Same month last year',
  rolling_mean_3: '3-month average', rolling_mean_6: '6-month average', rolling_mean_12: '12-month average',
  rolling_std_3: '3-month volatility', rolling_std_6: '6-month volatility',
  month: 'Month of year', quarter: 'Quarter', is_summer: 'Summer', is_winter: 'Winter',
  trend: 'Long-term trend', employee_count: 'Headcount', emissions_per_employee: 'Per-employee',
  yoy_change: 'Year-on-year change',
};

function monthLabel(ym) {
  if (!ym || typeof ym !== 'string') return ym || '';
  const [y, m] = ym.split('-');
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const idx = parseInt(m, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx > 11) return ym;
  return `${names[idx]} '${(y || '').slice(2)}`;
}
const fmtKg = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}t` : `${Math.round(n)}`);

/* ════════════════════════════════════════════════
   Forecast chart  (historical solid + forecast dashed + CI band)
════════════════════════════════════════════════ */
function ForecastChart({ historical, forecast: fc }) {
  const all = [...historical, ...fc];
  const W=720, H=220, PAD={t:20,b:32,l:12,r:12};
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
        {hPath&&(<><defs><linearGradient id="fcHG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.16"/><stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.01"/></linearGradient></defs><path d={`${hPath} L${hPts[hPts.length-1].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} L${hPts[0].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} Z`} fill="url(#fcHG)"/><path d={hPath} fill="none" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></>)}
        {fPath&&<path d={fPath} fill="none" stroke="#C4952A" strokeWidth="2.5" strokeDasharray="7,4" strokeLinecap="round" strokeLinejoin="round"/>}
        {hPts.length>0&&<line x1={divX.toFixed(1)} y1={PAD.t} x2={divX.toFixed(1)} y2={(PAD.t+iH).toFixed(1)} stroke="#9BAEA5" strokeWidth="1.5" strokeDasharray="5,4"/>}
        {hPts.map((p,i)=><circle key={`h${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5" fill="#2D6A4F" stroke="#fff" strokeWidth="1.5"/>)}
        {fPts.map((p,i)=><circle key={`f${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5" fill="#C4952A" stroke="#fff" strokeWidth="1.5"/>)}
        {all.map((pt,i)=>{if(i%step!==0&&i!==all.length-1)return null;const px=i<historical.length?hPts[i].x:fPts[i-historical.length].x;const isFc=i>=historical.length;return<text key={i} x={px.toFixed(1)} y={H-6} textAnchor="middle" fontSize="9.5" fill={isFc?'#C4952A':'#9BAEA5'} fontFamily="monospace" fontWeight={isFc?'600':'400'}>{pt.label}</text>;})}
        <text x={PAD.l} y={PAD.t-6} fontSize="9" fill="#2D6A4F" fontFamily="sans-serif" fontWeight="600">Historical</text>
        {fPts.length>0&&<text x={fPts[0].x.toFixed(1)} y={PAD.t-6} fontSize="9" fill="#C4952A" fontFamily="sans-serif" fontWeight="600">Predicted →</text>}
      </svg>
    </div>
  );
}

/* accuracy (%) from out-of-sample MAPE — intuitive & robust on short horizons */
const accuracyOf = (m) => (m && m.mape != null ? Math.max(0, Math.min(100, Math.round(100 - m.mape))) : 0);

/* ─── Accuracy donut gauge ─── */
function AccuracyGauge({ pct = 0, color }) {
  pct = Math.max(0, Math.min(100, Math.round(pct)));
  const R = 34, C = 2 * Math.PI * R;
  const off = C - (pct / 100) * C;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 92, height: 92 }}>
      <svg width="92" height="92" viewBox="0 0 92 92">
        <circle cx="46" cy="46" r={R} fill="none" stroke="#F0EDE4" strokeWidth="8" />
        <circle cx="46" cy="46" r={R} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 46 46)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute text-center">
        <p className="text-xl font-bold leading-none" style={{ color: '#1A2118' }}>{pct}%</p>
        <p className="text-[9px] font-medium" style={{ color: '#9BAEA5' }}>accuracy</p>
      </div>
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
  const bestMeta   = MODEL_META[bestKey] || { name: bestKey, color: '#2D6A4F' };

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

  // XGBoost feature importance (top drivers)
  const featImp = Object.entries(models?.xgboost?.feature_importance || {})
    .slice(0, 5)
    .map(([k, v]) => ({ name: FEATURE_LABELS[k] || k.replace(/_/g, ' '), v }));
  const featMax = featImp.length ? Math.max(...featImp.map(f => f.v), 0.0001) : 1;

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
                Multi-model emission forecasting · Prophet · XGBoost · Holt-Winters
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
          <p className="text-sm" style={{ color: '#9BAEA5' }}>Training Prophet · XGBoost · Holt-Winters…</p>
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
                  Based on <strong>{chartHist.length} months</strong> of data, <strong>{bestMeta.name}</strong> was
                  the most accurate model ({accuracyOf(bestModel.metrics)}% accuracy). Over the next{' '}
                  <strong>{chartFc.length} months</strong> your emissions are projected to{' '}
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
            <Kpi icon={Award} accent={bestMeta.color} label="Best model"
              value={bestMeta.name} sub={`RMSE ${Number(bestModel.metrics?.rmse).toFixed(1)}`} />
          </div>

          {/* ── Chart + accuracy ── */}
          <div className="grid lg:grid-cols-3 gap-5">
            <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Card className="p-6 h-full">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color:'#1A2118' }}>Historical + Predicted Emissions</h2>
                    <p className="text-xs mt-0.5" style={{ color:'#9BAEA5' }}>
                      kg CO₂e / month · model: <strong style={{ color: bestMeta.color }}>{bestMeta.name}</strong>
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

            {/* Accuracy + drivers */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <Card className="p-6 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Gauge className="h-4 w-4" style={{ color: bestMeta.color }} />
                  <h2 className="text-sm font-semibold" style={{ color:'#1A2118' }}>Model accuracy</h2>
                </div>
                <p className="text-[11px] mb-3" style={{ color: '#9BAEA5' }}>
                  {bestModel.validation === 'holdout'
                    ? '✓ Validated out-of-sample (holdout backtest)'
                    : 'In-sample fit (dataset too short to backtest)'}
                </p>
                <div className="flex items-center gap-4">
                  <AccuracyGauge pct={accuracyOf(bestModel.metrics)} color={bestMeta.color} />
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between gap-4"><span style={{color:'#9BAEA5'}}>RMSE</span><span className="font-semibold" style={{color:'#1A2118'}}>{Number(bestModel.metrics?.rmse).toFixed(1)}</span></div>
                    <div className="flex justify-between gap-4"><span style={{color:'#9BAEA5'}}>MAE</span><span className="font-semibold" style={{color:'#1A2118'}}>{Number(bestModel.metrics?.mae).toFixed(1)}</span></div>
                    <div className="flex justify-between gap-4"><span style={{color:'#9BAEA5'}}>MAPE</span><span className="font-semibold" style={{color:'#1A2118'}}>{Number(bestModel.metrics?.mape).toFixed(1)}%</span></div>
                    <div className="flex justify-between gap-4"><span style={{color:'#9BAEA5'}}>R²</span><span className="font-semibold" style={{color:'#1A2118'}}>{Number(bestModel.metrics?.r2).toFixed(2)}</span></div>
                  </div>
                </div>

                {featImp.length > 0 && (
                  <div className="mt-5 pt-4" style={{ borderTop: '1px solid #F0EDE4' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-3.5 w-3.5" style={{ color: '#C4952A' }} />
                      <span className="text-xs font-semibold" style={{ color: '#1A2118' }}>Top drivers (XGBoost)</span>
                    </div>
                    <div className="space-y-2">
                      {featImp.map((f) => (
                        <div key={f.name}>
                          <div className="flex justify-between text-[11px] mb-0.5">
                            <span style={{ color: '#5A7A6D' }}>{f.name}</span>
                            <span className="font-mono" style={{ color: '#9BAEA5' }}>{Math.round((f.v / featMax) * 100)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: '#F0EDE4' }}>
                            <div className="h-full rounded-full" style={{ width: `${(f.v / featMax) * 100}%`, background: '#C4952A' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* ── Model comparison ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-4 w-4" style={{ color: '#3B6CA8' }} />
              <h2 className="text-sm font-semibold" style={{ color: '#1A2118' }}>Model leaderboard</h2>
              <span className="text-[11px]" style={{ color: '#9BAEA5' }}>· lower RMSE = better · winner auto-selected</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(models).map(([key, mdl]) => {
                const meta = MODEL_META[key] || { name: key, color: '#7A9E8E', blurb: '' };
                const ok = mdl.status === 'success' && mdl.metrics;
                const isBest = key === bestKey;
                const acc = ok ? accuracyOf(mdl.metrics) : 0;
                return (
                  <Card key={key} className="p-4" style={isBest ? { border: `2px solid ${meta.color}`, background: `${meta.color}08` } : {}}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
                        <span className="text-sm font-bold" style={{ color: '#1A2118' }}>{meta.name}</span>
                      </div>
                      {isBest && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: meta.color, color: '#fff' }}>⭐ BEST</span>}
                    </div>
                    <p className="text-[11px] mb-3" style={{ color: '#9BAEA5' }}>{meta.blurb}</p>
                    {ok ? (
                      <>
                        <div className="flex items-end justify-between mb-2">
                          <div>
                            <p className="text-2xl font-bold" style={{ color: meta.color }}>{acc}%</p>
                            <p className="text-[10px]" style={{ color: '#9BAEA5' }}>accuracy (100−MAPE)</p>
                          </div>
                          <div className="text-right text-[11px] space-y-0.5">
                            <p style={{ color: '#5A7A6D' }}>RMSE <span className="font-semibold" style={{ color:'#1A2118' }}>{Number(mdl.metrics.rmse).toFixed(1)}</span></p>
                            <p style={{ color: '#5A7A6D' }}>MAPE <span className="font-semibold" style={{ color:'#1A2118' }}>{Number(mdl.metrics.mape).toFixed(1)}%</span></p>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: '#F0EDE4' }}>
                          <div className="h-full rounded-full" style={{ width: `${acc}%`, background: meta.color }} />
                        </div>
                      </>
                    ) : (
                      <p className="text-xs py-3" style={{ color: '#DC2626' }}>⚠ Unavailable for this dataset</p>
                    )}
                  </Card>
                );
              })}
            </div>
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

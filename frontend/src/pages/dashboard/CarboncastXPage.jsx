import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BrainCircuit, Loader2, RefreshCw, AlertCircle,
} from 'lucide-react';
import { insightsApi } from '../../api/insightsApi';

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

/* ════════════════════════════════════════════════
   Forecast chart
   Historical = solid green · Forecast = dashed amber + 90% CI band
════════════════════════════════════════════════ */
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

/* Pretty model names + colors */
const MODEL_META = {
  prophet:      { name: 'Prophet',      color: '#2D6A4F' },
  xgboost:      { name: 'XGBoost',      color: '#C4952A' },
  holt_winters: { name: 'Holt-Winters', color: '#3B6CA8' },
};

/* 'YYYY-MM' → "Jul '26" */
function monthLabel(ym) {
  if (!ym || typeof ym !== 'string') return ym || '';
  const [y, m] = ym.split('-');
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const idx = parseInt(m, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx > 11) return ym;
  return `${names[idx]} '${(y || '').slice(2)}`;
}

/* ════════════════════════════════════════════════
   PAGE — CarboncastX
════════════════════════════════════════════════ */
export default function CarboncastXPage() {
  const [months,  setMonths]  = useState(12);
  const [payload, setPayload] = useState(null);   // full backend data object
  const [loading, setLoading] = useState(false);
  const [errMsg,  setErrMsg]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErrMsg('');
    try {
      const { data: res } = await insightsApi.getForecast(months);
      setPayload(res.data);
    } catch (e) {
      const apiData = e?.response?.data;
      // Backend returns { data: { success:false, error } } with 400 for insufficient data
      if (apiData?.data) setPayload(apiData.data);
      else { setErrMsg(apiData?.message || 'Could not generate forecast.'); setPayload(null); }
    } finally { setLoading(false); }
  }, [months]);

  useEffect(() => { load(); }, [load]);

  // Parse ML response
  const ml         = payload?.forecast;                       // raw ML service result
  const bestKey    = ml?.best_model;
  const models     = ml?.models || {};
  const bestModel  = bestKey ? models[bestKey] : null;
  const insufficient = payload && (payload.success === false || !bestModel);

  // Build chart-ready arrays
  const histRaw    = payload?.historical || [];
  const chartHist  = histRaw.map(h => ({ actual: h.value, label: monthLabel(h.month) }));
  const fcItems    = bestModel?.forecast || [];
  const chartFc    = fcItems.map(f => ({
    predicted: Math.round(f.predicted_emissions),
    upper:     Math.round(f.upper_bound),
    lower:     Math.round(f.lower_bound),
    label:     monthLabel(f.month),
  }));

  // Trend (compare last historical vs last forecast)
  let trend = 'Stable', trendColor = '#9BAEA5', monthlyChange = 0;
  if (chartHist.length && chartFc.length) {
    const lastHist = chartHist[chartHist.length - 1].actual;
    const lastFc   = chartFc[chartFc.length - 1].predicted;
    monthlyChange  = Math.round((lastFc - lastHist) / chartFc.length);
    if (monthlyChange > 1)      { trend = 'Increasing'; trendColor = '#DC2626'; }
    else if (monthlyChange < -1){ trend = 'Decreasing'; trendColor = '#2D6A4F'; }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#2D6A4F,#3B6CA8)' }}>
          <BrainCircuit className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1A2118' }}>CarboncastX</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9BAEA5' }}>
            AI emission forecasting · Prophet · XGBoost · Holt-Winters
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold" style={{ color: '#9BAEA5' }}>Forecast horizon:</span>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#F4F6F4', border: '1px solid #E5EAE8' }}>
          {[3, 6, 12, 24].map(n => (
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
        <BrainCircuit className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#2D6A4F' }} />
        <p className="text-xs leading-relaxed" style={{ color: '#5A7A6D' }}>
          <strong style={{ color: '#1A2118' }}>AI-powered forecast.</strong> We train three models — Prophet,
          XGBoost and Holt-Winters — on your data and automatically pick the most accurate one
          (lowest RMSE ⭐). The shaded band is the 90% confidence range.
        </p>
      </Card>

      {loading && <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" style={{ color: '#9BAEA5' }} /></div>}

      {!loading && errMsg && (
        <Card className="p-4 flex items-start gap-3" style={{ background:'#FEF2F2', border:'1px solid #FCA5A5' }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color:'#DC2626' }} />
          <p className="text-xs" style={{ color:'#991B1B' }}>{errMsg}</p>
        </Card>
      )}

      {!loading && payload && insufficient && (
        <Card>
          <div className="flex flex-col items-center justify-center py-14 text-center px-8">
            <BrainCircuit className="h-10 w-10 mb-3" style={{ color: '#C0DDD0' }} />
            <h3 className="text-base font-semibold mb-2" style={{ color: '#1A2118' }}>Need more data</h3>
            <p className="text-sm max-w-sm" style={{ color: '#9BAEA5' }}>
              {payload.error ?? 'Log carbon entries across at least 2 different months to generate predictions.'}
            </p>
            <p className="text-xs font-mono mt-3 px-3 py-2 rounded-lg" style={{ background: '#F4F6F4', color: '#7A9E8E' }}>
              Jan=120 kg, Feb=140 kg → predicts Mar ✓
            </p>
          </div>
        </Card>
      )}

      {!loading && payload && !insufficient && (
        <>
          {/* Model comparison badges */}
          <div className="flex gap-3 flex-wrap">
            {Object.entries(models).map(([key, mdl]) => {
              const meta = MODEL_META[key] || { name: key, color: '#7A9E8E' };
              const ok   = mdl.status === 'success' && mdl.metrics;
              const isBest = key === bestKey;
              return (
                <div key={key} className="px-3 py-2 rounded-lg flex flex-col gap-0.5"
                  style={{ background: isBest ? `${meta.color}12` : '#F8FAF8',
                           border: `1px solid ${isBest ? meta.color : '#E5EAE8'}` }}>
                  <span className="text-xs font-bold flex items-center gap-1" style={{ color: meta.color }}>
                    {isBest && '⭐'} {meta.name}
                  </span>
                  {ok ? (
                    <span className="text-[10px] font-mono" style={{ color:'#9BAEA5' }}>
                      RMSE {Number(mdl.metrics.rmse).toFixed(1)} · R² {Number(mdl.metrics.r2).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[10px]" style={{ color:'#DC2626' }}>unavailable</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Trend indicator */}
          <div className="flex gap-3 flex-wrap items-center">
            <span className="text-sm font-bold" style={{ color: '#1A2118' }}>Projected trend:</span>
            <span className="text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              style={{ background: `${trendColor}18`, color: trendColor }}>
              {trend === 'Increasing' ? '📈' : trend === 'Decreasing' ? '📉' : '➡️'}
              {trend} {monthlyChange > 0 ? '+' : ''}{monthlyChange} kg/month
            </span>
          </div>

          {/* Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-sm font-semibold" style={{ color:'#1A2118' }}>Historical + Predicted Emissions</h2>
                <p className="text-xs mt-0.5" style={{ color:'#9BAEA5' }}>
                  kg CO₂e per month · model: <strong>{(MODEL_META[bestKey]||{}).name || bestKey}</strong>
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5"><div className="w-8 h-0.5" style={{ background:'#2D6A4F' }}/><span style={{ color:'#9BAEA5' }}>Historical</span></div>
                <div className="flex items-center gap-1.5"><div className="w-8" style={{ height:'2px', borderTop:'2px dashed #C4952A' }}/><span style={{ color:'#9BAEA5' }}>Forecast</span></div>
                <div className="flex items-center gap-1.5"><div className="w-8 h-3 rounded-sm" style={{ background:'rgba(196,149,42,0.18)' }}/><span style={{ color:'#9BAEA5' }}>90% CI</span></div>
              </div>
            </div>
            {chartHist.length >= 1
              ? <ForecastChart historical={chartHist} forecast={chartFc} />
              : <p className="text-xs text-center py-8" style={{ color:'#9BAEA5' }}>No historical series to plot.</p>}
          </Card>

          {/* Month forecast cards */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#1A2118' }}>Next {chartFc.length} Months</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {chartFc.map((f, i) => (
                <motion.div key={f.label + i} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04, duration:0.4 }}>
                  <Card className="p-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 font-mono" style={{ color:'#C4952A' }}>{f.label}</p>
                    <p className="text-2xl font-bold" style={{ color:'#1A2118' }}>
                      {f.predicted>=1000?`${(f.predicted/1000).toFixed(1)}t`:f.predicted}
                    </p>
                    <p className="text-[10px] mb-1" style={{ color:'#9BAEA5' }}>{f.predicted>=1000?'tonnes':'kg'} CO₂e</p>
                    <p className="text-[9px] font-mono" style={{ color:'#C0CCC6' }}>{f.lower}–{f.upper}</p>
                    {i>0&&<div className="text-[10px] font-semibold mt-1" style={{ color:f.predicted>chartFc[i-1].predicted?'#DC2626':'#2D6A4F' }}>
                      {f.predicted>chartFc[i-1].predicted?'↑ +':'↓ −'}{Math.abs(f.predicted-chartFc[i-1].predicted)} kg
                    </div>}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

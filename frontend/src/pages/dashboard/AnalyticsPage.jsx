import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown, TrendingUp, Minus, BarChart3, Loader2,
  AlertCircle, Calculator, RefreshCw, BrainCircuit,
  Upload, X, Download, CheckCircle, FileText, Info,
} from 'lucide-react';
import { carbonApi }    from '../../api/carbonApi';
import { useAuthStore } from '../../store/authStore';
import { useNavigate }  from 'react-router-dom';
import { getInitials }  from '../../utils/helpers';
import toast            from 'react-hot-toast';

/* ─── Shared card ─────────────────────────────── */
function Card({ className = '', style = {}, children }) {
  return (
    <div className={`rounded-xl ${className}`}
      style={{ background: '#ffffff', border: '1px solid #E5EAE8', ...style }}>
      {children}
    </div>
  );
}

/* ─── Growth badge ────────────────────────────── */
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
      {down ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
      {down ? '' : '+'}{pct}% vs prior
    </span>
  );
}

/* ─── SVG area chart (for daily data) ─────────── */
function AreaChart({ data, color = '#2D6A4F', height = 140 }) {
  if (!data || data.length < 2) return (
    <div className="flex items-center justify-center text-xs" style={{ height, color: '#9BAEA5' }}>
      Not enough data points yet
    </div>
  );
  const W = 600; const H = height;
  const PAD = { t: 12, b: 24, l: 8, r: 8 };
  const max = Math.max(...data.map(d => d.value), 0.001);
  const iW = W - PAD.l - PAD.r; const iH = H - PAD.t - PAD.b;
  const pts = data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * iW,
    y: PAD.t + iH - (d.value / max) * iH,
    v: d.value, l: d.label,
  }));
  const line = pts.map((p, i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length-1].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} L${pts[0].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} Z`;
  const gradId = `ag${color.replace('#','')}`;
  const step = Math.max(1, Math.ceil(data.length / 8));
  return (
    <div className="w-full">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0.25,0.5,0.75,1].map(f => (
          <line key={f} x1={PAD.l} y1={PAD.t+iH*(1-f)} x2={W-PAD.r} y2={PAD.t+iH*(1-f)}
            stroke="#E5EAE8" strokeWidth="1" strokeDasharray="4,4" />
        ))}
        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5"
            fill={p.v>0?color:'none'} stroke={p.v>0?'#fff':'none'} strokeWidth="1.5" />
        ))}
        {pts.filter((_,i) => i%step===0||i===pts.length-1).map((p,i) => (
          <text key={i} x={p.x.toFixed(1)} y={H-4} textAnchor="middle" fontSize="9"
            fill="#9BAEA5" fontFamily="monospace">{p.l}</text>
        ))}
      </svg>
    </div>
  );
}

/* ─── Bar chart column ────────────────────────── */
function BarCol({ heightPct, color, label, value, delay=0 }) {
  const disp = value>=1000?`${(value/1000).toFixed(1)}t`:value>0?`${value.toFixed(1)}`:'';
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <span className="text-[9px] font-semibold truncate w-full text-center" style={{ color:'#3D5247', minHeight:'12px' }}>{disp}</span>
      <div className="w-full flex items-end rounded-md overflow-hidden" style={{ height:'100px', background:'#F4F6F4' }}>
        <motion.div className="w-full rounded-t-sm"
          initial={{ height:0 }} animate={{ height: heightPct>0?`${Math.max(heightPct,2)}%`:'2%' }}
          transition={{ delay, duration:0.65, ease:[0.16,1,0.3,1] }}
          style={{ background:color, opacity: heightPct>0?0.85:0.15 }} />
      </div>
      <span className="text-[9px] truncate w-full text-center" style={{ color:'#9BAEA5' }}>{label}</span>
    </div>
  );
}

/* ─── Scope bar ───────────────────────────────── */
function ScopeBar({ label, pct, color, kg }) {
  return (
    <div>
      <div className="flex justify-between items-center text-xs mb-1">
        <span style={{ color:'#5A7A6D' }}>{label}</span>
        <div className="flex items-center gap-2">
          <span style={{ color:'#9BAEA5' }}>{kg>=1000?`${(kg/1000).toFixed(2)}t`:`${kg}kg`}</span>
          <span className="font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full" style={{ background:'#F0EDE4' }}>
        <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }}
          transition={{ delay:0.4, duration:0.7 }}
          className="h-full rounded-full" style={{ background:color }} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   FORECAST CHART  (historical + predicted)
════════════════════════════════════════════════ */
function ForecastChart({ historical, forecast: fc }) {
  const all  = [...historical, ...fc];
  const W=720, H=200;
  const PAD = { t:20, b:32, l:12, r:12 };
  const iW = W-PAD.l-PAD.r; const iH = H-PAD.t-PAD.b;
  const maxVal = Math.max(...historical.map(h=>h.actual), ...fc.map(f=>f.upper), 0.001);
  const toXY = (i0, val) => ({
    x: PAD.l + (i0/(all.length-1)) * iW,
    y: PAD.t + iH - (val/maxVal) * iH,
  });
  const hPts = historical.map((h,i) => ({ ...toXY(i, h.actual), v:h.actual, label:h.label }));
  const fPts = fc.map((f,i) => ({
    ...toXY(historical.length+i, f.predicted),
    upper: toXY(historical.length+i, f.upper).y,
    lower: toXY(historical.length+i, f.lower).y,
    v:f.predicted, label:f.label, lo:f.lower, hi:f.upper,
  }));
  const hPath = hPts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fPath = hPts.length
    ? `M${hPts[hPts.length-1].x.toFixed(1)},${hPts[hPts.length-1].y.toFixed(1)} `
      + fPts.map(p=>`L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    : '';
  const bandPath = fPts.length>=1
    ? fPts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.upper.toFixed(1)}`).join(' ')
      + ' ' + fPts.slice().reverse().map(p=>`L${p.x.toFixed(1)},${p.lower.toFixed(1)}`).join(' ') + ' Z'
    : '';
  const divX = hPts.length ? hPts[hPts.length-1].x : 0;
  const step = Math.max(1, Math.ceil(all.length/9));
  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ minWidth:'340px' }}>
        {[0.25,0.5,0.75,1].map(f=>(
          <line key={f} x1={PAD.l} y1={PAD.t+iH*(1-f)} x2={W-PAD.r} y2={PAD.t+iH*(1-f)} stroke="#F0EDE4" strokeWidth="1" />
        ))}
        {bandPath&&<path d={bandPath} fill="#C4952A" opacity="0.12" />}
        {hPath&&(
          <>
            <defs>
              <linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.01" />
              </linearGradient>
            </defs>
            <path d={`${hPath} L${hPts[hPts.length-1].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} L${hPts[0].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} Z`} fill="url(#hGrad)" />
            <path d={hPath} fill="none" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {fPath&&<path d={fPath} fill="none" stroke="#C4952A" strokeWidth="2.5" strokeDasharray="7,4" strokeLinecap="round" strokeLinejoin="round" />}
        {hPts.length>0&&<line x1={divX.toFixed(1)} y1={PAD.t} x2={divX.toFixed(1)} y2={(PAD.t+iH).toFixed(1)} stroke="#9BAEA5" strokeWidth="1.5" strokeDasharray="5,4" />}
        {hPts.map((p,i)=><circle key={`h${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4" fill="#2D6A4F" stroke="#fff" strokeWidth="1.5" />)}
        {fPts.map((p,i)=><circle key={`f${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4" fill="#C4952A" stroke="#fff" strokeWidth="1.5" />)}
        {all.map((pt,i)=>{
          if(i%step!==0&&i!==all.length-1) return null;
          const px=i<historical.length?hPts[i].x:fPts[i-historical.length].x;
          const isFc=i>=historical.length;
          return <text key={i} x={px.toFixed(1)} y={H-6} textAnchor="middle" fontSize="9.5"
            fill={isFc?'#C4952A':'#9BAEA5'} fontFamily="monospace" fontWeight={isFc?'600':'400'}>{pt.label}</text>;
        })}
        <text x={PAD.l} y={PAD.t-6} fontSize="9" fill="#2D6A4F" fontFamily="sans-serif" fontWeight="600">Historical</text>
        {fPts.length>0&&<text x={fPts[0].x.toFixed(1)} y={PAD.t-6} fontSize="9" fill="#C4952A" fontFamily="sans-serif" fontWeight="600">Predicted →</text>}
      </svg>
    </div>
  );
}

/* ─── Sustainability score ring ───────────────── */
function ScoreCard({ score }) {
  if (!score) return null;
  const circ = 2*Math.PI*40;
  const dash = circ*(1-score.score/100);
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color:'#1A2118' }}>Sustainability Score</h3>
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0" style={{ width:88, height:88 }}>
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" stroke="#F0EDE4" strokeWidth="8" />
            <motion.circle cx="44" cy="44" r="36" fill="none" stroke={score.color} strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circ}
              initial={{ strokeDashoffset:circ }} animate={{ strokeDashoffset:dash }}
              transition={{ duration:1.2, ease:[0.16,1,0.3,1] }}
              style={{ transformOrigin:'44px 44px', transform:'rotate(-90deg)' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold" style={{ color:score.color }}>{score.score}</span>
            <span className="text-xs font-bold" style={{ color:score.color }}>{score.grade}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold mb-1" style={{ color:score.color }}>{score.label}</p>
          <p className="text-xs leading-relaxed" style={{ color:'#7A9E8E' }}>
            {score.score>=85?'Outstanding! Well below average emissions.'
              :score.score>=70?'Good progress. Keep logging consistently.'
              :score.score>=55?'Room to improve — log more regularly.'
              :score.score>=40?'High emissions. Review top sources.'
              :'Critical level. Immediate action needed.'}
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ─── Employee comparison ─────────────────────── */
function EmployeeComparison({ data }) {
  if (!data?.length) return null;
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color:'#1A2118' }}>Employee Comparison</h3>
      <div className="space-y-3">
        {data.map((emp,i)=>(
          <div key={emp.user.id} className="flex items-center gap-3">
            <span className="text-xs font-bold w-5 text-right flex-shrink-0" style={{ color:i===0?'#C4952A':'#9BAEA5' }}>#{i+1}</span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white"
              style={{ background:i===0?'#C4952A':'#8B9E95' }}>{getInitials(emp.user.name)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold truncate" style={{ color:'#1A2118' }}>{emp.user.name}</span>
                <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color:i===0?'#C4952A':'#2D6A4F' }}>
                  {emp.totalKg>=1000?`${(emp.totalKg/1000).toFixed(2)}t`:`${emp.totalKg}kg`}
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background:'#F0EDE4' }}>
                <motion.div initial={{ width:0 }} animate={{ width:`${emp.barPct}%` }}
                  transition={{ delay:i*0.06+0.3, duration:0.6 }}
                  className="h-full rounded-full"
                  style={{ background:i===0?'#C4952A':i<3?'#2D6A4F':'#52B788' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Empty state ─────────────────────────────── */
function EmptyState({ navigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background:'#EAF4EE' }}>
        <BarChart3 className="h-7 w-7" style={{ color:'#2D6A4F' }} />
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color:'#1A2118' }}>No data yet</h3>
      <p className="text-sm max-w-xs mb-5" style={{ color:'#9BAEA5' }}>
        Log carbon entries in Activities → Calculator to see analytics here.
      </p>
      <button onClick={()=>navigate('/dashboard/activities')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
        style={{ background:'#2D6A4F' }}>
        <Calculator className="h-4 w-4" /> Open Calculator
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════
   CSV UPLOAD MODAL
════════════════════════════════════════════════ */
const SAMPLE_CSV = `date,category,sub_category,quantity,description,user_email
2026-01-15,commute,car_petrol,25,Morning commute,
2026-01-20,energy,electricity,150,Office electricity bill,
2026-02-05,travel,flight_short,800,Karachi to Lahore flight,
2026-02-10,food,beef,3,Weekly meals,wardahzia4@gmail.com
2026-03-01,commute,bus,60,Monthly bus travel,`;

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'carbonx_sample.csv'; a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines   = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV needs a header row and at least one data row');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z_]/g,''));
  return lines.slice(1).map((line, i) => {
    // Naive split — handles simple CSVs (no quoted commas)
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g,''));
    const row  = {};
    headers.forEach((h, j) => { row[h] = vals[j] ?? ''; });
    row._row = i + 2;
    return row;
  });
}

function CSVUploadModal({ onClose, onSuccess }) {
  const [rows,     setRows]     = useState([]);
  const [errors,   setErrors]   = useState([]);
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const fileRef = useRef();

  function handleFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { toast.error('Please upload a .csv file'); return; }
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseCSV(e.target.result);
        setRows(parsed);
        setErrors([]);
      } catch (err) {
        toast.error(err.message);
        setRows([]); setErrors([]);
      }
    };
    reader.readAsText(file);
  }

  async function handleUpload() {
    if (!rows.length) return;
    setLoading(true);
    try {
      const { data: res } = await carbonApi.bulkUpload(rows);
      setResult(res.data);
      if (res.data.inserted > 0) {
        toast.success(`${res.data.inserted} entries imported!`);
        onSuccess?.();
      }
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  const VALID_CATS = {
    commute: ['car_petrol','car_diesel','car_electric','motorbike','bus','train','walking'],
    energy:  ['electricity','natural_gas','lpg','diesel_gen'],
    travel:  ['flight_short','flight_long','car_rental','taxi'],
    food:    ['beef','chicken','fish','vegetarian','vegan'],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)' }}>
      <motion.div initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background:'#fff', border:'1px solid #E5EAE8', maxHeight:'90vh', overflowY:'auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom:'1px solid #E5EAE8' }}>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5" style={{ color:'#2D6A4F' }} />
            <h2 className="text-sm font-bold" style={{ color:'#1A2118' }}>Import Historical Data (CSV)</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" style={{ color:'#9BAEA5' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Format spec */}
          <div className="rounded-xl p-4 text-xs space-y-2" style={{ background:'#F8FAF8', border:'1px solid #E5EAE8' }}>
            <p className="font-bold" style={{ color:'#1A2118' }}>Required CSV Format</p>
            <code className="block p-2 rounded-lg text-[11px] font-mono overflow-x-auto"
              style={{ background:'#1A2118', color:'#52B788' }}>
              date,category,sub_category,quantity,description,user_email
            </code>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { col:'date',         ex:'2026-01-15',   note:'YYYY-MM-DD · past dates only' },
                { col:'category',     ex:'commute',       note:'commute | energy | travel | food' },
                { col:'sub_category', ex:'car_petrol',    note:'see full list below' },
                { col:'quantity',     ex:'25',            note:'positive number (km / kWh / meal)' },
                { col:'description',  ex:'Daily commute', note:'optional — free text' },
                { col:'user_email',   ex:'john@co.com',   note:'optional — leave blank for yourself' },
              ].map(r => (
                <div key={r.col} className="p-2 rounded-lg" style={{ background:'#fff', border:'1px solid #E5EAE8' }}>
                  <span className="font-bold font-mono" style={{ color:'#2D6A4F' }}>{r.col}</span>
                  <span className="ml-1.5" style={{ color:'#9BAEA5' }}>e.g. {r.ex}</span>
                  <p className="mt-0.5" style={{ color:'#7A9E8E' }}>{r.note}</p>
                </div>
              ))}
            </div>

            {/* Valid sub-categories */}
            <div className="mt-2 pt-2" style={{ borderTop:'1px solid #E5EAE8' }}>
              <p className="font-semibold mb-1.5" style={{ color:'#1A2118' }}>Valid sub_category values:</p>
              {Object.entries(VALID_CATS).map(([cat, subs]) => (
                <div key={cat} className="mb-1">
                  <span className="font-bold capitalize" style={{ color:'#2D6A4F' }}>{cat}:</span>{' '}
                  <span className="font-mono" style={{ color:'#5A7A6D' }}>{subs.join(', ')}</span>
                </div>
              ))}
            </div>

            <button onClick={downloadSample}
              className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
              style={{ background:'#EAF4EE', color:'#2D6A4F' }}>
              <Download className="h-3.5 w-3.5" /> Download sample CSV
            </button>
          </div>

          {/* Drop zone */}
          {!result && (
            <div
              onDragOver={e=>{e.preventDefault();setDragging(true)}}
              onDragLeave={()=>setDragging(false)}
              onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0])}}
              onClick={()=>fileRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all"
              style={{
                border:`2px dashed ${dragging?'#2D6A4F':'#D0DDD8'}`,
                background: dragging?'#EAF4EE':'#F8FAF8',
                padding:'28px 20px',
              }}>
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={e=>handleFile(e.target.files[0])} />
              <FileText className="h-8 w-8 mb-2" style={{ color: dragging?'#2D6A4F':'#9BAEA5' }} />
              {fileName
                ? <p className="text-sm font-semibold" style={{ color:'#1A2118' }}>{fileName}</p>
                : <p className="text-sm font-semibold" style={{ color:'#5A7A6D' }}>Drop CSV here or click to browse</p>
              }
              <p className="text-xs mt-1" style={{ color:'#9BAEA5' }}>Max 1 000 rows per upload</p>
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && !result && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color:'#1A2118' }}>
                Preview — {rows.length} row{rows.length!==1?'s':''} detected
              </p>
              <div className="overflow-x-auto rounded-xl" style={{ border:'1px solid #E5EAE8' }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background:'#F4F6F4' }}>
                      {['date','category','sub_category','quantity','description','user_email'].map(h=>(
                        <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color:'#5A7A6D' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0,8).map((r,i)=>(
                      <tr key={i} style={{ borderTop:'1px solid #F0EDE4' }}>
                        {['date','category','sub_category','quantity','description','user_email'].map(h=>(
                          <td key={h} className="px-3 py-2" style={{ color:'#3D5247' }}>{r[h]||'—'}</td>
                        ))}
                      </tr>
                    ))}
                    {rows.length>8&&(
                      <tr style={{ borderTop:'1px solid #F0EDE4' }}>
                        <td colSpan={6} className="px-3 py-2 text-center" style={{ color:'#9BAEA5' }}>
                          +{rows.length-8} more rows…
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upload result */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background:'#EAF4EE', border:'1px solid #C0DDD0' }}>
                <CheckCircle className="h-5 w-5 flex-shrink-0" style={{ color:'#2D6A4F' }} />
                <div>
                  <p className="text-sm font-bold" style={{ color:'#1B4332' }}>
                    {result.inserted} entries imported successfully
                  </p>
                  {result.errors?.length>0 && (
                    <p className="text-xs mt-0.5" style={{ color:'#5A7A6D' }}>
                      {result.errors.length} row{result.errors.length!==1?'s':''} skipped with errors
                    </p>
                  )}
                </div>
              </div>
              {result.errors?.length>0 && (
                <div className="rounded-xl overflow-hidden" style={{ border:'1px solid #FECACA' }}>
                  <p className="px-3 py-2 text-xs font-semibold" style={{ background:'#FEF2F2', color:'#DC2626' }}>
                    Rows with errors (skipped):
                  </p>
                  {result.errors.slice(0,5).map((e,i)=>(
                    <div key={i} className="px-3 py-2 text-xs" style={{ borderTop:'1px solid #FEF2F2', color:'#7f1d1d' }}>
                      Row {e.row}: {e.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
              style={{ background:'#F4F6F4', color:'#5A7A6D' }}>
              {result?'Close':'Cancel'}
            </button>
            {!result && rows.length>0 && (
              <button onClick={handleUpload} disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background:'#2D6A4F' }}>
                {loading?<Loader2 className="h-4 w-4 animate-spin" />:<Upload className="h-4 w-4" />}
                {loading?'Importing…':`Import ${rows.length} rows`}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════════ */
const TABS   = [
  { id:'overview', label:'Overview',    Icon: BarChart3    },
  { id:'forecast', label:'AI Forecast', Icon: BrainCircuit },
];
const RANGES = [
  { label:'Last 7 Days',    period:'7days'   },
  { label:'Last 30 Days',   period:'30days'  },
  { label:'Last 6 Months',  period:'6months' },
  { label:'Last 12 Months', period:'year'    },
];
const FC_MONTHS = [3,6,9,12];
const SCOPE_COLORS = ['#2D6A4F','#C4952A','#8B5E3C','#52B788'];
const CAT_COLORS   = { commute:'#2D6A4F', energy:'#C4952A', travel:'#8B5E3C', food:'#52B788' };
const BAR_COLOR    = (i) => i%3===0?'#2D6A4F':i%3===1?'#C4952A':'#8B5E3C';

/* ════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const { user }  = useAuthStore();
  const navigate  = useNavigate();
  const isAdmin   = user?.role === 'ADMIN';

  const [tab,        setTab]        = useState('overview');
  const [rangeIdx,   setRangeIdx]   = useState(2);        // default 6 months
  const [fcMonths,   setFcMonths]   = useState(6);
  const [analytics,  setAnalytics]  = useState(null);
  const [forecast,   setForecast]   = useState(null);
  const [loadingA,   setLoadingA]   = useState(true);
  const [loadingF,   setLoadingF]   = useState(false);
  const [errorA,     setErrorA]     = useState('');
  const [errorF,     setErrorF]     = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const period = RANGES[rangeIdx].period;

  const fetchAnalytics = useCallback(async () => {
    setLoadingA(true); setErrorA('');
    try {
      const { data: res } = await carbonApi.getAnalytics(period);
      setAnalytics(res.data);
    } catch (e) {
      setErrorA(e?.response?.data?.message ?? 'Failed to load analytics.');
    } finally { setLoadingA(false); }
  }, [period]);

  const fetchForecast = useCallback(async () => {
    setLoadingF(true); setErrorF('');
    try {
      const { data: res } = await carbonApi.getForecast(fcMonths);
      setForecast(res.data);
    } catch (e) {
      setErrorF(e?.response?.data?.message ?? 'Failed to generate forecast.');
    } finally { setLoadingF(false); }
  }, [fcMonths]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
  useEffect(() => { if (tab === 'forecast') fetchForecast(); }, [tab, fetchForecast]);

  const maxBar  = analytics ? Math.max(...analytics.timeSeries.map(m=>m.total), 0.001) : 0.001;
  const isDaily = analytics?.grain === 'day';
  const lineData = analytics?.timeSeries.map(d=>({ label:d.label, value:d.total })) ?? [];
  const fcModel  = forecast?.model;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color:'#1A2118' }}>AI Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color:'#9BAEA5' }}>
            {isAdmin ? 'Organisation-wide intelligence · predictive emissions modelling'
                     : 'Personal emission trends · AI-powered forecasting'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Admin CSV upload */}
          {isAdmin && (
            <button onClick={()=>setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ background:'#EAF4EE', color:'#2D6A4F', border:'1px solid #C0DDD0' }}>
              <Upload className="h-4 w-4" /> Import CSV
            </button>
          )}
          <button onClick={tab==='overview'?fetchAnalytics:fetchForecast}
            disabled={tab==='overview'?loadingA:loadingF}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-40"
            style={{ color:'#7A9E8E', border:'1px solid #E5EAE8' }}>
            <RefreshCw className={`h-4 w-4 ${(tab==='overview'?loadingA:loadingF)?'animate-spin':''}`} />
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background:'#F4F6F4', border:'1px solid #E5EAE8' }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={()=>setTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={id===tab
              ? { background:'#ffffff', color:'#1B4332', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }
              : { color:'#7A9E8E' }}>
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ══════════════════════════════════════════
            OVERVIEW TAB
        ══════════════════════════════════════════ */}
        {tab === 'overview' && (
          <motion.div key="overview"
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0 }} transition={{ duration:0.25 }}
            className="space-y-5">

            {/* Period selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1 p-1 rounded-lg" style={{ background:'#F4F6F4', border:'1px solid #E5EAE8' }}>
                {RANGES.map((r,i)=>(
                  <button key={r.period} onClick={()=>setRangeIdx(i)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap"
                    style={i===rangeIdx?{background:'#2D6A4F',color:'#fff'}:{color:'#7A9E8E'}}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {errorA && (
              <div className="p-4 rounded-xl flex items-center gap-3" style={{ background:'#FEF2F2', border:'1px solid #FECACA' }}>
                <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color:'#DC2626' }} />
                <p className="text-sm" style={{ color:'#DC2626' }}>{errorA}</p>
              </div>
            )}

            {loadingA && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color:'#9BAEA5' }} />
              </div>
            )}

            {!loadingA && !errorA && analytics && (
              <AnimatePresence mode="wait">
                <motion.div key={period}
                  initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0 }} transition={{ duration:0.2 }}
                  className="space-y-5">

                  {/* KPI cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label:'Total Emissions',      val:analytics.kpis.total,  growth:analytics.kpis.growth.total,  accent:'#2D6A4F' },
                      { label:'Scope 1 — Direct',     val:analytics.kpis.scope1, growth:analytics.kpis.growth.scope1, accent:'#2D6A4F' },
                      { label:'Scope 2 — Indirect',   val:analytics.kpis.scope2, growth:analytics.kpis.growth.scope2, accent:'#C4952A' },
                      { label:'Scope 3 — Value Chain',val:analytics.kpis.scope3, growth:analytics.kpis.growth.scope3, accent:'#8B5E3C' },
                    ].map((k,i)=>(
                      <motion.div key={k.label}
                        initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                        transition={{ delay:i*0.06, duration:0.4 }}>
                        <Card className="p-4">
                          <p className="text-xs font-medium mb-2 leading-snug" style={{ color:'#9BAEA5' }}>{k.label}</p>
                          <p className="text-xl font-bold mb-1" style={{ color:'#1A2118' }}>
                            {k.val>=1000
                              ? <>{(k.val/1000).toFixed(2)}<span className="text-sm font-normal ml-1" style={{ color:'#9BAEA5' }}>t</span></>
                              : <>{k.val.toFixed(2)}<span className="text-sm font-normal ml-1" style={{ color:'#9BAEA5' }}>kg</span></>}
                          </p>
                          <Growth pct={k.growth} />
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {analytics.kpis.entryCount===0 ? (
                    <Card><EmptyState navigate={navigate} /></Card>
                  ) : (
                    <>
                      {/* Main chart */}
                      <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-sm font-semibold" style={{ color:'#1A2118' }}>
                              {isDaily?'Daily':'Monthly'} Emissions Trend
                            </h2>
                            <p className="text-xs mt-0.5" style={{ color:'#9BAEA5' }}>
                              {isDaily?'kg CO₂e per day':'kg CO₂e per month'} · {RANGES[rangeIdx].label}
                            </p>
                          </div>
                        </div>
                        {isDaily
                          ? <AreaChart data={lineData} color="#2D6A4F" height={150} />
                          : (
                            <div className="flex items-end gap-1.5 overflow-x-auto pb-1">
                              {analytics.timeSeries.map((m,i)=>(
                                <BarCol key={m.label} heightPct={(m.total/maxBar)*100}
                                  color={BAR_COLOR(i)} label={m.label} value={m.total} delay={i*0.03} />
                              ))}
                            </div>
                          )
                        }
                      </Card>

                      {/* Scope + Top sources */}
                      <div className="grid lg:grid-cols-3 gap-5">
                        <Card className="p-6 lg:col-span-2">
                          <h2 className="text-sm font-semibold mb-5" style={{ color:'#1A2118' }}>Scope Breakdown</h2>
                          <div className="space-y-4">
                            {analytics.scopeBreakdown.map((s,i)=>(
                              <ScopeBar key={s.scope} label={s.scope} pct={s.percentage}
                                kg={s.kg} color={SCOPE_COLORS[i%SCOPE_COLORS.length]} />
                            ))}
                          </div>
                        </Card>
                        <Card className="p-6">
                          <h2 className="text-sm font-semibold mb-4" style={{ color:'#1A2118' }}>Top Sources</h2>
                          {analytics.topSources.map(s=>(
                            <div key={s.source} className="flex justify-between items-center py-2 text-xs capitalize"
                              style={{ borderBottom:'1px solid #F0EDE4' }}>
                              <span style={{ color:'#5A7A6D' }}>{s.source}</span>
                              <div className="flex items-center gap-2">
                                <span style={{ color:'#9BAEA5' }}>{s.totalKg>=1000?`${(s.totalKg/1000).toFixed(2)}t`:`${s.totalKg}kg`}</span>
                                <span className="font-bold" style={{ color:'#1A2118' }}>{s.percentage}%</span>
                              </div>
                            </div>
                          ))}
                        </Card>
                      </div>

                      {/* Category cards */}
                      {analytics.byCategory.length>0&&(
                        <Card className="p-6">
                          <h2 className="text-sm font-semibold mb-5" style={{ color:'#1A2118' }}>By Category</h2>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {analytics.byCategory.map(cat=>{
                              const c = CAT_COLORS[cat.category]??'#9BAEA5';
                              return (
                                <div key={cat.category} className="rounded-xl p-4"
                                  style={{ background:'#F8FAF8', border:'1px solid #E5EAE8' }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold capitalize" style={{ color:'#1A2118' }}>{cat.category}</span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                      style={{ background:`${c}18`, color:c }}>{cat.percentage}%</span>
                                  </div>
                                  <p className="text-xl font-bold" style={{ color:'#1A2118' }}>
                                    {cat.totalKg>=1000?`${(cat.totalKg/1000).toFixed(2)}t`:`${cat.totalKg}kg`}
                                  </p>
                                  <p className="text-xs mt-0.5 mb-3" style={{ color:'#9BAEA5' }}>CO₂e</p>
                                  <div className="h-1.5 rounded-full" style={{ background:'#E5EAE8' }}>
                                    <motion.div initial={{ width:0 }} animate={{ width:`${cat.percentage}%` }}
                                      transition={{ delay:0.3, duration:0.7 }}
                                      className="h-full rounded-full" style={{ background:c }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Card>
                      )}

                      {/* Score + employee comparison */}
                      <div className={`grid gap-5 ${isAdmin&&analytics.employeeComparison?.length?'lg:grid-cols-2':''}`}>
                        <ScoreCard score={analytics.sustainabilityScore} />
                        {isAdmin&&<EmployeeComparison data={analytics.employeeComparison} />}
                      </div>

                      {isAdmin&&(
                        <div className="p-4 rounded-xl flex items-center gap-3"
                          style={{ background:'#EAF4EE', border:'1px solid #C0DDD0' }}>
                          <TrendingDown className="h-4 w-4 flex-shrink-0" style={{ color:'#2D6A4F' }} />
                          <p className="text-sm" style={{ color:'#1B4332' }}>
                            <strong>Organisation view</strong> — aggregating all employees' entries.
                            Individual rankings are in Activities → Leaderboard.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            AI FORECAST TAB
        ══════════════════════════════════════════ */}
        {tab === 'forecast' && (
          <motion.div key="forecast"
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0 }} transition={{ duration:0.25 }}
            className="space-y-5">

            {/* Forecast horizon */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold" style={{ color:'#9BAEA5' }}>Forecast horizon:</span>
              <div className="flex gap-1 p-1 rounded-lg" style={{ background:'#F4F6F4', border:'1px solid #E5EAE8' }}>
                {FC_MONTHS.map(n=>(
                  <button key={n} onClick={()=>setFcMonths(n)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all"
                    style={n===fcMonths?{background:'#2D6A4F',color:'#fff'}:{color:'#7A9E8E'}}>
                    +{n} mo
                  </button>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="p-4 rounded-xl flex items-start gap-3"
              style={{ background:'#F8FAF8', border:'1px solid #E5EAE8' }}>
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color:'#2D6A4F' }} />
              <p className="text-xs leading-relaxed" style={{ color:'#5A7A6D' }}>
                <strong style={{ color:'#1A2118' }}>OLS Linear Regression</strong> — fits a best-fit line through your
                monthly emission totals (X = month index, Y = kg CO₂e), then extrapolates forward.
                The shaded band is a <strong>90% prediction interval</strong> — it widens the further into
                the future we look. More months of logged data → higher R² → more reliable predictions.
              </p>
            </div>

            {errorF && (
              <div className="p-4 rounded-xl flex items-center gap-3" style={{ background:'#FEF2F2', border:'1px solid #FECACA' }}>
                <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color:'#DC2626' }} />
                <p className="text-sm" style={{ color:'#DC2626' }}>{errorF}</p>
              </div>
            )}

            {loadingF && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color:'#9BAEA5' }} />
              </div>
            )}

            {!loadingF && !errorF && forecast && (
              <>
                {!forecast.model || forecast.historical.length < 2 ? (
                  <Card>
                    <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background:'#EAF4EE' }}>
                        <BrainCircuit className="h-7 w-7" style={{ color:'#2D6A4F' }} />
                      </div>
                      <h3 className="text-base font-semibold mb-2" style={{ color:'#1A2118' }}>
                        Not enough data yet
                      </h3>
                      <p className="text-sm max-w-sm mb-2" style={{ color:'#9BAEA5' }}>
                        {forecast.error ?? 'Log carbon entries across at least 2 different months to generate predictions.'}
                      </p>
                      <p className="text-xs font-mono px-3 py-2 rounded-lg mt-2"
                        style={{ background:'#F4F6F4', color:'#7A9E8E' }}>
                        Jan=120 kg, Feb=140 kg → predicts Mar=160 kg ✓
                      </p>
                      {isAdmin && (
                        <button onClick={()=>setShowUpload(true)}
                          className="flex items-center gap-2 mt-4 px-5 py-2.5 rounded-lg text-sm font-semibold"
                          style={{ background:'#2D6A4F', color:'#fff' }}>
                          <Upload className="h-4 w-4" /> Import Historical CSV
                        </button>
                      )}
                    </div>
                  </Card>
                ) : (
                  <>
                    {/* Model quality pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: fcModel.r2Pct>=90?'#EAF4EE':fcModel.r2Pct>=70?'#EAF4EE':fcModel.r2Pct>=50?'#FDF5E6':'#FEF2F2',
                          color:      fcModel.r2Pct>=90?'#2D6A4F':fcModel.r2Pct>=70?'#2D6A4F':fcModel.r2Pct>=50?'#C4952A':'#DC2626',
                        }}>
                        R² = {fcModel.r2Pct}% · {fcModel.confidence} accuracy
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background:`${fcModel.trendColor}14`, color:fcModel.trendColor }}>
                        {fcModel.trend} · {fcModel.monthlyChange>0?'+':''}{fcModel.monthlyChange} kg/month
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                        style={{ background:'#F4F6F4', color:'#9BAEA5', border:'1px solid #E5EAE8' }}>
                        {fcModel.dataPoints} historical months · {fcModel.forecastMonths} predicted
                      </span>
                    </div>

                    {/* Forecast chart */}
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                        <div>
                          <h2 className="text-sm font-semibold" style={{ color:'#1A2118' }}>Historical + Predicted Emissions</h2>
                          <p className="text-xs mt-0.5" style={{ color:'#9BAEA5' }}>kg CO₂e per month</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-8 h-0.5" style={{ background:'#2D6A4F' }} />
                            <span style={{ color:'#9BAEA5' }}>Historical</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-8" style={{ height:'2px', borderTop:'2px dashed #C4952A' }} />
                            <span style={{ color:'#9BAEA5' }}>Forecast</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-8 h-3 rounded-sm" style={{ background:'rgba(196,149,42,0.18)' }} />
                            <span style={{ color:'#9BAEA5' }}>90% CI</span>
                          </div>
                        </div>
                      </div>
                      <ForecastChart historical={forecast.historical} forecast={forecast.forecast} />
                    </Card>

                    {/* Month prediction cards */}
                    <div>
                      <h2 className="text-sm font-semibold mb-3" style={{ color:'#1A2118' }}>Month-by-Month Predictions</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {forecast.forecast.map((f,i)=>(
                          <motion.div key={f.label}
                            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                            transition={{ delay:i*0.06, duration:0.4 }}>
                            <Card className="p-4 text-center">
                              <p className="text-xs font-bold uppercase tracking-wider mb-2"
                                style={{ color:'#C4952A', fontFamily:"'JetBrains Mono', monospace" }}>{f.label}</p>
                              <p className="text-2xl font-bold mb-0.5" style={{ color:'#1A2118' }}>
                                {f.predicted>=1000?`${(f.predicted/1000).toFixed(2)}t`:f.predicted}
                              </p>
                              <p className="text-[10px] mb-3" style={{ color:'#9BAEA5' }}>
                                {f.predicted>=1000?'tonnes':'kg'} CO₂e
                              </p>
                              <div className="text-[10px] pt-2.5" style={{ borderTop:'1px solid #F0EDE4', color:'#9BAEA5' }}>
                                <div className="flex justify-between"><span>Low</span><span>High</span></div>
                                <div className="flex justify-between font-semibold mt-0.5" style={{ color:'#7A9E8E' }}>
                                  <span>{f.lower>=1000?`${(f.lower/1000).toFixed(1)}t`:f.lower}</span>
                                  <span>{f.upper>=1000?`${(f.upper/1000).toFixed(1)}t`:f.upper}</span>
                                </div>
                              </div>
                              {i>0&&(
                                <div className="mt-2 text-[10px] font-semibold"
                                  style={{ color:f.predicted>forecast.forecast[i-1].predicted?'#DC2626':'#2D6A4F' }}>
                                  {f.predicted>forecast.forecast[i-1].predicted?'↑':'↓'}{' '}
                                  {Math.abs(f.predicted-forecast.forecast[i-1].predicted).toFixed(1)} kg
                                </div>
                              )}
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Model equation card */}
                    <Card className="p-6">
                      <h2 className="text-sm font-semibold mb-4" style={{ color:'#1A2118' }}>Model Details</h2>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {[
                          { label:'Model Type',      value:'Linear Regression (OLS)',  sub:'Ordinary Least Squares' },
                          { label:'R² Accuracy',     value:`${fcModel.r2Pct}%`,         sub:`${fcModel.confidence} confidence` },
                          { label:'Monthly Trend',   value:`${fcModel.slope>0?'+':''}${fcModel.slope} kg/mo`, sub:fcModel.trend },
                          { label:'Base Intercept',  value:`${fcModel.intercept} kg`,   sub:'Regression constant' },
                        ].map(s=>(
                          <div key={s.label} className="rounded-xl p-4" style={{ background:'#F8FAF8', border:'1px solid #E5EAE8' }}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color:'#9BAEA5' }}>{s.label}</p>
                            <p className="text-sm font-bold" style={{ color:'#1A2118' }}>{s.value}</p>
                            <p className="text-[10px] mt-0.5" style={{ color:'#9BAEA5' }}>{s.sub}</p>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 rounded-xl font-mono text-sm text-center"
                        style={{ background:'#F4F6F4', border:'1px solid #E5EAE8', color:'#2D6A4F' }}>
                        ŷ = {fcModel.slope>0?'+':''}{fcModel.slope} × month + {fcModel.intercept}
                      </div>
                      <div className="mt-3 p-3 rounded-xl text-xs" style={{ background:'#EAF4EE', color:'#3D5247' }}>
                        <strong>R² = {fcModel.r2Pct}%</strong> — the model explains {fcModel.r2Pct}% of variance in your data.{' '}
                        {fcModel.r2Pct>=85?'Excellent fit — predictions are highly reliable.'
                          :fcModel.r2Pct>=65?'Good fit — log more data to improve accuracy.'
                          :'Moderate fit — log consistently over more months for better predictions.'}
                      </div>
                    </Card>
                  </>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSV Upload Modal */}
      {showUpload && (
        <CSVUploadModal
          onClose={()=>setShowUpload(false)}
          onSuccess={()=>{ fetchAnalytics(); if(tab==='forecast') fetchForecast(); }}
        />
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown, TrendingUp, Minus, BarChart3, Loader2,
  AlertCircle, Calculator, RefreshCw, X, HelpCircle,
} from 'lucide-react';
import { carbonApi }    from '../../api/carbonApi';
import { useAuthStore } from '../../store/authStore';
import { useNavigate }  from 'react-router-dom';
import { getInitials }  from '../../utils/helpers';

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
      {down ? '' : '+'}{pct}% vs prior period
    </span>
  );
}

/* ─── Score explanation modal ─────────────────── */
function ScoreModal({ score, onClose }) {
  const GRADES = [
    { g: 'A', range: '85–100', color: '#2D6A4F', bg: '#EAF4EE', title: 'Outstanding',  desc: 'Your daily emissions are exceptionally low. You are a sustainability leader — keep logging consistently to maintain this level.' },
    { g: 'B', range: '70–84',  color: '#52B788', bg: '#F0FAF4', title: 'Good',          desc: 'Above-average performance. Small improvements in commute or energy will push you into the A band.' },
    { g: 'C', range: '55–69',  color: '#C4952A', bg: '#FDF5E6', title: 'Moderate',      desc: 'Room to improve. Target your largest emission category first — usually commute or energy.' },
    { g: 'D', range: '40–54',  color: '#E07020', bg: '#FEF0E6', title: 'Needs Work',    desc: 'High emissions relative to benchmarks. Consistent daily logging and active reduction efforts needed.' },
    { g: 'F', range: '0–39',   color: '#DC2626', bg: '#FEF2F2', title: 'Critical',      desc: 'Significant emissions detected. Immediate action across commute, energy, and food categories is recommended.' },
  ];

  const FACTORS = [
    { icon: '📊', label: 'Daily average emissions', desc: 'Lower kg CO₂e per day = higher base score. <1 kg/day earns 95 pts; >30 kg/day earns 22 pts.' },
    { icon: '📅', label: 'Logging consistency',      desc: 'Tracking more unique days earns up to +8 bonus points. Regular logging = better visibility.' },
    { icon: '📈', label: 'Trend direction',           desc: 'If your most recent period is lower than the previous, you earn a +5 trend bonus. Rising emissions apply −5.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.2 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid #E5EAE8', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #E5EAE8', background: '#F8FAF8' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${score.color}18` }}>
              <span className="text-lg font-black" style={{ color: score.color }}>{score.grade}</span>
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: '#1A2118' }}>
                Sustainability Score — {score.score}/100
              </h2>
              <p className="text-xs" style={{ color: score.color }}>{score.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: '#9BAEA5' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* What it means */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9BAEA5' }}>
              How it's calculated
            </h3>
            <div className="space-y-2.5">
              {FACTORS.map(f => (
                <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: '#F8FAF8', border: '1px solid #E5EAE8' }}>
                  <span className="text-lg flex-shrink-0">{f.icon}</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#1A2118' }}>{f.label}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#7A9E8E' }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grade breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9BAEA5' }}>
              Grade levels
            </h3>
            <div className="space-y-2">
              {GRADES.map(g => (
                <div key={g.g}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{
                    background: score.grade === g.g ? g.bg : '#F8FAF8',
                    border: `1px solid ${score.grade === g.g ? g.color + '40' : '#E5EAE8'}`,
                  }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                    style={{ background: g.color, color: '#fff' }}>{g.g}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: g.color }}>{g.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: `${g.color}18`, color: g.color }}>{g.range}</span>
                      {score.grade === g.g && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: g.color, color: '#fff' }}>Your grade</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#7A9E8E' }}>{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How to improve */}
          <div className="p-4 rounded-xl" style={{ background: '#EAF4EE', border: '1px solid #C0DDD0' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#1B4332' }}>💡 How to improve your score</p>
            <ul className="text-xs space-y-1" style={{ color: '#3D6B56' }}>
              <li>• Log entries every day — consistency earns up to +8 bonus points</li>
              <li>• Reduce your top emission source (see Top Sources section)</li>
              <li>• Switch from car to bus/train for your daily commute</li>
              <li>• Replace one beef meal per week with vegetarian</li>
              <li>• Monitor your trend — declining emissions earn an extra +5</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Sustainability score banner ─────────────── */
function SustainabilityBanner({ score, onInfoClick }) {
  if (!score) return null;
  const circ = 2 * Math.PI * 44;
  const dash = circ * (1 - score.score / 100);
  const grades = ['A','B','C','D','F'];

  return (
    <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={onInfoClick}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Ring */}
        <div className="relative flex-shrink-0" style={{ width: 100, height: 100 }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#F0EDE4" strokeWidth="10" />
            <motion.circle cx="50" cy="50" r="44" fill="none"
              stroke={score.color} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: dash }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: '50px 50px', transform: 'rotate(-90deg)' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none" style={{ color: score.color }}>{score.score}</span>
            <span className="text-sm font-bold" style={{ color: score.color }}>{score.grade}</span>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold" style={{ color: '#1A2118' }}>Sustainability Score</h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: `${score.color}18`, color: score.color }}>{score.label}</span>
            <span className="flex items-center gap-1 text-xs ml-auto"
              style={{ color: '#9BAEA5' }}>
              <HelpCircle className="h-3.5 w-3.5" /> Click to learn more
            </span>
          </div>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: '#7A9E8E' }}>
            {score.score >= 85 ? 'Outstanding! Your emissions are well below average. Keep up the excellent work.'
              : score.score >= 70 ? 'Good progress. Consistent logging and small daily changes will push you higher.'
              : score.score >= 55 ? 'Room for improvement. Focus on your top emission source to see quick gains.'
              : score.score >= 40 ? 'High emissions detected. Review commute and energy usage for biggest impact.'
              : 'Critical level. Immediate reduction action is recommended across all categories.'}
          </p>
          {/* Grade scale */}
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[10px] mr-1" style={{ color: '#9BAEA5' }}>Scale:</span>
            {grades.map(g => (
              <span key={g} className="text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: score.grade === g ? score.color : '#F0EDE4',
                  color:      score.grade === g ? '#ffffff' : '#9BAEA5',
                }}>
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* Score bar visual */}
        <div className="hidden lg:block flex-shrink-0 w-40">
          <div className="space-y-1.5">
            {[['A', 85, '#2D6A4F'], ['B', 70, '#52B788'], ['C', 55, '#C4952A'], ['D', 40, '#E07020'], ['F', 0, '#DC2626']].map(([g, threshold, c]) => (
              <div key={g} className="flex items-center gap-2">
                <span className="text-[10px] font-bold w-4" style={{ color: c }}>{g}</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: '#F0EDE4' }}>
                  <div className="h-full rounded-full" style={{ background: c, width: `${Math.min(100, score.score)}%`, opacity: score.grade === g ? 1 : 0.25 }} />
                </div>
                <span className="text-[9px]" style={{ color: '#9BAEA5' }}>{threshold}+</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── SVG Donut chart ─────────────────────────── */
function DonutChart({ segments, totalKg }) {
  const r     = 62;
  const cx    = 90;
  const cy    = 90;
  const circ  = 2 * Math.PI * r;
  const total = segments.reduce((s, g) => s + g.value, 0);

  let cum = 0;
  const drawn = segments.map((seg) => {
    const len    = total > 0 ? (seg.value / total) * circ : 0;
    const offset = cum;
    cum += len;
    return { ...seg, len, offset };
  });

  const fmt = (kg) => kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${kg.toFixed(0)}`;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG */}
      <div className="relative flex-shrink-0">
        <svg width="180" height="180" viewBox="0 0 180 180">
          {/* Background ring */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0EDE4" strokeWidth="28" />
          {/* Segments */}
          {drawn.map((seg, i) => (
            <motion.circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={seg.color} strokeWidth="28"
              strokeDasharray={`${seg.len} ${circ - seg.len}`}
              strokeDashoffset={-seg.offset}
              style={{ transformOrigin: `${cx}px ${cy}px`, transform: 'rotate(-90deg)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 + 0.2, duration: 0.4 }} />
          ))}
          {/* Center */}
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize="20" fontWeight="700" fill="#1A2118">
            {fmt(totalKg)}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#9BAEA5">kg CO₂e</text>
          <text x={cx} y={cy + 24} textAnchor="middle" fontSize="9" fill="#9BAEA5">total</text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2 w-full">
        {drawn.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-xs flex-1 capitalize font-medium" style={{ color: '#3D5247' }}>{seg.label}</span>
            <span className="text-xs font-bold" style={{ color: '#1A2118' }}>
              {seg.value >= 1000 ? `${(seg.value / 1000).toFixed(2)}t` : `${seg.value}kg`}
            </span>
            <span className="text-xs w-10 text-right" style={{ color: '#9BAEA5' }}>{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Multi-line SVG chart ────────────────────── */
function MultiLineChart({ data, height = 180 }) {
  if (!data || data.length < 2) return (
    <div className="flex items-center justify-center text-xs" style={{ height, color: '#9BAEA5' }}>
      Not enough data points yet
    </div>
  );

  const W   = 640; const H = height;
  const PAD = { t: 14, b: 28, l: 8, r: 8 };
  const iW  = W - PAD.l - PAD.r;
  const iH  = H - PAD.t - PAD.b;
  const max = Math.max(...data.map(d => d.total), 0.001);

  const toX = (i) => PAD.l + (i / (data.length - 1)) * iW;
  const toY = (v) => PAD.t + iH - (v / max) * iH;

  const series = [
    { key: 'scope3',   color: '#8B5E3C', w: 1.5, dash: '4,3' },
    { key: 'scope2',   color: '#C4952A', w: 1.5, dash: '4,3' },
    { key: 'scope1',   color: '#52B788', w: 1.5, dash: '4,3' },
    { key: 'total',    color: '#2D6A4F', w: 2.5, dash: null   },
  ];

  const totalPath  = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.total).toFixed(1)}`).join(' ');
  const areaPath   = `${totalPath} L${toX(data.length - 1).toFixed(1)},${(PAD.t + iH).toFixed(1)} L${toX(0).toFixed(1)},${(PAD.t + iH).toFixed(1)} Z`;
  const step       = Math.max(1, Math.ceil(data.length / 9));

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ minWidth: '320px' }}>
        <defs>
          <linearGradient id="mlGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {/* Grid */}
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={PAD.l} y1={PAD.t + iH * (1 - f)} x2={W - PAD.r} y2={PAD.t + iH * (1 - f)}
            stroke="#F0EDE4" strokeWidth="1" />
        ))}
        {/* Area */}
        <path d={areaPath} fill="url(#mlGrad)" />
        {/* Lines */}
        {series.map(s => {
          const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d[s.key] ?? 0).toFixed(1)}`).join(' ');
          return (
            <motion.path key={s.key} d={path} fill="none"
              stroke={s.color} strokeWidth={s.w} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={s.dash ?? undefined}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }} />
          );
        })}
        {/* Dots on total */}
        {data.map((d, i) => (
          <motion.circle key={i} cx={toX(i).toFixed(1)} cy={toY(d.total).toFixed(1)} r="3.5"
            fill="#2D6A4F" stroke="#fff" strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.02, duration: 0.3 }} />
        ))}
        {/* X labels */}
        {data.map((d, i) => {
          if (i % step !== 0 && i !== data.length - 1) return null;
          return (
            <text key={i} x={toX(i).toFixed(1)} y={H - 5}
              textAnchor="middle" fontSize="9" fill="#9BAEA5" fontFamily="monospace">
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── Daily area chart ────────────────────────── */
function AreaChart({ data, color = '#2D6A4F', height = 160 }) {
  if (!data || data.length < 2) return (
    <div className="flex items-center justify-center text-xs" style={{ height, color: '#9BAEA5' }}>Not enough data points yet</div>
  );
  const W = 640; const H = height;
  const PAD = { t: 12, b: 26, l: 8, r: 8 };
  const max = Math.max(...data.map(d => d.value), 0.001);
  const iW = W - PAD.l - PAD.r; const iH = H - PAD.t - PAD.b;
  const pts = data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * iW,
    y: PAD.t + iH - (d.value / max) * iH,
    v: d.value, l: d.label,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length-1].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} L${pts[0].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} Z`;
  const gradId = `ag${color.replace('#','')}`;
  const step = Math.max(1, Math.ceil(data.length / 9));
  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ minWidth: '320px' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={PAD.l} y1={PAD.t+iH*(1-f)} x2={W-PAD.r} y2={PAD.t+iH*(1-f)} stroke="#F0EDE4" strokeWidth="1" />
        ))}
        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5"
            fill={p.v > 0 ? color : 'none'} stroke={p.v > 0 ? '#fff' : 'none'} strokeWidth="1.5" />
        ))}
        {pts.filter((_, i) => i % step === 0 || i === pts.length - 1).map((p, i) => (
          <text key={i} x={p.x.toFixed(1)} y={H - 5} textAnchor="middle" fontSize="9" fill="#9BAEA5" fontFamily="monospace">{p.l}</text>
        ))}
      </svg>
    </div>
  );
}

/* ─── Scope progress bar ──────────────────────── */
function ScopeBar({ label, pct, color, kg }) {
  return (
    <div>
      <div className="flex justify-between items-center text-xs mb-1.5">
        <span style={{ color: '#5A7A6D' }}>{label}</span>
        <div className="flex items-center gap-2">
          <span style={{ color: '#9BAEA5' }}>{kg >= 1000 ? `${(kg/1000).toFixed(2)}t` : `${kg}kg`}</span>
          <span className="font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="h-2.5 rounded-full" style={{ background: '#F0EDE4' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}

/* ─── Employee comparison ─────────────────────── */
function EmployeeComparison({ data }) {
  if (!data?.length) return null;
  return (
    <Card className="p-6">
      <h2 className="text-sm font-semibold mb-5" style={{ color: '#1A2118' }}>Employee Emission Comparison</h2>
      <div className="space-y-3.5">
        {data.map((emp, i) => (
          <div key={emp.user.id} className="flex items-center gap-3">
            <span className="text-xs font-bold w-5 text-right flex-shrink-0"
              style={{ color: i === 0 ? '#C4952A' : '#9BAEA5' }}>#{i+1}</span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white"
              style={{ background: i === 0 ? '#C4952A' : '#8B9E95' }}>
              {getInitials(emp.user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold truncate" style={{ color: '#1A2118' }}>{emp.user.name}</span>
                <span className="text-xs font-bold ml-2 flex-shrink-0"
                  style={{ color: i === 0 ? '#C4952A' : '#2D6A4F' }}>
                  {emp.totalKg >= 1000 ? `${(emp.totalKg/1000).toFixed(2)}t` : `${emp.totalKg}kg`}
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: '#F0EDE4' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${emp.barPct}%` }}
                  transition={{ delay: i * 0.06 + 0.2, duration: 0.6 }}
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

/* ─── Empty state ─────────────────────────────── */
function EmptyState({ navigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: '#EAF4EE' }}>
        <BarChart3 className="h-7 w-7" style={{ color: '#2D6A4F' }} />
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: '#1A2118' }}>No data yet</h3>
      <p className="text-sm max-w-xs mb-5" style={{ color: '#9BAEA5' }}>
        Log carbon entries in Activities → Calculator to see your analytics here.
      </p>
      <button onClick={() => navigate('/dashboard/activities')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
        style={{ background: '#2D6A4F' }}>
        <Calculator className="h-4 w-4" /> Open Calculator
      </button>
    </div>
  );
}



/* ════════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════════ */
const RANGES = [
  { label: 'Last 7 Days',    period: '7days'   },
  { label: 'Last 30 Days',   period: '30days'  },
  { label: 'Last 6 Months',  period: '6months' },
  { label: 'Last 12 Months', period: 'year'    },
];

const SCOPE_COLORS = ['#2D6A4F', '#C4952A', '#8B5E3C', '#52B788'];
const CAT_COLORS   = { commute: '#2D6A4F', energy: '#C4952A', travel: '#8B5E3C', food: '#52B788' };

/* ════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const { user }   = useAuthStore();
  const navigate   = useNavigate();
  const isAdmin    = user?.role === 'ADMIN';

  const [rangeIdx,       setRangeIdx]       = useState(2);
  const [analytics,      setAnalytics]      = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [showScoreModal, setShowScoreModal] = useState(false);

  const period = RANGES[rangeIdx].period;

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data: res } = await carbonApi.getAnalytics(period);
      setAnalytics(res.data);
    } catch (e) { setError(e?.response?.data?.message ?? 'Failed to load analytics.'); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* Derived */
  const isDaily  = analytics?.grain === 'day';
  const lineData = analytics?.timeSeries.map(d => ({ label: d.label, value: d.total })) ?? [];
  const donutData = (analytics?.byCategory ?? []).map(cat => ({
    label: cat.category,
    value: cat.totalKg,
    color: CAT_COLORS[cat.category] ?? '#9BAEA5',
    pct:   cat.percentage,
  }));
  const hasData = (analytics?.kpis?.entryCount ?? 0) > 0;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1A2118' }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9BAEA5' }}>
            {isAdmin
              ? 'Organisation-wide emission intelligence'
              : 'Personal emission trends and insights'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchData} disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40"
            style={{ color: '#7A9E8E', border: '1px solid #E5EAE8' }}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {/* Period selector */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#F4F6F4', border: '1px solid #E5EAE8' }}>
            {RANGES.map((r, i) => (
              <button key={r.period} onClick={() => setRangeIdx(i)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap"
                style={i === rangeIdx ? { background: '#2D6A4F', color: '#fff' } : { color: '#7A9E8E' }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl flex items-center gap-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#DC2626' }} />
          <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#9BAEA5' }} />
        </div>
      )}

      {!loading && !error && analytics && (
        <AnimatePresence mode="wait">
          <motion.div key={period}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="space-y-5">

            {/* ── Sustainability Score banner (top, prominent) ── */}
            {hasData && (
              <SustainabilityBanner
                score={analytics.sustainabilityScore}
                onInfoClick={() => setShowScoreModal(true)}
              />
            )}

            {/* ── KPI cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Emissions',      val: analytics.kpis.total,  growth: analytics.kpis.growth.total,  accent: '#2D6A4F' },
                { label: 'Scope 1 — Direct',     val: analytics.kpis.scope1, growth: analytics.kpis.growth.scope1, accent: '#2D6A4F' },
                { label: 'Scope 2 — Indirect',   val: analytics.kpis.scope2, growth: analytics.kpis.growth.scope2, accent: '#C4952A' },
                { label: 'Scope 3 — Value Chain',val: analytics.kpis.scope3, growth: analytics.kpis.growth.scope3, accent: '#8B5E3C' },
              ].map((k, i) => (
                <motion.div key={k.label}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}>
                  <Card className="p-4">
                    <p className="text-xs font-medium mb-2 leading-snug" style={{ color: '#9BAEA5' }}>{k.label}</p>
                    <p className="text-2xl font-bold mb-1" style={{ color: '#1A2118' }}>
                      {k.val >= 1000
                        ? <>{(k.val/1000).toFixed(2)}<span className="text-sm font-normal ml-1" style={{ color: '#9BAEA5' }}>t</span></>
                        : <>{k.val.toFixed(2)}<span className="text-sm font-normal ml-1" style={{ color: '#9BAEA5' }}>kg</span></>}
                    </p>
                    <Growth pct={k.growth} />
                  </Card>
                </motion.div>
              ))}
            </div>

            {!hasData ? (
              <Card><EmptyState navigate={navigate} /></Card>
            ) : (
              <>
                {/* ── Trend chart ── */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div>
                      <h2 className="text-sm font-semibold" style={{ color: '#1A2118' }}>
                        {isDaily ? 'Daily' : 'Monthly'} Emission Trend
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: '#9BAEA5' }}>
                        {isDaily ? 'kg CO₂e per day' : 'kg CO₂e per month'} · {RANGES[rangeIdx].label}
                      </p>
                    </div>
                    {!isDaily && (
                      <div className="flex items-center gap-4 text-xs flex-wrap">
                        {[['#2D6A4F','Total'],['#52B788','Scope 1'],['#C4952A','Scope 2'],['#8B5E3C','Scope 3']].map(([c, l]) => (
                          <div key={l} className="flex items-center gap-1.5">
                            <span className="h-2 w-5 rounded-sm flex-shrink-0" style={{ background: c }} />
                            <span style={{ color: '#9BAEA5' }}>{l}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {isDaily
                    ? <AreaChart data={lineData} color="#2D6A4F" height={160} />
                    : <MultiLineChart data={analytics.timeSeries} height={180} />
                  }
                </Card>

                {/* ── Donut + Scope breakdown ── */}
                <div className="grid lg:grid-cols-2 gap-5">
                  {/* Donut chart */}
                  <Card className="p-6">
                    <h2 className="text-sm font-semibold mb-5" style={{ color: '#1A2118' }}>Emission by Category</h2>
                    {donutData.length > 0
                      ? <DonutChart segments={donutData} totalKg={analytics.kpis.total} />
                      : <p className="text-sm text-center py-6" style={{ color: '#9BAEA5' }}>No category data</p>}
                  </Card>

                  {/* Scope breakdown */}
                  <Card className="p-6">
                    <h2 className="text-sm font-semibold mb-5" style={{ color: '#1A2118' }}>Scope Breakdown</h2>
                    <div className="space-y-4">
                      {analytics.scopeBreakdown.length > 0
                        ? analytics.scopeBreakdown.map((s, i) => (
                            <ScopeBar key={s.scope} label={s.scope}
                              pct={s.percentage} kg={s.kg}
                              color={SCOPE_COLORS[i % SCOPE_COLORS.length]} />
                          ))
                        : <p className="text-sm text-center py-6" style={{ color: '#9BAEA5' }}>No scope data</p>}
                    </div>
                  </Card>
                </div>

                {/* ── Top sources + Category detail cards ── */}
                <div className="grid lg:grid-cols-3 gap-5">
                  {/* Top sources */}
                  <Card className="p-6">
                    <h2 className="text-sm font-semibold mb-4" style={{ color: '#1A2118' }}>Top Emission Sources</h2>
                    <div className="space-y-0">
                      {analytics.topSources.map((s, i) => (
                        <div key={s.source}
                          className="flex items-center justify-between py-2.5 text-xs capitalize"
                          style={{ borderBottom: '1px solid #F0EDE4' }}>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold w-4 text-right" style={{ color: '#9BAEA5' }}>
                              #{i + 1}
                            </span>
                            <span style={{ color: '#5A7A6D' }}>{s.source}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: '#9BAEA5' }}>
                              {s.totalKg >= 1000 ? `${(s.totalKg/1000).toFixed(2)}t` : `${s.totalKg}kg`}
                            </span>
                            <span className="font-bold w-10 text-right" style={{ color: '#1A2118' }}>
                              {s.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Category cards */}
                  <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4 content-start">
                    {analytics.byCategory.map(cat => {
                      const c = CAT_COLORS[cat.category] ?? '#9BAEA5';
                      return (
                        <Card key={cat.category} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c }} />
                              <span className="text-sm font-semibold capitalize" style={{ color: '#1A2118' }}>
                                {cat.category}
                              </span>
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: `${c}18`, color: c }}>{cat.percentage}%</span>
                          </div>
                          <p className="text-2xl font-bold" style={{ color: '#1A2118' }}>
                            {cat.totalKg >= 1000 ? `${(cat.totalKg/1000).toFixed(2)}t` : `${cat.totalKg}kg`}
                          </p>
                          <p className="text-[10px] mb-3" style={{ color: '#9BAEA5' }}>CO₂e in period</p>
                          <div className="h-1.5 rounded-full" style={{ background: '#E5EAE8' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${cat.percentage}%` }}
                              transition={{ delay: 0.4, duration: 0.7 }}
                              className="h-full rounded-full" style={{ background: c }} />
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* ── Employee comparison (admin) ── */}
                {isAdmin && analytics.employeeComparison?.length > 0 && (
                  <EmployeeComparison data={analytics.employeeComparison} />
                )}

                {/* ── Admin org-wide note ── */}
                {isAdmin && (
                  <div className="p-4 rounded-xl flex items-center gap-3"
                    style={{ background: '#EAF4EE', border: '1px solid #C0DDD0' }}>
                    <TrendingDown className="h-4 w-4 flex-shrink-0" style={{ color: '#2D6A4F' }} />
                    <p className="text-sm" style={{ color: '#1B4332' }}>
                      <strong>Organisation view</strong> — aggregating all employees' entries.
                      AI Forecast and personalised recommendations are in the <strong>AI Insights</strong> tab.
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Score explanation modal */}
      <AnimatePresence>
        {showScoreModal && analytics?.sustainabilityScore && (
          <ScoreModal
            score={analytics.sustainabilityScore}
            onClose={() => setShowScoreModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

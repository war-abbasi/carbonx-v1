import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Leaf, BarChart3, Zap, MessageSquare, Shield,
  TrendingUp, FileText, Users, ChevronDown, Car, Plane, Utensils,
  Trash2, RefreshCw, Droplets, Thermometer, Wind, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar    from '../../components/layout/Navbar';
import Footer    from '../../components/shared/Footer';
import wardahImg from '../../assets/wardah.jpeg';

/* ── Animation variants ──────────────────────────── */
const FV  = { hidden: { opacity: 0, y: 28 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] } }) };
const SW  = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

/* ── Floating leaf SVG component ────────────────── */
function LeafShape({ size = 24, color = 'currentColor', opacity = 0.15, rotate = 0 }) {
  return (
    <svg
      width={size} height={size * 1.35}
      viewBox="0 0 24 32"
      fill={color}
      style={{ opacity, transform: `rotate(${rotate}deg)` }}
    >
      <path d="M12 1C7 5.5 2 12 2 18C2 24 6.5 31 12 31C17.5 31 22 24 22 18C22 12 17 5.5 12 1Z" />
      <path d="M12 1C12 10 11 20 12 31" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ── Floating leaves background ─────────────────── */
const LEAF_CONFIGS = [
  { top: '6%',   left: '2%',   size: 28, opacity: 0.28, rotate: -20, anim: 'animate-leaf-drift-1', delay: '0s'  },
  { top: '12%',  right: '3%',  size: 22, opacity: 0.24, rotate: 30,  anim: 'animate-leaf-drift-2', delay: '3s'  },
  { top: '22%',  left: '7%',   size: 18, opacity: 0.22, rotate: 55,  anim: 'animate-leaf-drift-3', delay: '6s'  },
  { top: '32%',  right: '5%',  size: 30, opacity: 0.22, rotate: -40, anim: 'animate-leaf-drift-1', delay: '9s'  },
  { top: '42%',  left: '2%',   size: 20, opacity: 0.26, rotate: 15,  anim: 'animate-leaf-drift-2', delay: '2s'  },
  { top: '52%',  right: '3%',  size: 16, opacity: 0.22, rotate: -60, anim: 'animate-leaf-drift-3', delay: '5s'  },
  { top: '62%',  left: '4%',   size: 24, opacity: 0.24, rotate: 45,  anim: 'animate-leaf-drift-1', delay: '11s' },
  { top: '72%',  right: '4%',  size: 26, opacity: 0.24, rotate: -25, anim: 'animate-leaf-drift-2', delay: '7s'  },
  { top: '82%',  left: '6%',   size: 19, opacity: 0.22, rotate: 70,  anim: 'animate-leaf-drift-3', delay: '1s'  },
  { top: '90%',  right: '6%',  size: 22, opacity: 0.26, rotate: -15, anim: 'animate-leaf-drift-1', delay: '14s' },
  { top: '18%',  left: '13%',  size: 15, opacity: 0.18, rotate: 80,  anim: 'animate-leaf-drift-2', delay: '10s' },
  { top: '48%',  right: '11%', size: 17, opacity: 0.20, rotate: -75, anim: 'animate-leaf-drift-3', delay: '13s' },
  { top: '68%',  left: '12%',  size: 20, opacity: 0.20, rotate: 20,  anim: 'animate-leaf-drift-1', delay: '16s' },
  { top: '35%',  right: '13%', size: 18, opacity: 0.20, rotate: -35, anim: 'animate-leaf-drift-2', delay: '5s'  },
  { top: '78%',  right: '12%', size: 23, opacity: 0.20, rotate: 65,  anim: 'animate-leaf-drift-3', delay: '12s' },
];

function FloatingLeaves() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {LEAF_CONFIGS.map((l, i) => (
        <div
          key={i}
          className={l.anim}
          style={{ position: 'absolute', top: l.top, left: l.left, right: l.right, animationDelay: l.delay, color: 'var(--accent)' }}
        >
          <LeafShape size={l.size} color="currentColor" opacity={l.opacity} rotate={l.rotate} />
        </div>
      ))}
    </div>
  );
}

/* ── Hero visual (floating dashboard cards) ─────── */
function HeroVisual() {
  return (
    <div className="relative py-8 px-4">
      <div className="absolute inset-0 rounded-[32px] pointer-events-none" style={{ border: '1px solid rgba(var(--accent-rgb),0.13)' }} />
      <div className="relative rounded-2xl overflow-hidden" style={{ border: '1.5px solid rgba(var(--accent-rgb),0.22)', boxShadow: '0 24px 64px rgba(20,32,26,0.12)' }}>
        <img
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=80&auto=format&fit=crop"
          alt="Sunlit forest — carbon sequestration and biodiversity"
          className="w-full h-[420px] object-cover"
          loading="eager"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(20,32,26,0.88) 0%, rgba(43,122,60,0.06) 50%, transparent 70%)' }} />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full animate-pulse flex-shrink-0" style={{ background: 'var(--accent)' }} />
            <span style={{ fontSize: '0.63rem', letterSpacing: '0.09em', color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
              GHG Protocol Compliant
            </span>
          </div>
          <p className="font-bold text-xl text-white leading-snug">AI-powered carbon intelligence</p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.60)' }}>Scope 1, 2 &amp; 3 tracking with ML forecasting</p>
        </div>
      </div>

      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-2 -right-2 rounded-2xl z-10"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-md)', padding: '14px 18px', minWidth: '152px' }}>
        <p style={{ fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '5px', fontFamily: 'var(--font-sans)' }}>Emission Scopes</p>
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
          {['Scope 1', 'Scope 2', 'Scope 3'].map((s) => (
            <span key={s} style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent)' }}>{s}</span>
          ))}
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>GHG Protocol aligned</p>
      </motion.div>

      <motion.div animate={{ x: [0, 7, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        className="absolute top-1/2 -right-4 -translate-y-1/2 rounded-2xl z-10"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-md)', padding: '14px 18px', minWidth: '140px' }}>
        <p style={{ fontSize: '0.6rem', letterSpacing: '0.08em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'var(--font-sans)' }}>ML Forecasting</p>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>Prophet · XGBoost<br />Holt-Winters</p>
        <p style={{ fontSize: '0.68rem', color: 'var(--accent)', marginTop: '4px', fontWeight: 500 }}>Up to 24-month horizon</p>
      </motion.div>

      <motion.div animate={{ y: [0, 9, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
        className="absolute bottom-2 -left-2 rounded-2xl z-10"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-md)', padding: '14px 18px', minWidth: '164px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-warm)', flexShrink: 0 }} />
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-warm)' }}>Emission Factors</p>
        </div>
        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>DEFRA 2023 · IPCC</p>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>Pakistan NCCC standards</p>
      </motion.div>
    </div>
  );
}

/* ── Section label ───────────────────────────────── */
function SectionLabel({ children, center = false }) {
  return (
    <div className={`flex items-center gap-3 mb-5 ${center ? 'justify-center' : ''}`}>
      <div className="h-px w-6 flex-shrink-0" style={{ background: 'var(--accent)' }} />
      <span style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
        {children}
      </span>
      {center && <div className="h-px w-6 flex-shrink-0" style={{ background: 'var(--accent)' }} />}
    </div>
  );
}

/* ── Calculator (embedded) ───────────────────────── */
const BENCHMARKS = {
  low:  { label: 'Low Impact',  value: 150, color: 'var(--accent)' },
  avg:  { label: 'Global Avg.', value: 400, color: 'var(--accent-warm)' },
  high: { label: 'High Impact', value: 800, color: 'var(--danger)' },
};

function CalcSlider({ value, onChange, min, max, step = 1, label, unit, icon: Icon, color }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}1a`, border: `1px solid ${color}33` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</span>
        </div>
        <span className="text-sm font-semibold tabular-nums" style={{ color, fontFamily: 'var(--font-sans)' }}>
          {value} <span className="text-xs font-normal" style={{ color: 'var(--text-dim)' }}>{unit}</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full" style={{ background: 'var(--surface)' }}>
        <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-150" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}60` }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" style={{ zIndex: 2 }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all duration-150 pointer-events-none" style={{ left: `calc(${pct}% - 8px)`, background: 'var(--bg)', borderColor: color, boxShadow: `0 0 6px ${color}80` }} />
      </div>
    </div>
  );
}

function CalcBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
        <span>{label}</span>
        <span style={{ color }}>{value.toFixed(1)} kg CO₂e</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
        <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </div>
  );
}

function EmbeddedCalculator() {
  const navigate = useNavigate();
  const [car,     setCar]     = useState(80);
  const [flights, setFlights] = useState(2);
  const [elec,    setElec]    = useState(250);
  const [meat,    setMeat]    = useState(4);
  const [waste,   setWaste]   = useState(10);

  const results = useMemo(() => {
    const transport   = car * 0.21 + (flights / 12) * 255;
    const electricity = elec * 0.42;
    const lifestyle   = meat * 12 + waste * 8;
    return { transport, electricity, lifestyle, total: transport + electricity + lifestyle };
  }, [car, flights, elec, meat, waste]);

  const getRating = (t) => {
    if (t < 200) return { label: 'Low Impact',    color: 'var(--accent)',      desc: 'Great — your footprint is well below average.' };
    if (t < 500) return { label: 'Average Impact', color: 'var(--accent-warm)', desc: 'Around the global average. Small changes can help.' };
    return              { label: 'High Impact',    color: 'var(--danger)',      desc: 'Above average — significant reduction potential.' };
  };

  const rating = getRating(results.total);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Inputs */}
      <div className="lg:col-span-3 space-y-5">
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <SectionLabel>Transport</SectionLabel>
          <CalcSlider value={car}     onChange={setCar}     min={0} max={200} step={5}  label="Car Travel"       unit="km/day"    icon={Car}       color="var(--accent-blue)" />
          <CalcSlider value={flights} onChange={setFlights} min={0} max={20}            label="Flights per Year" unit="flights/yr" icon={Plane}     color="var(--accent-warm)" />
        </div>
        <div className="glass-card rounded-2xl p-6">
          <SectionLabel>Energy</SectionLabel>
          <CalcSlider value={elec}  onChange={setElec}  min={0} max={1000} step={10} label="Electricity Usage" unit="kWh/mo"    icon={Zap}       color="var(--accent)" />
        </div>
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <SectionLabel>Lifestyle</SectionLabel>
          <CalcSlider value={meat}  onChange={setMeat}  min={0} max={21}              label="Meat-based Meals"  unit="meals/wk"  icon={Utensils}  color="var(--accent-warm)" />
          <CalcSlider value={waste} onChange={setWaste} min={0} max={50}              label="Household Waste"   unit="kg/wk"     icon={Trash2}    color="var(--danger)" />
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-2 space-y-5">
        <div className="glass-card rounded-2xl p-6 text-center">
          <SectionLabel center>Monthly Total</SectionLabel>
          <AnimatePresence mode="wait">
            <motion.p key={Math.round(results.total)} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.3 }}
              className="text-6xl font-bold" style={{ color: rating.color, fontFamily: 'var(--font-display)' }}>
              {results.total.toFixed(0)}
            </motion.p>
          </AnimatePresence>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>kg CO₂e / month</p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: `${rating.color}1a`, color: rating.color, border: `1px solid ${rating.color}33` }}>
            {rating.label}
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>{rating.desc}</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <SectionLabel>Breakdown</SectionLabel>
          <div className="space-y-4">
            <CalcBar label="Transport"   value={results.transport}   total={results.total} color="var(--accent-blue)" />
            <CalcBar label="Electricity" value={results.electricity} total={results.total} color="var(--accent)" />
            <CalcBar label="Lifestyle"   value={results.lifestyle}   total={results.total} color="var(--accent-warm)" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <SectionLabel>vs. Benchmarks</SectionLabel>
          <div className="space-y-3">
            {Object.values(BENCHMARKS).map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    <span>{b.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{b.value} kg</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: 'var(--surface)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min((b.value / 900) * 100, 100)}%`, background: b.color }} />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: rating.color, boxShadow: `0 0 6px ${rating.color}` }} />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text)' }}>
                  <span className="font-semibold">Your Result</span>
                  <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{results.total.toFixed(0)} kg</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: 'var(--surface)' }}>
                  <motion.div className="h-full rounded-full" animate={{ width: `${Math.min((results.total / 900) * 100, 100)}%` }} transition={{ duration: 0.4 }} style={{ background: rating.color }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={() => navigate('/signup')} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold">
            Get a Full Analysis <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => { setCar(80); setFlights(2); setElec(250); setMeat(4); setWaste(10); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Data ────────────────────────────────────────── */
const features = [
  { icon: Leaf,         color: 'var(--accent)',      title: 'Intelligent Carbon Tracking',     desc: 'Log and categorize emissions across Scope 1, 2, and 3 with GHG Protocol-aligned factors from DEFRA 2023, IPCC, and Pakistan NCCC standards.' },
  { icon: BarChart3,    color: 'var(--accent-warm)',  title: 'Interactive Analytics Dashboard', desc: 'Visualize emission trends, hotspot analysis, and category breakdowns through enterprise-grade charts and exportable PDF reports.' },
  { icon: TrendingUp,   color: '#4A7FA8',             title: 'CarboncastX — ML Forecasting',    desc: 'Proprietary ensemble of Prophet, XGBoost, and Holt-Winters models forecasts future emissions up to 24 months ahead.' },
  { icon: MessageSquare,color: 'var(--accent)',       title: 'AI Chat Assistant',               desc: 'A RAG-powered chatbot that understands your live emission data, answers sustainability questions in English or Roman Urdu, and logs activities from conversation.' },
  { icon: Users,        color: 'var(--accent-warm)',  title: 'Organizational Management',       desc: 'Admin controls for multi-user organizations: bulk CSV import, team-wide analytics, and role-based access for employees and managers.' },
  { icon: FileText,     color: '#4A7FA8',             title: 'Compliance-Ready Reporting',      desc: 'One-click PDF exports of full GHG inventory reports aligned with GHG Protocol Corporate Standard and ISO 14064-1.' },
];

const steps = [
  { num: '01', label: 'Log Activities',  desc: 'Record emissions from transport, energy, travel, and supply chain through the calculator, CSV upload, or the AI chat assistant.' },
  { num: '02', label: 'AI Analyzes',     desc: 'Our engine applies DEFRA/IPCC emission factors in real time, categorizing everything into Scope 1, 2, and 15 Scope 3 GHG Protocol categories.' },
  { num: '03', label: 'Get Insights',    desc: 'View trends, forecasts, hotspots, and actionable reduction recommendations — all in one dashboard.' },
];

const team = [
  { name: 'Wardah Zia Abbasi', role: 'Full Stack AI Engineer', color: 'var(--accent)' },
  { name: 'Zoha Latif',        role: 'ML & Backend Engineer', color: 'var(--accent-warm)' },
  { name: 'Dr. Salma Imtiaz',  role: 'Project Supervisor',    color: '#4A7FA8', supervisor: true },
];

const pakistanFacts = [
  { icon: Droplets,      label: '33M Displaced',      desc: 'By the catastrophic 2022 monsoon floods — the worst in recorded history' },
  { icon: Thermometer,   label: 'Ranked 5th Globally', desc: 'Most climate-vulnerable nation by the Germanwatch Climate Risk Index 2021' },
  { icon: Wind,          label: '7,253 Glaciers',      desc: 'More than anywhere outside polar regions — all accelerating in melt rate' },
  { icon: AlertTriangle, label: '<0.9% of Emissions',  desc: 'Pakistan contributes under 1% of global CO₂ yet bears among the heaviest costs' },
];

/* ── Page ────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative" style={{ color: 'var(--text)', background: 'var(--bg)' }}>
      <FloatingLeaves />
      <Navbar />

      {/* ══════════════════════════════════════════════
          HOME
      ══════════════════════════════════════════════ */}
      <section id="home" className="relative min-h-screen flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 55% at 50% -5%, rgba(var(--accent-rgb),0.10) 0%, transparent 60%), radial-gradient(ellipse 40% 35% at 0% 70%, rgba(var(--accent-rgb),0.05) 0%, transparent 50%)',
        }} />
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="orb orb-green absolute top-20 left-1/4  w-80 h-80 animate-orb-1" style={{ opacity: 0.12 }} />
        <div className="orb orb-gold  absolute bottom-20 right-1/3 w-72 h-72 animate-orb-2" style={{ opacity: 0.08 }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <motion.div variants={SW} initial="hidden" animate="visible" className="space-y-8">
              <motion.div variants={FV}>
                <span className="floating-badge">
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                  AI-Powered Sustainability Intelligence
                </span>
              </motion.div>

              <motion.h1 variants={FV} className="section-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', lineHeight: 1.1 }}>
                Track Carbon and Accelerate<br /><span style={{ color: 'var(--accent)' }}>With Intelligence</span>
              </motion.h1>

              <motion.p variants={FV} className="text-[1.05rem] leading-relaxed max-w-md" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                Measure, analyze, and predict your environmental impact through AI-powered sustainability
                intelligence. Built for organizations that want to lead on climate action.
              </motion.p>

              <motion.div variants={FV} className="flex items-center gap-4 flex-wrap">
                <button onClick={() => navigate('/signup')} className="btn-primary inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-semibold">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href="#about"
                  onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Learn more <ChevronDown className="h-4 w-4" />
                </a>
              </motion.div>

            </motion.div>

            <motion.div variants={FV} custom={3} initial="hidden" animate="visible" className="relative hidden lg:block">
              <HeroVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          ABOUT
      ══════════════════════════════════════════════ */}
      <section id="about" className="py-28 relative overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
        <div className="absolute inset-0 bg-grid pointer-events-none" style={{ opacity: 0.25 }} />
        <div className="orb orb-green absolute top-0 right-0 w-[500px] h-[500px] opacity-08" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Paris Agreement Quote */}
          <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7 }}
            className="text-center mb-20">
            <SectionLabel center>Our Story</SectionLabel>
            <blockquote className="max-w-3xl mx-auto mb-8">
              <p className="text-2xl md:text-3xl font-semibold leading-snug mb-4" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                "Holding global average temperature to{' '}
                <span style={{ color: 'var(--accent)' }}>well below 2°C</span>{' '}
                above pre-industrial levels and pursuing efforts to limit the temperature increase to{' '}
                <span style={{ color: 'var(--accent)' }}>1.5°C</span>."
              </p>
              <footer className="text-sm font-medium" style={{ color: 'var(--text-dim)' }}>
                — Paris Agreement (COP21), December 2015 · Signed by 195 nations
              </footer>
            </blockquote>
          </motion.div>

          {/* Narrative */}
          <div className="grid lg:grid-cols-2 gap-14 items-start mb-20">
            <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7 }}>
              <h2 className="section-title text-4xl mb-6">
                Why We Built<br />
                <span style={{ color: 'var(--accent)' }}>CarbonX</span>
              </h2>
              <div className="space-y-4 text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                <p>
                  We track our calories meticulously — logging every meal, monitoring macros, setting daily targets.
                  Yet we rarely think about the carbon impact of what we eat, how we travel, or how we power our homes.
                </p>
                <p>
                  <strong style={{ color: 'var(--text)' }}>CarbonX is the calorie-tracker for your carbon footprint.</strong>{' '}
                  Just as counting calories drives healthier eating, counting carbon drives smarter, more sustainable decisions — for individuals, teams, and entire organizations.
                </p>
                <p>
                  We built CarbonX as a final-year project at FAST NUCES to solve a real problem: Pakistani organizations
                  need credible, AI-backed carbon accounting to meet EU CBAM requirements, attract ESG investment, and
                  contribute meaningfully to Pakistan's climate commitments.
                </p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7 }}>
              <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text)' }}>Why Pakistan Needs This Now</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pakistanFacts.map((fact) => {
                  const Icon = fact.icon;
                  return (
                    <div key={fact.label} className="rounded-2xl p-5 glass-card glass-card-hover">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(var(--accent-rgb),0.09)', border: '1px solid rgba(var(--accent-rgb),0.18)' }}>
                        <Icon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                      </div>
                      <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>{fact.label}</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{fact.desc}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Team */}
          <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7 }}>
            <SectionLabel center>The Team</SectionLabel>
            <h2 className="section-title text-3xl text-center mb-10">Meet the builders</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {team.map((member) => (
                <div key={member.name} className="glass-card rounded-2xl p-9 text-center glass-card-hover">
                  <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-6 ring-2" style={{ ringColor: member.color, boxShadow: `0 0 0 4px ${member.color}44` }}>
                    <img
                      src={wardahImg}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-semibold text-lg mb-1" style={{ color: 'var(--text)' }}>{member.name}</p>
                  <p className="text-sm font-medium" style={{ color: member.color }}>{member.role}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="orb orb-gold absolute bottom-0 left-0 w-[500px] h-[500px] opacity-08" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
            className="text-center mb-16">
            <SectionLabel center>Platform Features</SectionLabel>
            <h2 className="section-title text-4xl md:text-5xl mb-4">
              Everything you need to<br />
              <span style={{ color: 'var(--accent)' }}>measure and reduce</span>
            </h2>
            <p className="max-w-xl mx-auto text-lg" style={{ color: 'var(--text-muted)' }}>
              Six integrated capabilities purpose-built for intelligent sustainability management.
            </p>
          </motion.div>

          {/* Feature grid */}
          <motion.div variants={SW} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} variants={FV} custom={i} className="feature-card">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                    <Icon className="h-5 w-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-[0.95rem] font-semibold mb-2" style={{ color: 'var(--text)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* 3-step process */}
          <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            <div className="p-8 md:p-10 border-b" style={{ borderColor: 'var(--border)' }}>
              <SectionLabel>How It Works</SectionLabel>
              <h3 className="section-title text-2xl">From first log to full insight — in minutes</h3>
            </div>
            <div className="grid md:grid-cols-3">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="p-8 flex flex-col gap-4"
                  style={{ borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}
                >
                  <span className="text-4xl font-bold" style={{ color: 'rgba(var(--accent-rgb),0.18)', fontFamily: 'var(--font-mono)' }}>{step.num}</span>
                  <h4 className="font-semibold text-base" style={{ color: 'var(--text)' }}>{step.label}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CALCULATOR
      ══════════════════════════════════════════════ */}
      <section id="calculator" className="py-28 relative overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
        <div className="absolute inset-0 bg-grid pointer-events-none" style={{ opacity: 0.18 }} />
        <div className="orb orb-green absolute -top-20 right-0 w-96 h-96 opacity-12" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
            className="text-center mb-12">
            <SectionLabel center>Carbon Calculator</SectionLabel>
            <h2 className="section-title text-4xl md:text-5xl mb-4">
              What is your<br />
              <span style={{ color: 'var(--accent)' }}>carbon footprint</span>?
            </h2>
            <p className="max-w-xl mx-auto text-lg" style={{ color: 'var(--text-muted)' }}>
              Adjust the sliders to estimate your monthly CO₂ emissions. Calculations use DEFRA 2024 and IPCC emission factors.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.65 }}>
            <EmbeddedCalculator />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid pointer-events-none" style={{ opacity: 0.14 }} />
        <div className="orb orb-green absolute -top-16 left-0   w-96 h-96 opacity-15" />
        <div className="orb orb-gold  absolute -bottom-8 right-0 w-80 h-80 opacity-10" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div variants={SW} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center space-y-7">
            <motion.div variants={FV}>
              <SectionLabel center>Start Today — It's Free</SectionLabel>
            </motion.div>

            <motion.h2 variants={FV} className="section-title text-4xl sm:text-5xl">
              Ready to lead on<br />
              <span style={{ color: 'var(--accent-warm)' }}>sustainability?</span>
            </motion.h2>

            <motion.p variants={FV} className="max-w-lg mx-auto text-[1.05rem] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Join forward-thinking organizations already using CarbonX to measure, understand, and reduce their environmental impact.
            </motion.p>

            <motion.div variants={FV}>
              <button onClick={() => navigate('/signup')} className="btn-primary inline-flex items-center gap-3 px-8 py-4 rounded-xl text-sm font-semibold">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>

            <motion.div variants={FV} className="flex flex-wrap justify-center gap-7 pt-1">
              {['GHG Protocol', 'DEFRA 2024', 'IPCC Factors', 'ISO 14064'].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-dim)' }}>
                  <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                  {t}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

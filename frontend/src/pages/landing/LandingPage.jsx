import { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Zap, BarChart3, Leaf, AlertTriangle, Droplets, Thermometer, Wind, Building2, TrendingUp, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/shared/Footer';

const FV = { hidden: { opacity: 0, y: 26 }, visible: (i=0) => ({ opacity:1, y:0, transition:{ duration:0.65, delay:i*0.1, ease:[0.16,1,0.3,1] } }) };
const SW = { visible: { transition: { staggerChildren: 0.1 } } };

/* ── Hero animated bars ───────────────────────── */
const barData = [88,82,76,70,63,57,50,46,41,36,31,27];
function HeroChart() {
  const refs = useRef([]);
  useEffect(() => {
    barData.forEach((h, i) => {
      setTimeout(() => {
        if (refs.current[i]) refs.current[i].style.height = h + '%';
      }, 500 + i * 80);
    });
  }, []);
  const color = (h) => h > 65 ? '#e05560' : h > 42 ? 'var(--accent-gold)' : 'var(--accent)';
  return (
    <div className="flex items-end gap-1.5 h-36">
      {barData.map((h, i) => (
        <div
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className="flex-1 rounded-t transition-all duration-[900ms]"
          style={{ height: '0%', background: color(h), opacity: 0.85 }}
        />
      ))}
    </div>
  );
}

const miniFeatures = [
  { icon: Leaf,      label: 'Intelligent Carbon Tracking',  color: 'var(--accent)',      desc: 'Real-time emission monitoring across all scopes with AI-powered categorization.' },
  { icon: Zap,       label: 'AI Emission Prediction',       color: 'var(--accent-blue)', desc: 'Proprietary ML models forecast future emissions up to 24 months ahead with 99%+ accuracy.' },
  { icon: BarChart3, label: 'Interactive Dashboards',       color: 'var(--accent-gold)', desc: 'Enterprise-grade visualization of trends, hotspot analysis, and category breakdowns.' },
];

const stats = [
  { v: '180+',  l: 'Organizations' },
  { v: '2.4M',  l: 'Tonnes CO₂ Tracked' },
  { v: '99.1%', l: 'Accuracy Rate' },
];

const trust = ['TechGreen Corp','SustainIQ Partners','EcoVentures Asia','ClimateFirst Fund','NexaESG Group'];

/* ── Global crisis data ──────────────────────── */
const globalStats = [
  { value: '37.4B',  label: 'Tonnes of CO₂',   sub: 'emitted globally in 2023',               color: 'var(--danger)' },
  { value: '1.45°C', label: 'Average warming',  sub: 'above pre-industrial baseline (2024)',    color: 'var(--accent-gold)' },
  { value: '195',    label: 'Nations signed',   sub: 'the Paris Climate Agreement',             color: 'var(--accent-blue)' },
  { value: '$54T',   label: 'Economic risk',    sub: 'at stake if 2°C is breached by 2100',    color: 'var(--accent)' },
];

/* ── Pakistan data ───────────────────────────── */
const pakistanFacts = [
  { icon: Droplets,    label: '33 Million Displaced',   desc: 'By the catastrophic 2022 monsoon floods — the worst in recorded history' },
  { icon: Thermometer, label: 'Ranked 5th Globally',    desc: 'Most climate-vulnerable nation by the Germanwatch Climate Risk Index 2021' },
  { icon: Wind,        label: '7,253 Glaciers',         desc: 'More than anywhere outside the polar regions — all accelerating in melt rate' },
  { icon: AlertTriangle, label: '<0.9% of Emissions',  desc: 'Pakistan contributes under 1% of global CO₂ yet bears among the heaviest costs' },
];

const pakistanSectors = [
  { icon: Building2,   label: 'Textile & Manufacturing', desc: 'EU & US buyers demand Scope 3 supply chain transparency for market access' },
  { icon: TrendingUp,  label: 'Financial & ESG',         desc: 'Islamic finance and international investors now require credible ESG disclosures' },
  { icon: Leaf,        label: 'Agriculture & Food',      desc: 'Climate-smart agriculture tracking to protect the 42% workforce in farming' },
  { icon: Zap,         label: 'Energy Transition',       desc: 'Renewable switch requires precise carbon accounting for NDMA & donor funding' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Navbar />

      {/* ══ HERO ══════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 55% at 50% -5%, rgba(var(--accent-rgb),0.16) 0%, transparent 60%), radial-gradient(ellipse 45% 35% at 0% 65%, rgba(var(--accent-rgb),0.07) 0%, transparent 50%)',
        }} />
        <div className="absolute inset-0 bg-grid opacity-70 pointer-events-none" />

        <div className="orb orb-green absolute top-16 left-1/4 w-80 h-80 animate-orb-1" style={{ opacity: 0.25 }} />
        <div className="orb orb-blue  absolute bottom-20 right-1/3 w-72 h-72 animate-orb-2" style={{ opacity: 0.15 }} />
        <div className="orb orb-gold  absolute top-1/2  left-0   w-52 h-52 animate-orb-3" style={{ opacity: 0.2 }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left */}
            <motion.div variants={SW} initial="hidden" animate="visible" className="space-y-7">
              <motion.div variants={FV}>
                <span className="floating-badge">
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                  AI-Powered Sustainability Intelligence
                </span>
              </motion.div>

              <motion.h1 variants={FV} className="section-title text-5xl sm:text-6xl md:text-[4rem]">
                Intelligent Carbon<br />Footprint Analysis<br />
                for a <em>Sustainable Future</em>
              </motion.h1>

              <motion.p variants={FV} className="text-lg leading-relaxed max-w-lg" style={{ color: 'var(--text-muted)' }}>
                Measure, analyze, and predict your environmental impact through AI-powered sustainability intelligence. Built for organizations that want to lead, not follow.
              </motion.p>

              <motion.div variants={FV}>
                <button
                  onClick={() => navigate('/signup')}
                  className="btn-primary flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold"
                >
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>

              {/* Stats */}
              <motion.div variants={FV} className="flex gap-10 pt-4 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                {stats.map((s) => (
                  <div key={s.l}>
                    <p className="section-title text-2xl text-gradient mb-0.5">{s.v}</p>
                    <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>{s.l}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — dashboard card */}
            <motion.div variants={FV} custom={3} initial="hidden" animate="visible" className="relative hidden lg:block">
              <div
                className="absolute -top-4 -right-4 z-10 animate-float flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--accent)', backdropFilter: 'blur(12px)' }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} />
                Scope 2 − 31% this quarter
              </div>
              <div
                className="absolute -bottom-3 -left-6 z-10 animate-float-gold flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--accent-gold)', backdropFilter: 'blur(12px)' }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent-gold)' }} />
                ESG Report Ready ✦
              </div>

              <div className="dash-mock">
                <div className="flex items-center justify-between px-5 py-3 border-b" style={{ background: 'var(--bg-elevated, var(--surface))', borderColor: 'var(--border)' }}>
                  <div className="flex gap-1.5">
                    {['var(--danger)','var(--accent-gold)','var(--accent)'].map((c,i) => (
                      <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                  <span className="font-mono text-xs" style={{ color: 'var(--text-dim)' }}>Emissions Intelligence · Q4 2026</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(var(--accent-rgb),0.15)', color: 'var(--accent)' }}>● LIVE</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="section-label mb-1" style={{ fontSize: '0.6rem' }}>Total CO₂e</p>
                      <p className="section-title text-3xl text-gradient">4,218</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>tCO₂e this quarter</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent)', border: '1px solid rgba(var(--accent-rgb),0.25)' }}>
                      ↓ 28% YoY
                    </span>
                  </div>
                  <HeroChart />
                  <div className="flex justify-between text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
                    {['Jan','Mar','May','Jul','Sep','Nov'].map((m) => <span key={m}>{m}</span>)}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label:'Scope 1', val:'812',  c:'var(--accent-blue)' },
                      { label:'Scope 2', val:'1,340', c:'var(--accent-gold)' },
                      { label:'ESG',     val:'A+',   c:'var(--accent)' },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg p-2.5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <p className="font-mono text-[0.6rem] mb-1 uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>{s.label}</p>
                        <p className="font-display text-lg" style={{ color: s.c }}>{s.val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-3 flex gap-2.5 items-start" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs" style={{ background: 'rgba(var(--accent-rgb),0.15)', color: 'var(--accent)' }}>⚡</div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>AI Forecast: </span>
                      At this trajectory your Scope 2 will exceed Q4 targets. Recommend switching to renewable grid procurement by October.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ TRUST BAR ═════════════════════════════════ */}
      <section className="py-10 border-y" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-mono uppercase tracking-[0.12em] mb-6" style={{ color: 'var(--text-dim)' }}>
            Trusted by sustainability-driven organizations
          </p>
          <div className="flex justify-center flex-wrap gap-8" style={{ opacity: 0.4 }}>
            {trust.map((t) => (
              <span key={t} className="text-sm font-bold tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                ◆ {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ GLOBAL CRISIS ═════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
        <div className="orb orb-gold  absolute top-0   right-0  w-[500px] h-[500px] opacity-10" />
        <div className="orb orb-green absolute bottom-0 left-0   w-[400px] h-[400px] opacity-10" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left — image */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <img
                  src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=900&q=80&auto=format&fit=crop"
                  alt="Industrial power plant emitting carbon dioxide"
                  className="w-full h-72 object-cover"
                  loading="lazy"
                />
                {/* Overlay badge */}
                <div
                  className="absolute bottom-4 left-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold backdrop-blur-md"
                  style={{ background: 'rgba(224,85,96,0.18)', border: '1px solid rgba(224,85,96,0.35)', color: '#e05560' }}
                >
                  <AlertTriangle className="h-4 w-4" />
                  +1.45 °C above baseline — and rising
                </div>
              </div>

              {/* Second small image */}
              <div
                className="absolute -bottom-6 -right-6 w-48 h-36 rounded-xl overflow-hidden hidden sm:block"
                style={{ border: '2px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
              >
                <img
                  src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&q=80&auto=format&fit=crop"
                  alt="Hands nurturing a plant — sustainability"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </motion.div>

            {/* Right — content */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8 pb-6 sm:pb-0"
            >
              <div>
                <p className="section-label mb-5">The Global Reality</p>
                <h2 className="section-title text-4xl md:text-5xl mb-5">
                  The carbon crisis is<br />happening <em>right now</em>
                </h2>
                <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  We have emitted more CO₂ in the last 30 years than in all of human history before. The window to limit catastrophic warming is narrowing — and every year of delayed measurement and action compounds the cost.
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4">
                {globalStats.map((s) => (
                  <div
                    key={s.value}
                    className="glass-card rounded-xl p-4"
                    style={{ borderLeft: `3px solid ${s.color}` }}
                  >
                    <p className="text-2xl font-bold font-display" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs font-semibold mt-1" style={{ color: 'var(--text)' }}>{s.label}</p>
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-dim)' }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              <Link to="/features" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                See how CarbonX addresses this <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ PAKISTAN SECTION ══════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="orb orb-blue  absolute top-0    right-1/4 w-[450px] h-[450px] opacity-15" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="section-label justify-center mb-5">Pakistan & Climate Change</p>
            <h2 className="section-title text-4xl md:text-5xl mb-5">
              Pakistan is on the <em>front line</em><br />of the climate crisis
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Despite contributing less than <strong style={{ color: 'var(--accent)' }}>0.9% of global CO₂ emissions</strong>, Pakistan
              faces among the most severe climate impacts on earth — floods, droughts, glacier loss, and deadly heat waves that threaten 220 million lives.
            </p>
          </motion.div>

          {/* Images row */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-3 gap-3 mb-16"
          >
            {[
              {
                src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80&auto=format&fit=crop',
                alt: 'Himalayan glaciers melting in Pakistan',
                label: 'Melting Glaciers',
                span: 'col-span-2',
                height: 'h-56',
              },
              {
                src: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80&auto=format&fit=crop',
                alt: 'Aerial view of climate impact',
                label: 'Extreme Heat',
                span: 'col-span-1',
                height: 'h-56',
              },
              {
                src: 'https://images.unsplash.com/photo-1569025590938-a00729c9e1f9?w=600&q=80&auto=format&fit=crop',
                alt: 'Drought and water scarcity in agriculture',
                label: 'Drought & Water Stress',
                span: 'col-span-1',
                height: 'h-44',
              },
              {
                src: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&q=80&auto=format&fit=crop',
                alt: 'Renewable energy transition — wind turbines',
                label: 'Energy Transition Opportunity',
                span: 'col-span-2',
                height: 'h-44',
              },
            ].map((img) => (
              <div
                key={img.label}
                className={`relative rounded-xl overflow-hidden ${img.span} ${img.height} group`}
                style={{ border: '1px solid var(--border)' }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(to top, rgba(6,13,9,0.7) 0%, transparent 60%)' }}
                />
                <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(var(--accent-rgb),0.2)', color: 'var(--accent)', border: '1px solid rgba(var(--accent-rgb),0.3)', backdropFilter: 'blur(8px)' }}
                  >
                    {img.label}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Facts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {pakistanFacts.map((fact, i) => {
              const Icon = fact.icon;
              return (
                <motion.div
                  key={fact.label}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="glass-card rounded-2xl p-5"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(var(--accent-rgb),0.1)', border: '1px solid rgba(var(--accent-rgb),0.2)' }}
                  >
                    <Icon className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                  </div>
                  <p className="font-semibold text-sm mb-1.5" style={{ color: 'var(--text)' }}>{fact.label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{fact.desc}</p>
                </motion.div>
              );
            })}
          </div>

          {/* How CarbonX helps Pakistan */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65 }}
            className="glass-card rounded-3xl overflow-hidden"
          >
            <div className="grid lg:grid-cols-5">
              {/* Left text */}
              <div className="lg:col-span-2 p-8 md:p-10" style={{ borderRight: '1px solid var(--border)' }}>
                <p className="section-label mb-5">Built for Pakistan</p>
                <h3 className="section-title text-3xl mb-5">
                  CarbonX helps Pakistani organizations <em>compete and comply</em>
                </h3>
                <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
                  With the EU Carbon Border Adjustment Mechanism (CBAM) now in effect and ESG due-diligence laws expanding globally, Pakistani exporters, manufacturers, and corporations need credible carbon accounting — or risk losing access to $85B in annual export markets.
                </p>
                <Link
                  to="/signup"
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
                >
                  Start for Free <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Right sectors */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2">
                {pakistanSectors.map((sector, i) => {
                  const Icon = sector.icon;
                  return (
                    <div
                      key={sector.label}
                      className="p-6 flex gap-4 items-start"
                      style={{
                        borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none',
                        borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(var(--accent-rgb),0.1)', border: '1px solid rgba(var(--accent-rgb),0.2)' }}
                      >
                        <Icon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{sector.label}</p>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{sector.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ MINI FEATURES PREVIEW ═════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
        <div className="absolute inset-0 bg-grid" style={{ opacity: 0.5 }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={SW} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-14 space-y-3"
          >
            <motion.p variants={FV} className="section-label justify-center">Platform Features</motion.p>
            <motion.h2 variants={FV} className="section-title text-4xl sm:text-5xl">
              Everything you need to<br />measure, <em>understand</em>, and reduce
            </motion.h2>
            <motion.p variants={FV} className="max-w-xl mx-auto text-lg" style={{ color: 'var(--text-muted)' }}>
              Eight integrated capabilities purpose-built for intelligent sustainability management at every scale.
            </motion.p>
          </motion.div>

          <motion.div
            variants={SW} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {miniFeatures.map((f, i) => (
              <motion.div key={f.label} variants={FV} custom={i} className="feature-card group">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `rgba(var(--accent-rgb),0.1)`, border: '1px solid rgba(var(--accent-rgb),0.2)' }}
                >
                  <f.icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text)' }}>{f.label}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={FV} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mt-10">
            <Link to="/features" className="inline-flex items-center gap-2 text-sm font-semibold transition-colors" style={{ color: 'var(--accent)' }}>
              View all 8 platform features <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ WHY ACT NOW ═══════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="section-label mb-5">Why Act Now</p>
              <h2 className="section-title text-4xl md:text-5xl mb-6">
                The cost of <em>inaction</em><br />is compounding
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
                Every year of delayed carbon measurement is a year of missed reduction. Companies that establish robust carbon baselines today will have a 3–5 year advantage when regulations, customer pressure, and capital markets fully price in carbon risk.
              </p>
              <ul className="space-y-4">
                {[
                  'EU CBAM tariffs already hitting carbon-intensive imports from Pakistan',
                  'SEC and SECP ESG disclosure requirements expanding in 2025–26',
                  'Net-zero supply chain mandates from major US and EU retailers',
                  'Green financing access tied to credible Scope 1, 2 & 3 reporting',
                  'Insurance premiums rising for high-carbon, climate-exposed assets',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right image */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <img
                  src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&q=80&auto=format&fit=crop"
                  alt="Solar panels — clean energy transition"
                  className="w-full h-80 object-cover"
                  loading="lazy"
                />
              </div>
              {/* Overlay card */}
              <div
                className="absolute -bottom-5 -left-5 glass-card rounded-2xl p-5 w-64"
                style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}
              >
                <p className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: 'var(--text-dim)' }}>CarbonX Impact</p>
                {[
                  { label: 'Avg. first-year reduction', value: '−42%', color: 'var(--accent)' },
                  { label: 'Time to first insight',     value: '8 weeks', color: 'var(--accent-gold)' },
                  { label: 'Compliance readiness',      value: '< 30 days', color: 'var(--accent-blue)' },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between text-sm py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                    <span className="font-semibold font-mono" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={SW} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="formula-bar rounded-2xl px-8 py-14 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(var(--accent-rgb),0.1) 0%, transparent 60%)',
            }} />
            <div className="relative space-y-6">
              <motion.p variants={FV} className="section-label justify-center">Start Today — It's Free</motion.p>
              <motion.h2 variants={FV} className="section-title text-4xl sm:text-5xl">
                Ready to lead on <em>sustainability?</em>
              </motion.h2>
              <motion.p variants={FV} className="max-w-lg mx-auto text-base" style={{ color: 'var(--text-muted)' }}>
                Join forward-thinking organizations already using CarbonX to measure, understand, and reduce their environmental impact with AI-powered intelligence.
              </motion.p>
              <motion.div variants={FV}>
                <button
                  onClick={() => navigate('/signup')}
                  className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold"
                >
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
              <motion.div variants={FV} className="flex flex-wrap justify-center gap-6 pt-2">
                {['SOC 2 Type II', 'GDPR Ready', 'GHG Protocol', '99.9% Uptime SLA'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-dim)' }}>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent)' }}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    {t}
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

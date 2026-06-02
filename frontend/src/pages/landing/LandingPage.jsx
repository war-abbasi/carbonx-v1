import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, ChevronRight, Zap, BarChart3, Leaf, AlertTriangle,
  Droplets, Thermometer, Wind, Building2, TrendingUp, CheckCircle, Shield,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar  from '../../components/layout/Navbar';
import Footer  from '../../components/shared/Footer';

const FV = {
  hidden:  { opacity: 0, y: 26 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] } }),
};
const SW = { visible: { transition: { staggerChildren: 0.1 } } };

/* ── Data ──────────────────────────────────────── */
const miniFeatures = [
  {
    icon: Leaf, label: 'Intelligent Carbon Tracking',
    color: 'var(--accent)', iconBg: 'rgba(var(--accent-rgb),0.12)', iconBorder: 'rgba(var(--accent-rgb),0.22)',
    desc: 'Real-time emission monitoring across all scopes with AI-powered categorization.',
  },
  {
    icon: Zap, label: 'AI Emission Prediction',
    color: 'var(--accent-warm)', iconBg: 'rgba(var(--accent-warm-rgb),0.12)', iconBorder: 'rgba(var(--accent-warm-rgb),0.22)',
    desc: 'Proprietary ML models forecast future emissions up to 24 months ahead with 99%+ accuracy.',
  },
  {
    icon: BarChart3, label: 'Interactive Dashboards',
    color: 'var(--accent-blue)', iconBg: 'rgba(91,143,168,0.12)', iconBorder: 'rgba(91,143,168,0.22)',
    desc: 'Enterprise-grade visualization of trends, hotspot analysis, and category breakdowns.',
  },
];

const stats = [
  { v: '180+',  l: 'Organizations' },
  { v: '2.4M',  l: 'Tonnes CO₂ Tracked' },
  { v: '99.1%', l: 'Accuracy Rate' },
];

const trust = ['TechGreen Corp', 'SustainIQ Partners', 'EcoVentures Asia', 'ClimateFirst Fund', 'NexaESG Group'];

const globalStats = [
  { value: '37.4B',  label: 'Tonnes of CO₂',  sub: 'emitted globally in 2023',            color: 'var(--danger)' },
  { value: '1.45°C', label: 'Average warming', sub: 'above pre-industrial baseline (2024)', color: 'var(--accent-warm)' },
  { value: '195',    label: 'Nations signed',  sub: 'the Paris Climate Agreement',          color: 'var(--accent-blue)' },
  { value: '$54T',   label: 'Economic risk',   sub: 'at stake if 2°C is breached by 2100', color: 'var(--accent)' },
];

const pakistanFacts = [
  { icon: Droplets,     label: '33 Million Displaced', desc: 'By the catastrophic 2022 monsoon floods — the worst in recorded history' },
  { icon: Thermometer,  label: 'Ranked 5th Globally',  desc: 'Most climate-vulnerable nation by the Germanwatch Climate Risk Index 2021' },
  { icon: Wind,         label: '7,253 Glaciers',        desc: 'More than anywhere outside the polar regions — all accelerating in melt rate' },
  { icon: AlertTriangle, label: '<0.9% of Emissions',  desc: 'Pakistan contributes under 1% of global CO₂ yet bears among the heaviest costs' },
];

const pakistanSectors = [
  { icon: Building2,  label: 'Textile & Manufacturing', desc: 'EU & US buyers demand Scope 3 supply chain transparency for market access' },
  { icon: TrendingUp, label: 'Financial & ESG',          desc: 'Islamic finance and international investors now require credible ESG disclosures' },
  { icon: Leaf,       label: 'Agriculture & Food',       desc: 'Climate-smart agriculture tracking to protect the 42% workforce in farming' },
  { icon: Zap,        label: 'Energy Transition',        desc: 'Renewable switch requires precise carbon accounting for NDMA & donor funding' },
];

/* ── Shared dark-section label ─────────────────── */
function DarkLabel({ children }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="h-px w-5" style={{ background: 'var(--accent)' }} />
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.67rem', letterSpacing: '0.13em',
        textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600,
      }}>
        {children}
      </span>
      <div className="h-px w-5" style={{ background: 'var(--accent)' }} />
    </div>
  );
}

/* ── Hero visual (right column) ────────────────── */
function HeroVisual() {
  return (
    <div className="relative py-8 px-4">
      {/* Outer decorative ring */}
      <div
        className="absolute inset-0 rounded-[32px] pointer-events-none"
        style={{ border: '1px solid rgba(var(--accent-rgb),0.13)' }}
      />

      {/* Main image */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: '1.5px solid rgba(var(--accent-rgb),0.20)',
          boxShadow: '0 24px 64px rgba(22,32,42,0.10)',
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=80&auto=format&fit=crop"
          alt="Sunlit forest — carbon sequestration and biodiversity"
          className="w-full h-[420px] object-cover"
          loading="eager"
        />
        {/* Bottom gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(22,32,42,0.86) 0%, rgba(31,111,120,0.06) 52%, transparent 72%)' }}
        />
        {/* Bottom text */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full animate-pulse flex-shrink-0" style={{ background: 'var(--accent)' }} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.63rem', letterSpacing: '0.09em',
              color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase',
            }}>
              Live Monitoring Active
            </span>
          </div>
          <p className="font-bold text-xl text-white leading-snug">2.4M tCO₂e tracked this year</p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Across 180+ organizations in 28 countries
          </p>
        </div>
      </div>

      {/* Floating card — top right: Scope 2 */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-2 -right-2 rounded-2xl z-10"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-md)',
          padding: '14px 18px',
          minWidth: '152px',
        }}
      >
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem', letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '5px',
        }}>
          Scope 2 Reduction
        </p>
        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>−31%</p>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '3px' }}>this quarter</p>
        <div style={{ marginTop: '8px', height: '4px', borderRadius: '2px', background: 'var(--surface)' }}>
          <div style={{ height: '100%', width: '69%', borderRadius: '2px', background: 'var(--accent)' }} />
        </div>
      </motion.div>

      {/* Floating card — mid right: AI (always dark) */}
      <motion.div
        animate={{ x: [0, 7, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        className="absolute top-1/2 -right-4 -translate-y-1/2 rounded-2xl z-10"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-md)',
          padding: '14px 18px',
          minWidth: '132px',
        }}
      >
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem', letterSpacing: '0.08em',
          color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '5px',
        }}>
          AI Accuracy
        </p>
        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>99.1%</p>
        <div style={{ marginTop: '8px', height: '4px', borderRadius: '2px', background: 'var(--surface)' }}>
          <div style={{ height: '100%', width: '99%', borderRadius: '2px', background: 'var(--accent)' }} />
        </div>
      </motion.div>

      {/* Floating card — bottom left: ESG */}
      <motion.div
        animate={{ y: [0, 9, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
        className="absolute bottom-2 -left-2 rounded-2xl z-10"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-md)',
          padding: '14px 18px',
          minWidth: '164px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-warm)', flexShrink: 0 }} />
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-warm)' }}>ESG Verified</p>
        </div>
        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>GHG Protocol Certified</p>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>ISO 14064 compliant</p>
      </motion.div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen hero-gradient" style={{ color: 'var(--text)' }}>
      <Navbar />

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 55% at 50% -5%, rgba(var(--accent-rgb),0.09) 0%, transparent 60%), radial-gradient(ellipse 40% 35% at 0% 70%, rgba(var(--accent-rgb),0.05) 0%, transparent 50%)',
        }} />
        <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
        <div className="orb orb-green absolute top-20 left-1/4  w-80 h-80 animate-orb-1" style={{ opacity: 0.12 }} />
        <div className="orb orb-gold  absolute bottom-20 right-1/3 w-72 h-72 animate-orb-2" style={{ opacity: 0.08 }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <motion.div variants={SW} initial="hidden" animate="visible" className="space-y-8">

              <motion.div variants={FV}>
                <span className="floating-badge">
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                  AI-Powered Sustainability Intelligence
                </span>
              </motion.div>

              <motion.h1 variants={FV} className="section-title text-5xl sm:text-6xl md:text-[3.85rem] leading-[1.1]">
                Intelligent Carbon<br />
                Footprint Analysis<br />
                for a <em>Sustainable Future</em>
              </motion.h1>

              <motion.p variants={FV} className="text-[1.05rem] leading-relaxed max-w-md" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                Measure, analyze, and predict your environmental impact through
                AI-powered sustainability intelligence. Built for organizations
                that want to lead, not follow.
              </motion.p>

              <motion.div variants={FV} className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => navigate('/signup')}
                  className="btn-primary inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-semibold"
                >
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  See how it works <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.div>

              {/* Stats row */}
              <motion.div variants={FV} className="grid grid-cols-3 gap-6 pt-4 mt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                {stats.map((s) => (
                  <div key={s.l}>
                    <p className="section-title text-[1.65rem] text-gradient mb-0.5 font-bold">{s.v}</p>
                    <p className="text-[0.7rem] uppercase tracking-[0.1em] font-medium" style={{ color: 'var(--text-dim)' }}>{s.l}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — hero image */}
            <motion.div
              variants={FV} custom={3}
              initial="hidden" animate="visible"
              className="relative hidden lg:block"
            >
              <HeroVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ TRUST BAR ═════════════════════════════════════ */}
      <section className="py-11 border-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[0.68rem] uppercase tracking-[0.14em] mb-8 font-medium" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Trusted by sustainability-driven organizations worldwide
          </p>
          <div className="flex justify-center flex-wrap gap-10">
            {trust.map((t) => (
              <span key={t} className="text-sm font-semibold flex items-center gap-2.5" style={{ color: 'var(--text-dim)' }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ GLOBAL CRISIS ═════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
        <div className="orb orb-gold  absolute top-0   right-0  w-[500px] h-[500px] opacity-08" />
        <div className="orb orb-green absolute bottom-0 left-0   w-[400px] h-[400px] opacity-08" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left — image */}
            <motion.div
              initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
                <img
                  src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=900&q=80&auto=format&fit=crop"
                  alt="Industrial power plant emitting carbon dioxide"
                  className="w-full h-72 object-cover"
                  loading="lazy"
                />
                <div
                  className="absolute bottom-4 left-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold backdrop-blur-md"
                  style={{ background: 'rgba(185,28,28,0.14)', border: '1px solid rgba(185,28,28,0.28)', color: 'var(--danger)' }}
                >
                  <AlertTriangle className="h-4 w-4" />
                  +1.45 °C above baseline — and rising
                </div>
              </div>
              <div
                className="absolute -bottom-6 -right-6 w-48 h-36 rounded-xl overflow-hidden hidden sm:block"
                style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
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
              initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
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

              <div className="grid grid-cols-2 gap-4">
                {globalStats.map((s) => (
                  <div key={s.value} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${s.color}`, boxShadow: 'var(--shadow-xs)' }}>
                    <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</p>
                    <p className="text-xs font-semibold mt-1" style={{ color: 'var(--text)' }}>{s.label}</p>
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-dim)' }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              <Link to="/features" className="inline-flex items-center gap-2 text-sm font-semibold transition-colors" style={{ color: 'var(--accent)' }}>
                See how CarbonX addresses this <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ PAKISTAN SECTION ══════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="orb orb-blue absolute top-0 right-1/4 w-[450px] h-[450px] opacity-10" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="section-label justify-center mb-5">Pakistan & Climate Change</p>
            <h2 className="section-title text-4xl md:text-5xl mb-5">
              Pakistan is on the <em>front line</em><br />of the climate crisis
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Despite contributing less than{' '}
              <strong style={{ color: 'var(--accent)' }}>0.9% of global CO₂ emissions</strong>,
              Pakistan faces among the most severe climate impacts on earth — floods, droughts, glacier loss,
              and deadly heat waves that threaten 220 million lives.
            </p>
          </motion.div>

          {/* Image mosaic */}
          <motion.div
            initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-3 gap-3 mb-16"
          >
            {[
              { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80&auto=format&fit=crop', alt: 'Himalayan glaciers melting in Pakistan',  label: 'Melting Glaciers',             span: 'col-span-2', height: 'h-56' },
              { src: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80&auto=format&fit=crop', alt: 'Aerial view of climate impact',            label: 'Extreme Heat',                 span: 'col-span-1', height: 'h-56' },
              { src: 'https://images.unsplash.com/photo-1569025590938-a00729c9e1f9?w=600&q=80&auto=format&fit=crop', alt: 'Drought and water scarcity',              label: 'Drought & Water Stress',       span: 'col-span-1', height: 'h-44' },
              { src: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&q=80&auto=format&fit=crop', alt: 'Renewable energy — wind turbines',        label: 'Energy Transition Opportunity', span: 'col-span-2', height: 'h-44' },
            ].map((img) => (
              <div
                key={img.label}
                className={`relative rounded-xl overflow-hidden ${img.span} ${img.height} group`}
                style={{ border: '1px solid var(--border)' }}
              >
                <img
                  src={img.src} alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(to top, rgba(var(--accent-rgb),0.70) 0%, transparent 60%)' }} />
                <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                    style={{ background: 'rgba(22,32,42,0.70)', border: '1px solid rgba(var(--accent-rgb),0.28)', backdropFilter: 'blur(8px)' }}>
                    {img.label}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Fact cards */}
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
                  className="rounded-2xl p-5"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(var(--accent-rgb),0.09)', border: '1px solid rgba(var(--accent-rgb),0.18)' }}>
                    <Icon className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                  </div>
                  <p className="font-semibold text-sm mb-1.5" style={{ color: 'var(--text)' }}>{fact.label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{fact.desc}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Built for Pakistan panel */}
          <motion.div
            initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65 }}
            className="rounded-3xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
          >
            <div className="grid lg:grid-cols-5">
              <div className="lg:col-span-2 p-8 md:p-10" style={{ borderRight: '1px solid var(--border)' }}>
                <p className="section-label mb-5">Built for Pakistan</p>
                <h3 className="section-title text-3xl mb-5">
                  CarbonX helps Pakistani organizations <em>compete and comply</em>
                </h3>
                <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
                  With the EU Carbon Border Adjustment Mechanism (CBAM) now in effect and ESG due-diligence laws
                  expanding globally, Pakistani exporters, manufacturers, and corporations need credible carbon
                  accounting — or risk losing access to $85B in annual export markets.
                </p>
                <Link to="/signup" className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold">
                  Start for Free <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2">
                {pakistanSectors.map((sector, i) => {
                  const Icon = sector.icon;
                  return (
                    <div
                      key={sector.label}
                      className="p-6 flex gap-4 items-start"
                      style={{
                        borderRight:  i % 2 === 0 ? '1px solid var(--border)' : 'none',
                        borderBottom: i < 2       ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(var(--accent-rgb),0.09)', border: '1px solid rgba(var(--accent-rgb),0.18)' }}>
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

      {/* ══ MINI FEATURES ════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
        <div className="absolute inset-0 bg-grid pointer-events-none" style={{ opacity: 0.16 }} />
        <div className="orb orb-green absolute -top-20 right-0 w-96 h-96 opacity-12" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div
            variants={SW} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-14 space-y-4"
          >
            <motion.div variants={FV}><DarkLabel>Platform Features</DarkLabel></motion.div>

            <motion.h2 variants={FV} className="section-title text-4xl sm:text-5xl">
              Everything you need to<br />
              measure, <em style={{ color: 'var(--accent-warm)' }}>understand</em>, and reduce
            </motion.h2>

            <motion.p variants={FV} className="max-w-xl mx-auto text-lg" style={{ color: 'var(--text-muted)' }}>
              Eight integrated capabilities purpose-built for intelligent sustainability management at every scale.
            </motion.p>
          </motion.div>

          <motion.div
            variants={SW} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-5"
          >
            {miniFeatures.map((f, i) => (
              <motion.div
                key={f.label}
                variants={FV}
                custom={i}
                className="rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: f.iconBg, border: `1px solid ${f.iconBorder}` }}>
                  <f.icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <h3 className="text-[0.95rem] font-semibold mb-2" style={{ color: 'var(--text)' }}>{f.label}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={FV} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link to="/features" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              View all 8 platform features <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ WHY ACT NOW ═══════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            <motion.div
              initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="section-label mb-5">Why Act Now</p>
              <h2 className="section-title text-4xl md:text-5xl mb-6">
                The cost of <em>inaction</em><br />is compounding
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
                Every year of delayed carbon measurement is a year of missed reduction. Companies that establish
                robust carbon baselines today will have a 3–5 year advantage when regulations, customer pressure,
                and capital markets fully price in carbon risk.
              </p>
              <ul className="space-y-3.5">
                {[
                  'EU CBAM tariffs already hitting carbon-intensive imports from Pakistan',
                  'SEC and SECP ESG disclosure requirements expanding in 2025–26',
                  'Net-zero supply chain mandates from major US and EU retailers',
                  'Green financing access tied to credible Scope 1, 2 & 3 reporting',
                  'Insurance premiums rising for high-carbon, climate-exposed assets',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                    <span className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
                <img
                  src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&q=80&auto=format&fit=crop"
                  alt="Solar panels — clean energy transition"
                  className="w-full h-80 object-cover"
                  loading="lazy"
                />
              </div>

              {/* Impact card */}
              <div
                className="absolute -bottom-5 -left-5 rounded-2xl p-5 w-64"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-strong)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <p className="text-[0.65rem] uppercase tracking-[0.1em] mb-3 font-medium"
                  style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  CarbonX Impact
                </p>
                {[
                  { label: 'Avg. first-year reduction', value: '−42%',      color: 'var(--accent)' },
                  { label: 'Time to first insight',     value: '8 weeks',    color: 'var(--accent-warm)' },
                  { label: 'Compliance readiness',      value: '< 30 days',  color: 'var(--accent-blue)' },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                    <span className="font-semibold" style={{ color: s.color, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, var(--surface) 0%, rgba(var(--accent-rgb),0.04) 100%)' }}>
        <div className="absolute inset-0 bg-grid pointer-events-none" style={{ opacity: 0.14 }} />
        <div className="orb orb-green absolute -top-16 left-0   w-96 h-96 opacity-15" />
        <div className="orb orb-gold  absolute -bottom-8 right-0 w-80 h-80 opacity-10" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative">
          <motion.div
            variants={SW} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center space-y-7"
          >
            <motion.div variants={FV}><DarkLabel>Start Today — It's Free</DarkLabel></motion.div>

            <motion.h2 variants={FV} className="section-title text-4xl sm:text-5xl">
              Ready to lead on <em style={{ color: 'var(--accent-warm)' }}>sustainability?</em>
            </motion.h2>

            <motion.p variants={FV} className="max-w-lg mx-auto text-[1.05rem] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Join forward-thinking organizations already using CarbonX to measure, understand, and reduce their
              environmental impact with AI-powered intelligence.
            </motion.p>

            <motion.div variants={FV}>
              <button
                onClick={() => navigate('/signup')}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-dark)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  background: 'var(--accent)', color: '#ffffff', fontWeight: 700,
                  padding: '14px 36px', borderRadius: '12px', fontSize: '0.9rem',
                  boxShadow: '0 4px 24px rgba(var(--accent-rgb),0.26)',
                  transition: 'all 0.22s ease', border: 'none', cursor: 'pointer',
                  letterSpacing: '0.01em',
                }}
              >
                Get Started Free <ArrowRight style={{ width: '17px', height: '17px' }} />
              </button>
            </motion.div>

            <motion.div variants={FV} className="flex flex-wrap justify-center gap-7 pt-1">
              {['SOC 2 Type II', 'GDPR Ready', 'GHG Protocol', '99.9% Uptime'].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: 'var(--text-dim)' }}>
                  <Shield style={{ width: '13px', height: '13px', color: 'var(--accent)', flexShrink: 0 }} />
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

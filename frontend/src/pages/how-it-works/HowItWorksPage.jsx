import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Database, Cpu, BarChart2, FileCheck, Repeat,
  ArrowRight, CheckCircle
} from 'lucide-react';
import Footer from '../../components/shared/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const steps = [
  {
    number: '01',
    icon: Database,
    title: 'Connect Your Data Sources',
    description:
      'Integrate with your existing ERP, utility billing, IoT sensors, supply chain platforms, and travel management tools in minutes. CarbonX supports 40+ native connectors and a universal CSV/API import for any custom source.',
    highlights: ['40+ Connectors', 'Auto-sync', 'Manual CSV upload', 'API integration'],
    color: 'var(--accent)',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'AI Processes & Classifies',
    description:
      'Our ML pipeline automatically categorizes every activity into the correct GHG Protocol emission category — Scope 1, 2, or 3. Emission factors are continuously updated from DEFRA, EPA, and IPCC databases.',
    highlights: ['GHG Protocol aligned', 'Live emission factors', 'Anomaly detection', 'Confidence scoring'],
    color: 'var(--accent-blue)',
  },
  {
    number: '03',
    icon: BarChart2,
    title: 'Visualize & Analyze',
    description:
      'Explore your footprint through interactive dashboards with heatmaps, Sankey flows, and trend overlays. Drill from organization level down to individual facility or product line in one click.',
    highlights: ['Real-time dashboards', 'Drill-down views', 'Peer benchmarking', 'Custom KPIs'],
    color: 'var(--accent-gold)',
  },
  {
    number: '04',
    icon: FileCheck,
    title: 'Report with Confidence',
    description:
      'Generate audit-ready reports for GHG Protocol, CDP, TCFD, and SBTi in minutes. Every data point is traceable back to its source with a full audit trail for third-party verification.',
    highlights: ['CDP ready', 'TCFD aligned', 'SBTi compatible', 'Audit trail'],
    color: 'var(--danger)',
  },
  {
    number: '05',
    icon: Repeat,
    title: 'Reduce & Improve',
    description:
      'Close the loop with AI-generated reduction recommendations, scenario modelling, and progress tracking against your science-based targets. CarbonX learns from your data to surface increasingly precise opportunities.',
    highlights: ['SBT scenario modelling', 'AI recommendations', 'Progress tracking', 'Carbon credits'],
    color: 'var(--accent)',
  },
];

const formulaItems = [
  { label: 'Transport Emissions', formula: 'km × 0.21 + (flights/yr ÷ 12) × 255', unit: 'kg CO₂e/mo' },
  { label: 'Energy Emissions', formula: 'kWh × emission_factor', unit: 'kg CO₂e/mo' },
  { label: 'Lifestyle Emissions', formula: '(meals/wk × 12) + (waste_kg × 8)', unit: 'kg CO₂e/mo' },
];

export default function HowItWorksPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)' }} className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="orb orb-green w-[500px] h-[500px] top-[-100px] right-[-200px] opacity-35" />
        <div className="orb orb-gold w-[350px] h-[350px] bottom-0 left-[-100px] opacity-20" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.p variants={fadeUp} className="section-label justify-center mb-5">
              How It Works
            </motion.p>
            <motion.h1 variants={fadeUp} className="section-title text-5xl md:text-6xl mb-6">
              From raw data to <em>climate action</em><br />in five steps
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              CarbonX turns fragmented emissions data into a single, trusted carbon intelligence
              platform — without requiring a PhD in climate science.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isEven = idx % 2 === 1;
              return (
                <motion.div
                  key={step.number}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  variants={fadeUp}
                  className={`step-card glass-card rounded-3xl p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${isEven ? 'lg:direction-rtl' : ''}`}
                >
                  {/* Text side */}
                  <div className={isEven ? 'lg:order-2' : ''}>
                    <div className="flex items-center gap-3 mb-5">
                      <span
                        className="text-6xl font-bold font-display opacity-15 select-none"
                        style={{ color: step.color, lineHeight: 1 }}
                      >
                        {step.number}
                      </span>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${step.color}1a`, border: `1px solid ${step.color}33` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: step.color }} />
                      </div>
                    </div>
                    <h3 className="section-title text-2xl md:text-3xl mb-4">{step.title}</h3>
                    <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
                      {step.description}
                    </p>
                    <ul className="grid grid-cols-2 gap-2">
                      {step.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: step.color }} />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Visual side */}
                  <div className={isEven ? 'lg:order-1' : ''}>
                    <div
                      className="rounded-2xl p-6 h-48 flex items-center justify-center"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      <div className="text-center">
                        <Icon className="w-16 h-16 mx-auto mb-3 opacity-20" style={{ color: step.color }} />
                        <p
                          className="text-xs font-mono uppercase tracking-widest"
                          style={{ color: step.color, opacity: 0.6 }}
                        >
                          Step {step.number}
                        </p>
                        <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>
                          {step.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Formula Bar ── */}
      <section className="py-24" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} className="section-label justify-center mb-4">
              Emission Calculation Engine
            </motion.p>
            <motion.h2 variants={fadeUp} className="section-title text-4xl md:text-5xl">
              Science-based <em>formulas</em>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base mt-4 max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Every calculation is traceable, auditable, and aligned with the latest IPCC emission factors.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="space-y-4"
          >
            {formulaItems.map((item) => (
              <motion.div key={item.label} variants={fadeUp} className="formula-bar rounded-2xl p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>
                      {item.label}
                    </p>
                    <code className="text-sm md:text-base font-mono" style={{ color: 'var(--accent)' }}>
                      {item.formula}
                    </code>
                  </div>
                  <span
                    className="text-xs font-mono px-3 py-1.5 rounded-lg whitespace-nowrap self-start md:self-auto"
                    style={{
                      background: 'rgba(var(--accent-rgb),0.1)',
                      color: 'var(--accent)',
                      border: '1px solid rgba(var(--accent-rgb),0.2)',
                    }}
                  >
                    {item.unit}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Dashboard Mockup ── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} className="section-label justify-center mb-4">
              The Platform
            </motion.p>
            <motion.h2 variants={fadeUp} className="section-title text-4xl">
              Your carbon <em>command center</em>
            </motion.h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card rounded-3xl overflow-hidden"
          >
            {/* Mock top bar */}
            <div
              className="px-6 py-4 flex items-center gap-3 border-b"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex gap-1.5">
                {['var(--danger)', 'var(--accent-gold)', 'var(--accent)'].map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <div
                className="flex-1 h-6 rounded-md mx-4 text-xs font-mono flex items-center px-3"
                style={{ background: 'var(--bg-card)', color: 'var(--text-dim)' }}
              >
                app.carbonx.io/dashboard
              </div>
            </div>

            {/* Mock content */}
            <div className="p-6 md:p-8" style={{ background: 'var(--bg-card)' }}>
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Emissions', value: '248.3 t', delta: '−12%', positive: true },
                  { label: 'Monthly Target', value: '22.4 t', delta: '−3%', positive: true },
                  { label: 'Reduction Rate', value: '18.2%', delta: '+2.1%', positive: true },
                  { label: 'Carbon Credits', value: '142', delta: '+18', positive: true },
                ].map((s) => (
                  <div key={s.label} className="glass-card rounded-xl p-4">
                    <p className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>{s.label}</p>
                    <p className="text-xl font-bold font-display" style={{ color: 'var(--text)' }}>{s.value}</p>
                    <p className="text-xs mt-1" style={{ color: s.positive ? 'var(--accent)' : 'var(--danger)' }}>
                      {s.delta}
                    </p>
                  </div>
                ))}
              </div>

              {/* Chart row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bar chart */}
                <div className="md:col-span-2 glass-card rounded-xl p-4">
                  <p className="text-xs font-mono mb-4" style={{ color: 'var(--text-dim)' }}>
                    Monthly Emissions (tCO₂e)
                  </p>
                  <div className="flex items-end gap-2 h-28">
                    {[60, 75, 55, 80, 65, 72, 48, 85, 58, 68, 45, 52].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                        className="flex-1 rounded-t-sm"
                        style={{
                          background: i === 11
                            ? 'var(--accent)'
                            : 'rgba(var(--accent-rgb),0.25)',
                          boxShadow: i === 11 ? '0 0 8px rgba(var(--accent-rgb),0.4)' : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Scope breakdown */}
                <div className="glass-card rounded-xl p-4">
                  <p className="text-xs font-mono mb-4" style={{ color: 'var(--text-dim)' }}>
                    Scope Breakdown
                  </p>
                  <div className="space-y-3">
                    {[
                      { label: 'Scope 1', pct: 35, color: 'var(--accent)' },
                      { label: 'Scope 2', pct: 28, color: 'var(--accent-gold)' },
                      { label: 'Scope 3', pct: 37, color: 'var(--accent-blue)' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                          <span>{item.label}</span><span style={{ color: item.color }}>{item.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: 'var(--surface)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                            className="h-full rounded-full"
                            style={{ background: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="section-label justify-center mb-5">
              Start Today
            </motion.p>
            <motion.h2 variants={fadeUp} className="section-title text-4xl mb-6">
              See the platform <em>in action</em>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base mb-10" style={{ color: 'var(--text-muted)' }}>
              Calculate your own footprint with our interactive calculator, or create an account
              to access the full CarbonX platform.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/calculator"
                className="btn-primary flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold"
              >
                Try the Calculator <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/signup"
                className="btn-outline flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold"
              >
                Create Free Account
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

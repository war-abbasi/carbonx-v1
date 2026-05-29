import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Leaf, Zap, BarChart3, FileText, Clock, Building2,
  TrendingUp, Shield, ArrowRight, CheckCircle
} from 'lucide-react';
import Footer from '../../components/shared/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const problems = [
  { value: '78%', label: 'of organizations lack real-time carbon visibility', color: 'var(--danger)' },
  { value: '$6.2T', label: 'in ESG-driven assets demand transparent reporting', color: 'var(--accent-gold)' },
  { value: '3.5×', label: 'more likely to hit targets with AI-powered tracking', color: 'var(--accent)' },
  { value: '91%', label: 'of existing tools lack predictive forecasting', color: 'var(--accent-blue)' },
];

const features = [
  {
    icon: Leaf,
    title: 'Intelligent Carbon Tracking',
    description:
      'Automatically capture Scope 1, 2, and 3 emissions across your entire value chain with smart data ingestion and real-time monitoring.',
    tags: ['Scope 1–3', 'Real-time', 'Auto-capture'],
  },
  {
    icon: Zap,
    title: 'AI Emission Prediction',
    description:
      'Leverage machine learning models trained on industry benchmarks to forecast your carbon trajectory and surface reduction opportunities months ahead.',
    tags: ['ML Models', 'Forecasting', 'Benchmarks'],
  },
  {
    icon: BarChart3,
    title: 'Interactive Dashboards',
    description:
      'Visualize your sustainability data through pixel-perfect charts, heatmaps, and trend lines — customizable for every stakeholder audience.',
    tags: ['Custom Views', 'Charts', 'Exports'],
  },
  {
    icon: FileText,
    title: 'Smart Reporting',
    description:
      'Generate audit-ready GHG Protocol, CDP, and TCFD reports in minutes. One-click export to PDF, CSV, or direct submission portals.',
    tags: ['GHG Protocol', 'CDP', 'TCFD'],
  },
  {
    icon: Clock,
    title: 'Historical Analysis',
    description:
      'Drill into years of emissions history with period-over-period comparisons, anomaly detection, and root-cause attribution tools.',
    tags: ['Trend Analysis', 'Anomaly Detection', 'Attribution'],
  },
  {
    icon: Building2,
    title: 'Organization-Level Monitoring',
    description:
      'Track emissions at facility, department, or business-unit level. Roll up or drill down across complex organizational hierarchies.',
    tags: ['Multi-site', 'Hierarchy', 'Consolidation'],
  },
  {
    icon: TrendingUp,
    title: 'Sustainability Analytics',
    description:
      'Turn raw emissions data into strategic intelligence — reduction potential scores, peer benchmarking, and science-based target alignment.',
    tags: ['SBTi Aligned', 'Peer Benchmarks', 'Scoring'],
  },
  {
    icon: Shield,
    title: 'Role-Based Access Control',
    description:
      'Granular permissions for sustainability managers, executives, auditors, and external stakeholders — all with full audit trails.',
    tags: ['SSO Ready', 'Audit Logs', 'Permissions'],
  },
];

const whyItems = [
  'Built on the GHG Protocol — the global standard for carbon accounting',
  'SOC 2 Type II certified infrastructure with end-to-end encryption',
  'Integrates with 40+ ERP, IoT, and supply chain data sources',
  'Dedicated sustainability expert support from day one',
];

export default function FeaturesPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)' }} className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Orbs */}
        <div className="orb orb-green w-[500px] h-[500px] top-[-120px] left-[-200px] opacity-40" />
        <div className="orb orb-blue w-[400px] h-[400px] bottom-0 right-[-150px] opacity-25" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.p variants={fadeUp} className="section-label justify-center mb-5">
              Platform Features
            </motion.p>
            <motion.h1 variants={fadeUp} className="section-title text-5xl md:text-6xl mb-6">
              Everything you need to reach<br />
              <em>net zero</em>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              CarbonX combines enterprise-grade data infrastructure with AI-powered intelligence
              to give your organization a clear, credible path to carbon neutrality.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Problem Stats ── */}
      <section className="py-20" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {problems.map((p) => (
              <motion.div key={p.value} variants={fadeUp} className="glass-card rounded-2xl p-6 text-center">
                <p className="text-4xl md:text-5xl font-bold font-display mb-3" style={{ color: p.color }}>
                  {p.value}
                </p>
                <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {p.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="section-label justify-center mb-4">
              Core Capabilities
            </motion.p>
            <motion.h2 variants={fadeUp} className="section-title text-4xl md:text-5xl">
              Built for <em>serious</em> sustainability
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} variants={fadeUp} className="feature-card glass-card rounded-2xl p-6 flex flex-col gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(var(--accent-rgb),0.12)', border: '1px solid rgba(var(--accent-rgb),0.2)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text)' }}>
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {f.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                    {f.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full font-mono"
                        style={{
                          background: 'rgba(var(--accent-rgb),0.08)',
                          color: 'var(--accent)',
                          border: '1px solid rgba(var(--accent-rgb),0.15)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Why CarbonX ── */}
      <section className="py-24" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
            >
              <motion.p variants={fadeUp} className="section-label mb-5">
                Why CarbonX
              </motion.p>
              <motion.h2 variants={fadeUp} className="section-title text-4xl md:text-5xl mb-6">
                The standard for <em>credible</em> climate action
              </motion.h2>
              <motion.p variants={fadeUp} className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
                We didn't build another sustainability checkbox tool. CarbonX is infrastructure —
                the foundation that lets your team move from data chaos to board-level confidence
                in your decarbonization strategy.
              </motion.p>
              <motion.ul variants={stagger} className="space-y-4">
                {whyItems.map((item) => (
                  <motion.li key={item} variants={fadeUp} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            {/* Right — visual */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card rounded-3xl p-8"
            >
              <p className="section-label mb-6">Emission Reduction Roadmap</p>
              <div className="space-y-5">
                {[
                  { label: 'Scope 1 — Direct Emissions', pct: 72, color: 'var(--accent)' },
                  { label: 'Scope 2 — Energy Indirect', pct: 55, color: 'var(--accent-gold)' },
                  { label: 'Scope 3 — Value Chain', pct: 38, color: 'var(--accent-blue)' },
                  { label: 'Offset Portfolio', pct: 89, color: 'var(--danger)' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                      <span>{item.label}</span>
                      <span style={{ color: item.color }}>{item.pct}%</span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: 'var(--surface)' }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                        className="h-full rounded-full"
                        style={{ background: item.color, boxShadow: `0 0 10px ${item.color}60` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-8 pt-6 border-t grid grid-cols-2 gap-4"
                style={{ borderColor: 'var(--border)' }}
              >
                {[
                  { value: '−42%', label: 'Avg. 1st-year reduction' },
                  { value: '8 wks', label: 'Avg. time to first insight' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-2xl font-bold font-display" style={{ color: 'var(--accent)' }}>
                      {s.value}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="section-label justify-center mb-5">
              Get Started
            </motion.p>
            <motion.h2 variants={fadeUp} className="section-title text-4xl md:text-5xl mb-6">
              Ready to take <em>control</em> of your carbon?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base mb-10" style={{ color: 'var(--text-muted)' }}>
              Join 180+ organizations using CarbonX to measure, manage, and reduce their
              carbon footprint with confidence.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="btn-primary flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold"
              >
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/how-it-works"
                className="btn-outline flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold"
              >
                See How It Works
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

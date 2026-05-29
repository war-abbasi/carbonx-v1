import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Target, Microscope, Globe, Users, ArrowRight, ChevronRight } from 'lucide-react';
import Footer from '../../components/shared/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const pillars = [
  {
    icon: Microscope,
    title: 'Scientific Rigour',
    description:
      'Every emission factor, calculation methodology, and reporting framework we use is sourced from peer-reviewed science and internationally recognised standards bodies — GHG Protocol, IPCC, DEFRA, and EPA.',
    color: 'var(--accent)',
  },
  {
    icon: Globe,
    title: 'Radical Transparency',
    description:
      'We publish our full methodology, update logs, and data sources publicly. Our audit trail means every tonne of CO₂ reported through CarbonX can be traced back to its origin with full chain of custody.',
    color: 'var(--accent-blue)',
  },
  {
    icon: Target,
    title: 'Action-Oriented',
    description:
      'Measurement without action is just reporting. CarbonX is designed to surface the highest-leverage reduction opportunities in your value chain and track progress against your science-based targets.',
    color: 'var(--accent-gold)',
  },
  {
    icon: Users,
    title: 'Built for Teams',
    description:
      'Sustainability is a team sport. CarbonX brings together sustainability managers, finance teams, operations, and executives on a single platform — with the right data for every audience.',
    color: 'var(--danger)',
  },
];

const vision = [
  'Universal carbon accounting — as standard as financial accounting',
  'AI-powered decarbonisation roadmaps for every sector',
  'Real-time supply chain emission visibility at product level',
  'Open emission data infrastructure accessible to all organisations',
  'Seamless integration with global carbon markets and offset registries',
];

const milestones = [
  { year: '2022', event: 'CarbonX founded — first GHG Protocol-aligned tracking MVP' },
  { year: '2023', event: 'Series A — 40 enterprise pilot customers across 8 industries' },
  { year: '2024', event: 'AI prediction engine launched — 91% accuracy in 12-month forecasting' },
  { year: '2025', event: 'SOC 2 Type II certification — 180+ organizations on platform' },
  { year: '2026', event: 'Supply chain Scope 3 module — full value chain visibility' },
];

export default function AboutPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)' }} className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="orb orb-green w-[500px] h-[500px] top-[-120px] right-[-200px] opacity-35" />
        <div className="orb orb-gold  w-[400px] h-[400px] bottom-[-100px] left-[-150px] opacity-20" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.p variants={fadeUp} className="section-label justify-center mb-5">
              About CarbonX
            </motion.p>
            <motion.h1 variants={fadeUp} className="section-title text-5xl md:text-6xl mb-6">
              We exist to make <em>climate action</em><br />
              measurable and credible
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              CarbonX was founded on a simple belief: organizations can't decarbonise what
              they can't accurately measure. We build the infrastructure that turns intent
              into verifiable climate progress.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Mission Statement ── */}
      <section className="py-24" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
            >
              <motion.p variants={fadeUp} className="section-label mb-5">Our Mission</motion.p>
              <motion.h2 variants={fadeUp} className="section-title text-4xl md:text-5xl mb-6">
                Accelerating the world's transition to <em>net zero</em>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-base leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
                The climate crisis is fundamentally a data problem. Trillions of tonnes of greenhouse
                gases are released every year with limited visibility into who is responsible, where
                reductions are possible, and whether pledges are being honoured.
              </motion.p>
              <motion.p variants={fadeUp} className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                CarbonX solves this by providing enterprise organisations with the measurement
                infrastructure, AI intelligence, and reporting confidence they need to move from
                net-zero commitments to net-zero reality.
              </motion.p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { value: '180+', label: 'Organizations', sub: 'across 22 countries', color: 'var(--accent)' },
                { value: '2.4M', label: 'Tonnes Tracked', sub: 'CO₂e monitored', color: 'var(--accent-gold)' },
                { value: '99.1%', label: 'Accuracy', sub: 'in emission classification', color: 'var(--accent-blue)' },
                { value: '−42%', label: 'Avg. Reduction', sub: 'in first 12 months', color: 'var(--danger)' },
              ].map((s) => (
                <motion.div key={s.label} variants={fadeUp} className="glass-card rounded-2xl p-5 text-center">
                  <p className="text-3xl font-bold font-display mb-1" style={{ color: s.color }}>
                    {s.value}
                  </p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{s.label}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>{s.sub}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Four Pillars ── */}
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
              Our Values
            </motion.p>
            <motion.h2 variants={fadeUp} className="section-title text-4xl md:text-5xl">
              The four <em>pillars</em> we build on
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <motion.div key={p.title} variants={fadeUp} className="feature-card glass-card rounded-2xl p-8">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                    style={{ background: `${p.color}1a`, border: `1px solid ${p.color}33` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: p.color }} />
                  </div>
                  <h3 className="section-title text-2xl mb-4">{p.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {p.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="py-24" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} className="section-label justify-center mb-4">
              Our Journey
            </motion.p>
            <motion.h2 variants={fadeUp} className="section-title text-4xl">
              From idea to <em>impact</em>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="relative"
          >
            {/* Vertical line */}
            <div
              className="absolute left-16 top-0 bottom-0 w-px"
              style={{ background: 'var(--border)' }}
            />

            <div className="space-y-8">
              {milestones.map((m, idx) => (
                <motion.div
                  key={m.year}
                  variants={fadeUp}
                  className="flex items-start gap-6"
                >
                  {/* Year */}
                  <div className="w-28 flex-shrink-0 text-right">
                    <span
                      className="text-sm font-mono font-semibold"
                      style={{ color: idx === milestones.length - 1 ? 'var(--accent)' : 'var(--text-muted)' }}
                    >
                      {m.year}
                    </span>
                  </div>

                  {/* Dot */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5 z-10 relative"
                    style={{
                      background: idx === milestones.length - 1 ? 'var(--accent)' : 'var(--border-strong)',
                      boxShadow: idx === milestones.length - 1 ? '0 0 8px var(--accent)' : 'none',
                    }}
                  />

                  {/* Event */}
                  <div
                    className="flex-1 pb-8"
                    style={{ borderBottom: idx < milestones.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: idx === milestones.length - 1 ? 'var(--text)' : 'var(--text-muted)' }}
                    >
                      {m.event}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Future Vision ── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
            >
              <motion.p variants={fadeUp} className="section-label mb-5">Future Vision</motion.p>
              <motion.h2 variants={fadeUp} className="section-title text-4xl md:text-5xl mb-6">
                Where we're <em>headed</em>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
                We're building toward a world where carbon accounting is as automated,
                standardized, and universally trusted as financial accounting.
              </motion.p>
              <motion.ul variants={stagger} className="space-y-4">
                {vision.map((item) => (
                  <motion.li key={item} variants={fadeUp} className="flex items-start gap-3">
                    <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65 }}
              className="glass-card rounded-3xl p-8"
            >
              <p className="section-label mb-6">2030 Target</p>
              <div className="text-center mb-8">
                <p className="text-7xl font-bold font-display" style={{ color: 'var(--accent)' }}>1B</p>
                <p className="text-base font-semibold mt-2" style={{ color: 'var(--text)' }}>
                  tonnes CO₂e tracked annually
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                  Representing 2.5% of global emissions
                </p>
              </div>
              <div className="space-y-4 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                {[
                  { label: 'Organizations on Platform', current: '180+', target: '10,000+' },
                  { label: 'Countries Covered', current: '22', target: '100+' },
                  { label: 'Data Sources Integrated', current: '40+', target: '200+' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs" style={{ color: 'var(--text-dim)' }}>
                        {item.current}
                      </span>
                      <ArrowRight className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                      <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                        {item.target}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
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
              Join Us
            </motion.p>
            <motion.h2 variants={fadeUp} className="section-title text-4xl md:text-5xl mb-6">
              Be part of the <em>solution</em>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base mb-10" style={{ color: 'var(--text-muted)' }}>
              Every organisation that measures and reduces its carbon footprint brings us
              closer to a livable planet. Start your journey today.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="btn-primary flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold"
              >
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="btn-outline flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold"
              >
                Talk to Our Team
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

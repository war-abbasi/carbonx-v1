import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Car, Plane, Zap, Utensils, Trash2, ArrowRight, Info, RefreshCw } from 'lucide-react';
import Footer from '../../components/shared/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const BENCHMARKS = {
  low:    { label: 'Low Impact',    value: 150,  color: 'var(--accent)' },
  avg:    { label: 'Global Avg.',   value: 400,  color: 'var(--accent-gold)' },
  high:   { label: 'High Impact',   value: 800,  color: 'var(--danger)' },
};

function Slider({ value, onChange, min, max, step = 1, label, unit, icon: Icon, color = 'var(--accent)', hint }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color}1a`, border: `1px solid ${color}33` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</span>
          {hint && (
            <div className="group relative">
              <Info className="w-3.5 h-3.5 cursor-help" style={{ color: 'var(--text-dim)' }} />
              <div
                className="absolute left-0 bottom-full mb-2 w-52 text-xs p-2.5 rounded-lg z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                {hint}
              </div>
            </div>
          )}
        </div>
        <span className="text-sm font-mono font-semibold" style={{ color }}>
          {value} <span className="text-xs font-normal" style={{ color: 'var(--text-dim)' }}>{unit}</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full" style={{ background: 'var(--surface)' }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-150"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}60` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ zIndex: 2 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all duration-150 pointer-events-none"
          style={{
            left: `calc(${pct}% - 8px)`,
            background: 'var(--bg)',
            borderColor: color,
            boxShadow: `0 0 6px ${color}80`,
          }}
        />
      </div>
    </div>
  );
}

function ResultBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
        <span>{label}</span>
        <span style={{ color }}>{value.toFixed(1)} kg CO₂e</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}50` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  const [car,      setCar]      = useState(80);   // km/day
  const [flights,  setFlights]  = useState(2);    // flights/year
  const [elec,     setElec]     = useState(250);  // kWh/month
  const [meat,     setMeat]     = useState(4);    // meals/week
  const [waste,    setWaste]    = useState(10);   // kg/week

  const results = useMemo(() => {
    const transport  = car * 0.21 + (flights / 12) * 255;
    const electricity = elec * 0.42;
    const lifestyle  = meat * 12 + waste * 8;
    const total      = transport + electricity + lifestyle;
    return { transport, electricity, lifestyle, total };
  }, [car, flights, elec, meat, waste]);

  const getRating = (total) => {
    if (total < 200)  return { label: 'Low Impact',    color: 'var(--accent)',      desc: 'Great job — your footprint is well below average.' };
    if (total < 500)  return { label: 'Average Impact', color: 'var(--accent-gold)', desc: 'Around the global average. Small changes can help.' };
    return              { label: 'High Impact',          color: 'var(--danger)',      desc: 'Above average — significant reduction potential.' };
  };

  const rating = getRating(results.total);

  const reset = () => { setCar(80); setFlights(2); setElec(250); setMeat(4); setWaste(10); };

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)' }} className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="orb orb-green w-[450px] h-[450px] top-[-100px] left-[-150px] opacity-30" />
        <div className="orb orb-gold  w-[350px] h-[350px] bottom-0   right-[-100px] opacity-20" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.p variants={fadeUp} className="section-label justify-center mb-5">
              Carbon Calculator
            </motion.p>
            <motion.h1 variants={fadeUp} className="section-title text-5xl md:text-6xl mb-6">
              What's your <em>carbon footprint</em>?
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              Adjust the sliders below to estimate your monthly CO₂ emissions.
              All calculations use verified emission factors from DEFRA and the IPCC.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Calculator ── */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Inputs — left (3 cols) */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="lg:col-span-3 space-y-5"
            >
              {/* Transport */}
              <motion.div variants={fadeUp} className="glass-card rounded-2xl p-6 space-y-6">
                <p className="section-label mb-0">Transport</p>
                <Slider
                  value={car} onChange={setCar} min={0} max={200} step={5}
                  label="Car Travel" unit="km/day" icon={Car}
                  color="var(--accent-blue)"
                  hint="Daily distance driven by car. Assumes average petrol vehicle (0.21 kg CO₂/km)."
                />
                <Slider
                  value={flights} onChange={setFlights} min={0} max={20}
                  label="Flights per Year" unit="flights/yr" icon={Plane}
                  color="var(--accent-gold)"
                  hint="Economy class return flights. Average of 255 kg CO₂ per flight per month."
                />
              </motion.div>

              {/* Energy */}
              <motion.div variants={fadeUp} className="glass-card rounded-2xl p-6">
                <p className="section-label mb-6">Energy</p>
                <Slider
                  value={elec} onChange={setElec} min={0} max={1000} step={10}
                  label="Electricity Usage" unit="kWh/mo" icon={Zap}
                  color="var(--accent)"
                  hint="Monthly household electricity consumption. Uses DEFRA grid emission factor (0.42 kg CO₂/kWh)."
                />
              </motion.div>

              {/* Lifestyle */}
              <motion.div variants={fadeUp} className="glass-card rounded-2xl p-6 space-y-6">
                <p className="section-label mb-0">Lifestyle</p>
                <Slider
                  value={meat} onChange={setMeat} min={0} max={21}
                  label="Meat-based Meals" unit="meals/wk" icon={Utensils}
                  color="var(--accent-gold)"
                  hint="Number of meals per week containing red meat. Each contributes approx. 12 kg CO₂e/month."
                />
                <Slider
                  value={waste} onChange={setWaste} min={0} max={50} step={1}
                  label="Household Waste" unit="kg/wk" icon={Trash2}
                  color="var(--danger)"
                  hint="Total household waste generated per week. Landfill waste produces 8 kg CO₂e per kg."
                />
              </motion.div>
            </motion.div>

            {/* Results — right (2 cols) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-2 space-y-5"
            >
              {/* Total */}
              <div className="glass-card rounded-2xl p-6 text-center">
                <p className="section-label justify-center mb-4">Monthly Total</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={Math.round(results.total)}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    className="text-6xl font-bold font-display"
                    style={{ color: rating.color }}
                  >
                    {results.total.toFixed(0)}
                  </motion.p>
                </AnimatePresence>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>kg CO₂e / month</p>
                <div
                  className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: `${rating.color}1a`, color: rating.color, border: `1px solid ${rating.color}33` }}
                >
                  {rating.label}
                </div>
                <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>{rating.desc}</p>
              </div>

              {/* Breakdown */}
              <div className="glass-card rounded-2xl p-6">
                <p className="section-label mb-5">Breakdown</p>
                <div className="space-y-4">
                  <ResultBar
                    label="Transport"
                    value={results.transport}
                    total={results.total}
                    color="var(--accent-blue)"
                  />
                  <ResultBar
                    label="Electricity"
                    value={results.electricity}
                    total={results.total}
                    color="var(--accent)"
                  />
                  <ResultBar
                    label="Lifestyle"
                    value={results.lifestyle}
                    total={results.total}
                    color="var(--accent-gold)"
                  />
                </div>

                <div className="mt-5 pt-5 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
                  {[
                    { label: 'Transport', value: results.transport },
                    { label: 'Electricity', value: results.electricity },
                    { label: 'Lifestyle', value: results.lifestyle },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{item.label}</span>
                      <span className="font-mono">{item.value.toFixed(1)} kg</span>
                    </div>
                  ))}
                  <div
                    className="flex justify-between text-sm font-semibold pt-2 border-t"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    <span>Total</span>
                    <span className="font-mono" style={{ color: rating.color }}>
                      {results.total.toFixed(1)} kg
                    </span>
                  </div>
                </div>
              </div>

              {/* vs benchmarks */}
              <div className="glass-card rounded-2xl p-6">
                <p className="section-label mb-5">vs. Benchmarks</p>
                <div className="space-y-3">
                  {Object.values(BENCHMARKS).map((b) => (
                    <div key={b.label} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                          <span>{b.label}</span>
                          <span className="font-mono">{b.value} kg</span>
                        </div>
                        <div className="h-1 rounded-full" style={{ background: 'var(--surface)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min((b.value / 900) * 100, 100)}%`, background: b.color }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Your result marker */}
                  <div className="flex items-center gap-3 pt-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: rating.color, boxShadow: `0 0 6px ${rating.color}` }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text)' }}>
                        <span className="font-semibold">Your Result</span>
                        <span className="font-mono font-semibold">{results.total.toFixed(0)} kg</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: 'var(--surface)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          animate={{ width: `${Math.min((results.total / 900) * 100, 100)}%` }}
                          transition={{ duration: 0.4 }}
                          style={{ background: rating.color, boxShadow: `0 0 6px ${rating.color}80` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Link
                  to="/signup"
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold"
                >
                  Get a Full Analysis <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={reset}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <RefreshCw className="w-4 h-4" /> Reset
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Formula transparency ── */}
      <section className="py-20" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-10"
          >
            <motion.p variants={fadeUp} className="section-label justify-center mb-4">
              Methodology
            </motion.p>
            <motion.h2 variants={fadeUp} className="section-title text-3xl md:text-4xl">
              <em>Transparent</em> calculations
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="space-y-3"
          >
            {[
              {
                label: 'Transport',
                formula: 'monthly_transport = (km_per_day × 0.21) + (annual_flights ÷ 12 × 255)',
                source: 'DEFRA 2024 Vehicle Emission Factors',
              },
              {
                label: 'Electricity',
                formula: 'monthly_electricity = monthly_kWh × 0.42',
                source: 'IPCC Grid Emission Factor (global average)',
              },
              {
                label: 'Lifestyle',
                formula: 'monthly_lifestyle = (meals_per_week × 12) + (waste_kg_per_week × 8)',
                source: 'EPA Food & Waste Lifecycle Assessment',
              },
            ].map((item) => (
              <motion.div key={item.label} variants={fadeUp} className="formula-bar rounded-xl p-4 md:p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>
                      {item.label}
                    </p>
                    <code className="text-sm font-mono" style={{ color: 'var(--accent)' }}>
                      {item.formula}
                    </code>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {item.source}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

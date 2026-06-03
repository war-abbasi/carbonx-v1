import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, BarChart3, Leaf, AlertCircle } from 'lucide-react';

function Card({ className = '', style = {}, children }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: '#ffffff', border: '1px solid #E5EAE8', ...style }}>
      {children}
    </div>
  );
}

/* Animated bar */
function Bar({ height, color, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <span className="text-[10px] font-semibold" style={{ color: '#3D5247' }}>{value}</span>
      <div className="w-full flex items-end" style={{ height: '120px', background: '#F9FAF9', borderRadius: '6px', padding: '4px' }}>
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${height}%` }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full rounded-md"
          style={{ background: color, opacity: 0.85, minHeight: '4px' }}
        />
      </div>
      <span className="text-[10px]" style={{ color: '#9BAEA5' }}>{label}</span>
    </div>
  );
}

/* Donut segment helper — simple CSS */
function ScopeBar({ label, pct, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: '#5A7A6D' }}>{label}</span>
        <span className="font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: '#F0EDE4' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MOCK_BARS = [72,85,68,91,80,65,88,74,62,79,70,58];

const RANGES = ['This Year', 'Last 6 Months', 'Last 3 Months'];

export default function AnalyticsPage() {
  const [range, setRange] = useState('This Year');

  const bars = range === 'Last 3 Months' ? MOCK_BARS.slice(9)
             : range === 'Last 6 Months' ? MOCK_BARS.slice(6)
             : MOCK_BARS;
  const months = range === 'Last 3 Months' ? MONTHS.slice(9)
               : range === 'Last 6 Months' ? MONTHS.slice(6)
               : MONTHS;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1A2118' }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9BAEA5' }}>Emission trends and performance metrics</p>
        </div>
        {/* Range selector */}
        <div className="flex gap-1.5 p-1 rounded-lg" style={{ background: '#F4F6F4', border: '1px solid #E5EAE8' }}>
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all"
              style={r === range ? { background: '#2D6A4F', color: '#fff' } : { color: '#7A9E8E' }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Emissions', value: '4,218', unit: 'tCO₂e', change: '−12%', up: false, accent: '#2D6A4F' },
          { label: 'Scope 1',         value: '812',   unit: 'tCO₂e', change: '−8%',  up: false, accent: '#2D6A4F' },
          { label: 'Scope 2',         value: '1,340', unit: 'tCO₂e', change: '−18%', up: false, accent: '#C4952A' },
          { label: 'Scope 3',         value: '2,066', unit: 'tCO₂e', change: '+3%',  up: true,  accent: '#8B5E3C' },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
          >
            <Card className="p-5">
              <p className="text-xs font-medium mb-2" style={{ color: '#9BAEA5' }}>{k.label}</p>
              <p className="text-2xl font-bold" style={{ color: '#1A2118' }}>
                {k.value}
                <span className="text-sm font-normal ml-1.5" style={{ color: '#9BAEA5' }}>{k.unit}</span>
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                {k.up
                  ? <TrendingUp className="h-3.5 w-3.5" style={{ color: '#DC2626' }} />
                  : <TrendingDown className="h-3.5 w-3.5" style={{ color: '#2D6A4F' }} />
                }
                <span className="text-xs font-semibold" style={{ color: k.up ? '#DC2626' : '#2D6A4F' }}>
                  {k.change} vs prior period
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bar chart + Scope breakdown */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Bar chart (2/3) */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#1A2118' }}>Monthly Emissions</h2>
              <p className="text-xs mt-0.5" style={{ color: '#9BAEA5' }}>tCO₂e per month</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              {[['#2D6A4F','Scope 1'],['#C4952A','Scope 2'],['#8B5E3C','Scope 3']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: c }} />
                  <span style={{ color: '#7A9E8E' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2">
            {bars.map((h, i) => (
              <Bar
                key={months[i]}
                height={h}
                color={i % 3 === 0 ? '#2D6A4F' : i % 3 === 1 ? '#C4952A' : '#8B5E3C'}
                label={months[i]}
                value={`${Math.round(h * 0.6 + 20)}t`}
              />
            ))}
          </div>
        </Card>

        {/* Scope breakdown (1/3) */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold mb-5" style={{ color: '#1A2118' }}>Scope Breakdown</h2>
          <div className="space-y-4">
            <ScopeBar label="Scope 1 — Direct" pct={19} color="#2D6A4F" />
            <ScopeBar label="Scope 2 — Indirect" pct={32} color="#C4952A" />
            <ScopeBar label="Scope 3 — Value Chain" pct={49} color="#8B5E3C" />
          </div>

          <div className="mt-6 pt-5" style={{ borderTop: '1px solid #E5EAE8' }}>
            <h3 className="text-xs font-semibold mb-3" style={{ color: '#9BAEA5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Top Sources
            </h3>
            {[
              { src: 'Energy consumption',   pct: 38 },
              { src: 'Business travel',       pct: 24 },
              { src: 'Supply chain',          pct: 21 },
              { src: 'Waste & water',         pct: 17 },
            ].map((s) => (
              <div key={s.src} className="flex justify-between items-center py-1.5 text-xs" style={{ borderBottom: '1px solid #F0EDE4' }}>
                <span style={{ color: '#5A7A6D' }}>{s.src}</span>
                <span className="font-semibold" style={{ color: '#1A2118' }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* No live data notice */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" style={{ color: '#C4952A', width: '18px', height: '18px' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1A2118' }}>Showing Demo Data</p>
            <p className="text-xs mt-0.5" style={{ color: '#7A9E8E' }}>
              Connect a data source in Admin Panel to replace this with your real emission figures.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

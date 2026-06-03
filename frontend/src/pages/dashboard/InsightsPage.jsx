import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Leaf, TrendingDown, BarChart3, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

function Card({ className = '', style = {}, children }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: '#ffffff', border: '1px solid #E5EAE8', ...style }}>
      {children}
    </div>
  );
}

const INSIGHTS = [
  {
    id: 1, category: 'energy', priority: 'high',
    icon: Zap, accent: '#C4952A', bg: '#FDF5E6',
    title: 'Switch to Renewable Electricity',
    summary: 'Migrating to a renewable energy tariff could eliminate 100% of your Scope 2 emissions immediately.',
    impact: '−32% total emissions', effort: 'Low effort', status: 'recommended',
    tags: ['Scope 2', 'Energy'],
  },
  {
    id: 2, category: 'transport', priority: 'high',
    icon: TrendingDown, accent: '#2D6A4F', bg: '#EAF4EE',
    title: 'Reduce Business Air Travel',
    summary: 'Business travel typically accounts for 15–25% of Scope 3. Shifting 50% of flights to video calls yields significant savings.',
    impact: '−15% Scope 3', effort: 'Medium effort', status: 'recommended',
    tags: ['Scope 3', 'Transport'],
  },
  {
    id: 3, category: 'supply_chain', priority: 'medium',
    icon: BarChart3, accent: '#8B5E3C', bg: '#F9F2EC',
    title: 'Engage Top 10 Suppliers',
    summary: 'Your supply chain (Scope 3 Cat. 1) is likely your largest emission source. Requesting emission data from your top 10 suppliers unlocks targeted reduction.',
    impact: '−18% Scope 3', effort: 'High effort', status: 'planned',
    tags: ['Scope 3', 'Supply Chain'],
  },
  {
    id: 4, category: 'energy', priority: 'medium',
    icon: Leaf, accent: '#2D6A4F', bg: '#EAF4EE',
    title: 'ISO 14001 Certification',
    summary: 'An environmental management system (EMS) improves operational efficiency and signals commitment to stakeholders and ESG investors.',
    impact: 'ESG score +12pts', effort: 'Medium effort', status: 'planned',
    tags: ['Compliance', 'ESG'],
  },
  {
    id: 5, category: 'waste', priority: 'low',
    icon: Leaf, accent: '#8B5E3C', bg: '#F9F2EC',
    title: 'Zero-Waste Operations Programme',
    summary: 'Introducing a waste diversion programme targeting 90% landfill avoidance reduces Scope 3 Category 5 emissions and operational costs.',
    impact: '−4% total emissions', effort: 'Low effort', status: 'explore',
    tags: ['Scope 3', 'Waste'],
  },
  {
    id: 6, category: 'reporting', priority: 'high',
    icon: BarChart3, accent: '#2D6A4F', bg: '#EAF4EE',
    title: 'Set Science-Based Targets (SBTi)',
    summary: 'Committing to science-based targets aligned with 1.5°C gives you a credible roadmap and satisfies investor and regulatory expectations.',
    impact: 'Full compliance', effort: 'Medium effort', status: 'recommended',
    tags: ['Compliance', 'Strategy'],
  },
];

const CATEGORIES = ['All', 'Energy', 'Transport', 'Supply Chain', 'Waste', 'Reporting'];

const PRIORITY_STYLES = {
  high:   { bg: '#FEF2F2', color: '#DC2626', label: 'High Priority' },
  medium: { bg: '#FDF5E6', color: '#C4952A', label: 'Medium Priority' },
  low:    { bg: '#EAF4EE', color: '#2D6A4F', label: 'Low Priority'  },
};

const STATUS_STYLES = {
  recommended: { bg: '#EAF4EE', color: '#2D6A4F', icon: CheckCircle },
  planned:     { bg: '#FDF5E6', color: '#C4952A', icon: AlertCircle },
  explore:     { bg: '#F4F6F4', color: '#7A9E8E', icon: Sparkles    },
};

export default function InsightsPage() {
  const [cat, setCat] = useState('All');

  const visible = cat === 'All'
    ? INSIGHTS
    : INSIGHTS.filter((ins) => ins.tags.some((t) => t.toLowerCase().includes(cat.toLowerCase()) || ins.category.includes(cat.toLowerCase())));

  const highCount = INSIGHTS.filter((i) => i.priority === 'high').length;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1A2118' }}>AI Insights</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9BAEA5' }}>
            AI-generated recommendations to reduce your carbon footprint
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
          style={{ background: '#EAF4EE', color: '#2D6A4F', border: '1px solid #C0DDD0' }}
        >
          <Sparkles className="h-4 w-4" />
          {highCount} high-priority actions
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Insights',    value: INSIGHTS.length, accent: '#2D6A4F', bg: '#EAF4EE' },
          { label: 'Recommended',       value: INSIGHTS.filter((i) => i.status === 'recommended').length, accent: '#2D6A4F', bg: '#EAF4EE' },
          { label: 'High Priority',     value: highCount, accent: '#DC2626', bg: '#FEF2F2' },
          { label: 'Max CO₂ Reduction', value: '−49%', accent: '#8B5E3C', bg: '#F9F2EC' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-2xl font-bold" style={{ color: '#1A2118' }}>{s.value}</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: '#9BAEA5' }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all"
            style={c === cat
              ? { background: '#2D6A4F', color: '#ffffff' }
              : { background: '#F4F6F4', color: '#7A9E8E', border: '1px solid #E5EAE8' }
            }
          >
            {c}
          </button>
        ))}
      </div>

      {/* Insight cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((ins, i) => {
          const Icon        = ins.icon;
          const pStyle      = PRIORITY_STYLES[ins.priority];
          const sStyle      = STATUS_STYLES[ins.status];
          const StatusIcon  = sStyle.icon;
          return (
            <motion.div
              key={ins.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <Card className="p-5 h-full flex flex-col">
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: ins.bg }}>
                    <Icon className="h-5 w-5" style={{ color: ins.accent }} />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: pStyle.bg, color: pStyle.color }}>
                      {pStyle.label}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: sStyle.bg, color: sStyle.color }}>
                      <StatusIcon className="h-2.5 w-2.5" />
                      {ins.status.charAt(0).toUpperCase() + ins.status.slice(1)}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-semibold mb-2" style={{ color: '#1A2118' }}>{ins.title}</h3>
                <p className="text-xs leading-relaxed flex-1" style={{ color: '#7A9E8E' }}>{ins.summary}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {ins.tags.map((t) => (
                    <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: '#F4F6F4', color: '#9BAEA5', border: '1px solid #E5EAE8' }}>
                      {t}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid #F0EDE4' }}>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#9BAEA5' }}>Est. Impact</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: ins.accent }}>{ins.impact}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-right" style={{ color: '#9BAEA5' }}>Effort</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#3D5247' }}>{ins.effort}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

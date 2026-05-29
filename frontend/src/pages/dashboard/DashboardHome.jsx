import { motion } from 'framer-motion';
import {
  Factory, Target, TrendingDown, Leaf,
  ArrowRight, Zap, BarChart3, FileText, Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge }   from '../../components/ui/badge';
import { Button }  from '../../components/ui/button';
import { useAuthStore } from '../../store/authStore';
import { formatDate }   from '../../utils/helpers';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
  }),
};

const statCards = [
  { label: 'Total Emissions', value: '—', unit: 'tCO₂e',  icon: Factory,    color: 'var(--accent)',      description: 'This quarter' },
  { label: 'Monthly Target',  value: '—', unit: 'tCO₂e',  icon: Target,     color: 'var(--accent-gold)', description: 'Set your target' },
  { label: 'Reduction Rate',  value: '—', unit: '%',       icon: TrendingDown, color: 'var(--accent)',    description: 'vs last period' },
  { label: 'Carbon Credits',  value: '—', unit: 'units',   icon: Leaf,       color: 'var(--accent-gold)', description: 'Available balance' },
];

const quickActions = [
  { icon: Zap,      title: 'AI Insights', description: 'Get AI-powered recommendations for reducing your footprint.', color: 'var(--accent)' },
  { icon: BarChart3, title: 'Analytics',  description: 'Deep dive into emission trends, sources, and projections.',   color: 'var(--accent-gold)' },
  { icon: FileText, title: 'Reports',     description: 'Generate GHG Protocol & ISO 14064 compliance reports.',       color: 'var(--accent-blue)' },
];

const setupSteps = [
  { label: 'Account Created',      done: true  },
  { label: 'Connect Data Source',  done: false },
  { label: 'Set Baseline',         done: false },
  { label: 'Set Targets',          done: false },
];

export default function DashboardHome() {
  const { user } = useAuthStore();
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

      {/* ── Welcome banner ── */}
      <motion.div
        initial="hidden" animate="visible" variants={fadeUp}
        className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden"
      >
        {/* Decorative orbs */}
        <div className="orb orb-green absolute -right-16 -top-16  w-56 h-56 opacity-20 pointer-events-none" />
        <div className="orb orb-gold  absolute -right-4  -bottom-12 w-40 h-40 opacity-10 pointer-events-none" />

        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                {greeting},{' '}
                <span style={{ color: 'var(--accent)' }}>{user?.name?.split(' ')[0] ?? 'there'}</span>
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text)' }}>
                Welcome to{' '}
                <span style={{ color: 'var(--accent)' }}>CarbonX</span>
              </h1>
              <p className="text-sm mt-2 max-w-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Your carbon intelligence platform is ready. Once you connect your data sources, live
                emissions tracking, AI predictions, and compliance reports will appear here.
              </p>
            </div>
            <div className="flex-shrink-0 flex flex-col items-start sm:items-end gap-2">
              <Badge variant="success">
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ background: 'var(--accent)' }}
                />
                Platform Active
              </Badge>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Member since {formatDate(user?.createdAt ?? new Date())}
              </p>
            </div>
          </div>

          {/* Setup progress */}
          <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Setup Progress
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>1 / 4 complete</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: '25%', background: 'var(--accent)', boxShadow: '0 0 8px rgba(var(--accent-rgb),0.5)' }}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {setupSteps.map((step) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: step.done ? 'rgba(var(--accent-rgb),0.15)' : 'var(--surface)',
                      border: step.done ? '1px solid rgba(var(--accent-rgb),0.4)' : '1px solid var(--border)',
                    }}
                  >
                    {step.done && (
                      <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 8 8" style={{ color: 'var(--accent)' }}>
                        <path d="M6.41 0L5 1.41 2.83 3.59 1.41 2.17 0 3.59l2.83 2.82 4.24-4.24L6.41 0z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: step.done ? 'var(--accent)' : 'var(--text-dim)' }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
              <div className="glass-card rounded-2xl p-5 h-full">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="p-2.5 rounded-xl"
                    style={{
                      background: `${stat.color}1a`,
                      border: `1px solid ${stat.color}33`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: stat.color }} />
                  </div>
                  <Badge variant="soon">Soon</Badge>
                </div>
                <p className="text-3xl font-bold mb-1" style={{ color: 'var(--text)' }}>
                  {stat.value}{' '}
                  <span className="text-base font-normal" style={{ color: 'var(--text-dim)' }}>
                    {stat.unit}
                  </span>
                </p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>{stat.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Platform Modules ── */}
      <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Platform Modules</h2>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-dim)' }}>
            <Clock className="h-3.5 w-3.5" /> Launching soon
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div key={action.title} custom={5 + i} initial="hidden" animate="visible" variants={fadeUp}>
                <Card className="h-full p-5 opacity-70 hover:opacity-90 transition-opacity">
                  <div
                    className="inline-flex p-2.5 rounded-xl mb-4"
                    style={{ background: `${action.color}1a`, border: `1px solid ${action.color}33` }}
                  >
                    <Icon className="h-[18px] w-[18px]" style={{ color: action.color }} />
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{action.title}</h3>
                    <Badge variant="soon">Soon</Badge>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {action.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Recent activity ── */}
      <motion.div custom={8} initial="hidden" animate="visible" variants={fadeUp}>
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" disabled>
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <CardDescription className="text-xs">
              Activity logs will appear here once data sources are connected.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3">
              {[
                { action: 'Account created',                  time: 'Just now', done: true  },
                { action: 'Awaiting data source connection',  time: 'Pending',  done: false },
                { action: 'AI model training',                time: 'Pending',  done: false },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 py-2 border-b last:border-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={{
                      background: item.done ? 'rgba(var(--accent-rgb),0.12)' : 'var(--surface)',
                      border: item.done ? '1px solid rgba(var(--accent-rgb),0.25)' : '1px solid var(--border)',
                      color: item.done ? 'var(--accent)' : 'var(--text-dim)',
                    }}
                  >
                    {item.done ? '✓' : '○'}
                  </div>
                  <p className="flex-1 text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                    {item.action}
                  </p>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-dim)' }}>
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Factory, Target, TrendingDown, Leaf,
  ArrowRight, Activity, BarChart3, MessageSquare,
  Sparkles, ShieldCheck, CheckCircle, Circle,
  ChevronRight, AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { formatDate }   from '../../utils/helpers';

const fade = (i = 0) => ({
  initial:  { opacity: 0, y: 16 },
  animate:  { opacity: 1, y: 0  },
  transition: { duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] },
});

/* ── Shared white card ── */
function Card({ className = '', style = {}, children }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{ background: '#ffffff', border: '1px solid #E5EAE8', ...style }}
    >
      {children}
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ icon: Icon, label, value, unit, desc, accent, index }) {
  return (
    <motion.div {...fade(index)}>
      <Card className="p-5 h-full">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${accent}14`, border: `1px solid ${accent}28` }}
          >
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: '#F4F6F4', color: '#9BAEA5', border: '1px solid #E5EAE8' }}
          >
            SOON
          </span>
        </div>
        <p className="text-2xl font-bold mb-0.5" style={{ color: '#1A2118' }}>
          {value}
          <span className="text-sm font-normal ml-1" style={{ color: '#9BAEA5' }}>{unit}</span>
        </p>
        <p className="text-sm font-medium" style={{ color: '#3D5247' }}>{label}</p>
        <p className="text-xs mt-1" style={{ color: '#9BAEA5' }}>{desc}</p>
      </Card>
    </motion.div>
  );
}

const statCards = [
  { icon: Factory,     label: 'Total Emissions', value: '—', unit: 'tCO₂e', desc: 'This quarter',   accent: '#2D6A4F' },
  { icon: Target,      label: 'Monthly Target',  value: '—', unit: 'tCO₂e', desc: 'Not set yet',    accent: '#C4952A' },
  { icon: TrendingDown, label: 'Reduction Rate', value: '—', unit: '%',     desc: 'vs last period', accent: '#2D6A4F' },
  { icon: Leaf,        label: 'Carbon Credits',  value: '—', unit: 'units', desc: 'Available',      accent: '#8B5E3C' },
];

const setupSteps = [
  { label: 'Create your account',          done: true  },
  { label: 'Connect a data source',         done: false },
  { label: 'Set emission baseline',         done: false },
  { label: 'Configure reduction targets',   done: false },
];

const modules = [
  { icon: Activity,      label: 'Activities',  href: '/dashboard/activities', desc: 'View all platform events and audit logs.',          accent: '#2D6A4F', bg: '#EAF4EE' },
  { icon: BarChart3,     label: 'Analytics',   href: '/dashboard/analytics',  desc: 'Emission trends, sources, and projections.',        accent: '#C4952A', bg: '#FDF5E6' },
  { icon: MessageSquare, label: 'AI Chat',     href: '/dashboard/chat',       desc: 'Ask your AI assistant anything about emissions.',   accent: '#2D6A4F', bg: '#EAF4EE' },
  { icon: Sparkles,      label: 'AI Insights', href: '/dashboard/insights',   desc: 'AI-generated recommendations for reduction.',       accent: '#8B5E3C', bg: '#F9F2EC' },
  { icon: ShieldCheck,   label: 'Admin Panel', href: '/dashboard/admin',      desc: 'Organization settings, users, and integrations.',   accent: '#C4952A', bg: '#FDF5E6' },
];

export default function DashboardHome() {
  const { user }  = useAuthStore();
  const navigate  = useNavigate();
  const greeting  = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const completedSteps = setupSteps.filter((s) => s.done).length;
  const progress = (completedSteps / setupSteps.length) * 100;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Welcome banner ── */}
      <motion.div {...fade(0)}>
        <div
          className="rounded-xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)', padding: '28px 32px' }}
        >
          {/* Decorative dots pattern */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {greeting}, <span className="text-white font-semibold">{user?.name?.split(' ')[0] ?? 'there'}</span>
              </p>
              <h1 className="text-2xl font-bold text-white">
                Welcome to your Dashboard
              </h1>
              <p className="text-sm mt-1.5 max-w-md" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Your carbon intelligence platform is ready. Connect data sources to begin real-time emissions tracking.
              </p>
            </div>
            <div className="flex-shrink-0 flex flex-col items-start sm:items-end gap-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Platform Active
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Member since {formatDate(user?.createdAt ?? new Date())}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <StatCard key={s.label} {...s} index={i + 1} />
        ))}
      </div>

      {/* ── Two-column row ── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Setup checklist (1/3) */}
        <motion.div {...fade(5)}>
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold" style={{ color: '#1A2118' }}>Setup Checklist</h2>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: '#EAF4EE', color: '#2D6A4F' }}>
                {completedSteps}/{setupSteps.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full mb-5" style={{ background: '#F0EDE4' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #2D6A4F, #52B788)' }}
              />
            </div>

            <div className="space-y-3">
              {setupSteps.map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  {step.done
                    ? <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" style={{ color: '#2D6A4F', width: '18px', height: '18px' }} />
                    : <Circle className="h-4.5 w-4.5 flex-shrink-0" style={{ color: '#D1D9D5', width: '18px', height: '18px' }} />
                  }
                  <span
                    className="text-sm"
                    style={{ color: step.done ? '#2D6A4F' : '#7A9E8E', fontWeight: step.done ? 500 : 400 }}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <button
              className="mt-5 w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: '#2D6A4F', color: '#ffffff' }}
              onClick={() => navigate('/dashboard/admin')}
            >
              Complete Setup
            </button>
          </Card>
        </motion.div>

        {/* Recent activity (2/3) */}
        <motion.div {...fade(6)} className="lg:col-span-2">
          <Card className="h-full">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E5EAE8' }}>
              <h2 className="text-sm font-semibold" style={{ color: '#1A2118' }}>Recent Activity</h2>
              <button
                className="text-xs font-medium flex items-center gap-1 transition-colors"
                style={{ color: '#2D6A4F' }}
                onClick={() => navigate('/dashboard/activities')}
              >
                View all <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: '#F0EDE4' }}>
              {[
                { icon: CheckCircle,  title: 'Account created',               time: 'Just now',  status: 'done',    color: '#2D6A4F' },
                { icon: AlertCircle,  title: 'Data source not connected',      time: 'Pending',   status: 'pending', color: '#C4952A' },
                { icon: Sparkles,     title: 'AI model initialised',           time: '1 hr ago',  status: 'done',    color: '#2D6A4F' },
                { icon: AlertCircle,  title: 'Baseline not configured',        time: 'Pending',   status: 'pending', color: '#C4952A' },
                { icon: BarChart3,    title: 'First report queued',            time: 'Waiting',   status: 'pending', color: '#8B5E3C' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-4 px-6 py-3.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${item.color}12`, border: `1px solid ${item.color}22` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: item.color }} />
                    </div>
                    <p className="flex-1 text-sm" style={{ color: '#3D5247' }}>{item.title}</p>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: item.status === 'done' ? '#EAF4EE' : '#FDF5E6',
                        color: item.status === 'done' ? '#2D6A4F' : '#C4952A',
                      }}
                    >
                      {item.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── Platform modules grid ── */}
      <motion.div {...fade(7)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: '#1A2118' }}>Platform Modules</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.label}
                onClick={() => navigate(m.href)}
                className="rounded-xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                style={{ background: '#ffffff', border: '1px solid #E5EAE8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: m.bg }}
                >
                  <Icon className="h-4.5 w-4.5" style={{ color: m.accent, width: '18px', height: '18px' }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#1A2118' }}>{m.label}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#9BAEA5' }}>{m.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: m.accent }}>
                  Open <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

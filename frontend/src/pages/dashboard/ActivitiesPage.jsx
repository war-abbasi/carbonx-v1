import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck, Shield, Zap, BarChart3, FileText,
  LogIn, AlertCircle, CheckCircle, Clock, Filter,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const ALL_ACTIVITIES = [
  { id: 1, type: 'account', icon: UserCheck, title: 'Account Created',             desc: 'Your CarbonX account was successfully created.',         time: 'Today, 09:14 AM', status: 'success', accent: '#2D6A4F' },
  { id: 2, type: 'account', icon: LogIn,     title: 'First Login',                 desc: 'Successful login from your registered device.',           time: 'Today, 09:14 AM', status: 'success', accent: '#2D6A4F' },
  { id: 3, type: 'system',  icon: Shield,    title: 'Security Verification Passed', desc: 'Account security check completed without issues.',       time: 'Today, 09:15 AM', status: 'success', accent: '#2D6A4F' },
  { id: 4, type: 'system',  icon: Zap,       title: 'AI Model Initialised',        desc: 'Emission prediction model is ready for your data.',       time: 'Today, 09:15 AM', status: 'success', accent: '#2D6A4F' },
  { id: 5, type: 'data',    icon: AlertCircle, title: 'Data Source Required',      desc: 'No data source connected. Connect one to start tracking.', time: 'Pending',        status: 'pending', accent: '#C4952A' },
  { id: 6, type: 'report',  icon: FileText,  title: 'GHG Report Queued',           desc: 'Monthly report will generate once data is connected.',    time: 'Waiting',        status: 'pending', accent: '#C4952A' },
  { id: 7, type: 'system',  icon: BarChart3, title: 'Analytics Ready',             desc: 'Dashboard analytics module is configured and ready.',     time: 'Today, 09:16 AM', status: 'success', accent: '#2D6A4F' },
];

const FILTERS = ['All', 'Account', 'System', 'Data', 'Reports'];

function Card({ className = '', style = {}, children }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: '#ffffff', border: '1px solid #E5EAE8', ...style }}>
      {children}
    </div>
  );
}

export default function ActivitiesPage() {
  const { user }    = useAuthStore();
  const [filter, setFilter] = useState('All');

  const visible = filter === 'All'
    ? ALL_ACTIVITIES
    : ALL_ACTIVITIES.filter((a) => a.type === filter.toLowerCase());

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1A2118' }}>Activity Log</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9BAEA5' }}>
            All platform events for <strong style={{ color: '#3D5247' }}>{user?.name}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: '#9BAEA5' }}>
          <Clock className="h-4 w-4" />
          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events',    value: ALL_ACTIVITIES.length,                               accent: '#2D6A4F', bg: '#EAF4EE' },
          { label: 'Completed',       value: ALL_ACTIVITIES.filter((a) => a.status === 'success').length, accent: '#2D6A4F', bg: '#EAF4EE' },
          { label: 'Pending',         value: ALL_ACTIVITIES.filter((a) => a.status === 'pending').length, accent: '#C4952A', bg: '#FDF5E6' },
          { label: 'Days Active',     value: 1,                                                    accent: '#8B5E3C', bg: '#F9F2EC' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-2xl font-bold" style={{ color: '#1A2118' }}>{s.value}</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: '#9BAEA5' }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filter + Timeline */}
      <Card>
        {/* Filter bar */}
        <div className="flex items-center gap-2 px-5 py-3 overflow-x-auto" style={{ borderBottom: '1px solid #E5EAE8' }}>
          <Filter className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#9BAEA5' }} />
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 transition-all"
              style={
                filter === f
                  ? { background: '#2D6A4F', color: '#ffffff' }
                  : { background: '#F4F6F4', color: '#7A9E8E', border: '1px solid #E5EAE8' }
              }
            >
              {f}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="divide-y" style={{ borderColor: '#F0EDE4' }}>
          {visible.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                className="flex items-start gap-4 px-6 py-4"
              >
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${item.accent}12`, border: `1px solid ${item.accent}22` }}
                >
                  <Icon className="h-4 w-4" style={{ color: item.accent }} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#1A2118' }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#7A9E8E' }}>{item.desc}</p>
                </div>

                {/* Status + time */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{
                      background: item.status === 'success' ? '#EAF4EE' : '#FDF5E6',
                      color:      item.status === 'success' ? '#2D6A4F' : '#C4952A',
                    }}
                  >
                    {item.status === 'success'
                      ? <><CheckCircle className="h-2.5 w-2.5" /> Done</>
                      : <><Clock className="h-2.5 w-2.5" /> Pending</>
                    }
                  </span>
                  <span className="text-[10px]" style={{ color: '#BFCDC7' }}>{item.time}</span>
                </div>
              </motion.div>
            );
          })}

          {visible.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: '#9BAEA5' }}>No activities match this filter.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Users, CreditCard, Plug, Save,
  CheckCircle, ShieldCheck, ShieldOff, Trash2,
  Loader2, AlertCircle, UserPlus,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { adminApi }     from '../../api/adminApi';
import { getInitials }  from '../../utils/helpers';

function Card({ className = '', style = {}, children }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: '#ffffff', border: '1px solid #E5EAE8', ...style }}>
      {children}
    </div>
  );
}

const TABS = [
  { id: 'org',          label: 'Organisation', icon: Building2  },
  { id: 'users',        label: 'Users',         icon: Users      },
  { id: 'billing',      label: 'Billing',       icon: CreditCard },
  { id: 'integrations', label: 'Integrations',  icon: Plug       },
];

const INTEGRATIONS = [
  { name: 'SAP ERP',          desc: 'Connect SAP for automatic activity data import.',       logo: '⚙️',  connected: false },
  { name: 'Microsoft 365',    desc: 'Import travel and energy data from M365 services.',      logo: '🔷',  connected: false },
  { name: 'QuickBooks',       desc: 'Link accounting data to estimate supply chain emissions.', logo: '🟢',  connected: false },
  { name: 'Google Workspace', desc: 'Connect G-Suite for office energy and travel data.',     logo: '🔴',  connected: false },
  { name: 'AWS / Azure',      desc: 'Measure and track cloud computing carbon footprint.',    logo: '☁️',  connected: false },
  { name: 'Custom CSV',       desc: 'Upload emission data via standardised CSV templates.',   logo: '📄',  connected: false },
];

/* ── Org tab ── */
function OrgTab({ user }) {
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-5" style={{ color: '#1A2118' }}>Organisation Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Organisation Name',  placeholder: 'Your Company Ltd',   id: 'org_name'  },
            { label: 'Industry',           placeholder: 'e.g. Manufacturing',  id: 'industry'  },
            { label: 'Headquarters',       placeholder: 'City, Country',       id: 'location'  },
            { label: 'Annual Revenue (USD)', placeholder: '$0–$10M',           id: 'revenue'   },
            { label: 'Employees',          placeholder: 'e.g. 50–200',         id: 'employees' },
            { label: 'Fiscal Year End',    placeholder: 'December 31',         id: 'fy_end'    },
          ].map((f) => (
            <div key={f.id}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5A7A6D' }}>{f.label}</label>
              <input
                type="text"
                placeholder={f.placeholder}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: '#F8FAF8', border: '1px solid #E5EAE8', color: '#1A2118',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#2D6A4F'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.08)'; }}
                onBlur={(e)  => { e.target.style.borderColor = '#E5EAE8'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: '#2D6A4F' }}
        >
          {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
      </Card>

      {/* Reporting standards */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#1A2118' }}>Reporting Standards</h3>
        <div className="space-y-3">
          {[
            { std: 'GHG Protocol Corporate Standard', enabled: true  },
            { std: 'ISO 14064-1:2018',                 enabled: true  },
            { std: 'TCFD Framework',                   enabled: false },
            { std: 'EU CSRD Directive',                enabled: false },
            { std: 'SEC Climate Disclosure Rules',     enabled: false },
          ].map(({ std, enabled }) => (
            <div key={std} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #F0EDE4' }}>
              <span className="text-sm" style={{ color: '#3D5247' }}>{std}</span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={enabled ? { background: '#EAF4EE', color: '#2D6A4F' } : { background: '#F4F6F4', color: '#9BAEA5' }}
              >
                {enabled ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Users tab (live data) ── */
function UsersTab({ currentUser }) {
  const [users,    setUsers]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState('');
  const [updating, setUpdating] = useState(null); // userId being updated

  const fetchUsers = useCallback(async () => {
    try {
      setError('');
      const { data } = await adminApi.listUsers();
      setUsers(data.data ?? []);
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleRole = async (u) => {
    const newRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
    setUpdating(u.id);
    try {
      await adminApi.updateRole(u.id, newRole);
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, role: newRole } : x));
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to update role.');
    } finally {
      setUpdating(null);
    }
  };

  const removeUser = async (u) => {
    if (!window.confirm(`Remove ${u.name}? This cannot be undone.`)) return;
    setUpdating(u.id);
    try {
      await adminApi.deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to delete user.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E5EAE8' }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: '#1A2118' }}>Team Members</h3>
          <p className="text-xs mt-0.5" style={{ color: '#9BAEA5' }}>{users.length} account{users.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg" style={{ background: '#F4F6F4', color: '#9BAEA5', border: '1px solid #E5EAE8' }}>
          <UserPlus className="h-3.5 w-3.5" /> Invite coming soon
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-4 px-3 py-2 rounded-lg flex items-center gap-2 text-xs"
          style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#9BAEA5' }} />
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 px-6 py-2 text-[10px] font-bold uppercase tracking-wider"
            style={{ borderBottom: '1px solid #F0EDE4', color: '#9BAEA5' }}>
            <div className="col-span-5">User</div>
            <div className="col-span-2 hidden sm:block text-right">Entries</div>
            <div className="col-span-2 hidden sm:block text-right">CO₂ (kg)</div>
            <div className="col-span-2 text-center">Role</div>
            <div className="col-span-1"></div>
          </div>

          <div className="divide-y" style={{ borderColor: '#F0EDE4' }}>
            {users.map((u) => {
              const isMe   = u.id === currentUser?.id;
              const busy   = updating === u.id;
              return (
                <div key={u.id} className="grid grid-cols-12 gap-2 items-center px-6 py-3.5"
                  style={{ background: isMe ? '#F8FAF8' : 'transparent' }}>

                  {/* Avatar + name */}
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                      style={{ background: u.role === 'ADMIN' ? '#2D6A4F' : '#8B9E95' }}>
                      {getInitials(u.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1A2118' }}>
                        {u.name}{isMe && <span className="text-[10px] font-normal ml-1.5" style={{ color: '#2D6A4F' }}>(you)</span>}
                      </p>
                      <p className="text-xs truncate" style={{ color: '#9BAEA5' }}>{u.email}</p>
                    </div>
                  </div>

                  {/* Entries */}
                  <div className="col-span-2 text-right hidden sm:block">
                    <span className="text-xs" style={{ color: '#7A9E8E' }}>{u.entryCount}</span>
                  </div>

                  {/* Carbon total */}
                  <div className="col-span-2 text-right hidden sm:block">
                    <span className="text-xs font-semibold" style={{ color: '#3D5247' }}>{u.totalKg}</span>
                  </div>

                  {/* Role badge */}
                  <div className="col-span-2 flex justify-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={u.role === 'ADMIN'
                        ? { background: '#EAF4EE', color: '#2D6A4F' }
                        : { background: '#F4F6F4', color: '#9BAEA5', border: '1px solid #E5EAE8' }}>
                      {u.role}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    {!isMe && (
                      <>
                        <button
                          onClick={() => toggleRole(u)}
                          disabled={busy}
                          title={u.role === 'ADMIN' ? 'Remove admin' : 'Make admin'}
                          className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-40"
                          style={{ color: u.role === 'ADMIN' ? '#C4952A' : '#2D6A4F' }}>
                          {busy
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : u.role === 'ADMIN'
                              ? <ShieldOff className="h-3.5 w-3.5" />
                              : <ShieldCheck className="h-3.5 w-3.5" />
                          }
                        </button>
                        <button
                          onClick={() => removeUser(u)}
                          disabled={busy}
                          title="Delete user"
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-50 disabled:opacity-40"
                          style={{ color: '#DC2626' }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-6 py-3 text-xs" style={{ borderTop: '1px solid #E5EAE8', color: '#9BAEA5' }}>
            <ShieldCheck className="h-3 w-3 inline mr-1" style={{ color: '#2D6A4F' }} />
            Shield icon = promote to Admin &nbsp;·&nbsp;
            <ShieldOff className="h-3 w-3 inline mr-1" style={{ color: '#C4952A' }} />
            Outline = remove Admin role
          </div>
        </>
      )}
    </Card>
  );
}

/* ── Billing tab ── */
function BillingTab() {
  return (
    <div className="space-y-4">
      {/* Current plan */}
      <Card className="p-6" style={{ border: '2px solid #2D6A4F' }}>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 inline-block"
              style={{ background: '#EAF4EE', color: '#2D6A4F' }}>Current Plan</span>
            <h3 className="text-xl font-bold mt-2" style={{ color: '#1A2118' }}>Free Tier</h3>
            <p className="text-sm mt-1" style={{ color: '#7A9E8E' }}>Up to 1 user · 1 data source · Basic reporting</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#2D6A4F' }}>$0<span className="text-sm font-normal text-gray-400">/mo</span></p>
        </div>
      </Card>

      {/* Upgrade plans */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          {
            name: 'Professional', price: '$49', per: '/month',
            features: ['Up to 10 users', '5 data sources', 'Advanced analytics', 'AI Insights', 'GHG Protocol reports'],
            accent: '#2D6A4F',
          },
          {
            name: 'Enterprise', price: 'Custom', per: '',
            features: ['Unlimited users', 'Unlimited data sources', 'Custom integrations', 'SLA guarantee', 'Dedicated support'],
            accent: '#C4952A',
          },
        ].map((plan) => (
          <Card key={plan.name} className="p-6">
            <h3 className="text-base font-bold mb-1" style={{ color: '#1A2118' }}>{plan.name}</h3>
            <p className="text-xl font-bold mb-4" style={{ color: plan.accent }}>
              {plan.price}<span className="text-sm font-normal" style={{ color: '#9BAEA5' }}>{plan.per}</span>
            </p>
            <ul className="space-y-2 mb-5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs" style={{ color: '#5A7A6D' }}>
                  <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: plan.accent }} /> {f}
                </li>
              ))}
            </ul>
            <button
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: plan.accent, color: '#ffffff' }}
            >
              Upgrade to {plan.name}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Integrations tab ── */
function IntegrationsTab() {
  const [connected, setConnected] = useState({});

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center gap-3" style={{ background: '#FDF5E6', border: '1px solid #F5E3C0' }}>
        <Plug className="h-4 w-4 flex-shrink-0" style={{ color: '#C4952A' }} />
        <p className="text-sm" style={{ color: '#7C5A10' }}>
          Connect a data source to start tracking real emissions. Each integration imports activity data automatically.
        </p>
      </Card>
      <div className="grid sm:grid-cols-2 gap-3">
        {INTEGRATIONS.map((int) => (
          <Card key={int.name} className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{int.logo}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: '#1A2118' }}>{int.name}</p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: '#9BAEA5' }}>{int.desc}</p>
              </div>
            </div>
            <button
              onClick={() => setConnected((c) => ({ ...c, [int.name]: !c[int.name] }))}
              className="mt-3 w-full py-2 rounded-lg text-xs font-semibold transition-all"
              style={connected[int.name]
                ? { background: '#EAF4EE', color: '#2D6A4F', border: '1px solid #C0DDD0' }
                : { background: '#F4F6F4', color: '#5A7A6D', border: '1px solid #E5EAE8' }
              }
            >
              {connected[int.name] ? '✓ Connected' : 'Connect'}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function AdminPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('org');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-bold" style={{ color: '#1A2118' }}>Admin Panel</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9BAEA5' }}>Organisation settings, users, and integrations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#F4F6F4', border: '1px solid #E5EAE8' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === id
              ? { background: '#ffffff', color: '#1B4332', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
              : { color: '#7A9E8E' }
            }
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {tab === 'org'          && <OrgTab         user={user} />}
        {tab === 'users'        && <UsersTab        currentUser={user} />}
        {tab === 'billing'      && <BillingTab />}
        {tab === 'integrations' && <IntegrationsTab />}
      </motion.div>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Users, CreditCard,
  CheckCircle, ShieldCheck, ShieldOff, Trash2,
  Loader2, AlertCircle, UserPlus, Upload, Download, X,
  FileText, Award, UserX, UserCheck, Building2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { adminApi }     from '../../api/adminApi';
import { carbonApi }   from '../../api/carbonApi';
import { getInitials }  from '../../utils/helpers';
import toast from 'react-hot-toast';

function Card({ className = '', style = {}, children }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: '#ffffff', border: '1px solid #E5EAE8', ...style }}>
      {children}
    </div>
  );
}

const TABS = [
  { id: 'users',        label: 'Users',               icon: Users      },
  { id: 'org',          label: 'Reporting Standards', icon: FileText   },
  { id: 'data',         label: 'Data Import',         icon: Upload     },
  { id: 'billing',      label: 'Billing',             icon: CreditCard },
];

/* ── Reporting Standards tab ── */
function OrgTab() {
  const STANDARDS = [
    { std: 'GHG Protocol Corporate Standard', desc: 'The global standard for corporate Scope 1, 2 & 3 accounting.', enabled: true  },
    { std: 'ISO 14064-1:2018',                 desc: 'International standard for quantifying and reporting GHG emissions.', enabled: true  },
    { std: 'TCFD Framework',                   desc: 'Climate-related financial risk disclosure recommendations.', enabled: false },
    { std: 'EU CSRD Directive',                desc: 'EU Corporate Sustainability Reporting Directive.', enabled: false },
    { std: 'SEC Climate Disclosure Rules',     desc: 'US Securities & Exchange Commission climate disclosure.', enabled: false },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-1" style={{ color: '#1A2118' }}>Reporting Standards</h3>
        <p className="text-xs mb-5" style={{ color: '#9BAEA5' }}>
          Frameworks your emission reports are aligned with. Active standards are applied to generated reports.
        </p>
        <div className="space-y-1">
          {STANDARDS.map(({ std, desc, enabled }) => (
            <div key={std} className="flex items-center justify-between gap-4 py-3" style={{ borderBottom: '1px solid #F0EDE4' }}>
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: '#1A2118' }}>{std}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9BAEA5' }}>{desc}</p>
              </div>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
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

/* ── Shared modal shell (portalled: the tab wrapper's transform would offset position:fixed) ── */
function Modal({ title, subtitle, onClose, children }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid #E5EAE8', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #E5EAE8', background: '#F8FAF8' }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: '#1A2118' }}>{title}</h2>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: '#9BAEA5' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: '#9BAEA5' }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>,
    document.body,
  );
}

const FIELD_STYLE = { background: '#F8FAF8', border: '1px solid #E5EAE8', color: '#1A2118' };

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold mb-1.5 block" style={{ color: '#3D5247' }}>{label}</span>
      {children}
    </label>
  );
}

/* ── Add member modal ── */
function AddUserModal({ orgName, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await adminApi.createUser(form);
      toast.success(data.message);
      onCreated();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Could not add user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add member" subtitle={orgName ? `Joins ${orgName}` : undefined} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <input required minLength={2} value={form.name} onChange={set('name')}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={FIELD_STYLE} />
        </Field>
        <Field label="Email">
          <input required type="email" value={form.email} onChange={set('email')}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={FIELD_STYLE} />
        </Field>
        <Field label="Temporary password">
          <input required minLength={8} type="text" value={form.password} onChange={set('password')}
            placeholder="At least 8 characters"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={FIELD_STYLE} />
        </Field>
        <Field label="Role">
          <select value={form.role} onChange={set('role')}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={FIELD_STYLE}>
            <option value="USER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </Field>
        <button type="submit" disabled={saving}
          className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: '#2D6A4F', color: '#fff' }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Add member
        </button>
      </form>
    </Modal>
  );
}

/* ── Give award modal ── */
const AWARD_PRESETS = [
  { icon: '🌍', title: 'Sustainability Ambassador', points: 75 },
  { icon: '🚗', title: 'Carpool Organiser',         points: 50 },
  { icon: '♻️', title: 'Recycling Hero',            points: 50 },
  { icon: '💡', title: 'Energy Saver',              points: 40 },
  { icon: '🌟', title: 'Monthly Star',              points: 100 },
];

function AwardModal({ user, onClose, onAwarded }) {
  const [form, setForm] = useState({ ...AWARD_PRESETS[0], reason: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await adminApi.giveAward(user.id, form);
      toast.success(data.message);
      onAwarded();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Could not give award.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Award ${user.name}`} subtitle="Recognition shows on their profile and adds to their points" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {AWARD_PRESETS.map((p) => (
            <button type="button" key={p.title} title={p.title}
              onClick={() => setForm((f) => ({ ...f, ...p }))}
              className="aspect-square rounded-xl text-2xl flex items-center justify-center transition-all"
              style={form.title === p.title
                ? { background: '#EAF4EE', border: '2px solid #2D6A4F' }
                : { background: '#F8FAF8', border: '1px solid #E5EAE8' }}>
              {p.icon}
            </button>
          ))}
        </div>
        <Field label="Award title">
          <input required minLength={3} value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={FIELD_STYLE} />
        </Field>
        <Field label="Points">
          <input type="number" min={0} max={500} value={form.points}
            onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={FIELD_STYLE} />
        </Field>
        <Field label="Reason (optional)">
          <textarea rows={2} value={form.reason} maxLength={200}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="What did they do?"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={FIELD_STYLE} />
        </Field>
        <button type="submit" disabled={saving}
          className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: '#C4952A', color: '#fff' }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />} Give award
        </button>
      </form>
    </Modal>
  );
}

const TIER_COLORS = { Platinum: '#5B7C99', Gold: '#C4952A', Silver: '#8B9E95', Bronze: '#CD7F32' };

/* ── Users tab (live data) ── */
function UsersTab({ currentUser }) {
  const [users,    setUsers]    = useState([]);
  const [org,      setOrg]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [updating, setUpdating] = useState(null); // userId being updated
  const [adding,   setAdding]   = useState(false);
  const [awarding, setAwarding] = useState(null); // user being awarded

  const fetchUsers = useCallback(async () => {
    try {
      setError('');
      const [{ data: u }, { data: o }] = await Promise.all([adminApi.listUsers(), adminApi.getOrganization()]);
      setUsers(u.data ?? []);
      setOrg(o.data ?? null);
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const run = async (u, fn) => {
    setUpdating(u.id);
    try {
      const { data } = await fn();
      if (data?.message) toast.success(data.message);
      await fetchUsers();
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Action failed.');
    } finally {
      setUpdating(null);
    }
  };

  const toggleRole   = (u) => run(u, () => adminApi.updateRole(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN'));
  const toggleActive = (u) => {
    if (u.active && !window.confirm(`Suspend ${u.name}? They will not be able to log in.`)) return;
    run(u, () => adminApi.updateStatus(u.id, !u.active));
  };
  const removeUser = (u) => {
    if (!window.confirm(`Remove ${u.name}? This cannot be undone.`)) return;
    run(u, () => adminApi.deleteUser(u.id));
  };

  const orgName = org?.organization?.name;

  return (
    <div className="space-y-4">
      {/* Organisation summary */}
      {org && (
        <Card className="p-5 flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#EAF4EE' }}>
              <Building2 className="h-5 w-5" style={{ color: '#2D6A4F' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9BAEA5' }}>Organisation</p>
              <p className="text-base font-bold" style={{ color: '#1A2118' }}>{orgName ?? 'Unassigned users'}</p>
            </div>
          </div>
          {[
            ['Members',   org.members],
            ['Admins',    org.admins],
            ['Suspended', org.suspended],
          ].map(([label, value]) => (
            <div key={label} className="text-center px-3">
              <p className="text-xl font-bold" style={{ color: '#1A2118' }}>{value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9BAEA5' }}>{label}</p>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E5EAE8' }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: '#1A2118' }}>Team Members</h3>
            <p className="text-xs mt-0.5" style={{ color: '#9BAEA5' }}>
              {users.length} account{users.length !== 1 ? 's' : ''} · ranked by award points over the last 60 days
            </p>
          </div>
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all hover:opacity-90"
            style={{ background: '#2D6A4F', color: '#fff' }}>
            <UserPlus className="h-3.5 w-3.5" /> Add member
          </button>
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
              <div className="col-span-7 sm:col-span-4">User</div>
              <div className="col-span-2 hidden sm:block">Points</div>
              <div className="col-span-2 hidden md:block">Badges</div>
              <div className="col-span-1 hidden sm:block text-right">CO₂ (kg)</div>
              <div className="col-span-2 sm:col-span-1 text-center">Status</div>
              <div className="col-span-3 sm:col-span-2"></div>
            </div>

            <div className="divide-y" style={{ borderColor: '#F0EDE4' }}>
              {[...users].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999)).map((u) => {
                const isMe = u.id === currentUser?.id;
                const busy = updating === u.id;
                return (
                  <div key={u.id} className="grid grid-cols-12 gap-2 items-center px-6 py-3.5"
                    style={{ background: isMe ? '#F8FAF8' : 'transparent', opacity: u.active ? 1 : 0.55 }}>

                    {/* Avatar + name */}
                    <div className="col-span-7 sm:col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                        style={{ background: u.role === 'ADMIN' ? '#2D6A4F' : '#8B9E95' }}>
                        {getInitials(u.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#1A2118' }}>
                          {u.rank && <span className="text-xs mr-1.5" style={{ color: '#9BAEA5' }}>#{u.rank}</span>}
                          {u.name}{isMe && <span className="text-[10px] font-normal ml-1.5" style={{ color: '#2D6A4F' }}>(you)</span>}
                        </p>
                        <p className="text-xs truncate" style={{ color: '#9BAEA5' }}>{u.email}</p>
                      </div>
                    </div>

                    {/* Points + tier */}
                    <div className="col-span-2 hidden sm:block">
                      {u.points != null ? (
                        <>
                          <p className="text-sm font-bold" style={{ color: '#1A2118' }}>{u.points}</p>
                          <p className="text-[10px] font-bold" style={{ color: TIER_COLORS[u.tier] ?? '#9BAEA5' }}>{u.tier}</p>
                        </>
                      ) : <span className="text-xs" style={{ color: '#C5D0CA' }}>{u.role === 'ADMIN' ? 'Admin' : '—'}</span>}
                    </div>

                    {/* Badges */}
                    <div className="col-span-2 hidden md:flex flex-wrap gap-0.5">
                      {u.badges.slice(0, 6).map((b) => (
                        <span key={b.title} title={`${b.title}${b.reason ? ` — ${b.reason}` : ''}`} className="text-base leading-none">{b.icon}</span>
                      ))}
                    </div>

                    {/* Carbon total */}
                    <div className="col-span-1 text-right hidden sm:block">
                      <span className="text-xs font-semibold" style={{ color: '#3D5247' }}>{u.totalKg}</span>
                    </div>

                    {/* Role / status */}
                    <div className="col-span-2 sm:col-span-1 flex flex-col items-center gap-1">
                      {u.role === 'ADMIN' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#EAF4EE', color: '#2D6A4F' }}>ADMIN</span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={u.active
                          ? { background: '#F4F6F4', color: '#5A7A6D', border: '1px solid #E5EAE8' }
                          : { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                        {u.active ? 'Active' : 'Suspended'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-0.5">
                      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" style={{ color: '#9BAEA5' }} />}
                      {!isMe && (
                        <>
                          {u.role !== 'ADMIN' && (
                            <button onClick={() => setAwarding(u)} disabled={busy || !u.active} title="Give award"
                              className="p-1.5 rounded-lg transition-colors hover:bg-amber-50 disabled:opacity-40" style={{ color: '#C4952A' }}>
                              <Award className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => toggleActive(u)} disabled={busy}
                            title={u.active ? 'Suspend account' : 'Reactivate account'}
                            className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-40"
                            style={{ color: u.active ? '#E07020' : '#2D6A4F' }}>
                            {u.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={() => toggleRole(u)} disabled={busy}
                            title={u.role === 'ADMIN' ? 'Remove admin' : 'Make admin'}
                            className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-40"
                            style={{ color: u.role === 'ADMIN' ? '#C4952A' : '#2D6A4F' }}>
                            {u.role === 'ADMIN' ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={() => removeUser(u)} disabled={busy} title="Delete user"
                            className="p-1.5 rounded-lg transition-colors hover:bg-red-50 disabled:opacity-40" style={{ color: '#DC2626' }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3 text-xs flex flex-wrap gap-x-4 gap-y-1" style={{ borderTop: '1px solid #E5EAE8', color: '#9BAEA5' }}>
              <span><Award className="h-3 w-3 inline mr-1" style={{ color: '#C4952A' }} />Give award</span>
              <span><UserX className="h-3 w-3 inline mr-1" style={{ color: '#E07020' }} />Suspend / reactivate</span>
              <span><ShieldCheck className="h-3 w-3 inline mr-1" style={{ color: '#2D6A4F' }} />Make or remove admin</span>
              <span><Trash2 className="h-3 w-3 inline mr-1" style={{ color: '#DC2626' }} />Delete</span>
            </div>
          </>
        )}
      </Card>

      {adding && (
        <AddUserModal orgName={orgName} onClose={() => setAdding(false)}
          onCreated={() => { setAdding(false); fetchUsers(); }} />
      )}
      {awarding && (
        <AwardModal user={awarding} onClose={() => setAwarding(null)}
          onAwarded={() => { setAwarding(null); fetchUsers(); }} />
      )}
    </div>
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

/* ── Data Import tab ── */
function DataImportTab() {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const VALID_CATS = {
    commute:              ['car_petrol','car_diesel','car_electric','motorbike','bus','train','walking'],
    energy:               ['electricity','natural_gas','lpg','diesel_gen'],
    travel:               ['flight_short','flight_long','car_rental','taxi'],
    food:                 ['beef','chicken','fish','vegetarian','vegan'],
    industry:             ['coal','furnace_oil','natural_gas_boiler','cement_process','steel','fabric_processing','brick_kiln'],
    agriculture:          ['rice_paddy','crop_residue','fertiliser_n','diesel_tractor','livestock_cattle'],
    purchased_goods:      ['paper','plastic_pkg','it_equipment','office_supplies'],
    upstream_transport:   ['road_freight','sea_freight','air_freight','rail_freight'],
    waste:                ['landfill','recycled','composted','wastewater'],
    downstream_transport: ['road_delivery','last_mile','cold_chain'],
    end_of_life:          ['e_waste','construction_waste','mixed_waste_eol'],
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) throw new Error('CSV needs a header row and at least one data row');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z_]/g,''));
    return lines.slice(1).map((line, i) => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g,''));
      const row = {};
      headers.forEach((h, j) => { row[h] = vals[j] ?? ''; });
      row._row = i + 2;
      return row;
    });
  };

  const downloadSample = () => {
    const sample = `date,category,sub_category,quantity,description,user_email
2026-01-15,commute,car_petrol,25,Morning commute,wardahzia4@gmail.com
2026-02-20,energy,electricity,150,Electricity bill,wardahzia4@gmail.com
2026-03-10,food,beef,3,Weekly meals,wardahzia4@gmail.com`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'carbonx_sample.csv';
    a.click();
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { toast.error('Please upload a .csv file'); return; }
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try { setRows(parseCSV(e.target.result)); }
      catch (err) { toast.error(err.message); setRows([]); }
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!rows.length) return;
    setLoading(true);
    try {
      const { data: res } = await carbonApi.bulkUpload(rows);
      setResult(res.data);
      if (res.data.inserted > 0) { toast.success(`${res.data.inserted} entries imported!`); }
    } catch (e) { toast.error(e?.response?.data?.message ?? 'Upload failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      {/* Info */}
      <Card className="p-4 flex items-start gap-3" style={{ background: '#FDF5E6', border: '1px solid #F5E3C0' }}>
        <Upload className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#C4952A' }} />
        <p className="text-sm" style={{ color: '#7C5A10' }}>
          Upload a CSV file with historical carbon data. This is useful for backfilling data or testing forecasting features with multi-month datasets.
        </p>
      </Card>

      {!result && (
        <>
          {/* Drop zone */}
          <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)}
            onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0])}}
            onClick={()=>fileRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl cursor-pointer"
            style={{ border:`2px dashed ${dragging?'#2D6A4F':'#D0DDD8'}`, background:dragging?'#EAF4EE':'#F8FAF8', padding:'40px 20px' }}>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e=>handleFile(e.target.files[0])} />
            <FileText className="h-8 w-8 mb-3" style={{ color: dragging?'#2D6A4F':'#9BAEA5' }} />
            {fileName
              ? <p className="text-sm font-semibold" style={{ color:'#1A2118' }}>{fileName}</p>
              : <p className="text-sm font-semibold" style={{ color:'#5A7A6D' }}>Drop CSV here or click to browse</p>}
            <p className="text-xs mt-1.5" style={{ color:'#9BAEA5' }}>Max 1,000 rows per upload</p>
          </div>

          {/* Format spec */}
          <Card className="p-4 text-xs space-y-2" style={{ background: '#F8FAF8', border: '1px solid #E5EAE8' }}>
            <p className="font-bold" style={{ color: '#1A2118' }}>Required CSV Format</p>
            <code className="block p-2 rounded-lg text-[11px] font-mono overflow-x-auto" style={{ background: '#1A2118', color: '#52B788' }}>
              date,category,sub_category,quantity,description,user_email
            </code>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { col:'date', ex:'2026-01-15', note:'YYYY-MM-DD · past dates only' },
                { col:'category', ex:'commute', note:'commute | energy | travel | food | industry | agriculture | purchased_goods | waste | upstream_transport | downstream_transport | end_of_life' },
                { col:'sub_category', ex:'car_petrol', note:'see list below' },
                { col:'quantity', ex:'25', note:'positive number (km / kWh / meal)' },
                { col:'description', ex:'Daily commute', note:'optional — free text' },
                { col:'user_email', ex:'john@co.com', note:'optional — blank = yourself' },
              ].map(r => (
                <div key={r.col} className="p-2 rounded-lg" style={{ background: '#fff', border: '1px solid #E5EAE8' }}>
                  <span className="font-bold font-mono" style={{ color: '#2D6A4F' }}>{r.col}</span>
                  <span className="ml-1.5" style={{ color: '#9BAEA5' }}>e.g. {r.ex}</span>
                  <p className="mt-0.5" style={{ color: '#7A9E8E' }}>{r.note}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid #E5EAE8' }}>
              <p className="font-semibold mb-1.5" style={{ color: '#1A2118' }}>Valid sub_category values:</p>
              {Object.entries(VALID_CATS).map(([cat, subs]) => (
                <div key={cat} className="mb-1">
                  <span className="font-bold capitalize" style={{ color: '#2D6A4F' }}>{cat}:</span>{' '}
                  <span className="font-mono text-xs" style={{ color: '#5A7A6D' }}>{subs.join(', ')}</span>
                </div>
              ))}
            </div>
            <button onClick={downloadSample}
              className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80"
              style={{ background: '#EAF4EE', color: '#2D6A4F' }}>
              <Download className="h-3.5 w-3.5" /> Download sample CSV
            </button>
          </Card>

          {/* Preview */}
          {rows.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color:'#1A2118' }}>Preview — {rows.length} rows</p>
              <div className="overflow-x-auto rounded-xl" style={{ border:'1px solid #E5EAE8' }}>
                <table className="w-full text-xs">
                  <thead><tr style={{ background:'#F4F6F4' }}>
                    {['date','category','sub_category','quantity','description','user_email'].map(h=>(
                      <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color:'#5A7A6D' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {rows.slice(0,5).map((r,i)=>(
                      <tr key={i} style={{ borderTop:'1px solid #F0EDE4' }}>
                        {['date','category','sub_category','quantity','description','user_email'].map(h=>(
                          <td key={h} className="px-3 py-2" style={{ color:'#3D5247' }}>{r[h]||'—'}</td>
                        ))}
                      </tr>
                    ))}
                    {rows.length>5&&(
                      <tr style={{ borderTop:'1px solid #F0EDE4' }}>
                        <td colSpan={6} className="px-3 py-2 text-center" style={{ color:'#9BAEA5' }}>+{rows.length-5} more rows…</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => { setRows([]); setFileName(''); }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background:'#F4F6F4', color:'#5A7A6D' }}>
                  Clear
                </button>
                <button onClick={handleUpload} disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background:'#2D6A4F' }}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {loading ? 'Importing…' : `Import ${rows.length} rows`}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background:'#EAF4EE', border:'1px solid #C0DDD0' }}>
            <CheckCircle className="h-5 w-5 flex-shrink-0" style={{ color:'#2D6A4F' }} />
            <p className="text-sm font-bold" style={{ color:'#1B4332' }}>
              {result.inserted} entries imported successfully
            </p>
          </div>
          {result.errors?.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border:'1px solid #FECACA' }}>
              <p className="px-3 py-2 text-xs font-semibold" style={{ background:'#FEF2F2', color:'#DC2626' }}>
                {result.errors.length} rows skipped with errors
              </p>
              {result.errors.slice(0,3).map((e,i)=>(
                <div key={i} className="px-3 py-2 text-xs" style={{ borderTop:'1px solid #FEF2F2', color:'#7f1d1d' }}>
                  Row {e.row}: {e.message}
                </div>
              ))}
            </div>
          )}
          <button onClick={() => { setResult(null); setRows([]); setFileName(''); }}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background:'#F4F6F4', color:'#5A7A6D' }}>
            Import More
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main ── */
export default function AdminPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('users');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-bold" style={{ color: '#1A2118' }}>Admin Panel</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9BAEA5' }}>Manage your organisation's members, awards, data and reporting</p>
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
        {tab === 'org'     && <OrgTab />}
        {tab === 'users'   && <UsersTab currentUser={user} />}
        {tab === 'data'    && <DataImportTab />}
        {tab === 'billing' && <BillingTab />}
      </motion.div>
    </div>
  );
}

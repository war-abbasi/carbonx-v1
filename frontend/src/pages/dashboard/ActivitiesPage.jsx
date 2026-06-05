import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Calculator, Trophy,
  UserCheck, Shield, Zap, BarChart3, FileText, LogIn,
  AlertCircle, CheckCircle, Clock, Filter,
  ChevronDown, Loader2, Send, Medal, Crown,
} from 'lucide-react';
import { carbonApi } from '../../api/carbonApi';
import { useAuthStore } from '../../store/authStore';
import { getInitials } from '../../utils/helpers';

/* ── Shared white card ─────────────────────────── */
function Card({ className = '', style = {}, children }) {
  return (
    <div className={`rounded-xl ${className}`}
      style={{ background: '#ffffff', border: '1px solid #E5EAE8', ...style }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 1 — ACTIVITY LOG
═══════════════════════════════════════════════════ */
const ALL_ACTIVITIES = [
  { id: 1, type: 'account', icon: UserCheck, title: 'Account Created',              desc: 'Your CarbonX account was successfully created.',          time: 'Today',   status: 'success', accent: '#2D6A4F' },
  { id: 2, type: 'account', icon: LogIn,     title: 'First Login',                  desc: 'Successful login from your registered device.',            time: 'Today',   status: 'success', accent: '#2D6A4F' },
  { id: 3, type: 'system',  icon: Shield,    title: 'Security Verification Passed', desc: 'Account security check completed without issues.',         time: 'Today',   status: 'success', accent: '#2D6A4F' },
  { id: 4, type: 'system',  icon: Zap,       title: 'AI Model Initialised',         desc: 'Emission prediction model is ready for your data.',        time: 'Today',   status: 'success', accent: '#2D6A4F' },
  { id: 5, type: 'data',    icon: AlertCircle, title: 'Data Source Required',       desc: 'No data source connected. Connect one to start tracking.', time: 'Pending', status: 'pending', accent: '#C4952A' },
  { id: 6, type: 'report',  icon: FileText,  title: 'GHG Report Queued',            desc: 'Monthly report will generate once data is connected.',     time: 'Waiting', status: 'pending', accent: '#C4952A' },
  { id: 7, type: 'system',  icon: BarChart3, title: 'Analytics Ready',              desc: 'Dashboard analytics module is configured and ready.',      time: 'Today',   status: 'success', accent: '#2D6A4F' },
];
const LOG_FILTERS = ['All', 'Account', 'System', 'Data', 'Reports'];

function ActivityLog() {
  const [filter, setFilter] = useState('All');
  const visible = filter === 'All'
    ? ALL_ACTIVITIES
    : ALL_ACTIVITIES.filter((a) => a.type === filter.toLowerCase());

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events',  value: ALL_ACTIVITIES.length,                                       accent: '#2D6A4F' },
          { label: 'Completed',     value: ALL_ACTIVITIES.filter((a) => a.status === 'success').length, accent: '#2D6A4F' },
          { label: 'Pending',       value: ALL_ACTIVITIES.filter((a) => a.status === 'pending').length, accent: '#C4952A' },
          { label: 'Days Active',   value: 1,                                                            accent: '#8B5E3C' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-2xl font-bold" style={{ color: '#1A2118' }}>{s.value}</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: '#9BAEA5' }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filter + Timeline */}
      <Card>
        <div className="flex items-center gap-2 px-5 py-3 overflow-x-auto" style={{ borderBottom: '1px solid #E5EAE8' }}>
          <Filter className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#9BAEA5' }} />
          {LOG_FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 transition-all"
              style={filter === f
                ? { background: '#2D6A4F', color: '#ffffff' }
                : { background: '#F4F6F4', color: '#7A9E8E', border: '1px solid #E5EAE8' }}>
              {f}
            </button>
          ))}
        </div>
        <div className="divide-y" style={{ borderColor: '#F0EDE4' }}>
          {visible.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-6 py-3.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.accent}12`, border: `1px solid ${item.accent}22` }}>
                  <Icon className="h-4 w-4" style={{ color: item.accent }} />
                </div>
                <p className="flex-1 text-sm" style={{ color: '#3D5247' }}>{item.title}</p>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1"
                  style={{
                    background: item.status === 'success' ? '#EAF4EE' : '#FDF5E6',
                    color:      item.status === 'success' ? '#2D6A4F' : '#C4952A',
                  }}>
                  {item.status === 'success'
                    ? <><CheckCircle className="h-2.5 w-2.5" /> Done</>
                    : <><Clock className="h-2.5 w-2.5" /> {item.time}</>}
                </span>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 2 — CARBON CALCULATOR
═══════════════════════════════════════════════════ */
const CATEGORIES = {
  commute: {
    label: 'Daily Commute', emoji: '🚗',
    subs: [
      { id: 'car_petrol',   label: 'Car (petrol)',      unit: 'km',    hint: 'One-way km' },
      { id: 'car_diesel',   label: 'Car (diesel)',      unit: 'km',    hint: 'One-way km' },
      { id: 'car_electric', label: 'Car (electric)',    unit: 'km',    hint: 'One-way km' },
      { id: 'motorbike',    label: 'Motorbike',         unit: 'km',    hint: 'One-way km' },
      { id: 'bus',          label: 'Bus',               unit: 'km',    hint: 'One-way km' },
      { id: 'train',        label: 'Train',             unit: 'km',    hint: 'One-way km' },
      { id: 'walking',      label: 'Walking / Cycling', unit: 'km',    hint: 'Zero emissions 🌱' },
    ],
  },
  energy: {
    label: 'Home Energy', emoji: '⚡',
    subs: [
      { id: 'electricity',  label: 'Electricity',       unit: 'kWh',   hint: 'Monthly kWh' },
      { id: 'natural_gas',  label: 'Natural gas',       unit: 'm³',    hint: 'Cubic metres' },
      { id: 'lpg',          label: 'LPG / cylinder',    unit: 'kg',    hint: 'Kg of LPG' },
      { id: 'diesel_gen',   label: 'Diesel generator',  unit: 'litre', hint: 'Litres used' },
    ],
  },
  travel: {
    label: 'Business Travel', emoji: '✈️',
    subs: [
      { id: 'flight_short', label: 'Short-haul flight', unit: 'km',    hint: 'One-way km' },
      { id: 'flight_long',  label: 'Long-haul flight',  unit: 'km',    hint: 'One-way km' },
      { id: 'car_rental',   label: 'Rental car',        unit: 'km',    hint: 'Total km' },
      { id: 'taxi',         label: 'Taxi / ride-share', unit: 'km',    hint: 'Total km' },
    ],
  },
  food: {
    label: 'Food & Diet', emoji: '🍽️',
    subs: [
      { id: 'beef',         label: 'Beef meal',         unit: 'meal',  hint: 'Number of meals' },
      { id: 'chicken',      label: 'Chicken meal',      unit: 'meal',  hint: 'Number of meals' },
      { id: 'fish',         label: 'Fish meal',         unit: 'meal',  hint: 'Number of meals' },
      { id: 'vegetarian',   label: 'Vegetarian',        unit: 'meal',  hint: 'Number of meals' },
      { id: 'vegan',        label: 'Vegan',             unit: 'meal',  hint: 'Number of meals' },
    ],
  },
};

/* Local emission factors (mirrors backend) */
const LOCAL_FACTORS = {
  commute: { car_petrol: 0.192, car_diesel: 0.171, car_electric: 0.047, motorbike: 0.114, bus: 0.089, train: 0.041, walking: 0 },
  energy:  { electricity: 0.45, natural_gas: 2.1, lpg: 1.51, diesel_gen: 2.68 },
  travel:  { flight_short: 0.255, flight_long: 0.195, car_rental: 0.192, taxi: 0.211 },
  food:    { beef: 6.1, chicken: 0.86, fish: 1.34, vegetarian: 0.50, vegan: 0.30 },
};

function calcKg(category, subCategory, quantity) {
  return ((LOCAL_FACTORS[category]?.[subCategory] ?? 0) * (parseFloat(quantity) || 0));
}

function CarbonCalculator() {
  const [catKey,    setCatKey]    = useState('commute');
  const [subKey,    setSubKey]    = useState('car_petrol');
  const [quantity,  setQuantity]  = useState('');
  const [desc,      setDesc]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState('');
  const [recentEntries, setRecentEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  const category  = CATEGORIES[catKey];
  const subOption = category.subs.find((s) => s.id === subKey) ?? category.subs[0];
  const kgValue   = calcKg(catKey, subKey, quantity);

  /* Load recent entries */
  const fetchEntries = useCallback(async () => {
    try {
      const { data } = await carbonApi.getMyEntries(10);
      setRecentEntries(data.data?.entries ?? []);
    } catch { /* silent */ }
    finally { setLoadingEntries(false); }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  /* On category change reset sub */
  const handleCatChange = (k) => { setCatKey(k); setSubKey(CATEGORIES[k].subs[0].id); setQuantity(''); };

  const handleSubmit = async () => {
    if (!quantity || parseFloat(quantity) <= 0) { setError('Enter a valid quantity.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await carbonApi.submitEntry({ category: catKey, subCategory: subKey, quantity: parseFloat(quantity), description: desc || undefined });
      setSubmitted(true);
      setQuantity('');
      setDesc('');
      fetchEntries();
      setTimeout(() => setSubmitted(false), 3000);
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-5">

      {/* Calculator form (3/5) */}
      <div className="lg:col-span-3 space-y-4">
        <Card className="p-6">
          <h2 className="text-sm font-semibold mb-5" style={{ color: '#1A2118' }}>Log Your Carbon Footprint</h2>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-5">
            {Object.entries(CATEGORIES).map(([k, cat]) => (
              <button key={k} onClick={() => handleCatChange(k)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all"
                style={k === catKey
                  ? { background: '#2D6A4F', color: '#fff' }
                  : { background: '#F4F6F4', color: '#7A9E8E', border: '1px solid #E5EAE8' }}>
                <span>{cat.emoji}</span> {cat.label}
              </button>
            ))}
          </div>

          {/* Sub-category */}
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5A7A6D' }}>Activity type</label>
            <div className="relative">
              <select
                value={subKey}
                onChange={(e) => setSubKey(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none appearance-none pr-8 transition-all"
                style={{ background: '#F8FAF8', border: '1px solid #E5EAE8', color: '#1A2118' }}
                onFocus={(e) => { e.target.style.borderColor = '#2D6A4F'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.08)'; }}
                onBlur={(e)  => { e.target.style.borderColor = '#E5EAE8'; e.target.style.boxShadow = 'none'; }}>
                {category.subs.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#9BAEA5' }} />
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5A7A6D' }}>
              Quantity ({subOption.unit}) — <span style={{ color: '#9BAEA5' }}>{subOption.hint}</span>
            </label>
            <input
              type="number" min="0" step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Enter ${subOption.unit}`}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{ background: '#F8FAF8', border: '1px solid #E5EAE8', color: '#1A2118' }}
              onFocus={(e) => { e.target.style.borderColor = '#2D6A4F'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.08)'; }}
              onBlur={(e)  => { e.target.style.borderColor = '#E5EAE8'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5A7A6D' }}>
              Note <span style={{ color: '#9BAEA5' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Drive to Lahore office"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{ background: '#F8FAF8', border: '1px solid #E5EAE8', color: '#1A2118' }}
              onFocus={(e) => { e.target.style.borderColor = '#2D6A4F'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.08)'; }}
              onBlur={(e)  => { e.target.style.borderColor = '#E5EAE8'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* CO₂ preview */}
          <div className="rounded-xl p-4 mb-5 flex items-center justify-between"
            style={{ background: kgValue > 0 ? '#EAF4EE' : '#F8FAF8', border: `1px solid ${kgValue > 0 ? '#C0DDD0' : '#E5EAE8'}` }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9BAEA5' }}>Estimated CO₂e</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: kgValue > 0 ? '#2D6A4F' : '#D1D9D5' }}>
                {kgValue > 0 ? kgValue.toFixed(3) : '0.000'}
                <span className="text-sm font-normal ml-1.5" style={{ color: '#9BAEA5' }}>kg</span>
              </p>
              {kgValue > 0 && (
                <p className="text-xs mt-0.5" style={{ color: '#7A9E8E' }}>
                  ≈ {(kgValue / 1000).toFixed(4)} tonnes CO₂e
                </p>
              )}
            </div>
            {kgValue === 0 && subKey === 'walking' && (
              <span className="text-2xl">🌱</span>
            )}
            {kgValue > 5 && <span className="text-2xl">⚠️</span>}
          </div>

          {error && <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>{error}</p>}

          {submitted && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="text-xs mb-3 px-3 py-2 rounded-lg flex items-center gap-2"
              style={{ background: '#EAF4EE', color: '#2D6A4F', border: '1px solid #C0DDD0' }}>
              <CheckCircle className="h-3.5 w-3.5" /> Entry logged successfully!
            </motion.p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !quantity || parseFloat(quantity) <= 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: '#2D6A4F' }}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Logging…</> : <><Send className="h-4 w-4" /> Log Entry</>}
          </button>
        </Card>
      </div>

      {/* Recent entries (2/5) */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #E5EAE8' }}>
            <h2 className="text-sm font-semibold" style={{ color: '#1A2118' }}>My Recent Entries</h2>
          </div>
          {loadingEntries ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#9BAEA5' }} />
            </div>
          ) : recentEntries.length === 0 ? (
            <div className="py-10 text-center px-6">
              <Calculator className="h-8 w-8 mx-auto mb-2" style={{ color: '#D1D9D5' }} />
              <p className="text-sm" style={{ color: '#9BAEA5' }}>No entries yet.<br />Log your first one!</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#F0EDE4' }}>
              {recentEntries.map((entry) => (
                <div key={entry.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold capitalize truncate" style={{ color: '#1A2118' }}>
                      {entry.subCategory?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] mt-0.5 capitalize" style={{ color: '#9BAEA5' }}>
                      {entry.category} · {entry.quantity} {entry.unit}
                    </p>
                  </div>
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: '#2D6A4F' }}>
                    {entry.valueKg.toFixed(2)} kg
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 3 — LEADERBOARD
═══════════════════════════════════════════════════ */
const PERIODS = [
  { id: 'all',   label: 'All Time' },
  { id: 'month', label: 'This Month' },
  { id: 'week',  label: 'This Week' },
];

const RANK_ICONS = {
  1: { icon: Crown,  color: '#F5A623' },
  2: { icon: Medal,  color: '#A8A8A8' },
  3: { icon: Medal,  color: '#CD7F32' },
};

function Leaderboard() {
  const { user: currentUser } = useAuthStore();
  const [period,   setPeriod]   = useState('all');
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [scope,    setScope]    = useState('total'); // total | scope1 | scope2 | scope3

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await carbonApi.getLeaderboard(period);
      setEntries(data.data ?? []);
    } catch {
      // Show empty state with helpful message
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const myRank = entries.find((e) => e.user.id === currentUser?.id);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1.5 p-1 rounded-lg w-fit" style={{ background: '#F4F6F4', border: '1px solid #E5EAE8' }}>
          {PERIODS.map((p) => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all"
              style={p.id === period ? { background: '#2D6A4F', color: '#fff' } : { color: '#7A9E8E' }}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 p-1 rounded-lg w-fit" style={{ background: '#F4F6F4', border: '1px solid #E5EAE8' }}>
          {[['total','Total'],['scope1','Scope 1'],['scope2','Scope 2'],['scope3','Scope 3']].map(([k,l]) => (
            <button key={k} onClick={() => setScope(k)}
              className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all"
              style={k === scope ? { background: '#1B4332', color: '#fff' } : { color: '#7A9E8E' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* My rank banner */}
      {myRank && (
        <div className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', border: '1px solid #2D6A4F' }}>
          <Trophy className="h-6 w-6 flex-shrink-0 text-yellow-400" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">Your Ranking</p>
            <p className="text-white/70 text-xs">
              #{myRank.rank} overall · {myRank.totalKg.toFixed(2)} kg CO₂e total
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-white font-bold text-xl">#{myRank.rank}</p>
            <p className="text-white/60 text-xs">{entries.length} employees</p>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-wider"
          style={{ borderBottom: '1px solid #E5EAE8', color: '#9BAEA5' }}>
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Employee</div>
          <div className="col-span-2 text-right hidden sm:block">Entries</div>
          <div className="col-span-2 text-right hidden md:block">Scope 1</div>
          <div className="col-span-2 text-right hidden md:block">Scope 2</div>
          <div className="col-span-3 sm:col-span-1 text-right font-bold" style={{ color: '#2D6A4F' }}>Total</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#9BAEA5' }} />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center px-6">
            <Trophy className="h-10 w-10 mx-auto mb-3" style={{ color: '#D1D9D5' }} />
            <p className="text-sm font-semibold mb-1" style={{ color: '#3D5247' }}>No data yet</p>
            <p className="text-xs" style={{ color: '#9BAEA5' }}>
              Be the first to log a carbon entry using the Calculator tab.
              <br />The leaderboard will appear once employees start logging.
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#F0EDE4' }}>
            {entries.map((entry, i) => {
              const RankMeta   = RANK_ICONS[entry.rank];
              const RankIcon   = RankMeta?.icon;
              const isMe       = entry.user.id === currentUser?.id;
              const scopeVal   = scope === 'total'
                ? entry.totalKg
                : (entry.scopeBreakdown?.[scope] ?? 0);

              return (
                <motion.div key={entry.user.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-12 gap-2 items-center px-5 py-3.5"
                  style={{ background: isMe ? '#F0F8F3' : 'transparent' }}>

                  {/* Rank */}
                  <div className="col-span-1 flex items-center">
                    {RankIcon
                      ? <RankIcon className="h-4.5 w-4.5" style={{ color: RankMeta.color, width: '18px', height: '18px' }} />
                      : <span className="text-sm font-bold" style={{ color: '#9BAEA5' }}>#{entry.rank}</span>
                    }
                  </div>

                  {/* User */}
                  <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                      style={{ background: isMe ? '#2D6A4F' : '#8B9E95' }}>
                      {getInitials(entry.user.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1A2118' }}>
                        {entry.user.name} {isMe && <span className="text-[10px] font-normal" style={{ color: '#2D6A4F' }}>(you)</span>}
                      </p>
                      <p className="text-[10px]" style={{ color: '#9BAEA5' }}>{entry.user.role}</p>
                    </div>
                  </div>

                  {/* Entries count */}
                  <div className="col-span-2 text-right hidden sm:block">
                    <span className="text-xs" style={{ color: '#7A9E8E' }}>{entry.entryCount}</span>
                  </div>

                  {/* Scope 1 */}
                  <div className="col-span-2 text-right hidden md:block">
                    <span className="text-xs font-medium" style={{ color: '#3D5247' }}>
                      {(entry.scopeBreakdown?.scope1 ?? 0).toFixed(2)} kg
                    </span>
                  </div>

                  {/* Scope 2 */}
                  <div className="col-span-2 text-right hidden md:block">
                    <span className="text-xs font-medium" style={{ color: '#3D5247' }}>
                      {(entry.scopeBreakdown?.scope2 ?? 0).toFixed(2)} kg
                    </span>
                  </div>

                  {/* Total */}
                  <div className="col-span-3 sm:col-span-1 text-right">
                    <span className="text-sm font-bold" style={{ color: entry.rank <= 3 ? '#2D6A4F' : '#1A2118' }}>
                      {scopeVal.toFixed(2)}
                    </span>
                    <span className="text-[10px] ml-0.5" style={{ color: '#9BAEA5' }}>kg</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <div className="px-5 py-3 text-xs" style={{ borderTop: '1px solid #E5EAE8', color: '#9BAEA5' }}>
          Rankings are based on total CO₂e logged. Lower = better 🌱 · Updates in real-time as employees log entries.
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE SHELL
═══════════════════════════════════════════════════ */
const TABS = [
  { id: 'log',         label: 'Activity Log',  icon: Activity    },
  { id: 'calculator',  label: 'Calculator',    icon: Calculator  },
  { id: 'leaderboard', label: 'Leaderboard',   icon: Trophy      },
];

export default function ActivitiesPage() {
  const [tab, setTab] = useState('log');

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold" style={{ color: '#1A2118' }}>Activities</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9BAEA5' }}>
          Activity log · Personal carbon calculator · Employee leaderboard
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#F4F6F4', border: '1px solid #E5EAE8' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === id
              ? { background: '#ffffff', color: '#1B4332', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
              : { color: '#7A9E8E' }}>
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}>
          {tab === 'log'         && <ActivityLog />}
          {tab === 'calculator'  && <CarbonCalculator />}
          {tab === 'leaderboard' && <Leaderboard />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, Trophy,
  CheckCircle, ChevronDown, Loader2, Send, Medal, Crown,
  Pencil, Trash2, X, Award,
} from 'lucide-react';
import { carbonApi } from '../../api/carbonApi';
import { insightsApi } from '../../api/insightsApi';
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
   TAB 1 — CARBON CALCULATOR
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
  industry: {
    label: 'Industry & Process', emoji: '🏭',
    subs: [
      { id: 'coal',               label: 'Coal (industrial)',          unit: 'kg',    hint: 'Kg of coal burned' },
      { id: 'furnace_oil',        label: 'Furnace oil / RFO',          unit: 'litre', hint: 'Litres used' },
      { id: 'natural_gas_boiler', label: 'Natural gas (boiler)',       unit: 'm³',    hint: 'Cubic metres' },
      { id: 'cement_process',     label: 'Cement (clinker)',           unit: 'kg',    hint: 'Kg of cement produced' },
      { id: 'steel',              label: 'Steel (crude)',              unit: 'kg',    hint: 'Kg of steel produced' },
      { id: 'fabric_processing',  label: 'Textile (dyeing/finishing)', unit: 'kg',    hint: 'Kg of fabric processed' },
      { id: 'brick_kiln',         label: 'Brick kiln',                 unit: 'brick', hint: 'Number of bricks fired' },
    ],
  },
  agriculture: {
    label: 'Agriculture', emoji: '🌾',
    subs: [
      { id: 'rice_paddy',       label: 'Rice paddy',           unit: 'hectare', hint: 'Hectares / season' },
      { id: 'crop_residue',     label: 'Crop residue burning',  unit: 'kg',     hint: 'Kg of residue burned' },
      { id: 'fertiliser_n',     label: 'Nitrogen fertiliser',   unit: 'kg',     hint: 'Kg of N applied' },
      { id: 'diesel_tractor',   label: 'Tractor / pump diesel', unit: 'litre',  hint: 'Litres used' },
      { id: 'livestock_cattle', label: 'Cattle (enteric)',      unit: 'head',   hint: 'Head of cattle (monthly)' },
    ],
  },
  purchased_goods: {
    label: 'Purchased Goods', emoji: '📦',
    subs: [
      { id: 'paper',           label: 'Office paper',           unit: 'kg',   hint: 'Kg of paper used' },
      { id: 'plastic_pkg',     label: 'Plastic packaging',      unit: 'kg',   hint: 'Kg of plastic packaging' },
      { id: 'it_equipment',    label: 'IT equipment (laptop)',   unit: 'unit', hint: 'Number of units' },
      { id: 'office_supplies', label: 'General office supplies', unit: 'kg',   hint: 'Kg of supplies' },
    ],
  },
  upstream_transport: {
    label: 'Upstream Freight', emoji: '🚢',
    subs: [
      { id: 'road_freight', label: 'Road freight (HGV)',      unit: 'tonne-km', hint: 'Tonne × km' },
      { id: 'sea_freight',  label: 'Sea freight (container)', unit: 'tonne-km', hint: 'Tonne × km' },
      { id: 'air_freight',  label: 'Air freight (cargo)',     unit: 'tonne-km', hint: 'Tonne × km' },
      { id: 'rail_freight', label: 'Rail freight',            unit: 'tonne-km', hint: 'Tonne × km' },
    ],
  },
  waste: {
    label: 'Waste', emoji: '♻️',
    subs: [
      { id: 'landfill',   label: 'Landfill (mixed)',     unit: 'kg', hint: 'Kg sent to landfill' },
      { id: 'recycled',   label: 'Mixed recycling',      unit: 'kg', hint: 'Kg recycled' },
      { id: 'composted',  label: 'Composting',           unit: 'kg', hint: 'Kg composted' },
      { id: 'wastewater', label: 'Wastewater treatment', unit: 'm3', hint: 'Cubic metres treated' },
    ],
  },
  downstream_transport: {
    label: 'Downstream Freight', emoji: '🚚',
    subs: [
      { id: 'road_delivery', label: 'Road delivery (HGV)',    unit: 'tonne-km', hint: 'Tonne × km' },
      { id: 'last_mile',     label: 'Last-mile van delivery', unit: 'tonne-km', hint: 'Tonne × km' },
      { id: 'cold_chain',    label: 'Cold chain distribution',unit: 'tonne-km', hint: 'Tonne × km' },
    ],
  },
  end_of_life: {
    label: 'End of Life', emoji: '🗑️',
    subs: [
      { id: 'e_waste',            label: 'Electronics recycling',    unit: 'kg', hint: 'Kg of e-waste' },
      { id: 'construction_waste', label: 'Construction waste',       unit: 'kg', hint: 'Kg of construction waste' },
      { id: 'mixed_waste_eol',    label: 'Mixed product waste (EOL)', unit: 'kg', hint: 'Kg of end-of-life products' },
    ],
  },
};

/* Local emission factors (mirrors backend) */
const LOCAL_FACTORS = {
  commute: { car_petrol: 0.192, car_diesel: 0.171, car_electric: 0.047, motorbike: 0.114, bus: 0.089, train: 0.041, walking: 0 },
  energy:  { electricity: 0.45, natural_gas: 2.1, lpg: 1.51, diesel_gen: 2.68 },
  travel:  { flight_short: 0.255, flight_long: 0.195, car_rental: 0.192, taxi: 0.211 },
  food:    { beef: 6.1, chicken: 0.86, fish: 1.34, vegetarian: 0.50, vegan: 0.30 },
  industry:             { coal: 2.42, furnace_oil: 3.13, natural_gas_boiler: 2.02, cement_process: 0.53, steel: 1.85, fabric_processing: 1.80, brick_kiln: 0.18 },
  agriculture:          { rice_paddy: 1370, crop_residue: 1.5, fertiliser_n: 4.42, diesel_tractor: 2.68, livestock_cattle: 225 },
  purchased_goods:      { paper: 1.37, plastic_pkg: 2.53, it_equipment: 300, office_supplies: 0.85 },
  upstream_transport:   { road_freight: 0.11, sea_freight: 0.008, air_freight: 0.602, rail_freight: 0.028 },
  waste:                { landfill: 0.46, recycled: 0.021, composted: 0.01, wastewater: 0.35 },
  downstream_transport: { road_delivery: 0.11, last_mile: 0.184, cold_chain: 0.22 },
  end_of_life:          { e_waste: 0.020, construction_waste: 0.025, mixed_waste_eol: 0.46 },
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
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  const resetForm = () => { setEditingId(null); setQuantity(''); setDesc(''); setError(''); };

  /* Load an entry into the form for editing */
  const startEdit = (entry) => {
    const cat = CATEGORIES[entry.category] ? entry.category : 'commute';
    const sub = CATEGORIES[cat]?.subs.some((s) => s.id === entry.subCategory)
      ? entry.subCategory : CATEGORIES[cat].subs[0].id;
    setEditingId(entry.id);
    setCatKey(cat);
    setSubKey(sub);
    setQuantity(String(entry.quantity));
    setDesc(entry.description ?? '');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeEntry = async (id) => {
    setDeletingId(id);
    try {
      await carbonApi.deleteEntry(id);
      if (editingId === id) resetForm();
      fetchEntries();
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Could not delete entry.');
    } finally { setDeletingId(null); }
  };

  const handleSubmit = async () => {
    if (!quantity || parseFloat(quantity) <= 0) { setError('Enter a valid quantity.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const payload = { category: catKey, subCategory: subKey, quantity: parseFloat(quantity), description: desc || undefined };
      if (editingId) {
        await carbonApi.updateEntry(editingId, payload);
      } else {
        await carbonApi.submitEntry(payload);
      }
      setSubmitted(true);
      resetForm();
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
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold" style={{ color: '#1A2118' }}>
              {editingId ? 'Edit Entry' : 'Log Your Carbon Footprint'}
            </h2>
            {editingId && (
              <button onClick={resetForm} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: '#F4F6F4', color: '#7A9E8E' }}>
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            )}
          </div>

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
              placeholder={`Add a note about this ${subOption.label.toLowerCase()} entry`}
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
              <CheckCircle className="h-3.5 w-3.5" /> {editingId ? 'Entry updated!' : 'Entry logged successfully!'}
            </motion.p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !quantity || parseFloat(quantity) <= 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: editingId ? '#C4952A' : '#2D6A4F' }}>
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> {editingId ? 'Saving…' : 'Logging…'}</>
              : editingId ? <><Pencil className="h-4 w-4" /> Update Entry</> : <><Send className="h-4 w-4" /> Log Entry</>}
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
                <div key={entry.id} className="px-5 py-3 flex items-center justify-between gap-2 group"
                  style={{ background: editingId === entry.id ? '#FDF8EC' : 'transparent' }}>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold capitalize truncate" style={{ color: '#1A2118' }}>
                      {entry.subCategory?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] mt-0.5 capitalize" style={{ color: '#9BAEA5' }}>
                      {entry.category} · {entry.quantity} {entry.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs font-bold" style={{ color: '#2D6A4F' }}>
                      {entry.valueKg.toFixed(2)} kg
                    </span>
                    <button onClick={() => startEdit(entry)} title="Edit"
                      className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" style={{ color: '#9BAEA5' }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => removeEntry(entry.id)} title="Delete" disabled={deletingId === entry.id}
                      className="p-1.5 rounded-md hover:bg-red-50 transition-colors disabled:opacity-40" style={{ color: '#DC8585' }}>
                      {deletingId === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
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
   TAB 3 — AWARDS (points, tiers, badges)
═══════════════════════════════════════════════════ */
const POINT_SOURCES = [
  { key: 'footprint',   label: 'Low footprint',  max: 200, color: '#2D6A4F', desc: 'Lowest CO₂e in your team earns 200' },
  { key: 'improvement', label: 'Improvement',    max: 150, color: '#52B788', desc: '5 pts per % cut vs the previous 30 days' },
  { key: 'consistency', label: 'Consistency',    max: 100, color: '#5B7C99', desc: '2 pts per day you log activity' },
  { key: 'challenges',  label: 'Challenges',     max: null, color: '#C4952A', desc: '50 + kg saved per completed challenge' },
  { key: 'adminAwards', label: 'Admin awards',   max: null, color: '#E07020', desc: 'Recognition given by your admin' },
];

function TierPill({ tier }) {
  if (!tier) return null;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${tier.color}1A`, color: tier.color, border: `1px solid ${tier.color}40` }}>
      {tier.name}
    </span>
  );
}

function AwardsBoard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(null); // expanded user id

  useEffect(() => {
    insightsApi.getAwards()
      .then(({ data: res }) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#9BAEA5' }} />
      </div>
    );
  }
  if (!data?.rankings?.length) {
    return (
      <Card className="py-16 text-center px-6">
        <Award className="h-10 w-10 mx-auto mb-3" style={{ color: '#D1D9D5' }} />
        <p className="text-sm font-semibold" style={{ color: '#3D5247' }}>No awards yet</p>
        <p className="text-xs mt-1" style={{ color: '#9BAEA5' }}>Log activities and complete challenges to start earning points.</p>
      </Card>
    );
  }

  const { me, rankings, organization, periodDays } = data;

  return (
    <div className="space-y-4">
      {/* My standing */}
      {me && (
        <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[180px]">
              <Trophy className="h-7 w-7 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm">Your awards · {organization}</p>
                <p className="text-white/70 text-xs">#{me.rank} of {rankings.length} · last {periodDays} days</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-3xl leading-none">{me.points}</p>
              <p className="text-xs font-bold mt-1" style={{ color: '#F4D58D' }}>{me.tier?.name} tier</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
            {POINT_SOURCES.map((s) => (
              <div key={s.key} className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <p className="text-white font-bold text-base">{me.breakdown[s.key]}</p>
                <p className="text-white/60 text-[10px]">{s.label}</p>
              </div>
            ))}
          </div>

          {me.badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {me.badges.map((b) => (
                <span key={b.title} title={b.reason ?? ''}
                  className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                  style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
                  <span>{b.icon}</span>{b.title}{b.fromAdmin && <span className="text-[9px] opacity-70">· admin</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Team ranking */}
      <Card>
        <div className="px-5 py-3.5" style={{ borderBottom: '1px solid #E5EAE8' }}>
          <h3 className="text-sm font-semibold" style={{ color: '#1A2118' }}>{organization ?? 'Team'} rankings</h3>
          <p className="text-xs mt-0.5" style={{ color: '#9BAEA5' }}>Tap a member to see how their points were earned</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#F0EDE4' }}>
          {rankings.map((r, i) => {
            const RankMeta = RANK_ICONS[r.rank];
            const RankIcon = RankMeta?.icon;
            const isMe     = r.user.id === me?.user.id;
            const expanded = open === r.user.id;
            return (
              <motion.div key={r.user.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }} style={{ background: isMe ? '#F0F8F3' : 'transparent' }}>
                <button onClick={() => setOpen(expanded ? null : r.user.id)}
                  className="w-full grid grid-cols-12 gap-2 items-center px-5 py-3 text-left">
                  <div className="col-span-1">
                    {RankIcon
                      ? <RankIcon style={{ color: RankMeta.color, width: 18, height: 18 }} />
                      : <span className="text-sm font-bold" style={{ color: '#9BAEA5' }}>#{r.rank}</span>}
                  </div>
                  <div className="col-span-7 sm:col-span-5 flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                      style={{ background: isMe ? '#2D6A4F' : '#8B9E95' }}>
                      {getInitials(r.user.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1A2118' }}>
                        {r.user.name}{isMe && <span className="text-[10px] font-normal ml-1" style={{ color: '#2D6A4F' }}>(you)</span>}
                      </p>
                      <TierPill tier={r.tier} />
                    </div>
                  </div>
                  <div className="col-span-4 hidden sm:flex flex-wrap gap-0.5">
                    {r.badges.map((b) => <span key={b.title} title={b.title} className="text-base leading-none">{b.icon}</span>)}
                  </div>
                  <div className="col-span-4 sm:col-span-2 text-right">
                    <span className="text-sm font-bold" style={{ color: r.rank <= 3 ? '#2D6A4F' : '#1A2118' }}>{r.points}</span>
                    <span className="text-[10px] ml-0.5" style={{ color: '#9BAEA5' }}>pts</span>
                  </div>
                </button>

                {expanded && (
                  <div className="px-5 pb-4 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {POINT_SOURCES.map((s) => (
                        <div key={s.key} className="rounded-lg px-3 py-2" style={{ background: '#F8FAF8', border: '1px solid #E5EAE8' }}>
                          <p className="text-sm font-bold" style={{ color: s.color }}>{r.breakdown[s.key]}</p>
                          <p className="text-[10px]" style={{ color: '#9BAEA5' }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: '#5A7A6D' }}>
                      {r.totalKg} kg CO₂e · {r.changePct > 0 ? '+' : ''}{r.changePct}% vs previous 30 days ·
                      {' '}{r.challengesCompleted} challenge{r.challengesCompleted !== 1 ? 's' : ''} completed · logged on {r.activeDays} days
                    </p>
                    {r.badges.length > 0 && (
                      <div className="space-y-1">
                        {r.badges.map((b) => (
                          <p key={b.title} className="text-xs" style={{ color: '#3D5247' }}>
                            <span className="mr-1.5">{b.icon}</span><strong>{b.title}</strong>
                            {b.reason && <span style={{ color: '#9BAEA5' }}> — {b.reason}</span>}
                            {b.fromAdmin && <span className="ml-1 text-[10px] font-semibold" style={{ color: '#E07020' }}>(+{b.points} admin award)</span>}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* How points work */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#1A2118' }}>How points are earned</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {POINT_SOURCES.map((s) => (
            <div key={s.key}>
              <p className="text-xs font-bold" style={{ color: s.color }}>{s.label}{s.max ? ` · up to ${s.max}` : ''}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#9BAEA5' }}>{s.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] mt-3" style={{ color: '#9BAEA5' }}>
          Tiers: Bronze 0+ · Silver 180+ · Gold 300+ · Platinum 450+
        </p>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE SHELL
═══════════════════════════════════════════════════ */
const TABS = [
  { id: 'calculator',  label: 'Calculator',  icon: Calculator },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy     },
  { id: 'awards',      label: 'Awards',      icon: Award      },
];

export default function ActivitiesPage() {
  const [tab, setTab] = useState('calculator');

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold" style={{ color: '#1A2118' }}>Activities</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9BAEA5' }}>
          Log your carbon footprint · See how you rank and what you've earned
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
          {tab === 'calculator'  && <CarbonCalculator />}
          {tab === 'leaderboard' && <Leaderboard />}
          {tab === 'awards'      && <AwardsBoard />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

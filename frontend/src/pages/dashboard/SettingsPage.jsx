import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Save, Loader2, ShieldCheck, LogOut } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { getInitials, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

function Card({ className = '', style = {}, children }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: '#fff', border: '1px solid #E5EAE8', ...style }}>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all';
const inputStyle = { border: '1px solid #E5EAE8', color: '#1A2118' };

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { handleLogout }  = useAuth();

  const [name, setName]   = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    const payload = {};
    if (name.trim() && name.trim() !== user?.name)  payload.name  = name.trim();
    if (email.trim() && email.trim() !== user?.email) payload.email = email.trim();
    if (Object.keys(payload).length === 0) { toast('No changes to save.'); return; }
    setSavingProfile(true);
    try {
      const { data: res } = await authApi.updateProfile(payload);
      setUser(res.data);
      toast.success('Profile updated.');
    } catch (e) { toast.error(e?.response?.data?.message ?? 'Could not update profile.'); }
    finally { setSavingProfile(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (newPw.length < 8) { toast.error('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { toast.error('Passwords do not match.'); return; }
    setSavingPw(true);
    try {
      await authApi.changePassword({ currentPassword: curPw, newPassword: newPw });
      toast.success('Password changed.');
      setCurPw(''); setNewPw(''); setConfirmPw('');
    } catch (e) { toast.error(e?.response?.data?.message ?? 'Could not change password.'); }
    finally { setSavingPw(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      {/* Header / identity */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
        <Card className="p-5 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#2D6A4F,#3B6CA8)' }}>
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold truncate" style={{ color:'#1A2118' }}>{user?.name}</h1>
              {user?.role === 'ADMIN' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background:'#FDF5E6', color:'#C4952A' }}>
                  <ShieldCheck className="h-3 w-3" /> ADMIN
                </span>
              )}
            </div>
            <p className="text-sm truncate" style={{ color:'#9BAEA5' }}>{user?.email}</p>
            <p className="text-xs mt-0.5" style={{ color:'#C0CCC6' }}>Member since {formatDate(user?.createdAt ?? new Date())}</p>
          </div>
        </Card>
      </motion.div>

      {/* Profile */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.05 }}>
        <Card className="p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color:'#1A2118' }}>Profile</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color:'#5A7A6D' }}>
                <User className="h-3.5 w-3.5" /> Full name
              </label>
              <input className={inputCls} style={inputStyle} value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color:'#5A7A6D' }}>
                <Mail className="h-3.5 w-3.5" /> Email address
              </label>
              <input className={inputCls} style={inputStyle} type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <button type="submit" disabled={savingProfile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background:'#2D6A4F' }}>
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
            </button>
          </form>
        </Card>
      </motion.div>

      {/* Password */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.1 }}>
        <Card className="p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color:'#1A2118' }}>Change password</h2>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color:'#5A7A6D' }}>
                <Lock className="h-3.5 w-3.5" /> Current password
              </label>
              <input className={inputCls} style={inputStyle} type="password" value={curPw} onChange={(e)=>setCurPw(e.target.value)} autoComplete="current-password" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color:'#5A7A6D' }}>New password</label>
                <input className={inputCls} style={inputStyle} type="password" value={newPw} onChange={(e)=>setNewPw(e.target.value)} autoComplete="new-password" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color:'#5A7A6D' }}>Confirm new password</label>
                <input className={inputCls} style={inputStyle} type="password" value={confirmPw} onChange={(e)=>setConfirmPw(e.target.value)} autoComplete="new-password" />
              </div>
            </div>
            <button type="submit" disabled={savingPw}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background:'#2D6A4F' }}>
              {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Update password
            </button>
          </form>
        </Card>
      </motion.div>

      {/* Danger / session */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.15 }}>
        <Card className="p-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold" style={{ color:'#1A2118' }}>Session</h2>
            <p className="text-xs mt-0.5" style={{ color:'#9BAEA5' }}>Sign out of this device.</p>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background:'#FEF2F2', color:'#DC2626' }}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </Card>
      </motion.div>
    </div>
  );
}

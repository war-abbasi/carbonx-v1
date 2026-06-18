import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Factory, Sparkles, CheckCircle, ArrowRight, ChevronLeft, X } from 'lucide-react';
import iconImg from '../../assets/carbonx-icon.png';

const slides = [
  {
    icon: Leaf,
    accent: '#2D6A4F',
    bg: '#EAF4EE',
    tag: 'Welcome',
    title: 'Welcome to CarbonX',
    subtitle: 'Your AI-powered carbon intelligence platform',
    body: 'Track, analyze, and reduce your organization\'s carbon footprint with enterprise-grade precision — aligned with the GHG Protocol across Scope 1, 2 & 3.',
    visual: (
      <div className="relative flex items-center justify-center h-48">
        <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ background: '#EAF4EE', border: '2px solid #C0DDD0' }}>
          <Leaf className="h-16 w-16" style={{ color: '#2D6A4F' }} />
        </div>
        {/* orbiting dots */}
        {[0,1,2,3].map((i) => (
          <div key={i} className="absolute w-3 h-3 rounded-full" style={{
            background: i % 2 === 0 ? '#2D6A4F' : '#C4952A',
            opacity: 0.5,
            top: `${20 + Math.sin(i * 1.57) * 52}%`,
            left: `${50 + Math.cos(i * 1.57) * 30}%`,
            transform: 'translate(-50%,-50%)',
          }} />
        ))}
      </div>
    ),
  },
  {
    icon: Factory,
    accent: '#C4952A',
    bg: '#FDF5E6',
    tag: 'Step 1',
    title: 'Track Every Emission',
    subtitle: 'Scope 1, 2 & 3 — fully covered',
    body: 'Connect your data sources — ERP systems, utility bills, supply chain data — and CarbonX automatically categorizes and measures all emissions in real time.',
    visual: (
      <div className="flex items-end justify-center gap-3 h-48 pb-4">
        {[60, 85, 45, 92, 70, 55, 80].map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${h * 0.9}px` }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-7 rounded-t-md"
              style={{ background: i === 3 ? '#C4952A' : i % 2 === 0 ? '#2D6A4F' : '#8B5E3C', opacity: 0.8 }}
            />
            <span className="text-[9px] font-mono" style={{ color: '#9BAEA5' }}>
              {['J','F','M','A','M','J','J'][i]}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Sparkles,
    accent: '#2D6A4F',
    bg: '#EAF4EE',
    tag: 'Step 2',
    title: 'AI-Powered Intelligence',
    subtitle: 'Forecast, recommend, and automate',
    body: 'Our AI models analyze your emission patterns to forecast future output, identify high-impact reduction opportunities, and auto-generate GHG Protocol compliance reports.',
    visual: (
      <div className="h-48 flex flex-col justify-center gap-3 px-4">
        {[
          { label: 'Emission Forecast', val: 92, color: '#2D6A4F' },
          { label: 'Reduction Potential', val: 67, color: '#C4952A' },
          { label: 'Compliance Score',    val: 84, color: '#8B5E3C' },
        ].map(({ label, val, color }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: '#5A7A6D' }}>{label}</span>
              <span className="font-semibold" style={{ color }}>{val}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: '#F0EDE4' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${val}%` }}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full"
                style={{ background: color }}
              />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: CheckCircle,
    accent: '#2D6A4F',
    bg: '#EAF4EE',
    tag: 'Ready',
    title: "You're All Set!",
    subtitle: 'Your dashboard is waiting',
    body: 'Start by exploring your overview, or head straight to Admin Panel to connect your first data source and begin tracking emissions in minutes.',
    visual: (
      <div className="h-48 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{ background: '#EAF4EE', border: '3px solid #2D6A4F' }}
        >
          <CheckCircle className="h-14 w-14" style={{ color: '#2D6A4F' }} />
        </motion.div>
      </div>
    ),
  },
];

const SLIDE_VARIANTS = {
  enter:  (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

export default function OnboardingPage() {
  const [step, setStep]     = useState(0);
  const [dir,  setDir]      = useState(1);
  const navigate            = useNavigate();
  const slide               = slides[step];

  const complete = () => {
    localStorage.setItem('carbonx_onboarding', 'done');
    navigate('/dashboard');
  };

  const next = () => {
    if (step < slides.length - 1) { setDir(1); setStep((s) => s + 1); }
    else complete();
  };

  const back = () => {
    if (step > 0) { setDir(-1); setStep((s) => s - 1); }
  };

  const Icon = slide.icon;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative"
      style={{ background: '#F2F5F3' }}
    >
      {/* Skip */}
      <button
        onClick={complete}
        className="absolute top-6 right-6 flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
        style={{ color: '#9BAEA5' }}
      >
        <X className="h-4 w-4" /> Skip
      </button>

      {/* Logo */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <img src={iconImg} alt="CarbonX" className="h-7 w-7 object-contain" />
        <span className="font-bold text-sm" style={{ color: '#1B4332' }}>CarbonX</span>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid #E5EAE8', boxShadow: '0 20px 60px rgba(27,67,50,0.10)' }}
      >
        {/* Coloured top strip */}
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${slide.accent}, #52B788)` }} />

        {/* Visual area */}
        <div className="px-8 py-6" style={{ background: slide.bg, borderBottom: '1px solid #E5EAE8' }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {slide.visual}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="px-8 py-7">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={`content-${step}`}
              custom={dir}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              {/* Tag */}
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full"
                style={{ background: slide.bg, color: slide.accent, border: `1px solid ${slide.accent}28` }}
              >
                {slide.tag}
              </span>

              <h2
                className="text-2xl font-bold leading-tight"
                style={{ fontFamily: 'Instrument Serif, Georgia, serif', color: '#1A2118' }}
              >
                {slide.title}
              </h2>
              <p className="text-sm font-medium" style={{ color: slide.accent }}>{slide.subtitle}</p>
              <p className="text-sm leading-relaxed" style={{ color: '#5A7A6D' }}>{slide.body}</p>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 my-6">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDir(i > step ? 1 : -1); setStep(i); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width:  i === step ? '20px' : '7px',
                  height: '7px',
                  background: i === step ? slide.accent : '#D1D9D5',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={back}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors hover:bg-gray-50"
                style={{ color: '#9BAEA5', border: '1px solid #E5EAE8' }}
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}
            <button
              onClick={next}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: slide.accent, boxShadow: `0 4px 16px ${slide.accent}38` }}
            >
              {step === slides.length - 1 ? 'Open My Dashboard' : 'Continue'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Step count */}
      <p className="mt-5 text-xs" style={{ color: '#9BAEA5' }}>
        Step {step + 1} of {slides.length}
      </p>
    </div>
  );
}

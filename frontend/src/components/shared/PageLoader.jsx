import iconImg from '../../assets/carbonx-icon.png';

export default function PageLoader() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
      <div className="relative">
        <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/20 scale-150" />
        <div className="relative h-16 w-16 rounded-2xl flex items-center justify-center glass-card">
          <img src={iconImg} alt="CarbonX" className="h-10 w-10 object-contain animate-pulse-slow" />
        </div>
      </div>
      <p className="mt-6 text-emerald-400/60 text-sm font-medium tracking-widest uppercase animate-pulse">
        Loading
      </p>
    </div>
  );
}

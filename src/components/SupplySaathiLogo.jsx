export default function SupplySaathiLogo({ className = '' }) {
  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      {/* Generated AI Fintech Brand Mark Asset with Glow Elevation */}
      <div className="relative group flex items-center justify-center cursor-pointer">
        {/* Layer 1: Ambient Backdrop Glow Bloom */}
        <div className="absolute -inset-1.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 rounded-2xl blur-md opacity-40 group-hover:opacity-80 transition-all duration-500" />
        
        {/* Layer 2: Brand Logo Frame */}
        <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-white/20 bg-slate-950 shadow-2xl transition-transform duration-300 group-hover:scale-105 flex items-center justify-center">
          <img
            src="/brand_logo.png"
            alt="SupplySaathi Brand Mark"
            className="w-full h-full object-cover rounded-2xl transition-all duration-300 group-hover:brightness-110"
            onError={(e) => {
              // Fallback SVG if image is loading
              e.target.style.display = 'none'
            }}
          />
        </div>
      </div>

      {/* Brand Identity Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-black tracking-tight text-white font-sans">SupplySaathi</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase font-bold">
          AI Procurement & Trust
        </span>
      </div>
    </div>
  )
}

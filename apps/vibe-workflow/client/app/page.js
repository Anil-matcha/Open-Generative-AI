import Link from "next/link";
import { HiArrowRight } from "react-icons/hi2";
import { GoWorkflow } from "react-icons/go";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-[#030303] text-white overflow-hidden selection:bg-blue-500/30">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <GoWorkflow className="text-white" size={20} />
          </div>
          <span>Workflow<span className="text-blue-500">Pro</span></span>
        </div>
        <Link 
          href="https://muapi.ai/access-keys"
          target="_blank"
          className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2 rounded-full text-sm font-medium transition-all"
        >
          Get Api Key
        </Link>
      </nav>
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          New: AI-Powered Automations
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
          Orchestrate your <br /> 
          <span className="text-white">creative workflow.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl leading-relaxed">
          The all-in-one platform to design, automate, and scale your creative processes with precision. Seamlessly bridge your ideas and execution.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/workflow"
            className="group relative flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold transition-all shadow-[0_20px_40px_-15px_rgba(37,99,235,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] active:scale-95"
          >
            Explore Workflows
            <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-8 py-4 rounded-full font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm">
            Watch Demo
          </button>
        </div>
        <div className="mt-20 w-full max-w-5xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 shadow-2xl relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity blur-lg" />
          <div className="aspect-video rounded-xl bg-zinc-900 overflow-hidden relative">
             <div className="absolute inset-0 flex items-center justify-center">
                <GoWorkflow className="text-zinc-800" size={120} />
             </div>
             <div className="absolute top-8 left-8 w-48 h-32 bg-white/5 rounded-lg border border-white/10 p-4">
                <div className="w-12 h-2 bg-blue-500/40 rounded mb-2" />
                <div className="w-24 h-2 bg-white/10 rounded mb-4" />
                <div className="space-y-2">
                  <div className="w-full h-1 bg-white/5 rounded" />
                  <div className="w-full h-1 bg-white/5 rounded" />
                  <div className="w-2/3 h-1 bg-white/5 rounded" />
                </div>
             </div>
             <div className="absolute bottom-8 right-8 w-64 h-48 bg-white/5 rounded-lg border border-white/10 p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="w-16 h-2 bg-purple-500/40 rounded" />
                  <div className="w-4 h-4 rounded-full bg-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="aspect-square bg-white/5 rounded" />
                  <div className="aspect-square bg-white/5 rounded" />
                  <div className="aspect-square bg-white/5 rounded" />
                  <div className="aspect-square bg-white/5 rounded" />
                </div>
             </div>
          </div>
        </div>
      </main>
      <footer className="relative z-10 border-t border-white/5 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-zinc-500 text-sm italic">
            Trusted by over 10,000+ creative teams worldwide.
          </div>
          <div className="flex gap-8 overflow-hidden grayscale opacity-50">
            <span className="font-black text-xl tracking-tighter italic">AURORA</span>
            <span className="font-black text-xl tracking-tighter italic">METAVOX</span>
            <span className="font-black text-xl tracking-tighter italic">NEXUS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

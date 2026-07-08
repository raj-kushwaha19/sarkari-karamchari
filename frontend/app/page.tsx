'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '@/lib/authContext';
import { Brain, Clock, ShieldAlert, CheckCircle, ArrowRight, Sparkles, Building2, Mic, Cpu, ShieldCheck } from 'lucide-react';

function LandingContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'track'>('login');
  const [trackCode, setTrackCode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  const handleTrackSearch = () => {
    const cleanCode = trackCode.replace(/\s/g, '').toUpperCase();
    if (cleanCode.length >= 16) {
      router.push(`/track?code=${cleanCode}`);
    }
  };

  const formatCode = (v: string) => {
    const raw = v.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 16);
    return raw.replace(/(.{4})/g, '$1-').replace(/-$/, '');
  };

  return (
    <main className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden bg-[#0A0A10]">
      {/* ── LEFT SIDE: BAWAL GLOWING GRAPHICS & BRAND STORY ── */}
      <div className="relative flex-1 hidden md:flex flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        {/* Glow meshes (Slow-moving ambient background) */}
        <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] rounded-full bg-primary/10 blur-[130px] animate-glow-1" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[140px] animate-glow-2" />
        <div className="absolute top-1/2 right-10 w-64 h-64 rounded-full bg-orange-500/5 blur-[110px] animate-glow-3" />

        {/* Rotating Light Rays Animation */}
        <div className="absolute inset-0 opacity-[0.14] pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 w-[220%] h-[220%] bg-[conic-gradient(from_0deg_at_50%_50%,rgba(99,102,241,0.2)_0deg,transparent_45deg,rgba(16,185,129,0.15)_90deg,transparent_135deg,rgba(249,115,22,0.15)_180deg,transparent_225deg,rgba(99,102,241,0.2)_270deg,transparent_315deg)] animate-rays" />
        </div>

        {/* Brand header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 z-10"
        >
          <div className="p-1 rounded-xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-md" style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}>
            <img src="/logo.png" className="w-9 h-9 object-cover rounded-lg" style={{ width: '36px', height: '36px' }} alt="Logo" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-lg tracking-tight">Sarkari Karamchari</h2>
            <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Smart Civic Grievance</p>
          </div>
        </motion.div>

        {/* Brand center typography */}
        <div className="my-auto z-10 max-w-xl space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Owned & Developed by Gen-Z Solutions
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              Aapki Awaaz,<br />
              <span className="bg-gradient-to-r from-primary via-emerald-400 to-orange-400 bg-clip-text text-transparent">
                Sidha Samadhan.
              </span>
            </h1>
            
            <p className="text-sm text-zinc-300 leading-relaxed font-medium">
              Sarkari Karamchari is a high-trust, automated civic grievance system. We connect citizens directly to verified government departments. Speak or type your problem, and our AI dispatches it instantly to official nodal mailrooms. No middlemen, no bribes, and absolute accountability.
            </p>
          </motion.div>

          {/* Large Highlighted Verified Gov Emails Banner (Replacing stats) */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="flex items-center gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md z-10 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-2xl rounded-full pointer-events-none" />
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-orange-400 tracking-tight">1,500+</div>
            <div className="border-l border-white/10 pl-6 space-y-1">
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-wide bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Verified Mails</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Directly connected to official Indian administrative email servers. No middlemen. Your complaint lands directly in the inbox of the officer-in-charge, legally binding them to act.
              </p>
            </div>
          </motion.div>

          {/* How It Works Section (Rich Density UI with Custom Icons) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="space-y-3 pt-6 border-t border-white/5"
          >
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">How It Works</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Mic className="w-4 h-4" />
                </div>
                <h4 className="text-[11px] font-bold text-white">1. Voice / Text</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed">Speak, write or upload photo of the issue. Our AI instantly formats your grievance.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <h4 className="text-[11px] font-bold text-white">2. AI Router</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed">Dispatches to the verified official department mailboxes instantly in milliseconds.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-[11px] font-bold text-white">3. Escalations</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed">Watchdog auto-notifies HoD, MLA & Minister if department delays the resolution.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-[11px] text-zinc-400 flex justify-between items-center z-10 pt-4"
        >
          <span>Made for the Citizens of India</span>
          <span>© 2026 Gen-Z Solutions</span>
        </motion.div>
      </div>

      {/* ── RIGHT SIDE: CARD PANEL & LOGIN FLOW ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden bg-gradient-to-t from-[#0A0A10] to-[#12121E]">
        {/* Decorative backdrop lights for mobile */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] md:hidden" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] md:hidden" />

        {/* Branding for Mobile */}
        <div className="flex items-center gap-2 mb-8 md:hidden">
          <img src="/logo.png" className="w-10 h-10 object-cover rounded-xl" style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' }} alt="Logo" />
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Sarkari Karamchari</h1>
            <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Owned & Developed by Gen-Z Solutions</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-full max-w-[420px] bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10"
        >
          {/* Tabs */}
          <div className="flex bg-white/5 p-1 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'login' ? 'bg-primary text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'track' ? 'bg-primary text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Track Complaint
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center md:text-left">
                  <h2 className="text-xl font-bold text-white mb-2">Welcome Back</h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Login with your Google account to file new complaints, view your dashboard, and receive instant status updates.
                  </p>
                </div>

                <div className="py-4 space-y-4">
                  {/* Terms & Conditions Checkbox */}
                  <div className="flex items-start gap-2.5 px-1">
                    <input
                      type="checkbox"
                      id="terms-checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/40 focus:ring-2 focus:ring-offset-0 accent-primary cursor-pointer"
                    />
                    <label htmlFor="terms-checkbox" className="text-xs text-zinc-400 leading-normal cursor-pointer select-none">
                      I agree to the{" "}
                      <a href="/privacy-policy" target="_blank" className="text-primary hover:underline font-semibold">Privacy Policy</a>
                      {" "}and{" "}
                      <a href="/terms-of-service" target="_blank" className="text-primary hover:underline font-semibold">Terms & Conditions</a>.
                    </label>
                  </div>

                  {/* Premium Google Button */}
                  <motion.a
                    id="google-login-btn"
                    href="/api/auth/google"
                    whileHover={acceptedTerms ? { scale: 1.02 } : {}}
                    whileTap={acceptedTerms ? { scale: 0.98 } : {}}
                    className={`flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-bold rounded-xl py-4 px-6 text-sm shadow-lg shadow-black/20 transition-all w-full min-h-[52px] ${
                      !acceptedTerms ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                    }`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </motion.a>
                </div>

                {/* Features Highlights list */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2.5 text-xs text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Vernacular Voice & Photo recognition</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Auto-escalation watchdogs (4 to 14 days)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Direct integration with official channels</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="track"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Track Complaint</h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Check the current status and tracking timeline of any complaint using its unique 16-character code. No login required.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Complaint Code
                  </label>
                  <input
                    id="track-code-input"
                    type="text"
                    value={trackCode}
                    onChange={e => setTrackCode(formatCode(e.target.value))}
                    onKeyDown={e => e.key === 'Enter' && handleTrackSearch()}
                    placeholder="A3X9-K2MQ-T7PL-W4NR"
                    className="w-full p-3 rounded-xl border border-white/10 bg-white/5 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 tracking-widest uppercase text-center"
                    maxLength={19}
                  />

                  <motion.button
                    id="track-submit-btn"
                    onClick={handleTrackSearch}
                    disabled={trackCode.replace(/\s/g, '').length < 16}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold rounded-xl py-3.5 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    Track Status <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Support Section Footer inside the Card */}
          <div className="mt-8 text-center text-xs text-zinc-500 border-t border-white/5 pt-5 space-y-2 relative z-10">
            <p className="font-semibold text-zinc-400">Need support or have feedback?</p>
            <div className="flex justify-center gap-4 text-[10.5px]">
              <a href="mailto:sarkari.karamchari.official@gmail.com" className="hover:text-primary transition-colors hover:underline">sarkari.karamchari.official@gmail.com</a>
              <span>•</span>
              <a href="#" className="hover:text-primary transition-colors hover:underline">Terms of Use</a>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <LandingContent />
    </AuthProvider>
  );
}

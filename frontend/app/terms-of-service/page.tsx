'use client';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsOfService() {
  const router = useRouter();

  return (
    <main className="min-h-screen w-full bg-[#0A0A10] text-zinc-300 py-16 px-6 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px]" />

      <div className="max-w-3xl mx-auto relative z-10 space-y-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-semibold group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Go Back
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/15 pb-6">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Terms & Conditions</h1>
            <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-bold">Sarkari Karamchari Platform</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm leading-relaxed text-zinc-400">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Sarkari Karamchari platform, you accept and agree to be bound by these Terms and Conditions. If you do not agree, please do not utilize our civic grievance routing services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. User Conduct & Submissions</h2>
            <p>
              Citizens are solely responsible for the information they submit. You agree that:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All reported grievances reflect genuine civic issues (e.g., road, sanitation, water, electrical hazards).</li>
              <li>You will not submit misleading, abusive, defamatory, or politically malicious content.</li>
              <li>You will not abuse the automated AI transcriber with spam submissions.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. Platform Services & Escalations</h2>
            <p>
              Sarkari Karamchari acts as an automated routing agent. We provide the tools to dispatch complaints directly to government officers and trigger watchdog escalations.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>We do not guarantee the resolution timeline of any government department.</li>
              <li>Escalations to MLAs and higher authorities are driven by system timers and department response states.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. Modifications</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the platform constitutes agreement to the updated terms.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-white/5 text-xs text-zinc-600">
          <p>© 2026 Gen-Z Solutions. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}

'use client';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicy() {
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
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-bold">Sarkari Karamchari Platform</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm leading-relaxed text-zinc-400">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
            <p>
              We collect information to facilitate the resolution of civic grievances. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Profile Information:</strong> Name and email address retrieved securely via Google OAuth2 authentication.</li>
              <li><strong>Complaint Details:</strong> Raw text, transcripts of vernacular voice inputs, uploaded photos, and 6-digit postal PIN codes.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. How We Use Your Information</h2>
            <p>
              The collected information is used strictly to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Classify and route complaints to the appropriate administrative authorities.</li>
              <li>Notify and escalate complaints to local MLAs, HoDs, and CM Offices if resolution is delayed.</li>
              <li>Generate tracking timelines to keep citizens updated on progress.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. Data Integrity & Security</h2>
            <p>
              We prioritize data security:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Citizen authentication sessions are secured using HTTP-only cookies, protecting against unauthorized access.</li>
              <li>Credentials and database connection variables are isolated server-side and never exposed.</li>
              <li>Inputs are fully sanitized to protect against cross-site scripting (XSS) and injection attacks.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact our support team at:
              <br />
              <a href="mailto:sarkari.karamchari.official@gmail.com" className="text-primary hover:underline font-semibold">sarkari.karamchari.official@gmail.com</a>
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

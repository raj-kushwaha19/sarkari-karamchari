'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/Toast';
import StatusTimeline from '@/components/StatusTimeline';
import api from '@/lib/apiClient';
import { useAuth } from '@/lib/authContext';
import { Phone, Mail, AlertTriangle, CheckCircle, Send } from 'lucide-react';

export default function ComplaintDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [complaint, setComplaint]       = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMLAModal, setShowMLAModal] = useState(false);
  const [mlaPreview, setMlaPreview]     = useState<any>(null);
  const [mlaLookupLoading, setMlaLookupLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/complaints/${params.id}`);
        setComplaint(data);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to load details', 'error');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetch();
  }, [params.id, router, showToast]);

  const doAction = async (action: string) => {
    setActionLoading(true);
    try {
      const { data } = await api.post(`/complaints/${params.id}/action`, { action });
      setComplaint(data);
      if (action === 'followup')    showToast('Follow-up email sent to department!', 'success');
      if (action === 'resolve')     showToast('Complaint marked as resolved!', 'success');
      if (action === 'escalate_mla') { showToast('FINAL ESCALATION sent to MLA!', 'success'); setShowMLAModal(false); }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Look up MLA/MP preview before showing confirm modal
  const handleOpenMLAModal = async () => {
    setMlaLookupLoading(true);
    try {
      const { data } = await api.get(`/representatives?pinCode=${complaint.location.pinCode}`);
      setMlaPreview(data.data?.[0] || null);
      setShowMLAModal(true);
    } catch {
      setMlaPreview(null);
      setShowMLAModal(true);
    } finally {
      setMlaLookupLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-textsecondary">Loading complaint details...</div>;
  if (!complaint) return null;

  const isFinalPhase = complaint.escalationLevel >= 3;
  const hasMLAContact = complaint.mlaContact?.email;
  const daysOld = Math.round((Date.now() - new Date(complaint.createdAt).getTime()) / 86400000);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button onClick={() => router.back()} className="text-sm font-medium text-textsecondary hover:text-primary mb-6 flex items-center gap-1">
        ← Back
      </button>

      {/* ── FINAL PHASE BANNER ── */}
      {isFinalPhase && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl overflow-hidden border-2 border-red-500/50 bg-gradient-to-r from-red-950/40 to-orange-950/30"
        >
          <div className="flex items-center gap-3 bg-red-500/20 px-5 py-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse" />
            <span className="font-bold text-red-300 text-sm uppercase tracking-widest">Final Escalation Phase</span>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-red-200/80 mb-4">
              This complaint has been active for <strong className="text-red-300">{daysOld} days</strong> with no resolution from the department. 
              It has been escalated to the highest authority.
            </p>
            {hasMLAContact && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-red-300 uppercase tracking-wider mb-3">
                  Complaint Sent To
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-bold">
                    {complaint.mlaContact.type}
                  </span>
                  <span className="text-sm font-semibold text-white">{complaint.mlaContact.name}</span>
                </div>
                <p className="text-xs text-red-300/70">{complaint.mlaContact.district}</p>
                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                  <a href={`mailto:${complaint.mlaContact.email}`}
                    className="flex items-center gap-2 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-2 rounded-lg transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                    {complaint.mlaContact.email}
                  </a>
                  {complaint.mlaContact.phone && (
                    <a href={`tel:${complaint.mlaContact.phone}`}
                      className="flex items-center gap-2 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-2 rounded-lg transition-colors">
                      <Phone className="w-3.5 h-3.5" />
                      {complaint.mlaContact.phone}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-textprimary mb-1">{complaint.department}</h1>
          {complaint.complaintCode && (
            <div className="inline-flex items-center gap-2 mt-2 px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-xs sm:text-sm font-black tracking-widest shadow-sm">
              <span className="opacity-70">CODE:</span>
              <span className="select-all">{complaint.complaintCode}</span>
            </div>
          )}
          <p className="text-sm text-textsecondary mt-3">PIN: {complaint.location.pinCode}
            {complaint.location.exactAddress && <> · {complaint.location.exactAddress.substring(0, 50)}</>}
          </p>
          <p className="text-xs text-textsecondary mt-1">
            Filed: {new Date(complaint.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {' · '}<span className="font-semibold">{daysOld} day{daysOld !== 1 ? 's' : ''} old</span>
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${
          isFinalPhase ? 'bg-red-500/20 text-red-400 border-red-500/40' :
          complaint.status === 'resolved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
          complaint.status === 'hq_escalated' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
          'bg-primary/10 text-primary border-primary/20'
         }`}>
          {isFinalPhase ? 'Final Phase' : complaint.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Complaint Details + Email Draft */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-textsecondary mb-2 uppercase tracking-wider">Your Complaint</h3>
        <p className="text-textprimary text-sm leading-relaxed whitespace-pre-wrap">{complaint.description.raw}</p>
        
        {complaint.description.aiFormatted && (
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-sm font-bold text-textprimary mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              Official Email Sent to Department
            </h3>
            <div className="bg-white dark:bg-[#0A0A10] rounded-xl overflow-hidden border border-border shadow-sm">
              <div className="bg-slate-50 dark:bg-white/[0.02] border-b border-border p-4 space-y-2">
                {complaint.description.aiFormatted.split('\n').filter((l: string) => l.startsWith('From:') || l.startsWith('To:') || l.startsWith('Subject:')).map((line: string, i: number) => {
                  if (line.startsWith('From:')) return <div key={i} className="text-xs sm:text-sm flex gap-2"><span className="text-slate-500 dark:text-slate-400 w-14 font-medium">From:</span><span className="font-semibold text-slate-900 dark:text-slate-200">{line.replace('From:', '').trim()}</span></div>;
                  if (line.startsWith('To:'))   return <div key={i} className="text-xs sm:text-sm flex gap-2"><span className="text-slate-500 dark:text-slate-400 w-14 font-medium">To:</span><span className="font-semibold text-blue-600 dark:text-blue-400">{line.replace('To:', '').trim()}</span></div>;
                  if (line.startsWith('Subject:')) return <div key={i} className="text-xs sm:text-sm flex gap-2 mt-2 pt-2 border-t border-border/40"><span className="text-slate-500 dark:text-slate-400 w-14 font-bold">Subject:</span><span className="font-bold text-slate-900 dark:text-slate-200">{line.replace('Subject:', '').trim()}</span></div>;
                  return null;
                })}
              </div>
              <div className="p-6 text-sm sm:text-base text-slate-800 dark:text-slate-100 space-y-4 bg-white dark:bg-[#0f172a] leading-relaxed font-normal">
                {complaint.description.aiFormatted.split('\n').filter((l: string) => !l.startsWith('From:') && !l.startsWith('To:') && !l.startsWith('Subject:')).map((line: string, i: number) => {
                  if (line.trim() === '') return <div key={i} className="h-2" />;
                  if (line.startsWith('Dear') || line.startsWith('Sincerely') || line.startsWith('Thank you') || line.startsWith('Regards')) return <p key={i} className="font-bold text-slate-900 dark:text-white">{line}</p>;
                  return <p key={i} className="leading-relaxed">{line}</p>;
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Tracking */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-textprimary mb-4">Live Tracking</h2>
        <StatusTimeline
          timeline={complaint.timeline}
          status={complaint.status}
          escalationLevel={complaint.escalationLevel || 0}
        />
      </div>

      {/* Action Buttons */}
      {user?.role !== 'admin' && complaint.status !== 'resolved' && complaint.status !== 'rejected' && (
        <div className="flex flex-col gap-3 mt-4">

          {/* Level 1: Follow-Up (if not yet sent) */}
          {complaint.escalationLevel < 1 && (
            <motion.button
              id="followup-btn"
              onClick={() => doAction('followup')}
              disabled={actionLoading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md min-h-[52px] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {actionLoading ? 'Sending...' : 'Nudge Department (Send Follow-Up)'}
            </motion.button>
          )}

          {/* Level 2: Final MLA Escalation */}
          {complaint.escalationLevel >= 1 && complaint.escalationLevel < 3 && (
            <motion.button
              id="mla-escalate-btn"
              onClick={handleOpenMLAModal}
              disabled={actionLoading || mlaLookupLoading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-4 rounded-xl shadow-md min-h-[52px] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              {mlaLookupLoading ? 'Looking up your MLA...' : 'Escalate to MLA / Minister (Final Step)'}
            </motion.button>
          )}

          {/* Mark Resolved */}
          <motion.button
            id="resolve-btn"
            onClick={() => doAction('resolve')}
            disabled={actionLoading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full border border-border text-textsecondary font-medium py-3 rounded-xl min-h-[48px] hover:bg-surface2 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Mark as Resolved (Department replied)
          </motion.button>
        </div>
      )}

      {/* ── MLA CONFIRM MODAL ── */}
      <AnimatePresence>
        {showMLAModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface rounded-2xl p-6 max-w-md w-full border-2 border-red-500/40 shadow-2xl shadow-red-900/30"
            >
              <div className="text-center mb-5 flex flex-col items-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-2 animate-pulse" />
                <h2 className="text-xl font-extrabold text-textprimary mt-3">Final Escalation</h2>
                <p className="text-sm text-textsecondary mt-2">
                  Department ne {daysOld} dino se koi jawab nahi diya. Aap apna complaint seedha MLA ko bhejne wale hain.
                </p>
              </div>

              {mlaPreview ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5">
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Jisko email jayega:</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full font-bold">
                      {mlaPreview.type}
                    </span>
                    <span className="font-bold text-textprimary">{mlaPreview.name || 'Incumbent Representative'}</span>
                  </div>
                  <p className="text-xs text-textsecondary mb-3">{mlaPreview.district} · {mlaPreview.state}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-red-300">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="break-all">{mlaPreview.officeEmail || mlaPreview.email}</span>
                    </div>
                    {mlaPreview.officePhone || mlaPreview.phone ? (
                      <div className="flex items-center gap-2 text-xs text-red-300">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{mlaPreview.officePhone || mlaPreview.phone}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="bg-surface2 rounded-xl p-4 mb-5 text-center">
                  <p className="text-sm text-textsecondary">Aapke pincode ke liye MLA/MP ka data DB me hai. Complaint pgportal.gov.in pe bhi jayegi.</p>
                </div>
              )}

              <p className="text-xs text-textsecondary text-center mb-5">
                Ek professional email jayega jisme complaint ki poori history, department ki koi response na dene ki baat, aur aapka exact address hoga.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowMLAModal(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-textsecondary hover:bg-surface2 transition-all font-medium text-sm"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={() => doAction('escalate_mla')}
                  disabled={actionLoading}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold text-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Sending...' : 'Haan, Bhejo Email'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

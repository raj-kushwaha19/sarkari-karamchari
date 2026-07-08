'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertCircle, CheckCircle2, Clock, ChevronDown, ChevronUp, FileText, Mail } from 'lucide-react';
import axios from 'axios';

const STATUS_COLOR: Record<string, string> = {
  resolved:            'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  department_received: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  hq_escalated:        'bg-orange-500/10 text-orange-400 border-orange-500/30',
  submitted:           'bg-primary/10 text-primary border-primary/30',
};

const renderStageIcon = (status: string) => {
  switch (status) {
    case 'submitted': return <FileText className="w-5 h-5 text-primary" />;
    case 'department_received': return <Mail className="w-5 h-5 text-blue-400" />;
    case 'hq_escalated': return <AlertCircle className="w-5 h-5 text-orange-400" />;
    case 'resolved': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    default: return <FileText className="w-5 h-5 text-primary" />;
  }
};

export default function TrackPage() {
  const [code, setCode]           = useState('');
  const [result, setResult]       = useState<any>(null);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const handleSearch = async () => {
    const clean = code.replace(/\s/g, '').toUpperCase();
    if (clean.length < 16) {
      setError('Please enter a valid 16-character complaint code.');
      return;
    }
    setError('');
    setResult(null);
    setLoading(true);
    try {
      let BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      if (BACKEND.endsWith('/api/')) {
        BACKEND = BACKEND.slice(0, -1);
      } else if (!BACKEND.endsWith('/api')) {
        BACKEND = `${BACKEND}/api`;
      }
      const { data } = await axios.get(`${BACKEND}/track/${clean}`);
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Complaint not found. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const formatCode = (v: string) => {
    const raw = v.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 16);
    return raw.replace(/(.{4})/g, '$1-').replace(/-$/, '');
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-start px-4 pt-12 pb-20 bg-gradient-to-br from-bg via-surface to-surface2">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 max-w-lg"
      >
        <Search className="w-12 h-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-textprimary mb-2">Track Your Complaint</h1>
        <p className="text-textsecondary text-sm leading-relaxed">
          Enter your 16-character complaint code to see the current status, timeline, and which authority is handling it.
          <br />
          <span className="text-primary font-medium">No login required.</span>
        </p>
      </motion.div>

      {/* Search Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full max-w-lg"
      >
        <div className="glass-card rounded-2xl p-6 mb-4">
          <label className="block text-sm font-semibold text-textprimary mb-3">
            Complaint Code
          </label>
          <div className="flex gap-3">
            <input
              id="complaint-code-input"
              type="text"
              value={code}
              onChange={e => setCode(formatCode(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="A3X9-K2MQ-T7PL-W4NR"
              maxLength={19}
              className="flex-1 p-3 rounded-xl border border-border bg-surface text-textprimary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 tracking-widest uppercase"
            />
            <motion.button
              id="track-search-btn"
              onClick={handleSearch}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="bg-primary text-white px-5 rounded-xl font-bold disabled:opacity-50 flex items-center gap-2 min-w-[56px]"
            >
              {loading ? (
                <span className="animate-spin">⟳</span>
              ) : (
                <Search className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </div>

        {/* Example */}
        <p className="text-center text-xs text-textsecondary">
          Example code format: <span className="font-mono text-primary">A3X9-K2MQ-T7PL-W4NR</span>
          <br />You can find your code in the confirmation message after filing a complaint.
        </p>
      </motion.div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-lg mt-8 space-y-4"
          >
            {/* Code Header */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-textsecondary uppercase tracking-wider mb-1">Complaint Code</p>
                  <p className="font-mono font-bold text-lg text-primary tracking-widest">{result.complaintCode}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${STATUS_COLOR[result.status] || 'bg-primary/10 text-primary border-primary/20'}`}>
                  {result.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{renderStageIcon(result.status)}</div>
                  <div>
                    <p className="text-xs text-textsecondary font-medium uppercase tracking-wider">Current Stage</p>
                    <p className="text-sm font-semibold text-textprimary">{result.currentStage}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-textsecondary uppercase tracking-wider mb-1">Department</p>
                    <p className="text-sm font-semibold text-textprimary">{result.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-textsecondary uppercase tracking-wider mb-1">Pincode</p>
                    <p className="text-sm font-semibold text-textprimary">{result.pinCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-textsecondary uppercase tracking-wider mb-1">Filed On</p>
                    <p className="text-sm font-semibold text-textprimary">
                      {new Date(result.filedOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-textsecondary uppercase tracking-wider mb-1">Last Update</p>
                    <p className="text-sm font-semibold text-textprimary">
                      {new Date(result.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Issue Preview (sanitized) */}
            <div className="glass-card rounded-2xl p-5">
              <p className="text-xs text-textsecondary uppercase tracking-wider mb-2">Issue Reported</p>
              <p className="text-sm text-textprimary leading-relaxed">
                {result.issue?.substring(0, 200)}{result.issue?.length > 200 ? '...' : ''}
              </p>
            </div>

            {/* MLA Contacted Badge */}
            {result.mlaContacted && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-400">Escalated to MLA / Minister</p>
                  <p className="text-xs text-red-300/70 mt-1">
                    {result.mlaContacted.type} — {result.mlaContacted.district}
                  </p>
                </div>
              </div>
            )}

            {/* Resolved badge */}
            {result.status === 'resolved' && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <p className="text-sm font-bold text-emerald-400">Complaint has been resolved!</p>
              </div>
            )}

            {/* Timeline Toggle */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowTimeline(!showTimeline)}
                className="w-full flex items-center justify-between p-5 text-sm font-semibold text-textprimary hover:bg-surface2 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  View Full Timeline ({result.timeline?.length || 0} events)
                </span>
                {showTimeline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <AnimatePresence>
                {showTimeline && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-3 border-t border-border">
                      {(result.timeline || []).map((t: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 pt-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-textprimary">{t.note}</p>
                            <p className="text-xs text-textsecondary mt-0.5">
                              {new Date(t.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Note about privacy */}
            <p className="text-center text-xs text-textsecondary px-4">
              Note: Personal details (name, email, contact info) are never shown on this public page. Only the complaint owner can escalate or modify the complaint.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

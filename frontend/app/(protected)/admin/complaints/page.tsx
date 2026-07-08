'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/components/Toast';
import api from '@/lib/apiClient';
import { Search, Mail, User, MapPin, Calendar, Clipboard, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

export default function AdminComplaints() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/admin/complaints');
        setComplaints(data);
        setFiltered(data);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to load complaints', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'admin') fetch();
  }, [user, showToast]);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const result = complaints.filter(c => 
      c.complaintCode?.toLowerCase().includes(term) ||
      c.department?.toLowerCase().includes(term) ||
      c.userRef?.name?.toLowerCase().includes(term) ||
      c.userRef?.email?.toLowerCase().includes(term) ||
      c.location?.pinCode?.includes(term)
    );
    setFiltered(result);
  }, [searchTerm, complaints]);

  const toggleSort = () => {
    const nextSort = sortBy === 'date' ? 'status' : 'date';
    setSortBy(nextSort);
    const sorted = [...filtered].sort((a, b) => {
      if (nextSort === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return a.status.localeCompare(b.status);
      }
    });
    setFiltered(sorted);
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied. Admins only.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-textprimary tracking-tight">Citizen Complaints Database</h1>
          <p className="text-textsecondary text-sm mt-1">
            Total {complaints.length} complaints filed across India. Read-only records with user details.
          </p>
        </div>

        {/* Search & Sort */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-textsecondary absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search code, user, dept..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-textprimary text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            onClick={toggleSort}
            className="px-4 py-2.5 rounded-xl border border-border bg-surface text-textsecondary hover:text-primary transition-colors text-xs font-semibold flex items-center gap-1.5"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort by {sortBy === 'date' ? 'Date' : 'Status'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 4].map(i => <div key={i} className="h-32 glass-card rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-3xl">
          <p className="text-textsecondary font-medium text-sm">No complaints match your search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* List of complaints */}
          <div className="lg:col-span-2 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {filtered.map(c => (
              <motion.div
                layoutId={`card-${c._id}`}
                key={c._id}
                onClick={() => setSelectedComplaint(c)}
                className={`glass-card rounded-2xl p-4 cursor-pointer border-l-4 transition-all hover:bg-surface2 ${
                  selectedComplaint?._id === c._id ? 'border-primary ring-2 ring-primary/20 bg-surface2' : 'border-border'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div>
                    <span className="font-mono font-bold text-xs text-primary block tracking-wider mb-1">
                      {c.complaintCode || 'NO-CODE'}
                    </span>
                    <h3 className="font-bold text-textprimary text-sm leading-tight">{c.department}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    c.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    c.status === 'hq_escalated' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                    'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* User Details Preview */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-textsecondary mt-3 pt-3 border-t border-border/40">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {c.userRef?.name || 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {c.userRef?.email || 'No email'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    PIN: {c.location?.pinCode}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedComplaint ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card rounded-3xl p-5 sticky top-6 border border-border"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] text-textsecondary uppercase tracking-wider mb-1">Complaint Code</p>
                      <p className="font-mono font-bold text-sm text-primary tracking-widest">{selectedComplaint.complaintCode}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedComplaint(null)}
                      className="text-xs text-textsecondary hover:text-textprimary"
                    >
                      Close ✕
                    </button>
                  </div>

                  {/* Citizen Card info */}
                  <div className="bg-surface2 rounded-2xl p-4 border border-border/40 space-y-2.5 mb-5">
                    <p className="text-xs font-bold text-textsecondary uppercase tracking-wider mb-1">Citizen Details</p>
                    <div className="flex items-center gap-2 text-xs">
                      <User className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-semibold text-textprimary">{selectedComplaint.userRef?.name || 'Citizen'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-textsecondary select-all">{selectedComplaint.userRef?.email || 'Not Provided'}</span>
                    </div>
                    {selectedComplaint.location?.exactAddress && (
                      <div className="flex items-start gap-2 text-xs">
                        <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-textsecondary">{selectedComplaint.location.exactAddress}</span>
                      </div>
                    )}
                  </div>

                  {/* Raw Issue */}
                  <div className="mb-4">
                    <p className="text-[10px] text-textsecondary uppercase tracking-wider mb-1">Citizen Report</p>
                    <div className="p-3 bg-surface rounded-xl text-xs text-textprimary leading-relaxed max-h-40 overflow-y-auto border border-border/50">
                      {selectedComplaint.description?.raw}
                    </div>
                  </div>

                  {/* Actions & Detail page link */}
                  <div className="space-y-2 pt-2">
                    <Link href={`/complaint/${selectedComplaint._id}`} className="block">
                      <button className="w-full bg-primary text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm">
                        <Clipboard className="w-3.5 h-3.5" />
                        View Live Timeline & Actions
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <div className="glass-card rounded-3xl p-8 text-center border border-dashed border-border/80 h-64 flex flex-col items-center justify-center text-textsecondary">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="text-xs font-medium">Select a complaint from the list to view complete citizen profiles, exact addresses, and raw logs.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}
    </div>
  );
}

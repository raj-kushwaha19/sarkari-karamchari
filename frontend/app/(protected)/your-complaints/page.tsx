'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import ComplaintCard from '@/components/ComplaintCard';
import api from '@/lib/apiClient';
import { FolderOpen } from 'lucide-react';

export default function YourComplaints() {
  const { showToast } = useToast();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/complaints');
        setComplaints(data);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to load complaints', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [showToast]);

  return (
    <div className="px-4 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 flex-wrap gap-3"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-textprimary mb-1"> Your Complaints</h1>
          <p className="text-textsecondary text-sm">Track the status of your reported issues</p>
        </div>
        <Link href="/dashboard">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-primary text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all min-h-[44px]"
          >
            + File New Complaint
          </motion.button>
        </Link>
      </motion.div>

      {/* Complaints grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card rounded-2xl h-40 animate-pulse bg-surface/50" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card text-center py-20 rounded-3xl"
        >
          <FolderOpen className="w-16 h-16 text-textsecondary/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-textprimary mb-2">No complaints yet</h2>
          <p className="text-textsecondary mb-8 max-w-sm mx-auto">Everything looks good! If you face any issues, our AI is ready to help you report them automatically.</p>
          <Link href="/dashboard">
            <button className="bg-primary text-white font-semibold px-8 py-4 rounded-xl shadow-xl shadow-primary/20 min-h-[44px]">File Your First Complaint</button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {complaints.map((c, i) => (
            <ComplaintCard key={c._id} complaint={c} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

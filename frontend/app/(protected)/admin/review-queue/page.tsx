'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/components/Toast';
import api from '@/lib/apiClient';

export default function AdminQueue() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/admin/review-queue');
        setItems(data);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to load queue', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'admin') fetch();
  }, [user, showToast]);

  const handleAction = async (id: string, type: 'Representative' | 'DepartmentDirectory', action: 'approve' | 'reject') => {
    try {
      await api.patch(`/admin/review-queue/${id}/${action}`, { type });
      setItems(items.filter(i => i._id !== id));
      showToast(`Item ${action}d successfully`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error');
    }
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied. Admins only.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-extrabold text-textprimary mb-6">Data Freshness Review Queue</h1>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 glass-card rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <div className="text-4xl mb-3"></div>
          <p className="text-textsecondary font-medium">Queue is empty. All data is verified!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={item._id}
              className="glass-card rounded-xl p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-l-4 border-accent"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface2 text-textsecondary uppercase tracking-wider">
                    {item.constituency ? 'Representative' : 'Department'}
                  </span>
                  <span className="text-xs text-textsecondary">via {new URL(item.sourceUrl).hostname}</span>
                </div>
                <h3 className="font-bold text-textprimary">{item.name}</h3>
                <p className="text-sm text-textsecondary mt-1">
                  {item.constituency ? `Constituency: ${item.constituency}` : `Jurisdiction: ${item.jurisdiction}`}
                </p>
                <div className="flex gap-4 mt-2 text-xs text-textsecondary">
                  {item.email && <span> {item.email}</span>}
                  {item.officialEmail && <span> {item.officialEmail}</span>}
                  {item.phone && <span> {item.phone}</span>}
                  {item.pinCodes && <span> {item.pinCodes.length} PINs</span>}
                </div>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleAction(item._id, item.constituency ? 'Representative' : 'DepartmentDirectory', 'reject')}
                  className="flex-1 md:flex-none px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium text-sm transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction(item._id, item.constituency ? 'Representative' : 'DepartmentDirectory', 'approve')}
                  className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium text-sm transition-colors shadow-sm"
                >
                  Approve
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/components/Toast';
import api from '@/lib/apiClient';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, Trash2, Edit2, Check, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const router = useRouter();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [formData, setFormData] = useState({ tag: 'Home', fullAddress: '', pincode: '', isDefault: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data);
        setAddresses(res.data.addresses || []);
      })
      .catch(() => {
        router.push('/');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let res;
      if (editingId) {
        res = await api.put(`/auth/addresses/${editingId}`, formData);
      } else {
        res = await api.post('/auth/addresses', formData);
      }
      setAddresses(res.data.addresses);
      setIsModalOpen(false);
      showToast(editingId ? 'Address Updated!' : 'Address Added!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await api.delete(`/auth/addresses/${id}`);
      setAddresses(res.data.addresses);
      showToast('Address Deleted!', 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const setAsDefault = async (id: string) => {
    try {
      const res = await api.put(`/auth/addresses/${id}`, { isDefault: true });
      setAddresses(res.data.addresses);
      showToast('Default address updated', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openModal = (addr?: any) => {
    if (addr) {
      setEditingId(addr._id);
      setFormData({ tag: addr.tag, fullAddress: addr.fullAddress, pincode: addr.pincode, isDefault: addr.isDefault });
    } else {
      setEditingId(null);
      setFormData({ tag: 'Home', fullAddress: '', pincode: '', isDefault: addresses.length === 0 });
    }
    setIsModalOpen(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-textsecondary animate-pulse">Loading profile...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen pb-24 bg-bg">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 flex items-center gap-4"
        >
          <div className="h-16 w-16 bg-primary/20 text-primary rounded-full flex items-center justify-center text-2xl font-black shadow-inner">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-textprimary">{user.name}</h2>
            <p className="text-textsecondary text-sm">{user.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
              {user.role} Account
            </span>
          </div>
        </motion.div>

        {/* Address Book Panel */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-textprimary">Address Book</h3>
            <button
              onClick={() => openModal()}
              className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 bg-surface border border-border px-3.5 py-2 rounded-xl shadow-sm hover:shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Add Address
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr, i) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={addr._id}
                className={`p-5 rounded-2xl border-2 transition-all relative flex flex-col justify-between ${
                  addr.isDefault 
                    ? 'border-primary bg-surface shadow-md' 
                    : 'border-border bg-surface/50 hover:bg-surface'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                      addr.tag === 'Home' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                      addr.tag === 'Office' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                      'bg-slate-500/10 text-slate-600 border-slate-500/20'
                    }`}>
                      {addr.tag}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Star className="w-3 h-3 fill-primary" /> Default
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium text-textprimary leading-relaxed break-words pr-2 min-h-[40px]">
                    {addr.fullAddress}
                  </p>
                  <p className="text-xs font-mono text-textsecondary mt-2">
                    PIN: {addr.pincode}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border flex justify-between items-center">
                  {!addr.isDefault ? (
                    <button
                      onClick={() => setAsDefault(addr._id)}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      Set as Default
                    </button>
                  ) : <div />}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(addr)}
                      className="p-1.5 rounded-lg border border-border text-textsecondary hover:text-textprimary hover:bg-surface2 transition-all"
                      title="Edit address"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(addr._id)}
                      className="p-1.5 rounded-lg border border-border text-danger hover:bg-danger/10 hover:border-danger/20 transition-all"
                      title="Delete address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {addresses.length === 0 && (
              <div className="col-span-1 md:col-span-2 text-center p-8 bg-surface/50 rounded-2xl border-2 border-dashed border-border/80 flex flex-col items-center justify-center gap-2">
                <MapPin className="w-8 h-8 text-textsecondary" />
                <p className="text-textsecondary text-sm font-semibold">No saved addresses found.</p>
                <button
                  onClick={() => openModal()}
                  className="mt-1 text-xs text-primary font-extrabold hover:underline"
                >
                  Add your first address to start filing.
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />

      {/* Address Edit/Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-3xl w-full max-w-md p-6 relative shadow-2xl border border-border"
            >
              <h3 className="text-lg font-bold text-textprimary mb-4">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h3>
              
              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-textsecondary uppercase tracking-wider mb-2">
                    Save Address As
                  </label>
                  <div className="flex gap-2">
                    {['Home', 'Office', 'Other'].map(tag => (
                      <button 
                        key={tag} type="button" 
                        onClick={() => setFormData({...formData, tag})}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-colors ${
                          formData.tag === tag 
                            ? 'bg-primary border-primary text-white shadow-sm' 
                            : 'border-border text-textsecondary hover:bg-surface2'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-textsecondary uppercase tracking-wider mb-2">
                    Full Address (House No, Street, Area)
                  </label>
                  <textarea 
                    required 
                    rows={3}
                    value={formData.fullAddress}
                    onChange={e => setFormData({...formData, fullAddress: e.target.value})}
                    placeholder="e.g. Flat 402, Sunshine Apts, MG Road..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-textprimary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-textsecondary uppercase tracking-wider mb-2">
                    Pincode (6-Digits)
                  </label>
                  <input 
                    type="text" 
                    required 
                    pattern="[0-9]{6}"
                    value={formData.pincode}
                    onChange={e => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                    placeholder="e.g. 110001"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-textprimary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-surface2 text-textsecondary font-bold rounded-xl border border-border hover:bg-border transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md text-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import api from '@/lib/apiClient';
import { useAuth } from '@/lib/authContext';

export default function Onboarding() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, refetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const nameInitialized = useRef(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    pincode: '',
    language: 'English',
  });

  useEffect(() => {
    if (user?.onboarded) {
      router.push('/dashboard');
    } else if (user && !nameInitialized.current) {
      // Set name only once — when user data first arrives from API
      nameInitialized.current = true;
      // Fallback to email prefix if name is somehow empty
      const displayName = user.name || user.email?.split('@')[0] || '';
      setFormData(prev => ({ ...prev, name: displayName }));
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.address.trim() || formData.pincode.length !== 6) {
      return showToast('Please enter your full address and a 6-digit PIN code', 'error');
    }

    setLoading(true);
    try {
      await api.put('/auth/onboarding', formData);
      await refetch(); // Re-fetch user to get updated onboarded status
      showToast('Profile updated successfully!', 'success');
      router.push('/dashboard');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [detecting, setDetecting] = useState(false);

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.address) {
            const pincode = data.address.postcode || '';
            const fullAddress = data.display_name || '';
            setFormData(prev => ({
              ...prev,
              address: fullAddress,
              pincode: pincode
            }));
            showToast('Location detected successfully!', 'success');
          } else {
            showToast('Could not resolve address details.', 'error');
          }
        } catch (err) {
          showToast('Failed to fetch address from coordinates.', 'error');
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        showToast(error.message || 'Permission denied to access location.', 'error');
        setDetecting(false);
      }
    );
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <div className="min-h-[80dvh] flex items-center justify-center p-4">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="glass-card max-w-md w-full p-8 rounded-3xl relative overflow-hidden"
        style={{ borderTop: '1px solid rgba(107, 127, 215, 0.45)' }}
      >
        {/* Decorative background blurs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/20 blur-3xl rounded-full pointer-events-none" />

        <motion.div variants={itemVariants} className="text-center mb-8 relative z-10">
          <div className="text-5xl mb-4">🏛️</div>
          <h1 className="text-2xl font-bold text-textprimary mb-2">Welcome to Sarkari Karamchari!</h1>
          <p className="text-sm text-textsecondary">
            Before we begin, please tell us a little bit about yourself so we can route your complaints accurately.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-textprimary mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Aapka pura naam"
              className="w-full p-3 rounded-xl border border-border bg-surface2 text-textprimary placeholder-textsecondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-textprimary">Full Address <span className="text-red-500">*</span></label>
              <button 
                type="button" 
                onClick={handleAutoDetect} 
                disabled={detecting}
                className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline disabled:opacity-50"
              >
                {detecting ? 'Detecting...' : 'Auto-Detect'}
              </button>
            </div>
            <textarea
              required
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="House No, Street, Area, City"
              className="w-full h-24 p-3 rounded-xl border border-border bg-surface2 text-textprimary placeholder-textsecondary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-textprimary mb-1">PIN Code <span className="text-red-500">*</span></label>
            <input
              required
              type="text"
              maxLength={6}
              value={formData.pincode}
              onChange={e => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
              placeholder="e.g. 110001"
              className="w-full p-3 rounded-xl border border-border bg-surface2 text-textprimary placeholder-textsecondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-textprimary mb-1">Preferred Language</label>
            <div className="flex gap-2 p-1 bg-surface2 rounded-xl">
              {['English', 'Hindi', 'Hinglish'].map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setFormData({ ...formData, language: lang })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.language === lang 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-textsecondary hover:text-primary'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !formData.address.trim() || formData.pincode.length !== 6}
            className="w-full py-4 mt-4 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white font-bold shadow-lg shadow-primary/30 disabled:opacity-50 disabled:shadow-none transition-all"
          >
            {loading ? 'Saving...' : 'Get Started '}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

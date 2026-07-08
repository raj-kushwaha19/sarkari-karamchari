'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import VoiceRecorder from '@/components/VoiceRecorder';
import api from '@/lib/apiClient';
import { Type, Mic, Camera, Sparkles, Loader2, Info } from 'lucide-react';

type InputTab = 'voice' | 'photo' | 'text';

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? '100%' : '-100%', opacity: 0 }),
};

export default function NewComplaint() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [tab, setTab] = useState<InputTab>('text');

  // Form state
  const [rawText, setRawText] = useState('');
  const [pinCode, setPinCode] = useState('');
  
  // Address State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  const [detecting, setDetecting] = useState(false);

  // Fetch addresses on mount
  useEffect(() => {
    api.get('/auth/me').then(res => {
      const userAddresses = res.data.addresses || [];
      setAddresses(userAddresses);
      const defaultAddr = userAddresses.find((a: any) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.fullAddress);
        setPinCode(defaultAddr.pincode);
      }
    }).catch(console.error);
  }, []);

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
            setSelectedAddress(fullAddress);
            setPinCode(pincode);
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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [editedEmail, setEditedEmail] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const next = () => { setDir(1); setStep(s => s + 1); };
  const prev = () => { setDir(-1); setStep(s => s - 1); };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.8);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    const compressedFile = new File([compressed], file.name, { type: 'image/jpeg' });
    setPhotoFile(compressedFile);
    setPhotoPreview(URL.createObjectURL(compressed));
  };

  const handleClassify = async () => {
    setAiLoading(true);
    try {
      let result;
      if (tab === 'photo' && photoFile) {
        const formData = new FormData();
        formData.append('image', photoFile);
        if (pinCode) formData.append('pinCode', pinCode);
        if (selectedAddress) formData.append('selectedAddress', selectedAddress);
        const { data } = await api.post('/ai/classify', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        result = data;
      } else {
        const { data } = await api.post('/ai/classify', { text: rawText, pinCode, selectedAddress });
        result = data;
      }
      setAiResult(result);
      setEditedEmail(result.formalEmail);
      next();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'AI classification failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!aiResult) return;
    setSubmitting(true);
    try {
      await api.post('/complaints', {
        department: aiResult.department,
        pinCode,
        exactAddress: selectedAddress,
        description: { raw: rawText || 'Submitted via photo/voice', aiFormatted: editedEmail },
      });
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60dvh] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="text-7xl mb-4"
          ></motion.div>
          <h2 className="text-2xl font-bold text-textprimary mb-2">Shikayat Submit Ho Gayi!</h2>
          <p className="text-textsecondary">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-2 rounded-full transition-all ${
            s === step ? 'w-8 bg-primary' : s < step ? 'w-4 bg-primary/50' : 'w-4 bg-border'
          }`} />
        ))}
      </div>

      <AnimatePresence mode="wait" custom={dir}>
        {step === 1 && (
          <motion.div
            key="step1"
            custom={dir}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-bold text-textprimary mb-6"> Apni Shikayat Batayein</h2>

            {/* Input tabs */}
            <div className="flex gap-2 mb-6 bg-surface2 p-1 rounded-xl">
              {(['text', 'voice', 'photo'] as InputTab[]).map(t => (
                <button
                  key={t}
                  id={`tab-${t}`}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex flex-col items-center justify-center gap-1 min-h-[56px] ${
                    tab === t ? 'bg-white text-primary shadow-sm' : 'text-textsecondary hover:text-primary'
                  }`}
                >
                  {t === 'text' ? <Type className="w-5 h-5" /> : t === 'voice' ? <Mic className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                  <span className="text-[10px] uppercase tracking-wider">{t}</span>
                </button>
              ))}
            </div>

            {tab === 'text' && (
              <textarea
                id="complaint-text"
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Apni shikayat yahan likhein... (Hindi ya English mein)"
                className="w-full h-40 p-4 rounded-xl border border-border bg-surface text-textprimary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            )}

            {tab === 'voice' && (
              <>
                <VoiceRecorder
                  onTranscript={t => setRawText(t)}
                  onError={msg => showToast(msg, 'error')}
                />
                {rawText && (
                  <textarea
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                    className="w-full h-32 p-4 rounded-xl border border-border bg-surface text-textprimary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 mt-4"
                  />
                )}
              </>
            )}

            {tab === 'photo' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors min-h-[160px] flex flex-col items-center justify-center gap-3"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="max-h-40 rounded-lg object-contain shadow-sm" />
                ) : (
                  <>
                    <div className="text-4xl text-gray-300">
                      <Camera className="w-12 h-12" />
                    </div>
                    <p className="text-textsecondary text-sm font-medium">Click or Drag Photo</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
              </div>
            )}

            {/* Address Selection */}
            <div className="mt-6 mb-2">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-textprimary">Location of Issue</label>
                <div className="flex gap-2 items-center">
                  <button 
                    type="button" 
                    onClick={handleAutoDetect} 
                    disabled={detecting}
                    className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    {detecting ? 'Detecting...' : 'Auto-Detect'}
                  </button>
                  <span className="text-border text-xs">|</span>
                  <button onClick={() => router.push('/profile')} className="text-xs text-primary font-medium hover:underline">Manage Addresses</button>
                </div>
              </div>
              
              {addresses.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={selectedAddress}
                    onChange={(e) => {
                      const addr = addresses.find(a => a.fullAddress === e.target.value);
                      setSelectedAddress(e.target.value);
                      if (addr) setPinCode(addr.pincode);
                    }}
                    className="w-full p-3 rounded-xl border border-border bg-surface text-textprimary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">-- Type address manually below --</option>
                    {addresses.map(a => (
                      <option key={a._id} value={a.fullAddress}>{a.tag}: {a.fullAddress.substring(0, 40)}...</option>
                    ))}
                  </select>
                  {!selectedAddress && (
                     <textarea
                      placeholder="Enter exact address manually..."
                      onChange={(e) => setSelectedAddress(e.target.value)}
                      className="w-full p-3 rounded-xl border border-border bg-surface text-textprimary text-sm"
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    placeholder="House No, Street, Area..."
                    value={selectedAddress}
                    onChange={(e) => setSelectedAddress(e.target.value)}
                    className="w-full p-3 rounded-xl border border-border bg-surface text-textprimary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[80px]"
                  />
                  <p className="text-xs text-textsecondary">Tip: Save addresses in your Profile for faster filing.</p>
                </div>
              )}
            </div>

            {/* PIN Code */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-textprimary mb-1">PIN Code (6 digits)</label>
              <input
                id="pin-code-input"
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={pinCode}
                onChange={e => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="e.g. 110001"
                className="w-full p-3 rounded-xl border border-border bg-surface text-textprimary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[44px]"
              />
            </div>

            <motion.button
              id="classify-btn"
              onClick={handleClassify}
              disabled={aiLoading || (!rawText.trim() && !photoFile) || pinCode.length !== 6}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-6 bg-primary text-white font-semibold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] transition-all"
            >
              {aiLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI is reading your complaint...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" /> Let AI Format →
                </span>
              )}
            </motion.button>
          </motion.div>
        )}

        {step === 2 && aiResult && (
          <motion.div
            key="step2"
            custom={dir}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-bold text-textprimary mb-6"> AI Preview</h2>

            <div className="space-y-4">
              <div className="glass-card rounded-xl p-4">
                <p className="text-xs text-textsecondary mb-1">Department</p>
                <p className="font-semibold text-textprimary">{aiResult.department}</p>
              </div>

              {aiResult.officialEmail && (
                <div className="glass-card rounded-xl p-4">
                  <p className="text-xs text-textsecondary mb-1">Official Email</p>
                  <p className="font-medium text-primary text-sm">{aiResult.officialEmail}</p>
                </div>
              )}

              <div className="glass-card rounded-xl p-4">
                <p className="text-xs text-textsecondary mb-1">Summary</p>
                <p className="text-sm text-textprimary">{aiResult.summary}</p>
              </div>

              {aiResult.confidence < 0.7 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700 flex gap-2 items-start">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>AI ko poora yakin nahi — please verify the department before submitting.</span>
                </div>
              )}

              <div>
                <p className="text-xs text-textsecondary mb-1">Formal Email Draft (edit if needed)</p>
                <textarea
                  id="formal-email-edit"
                  value={editedEmail}
                  onChange={e => setEditedEmail(e.target.value)}
                  className="w-full h-48 p-4 rounded-xl border border-border bg-surface text-textprimary text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={prev} className="flex-1 py-3 rounded-xl border border-border text-textsecondary font-medium min-h-[44px] hover:bg-surface2 transition-colors">← Back</button>
              <motion.button
                id="step2-next-btn"
                onClick={next}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold min-h-[44px]"
              >Aage Badho →</motion.button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            custom={dir}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-bold text-textprimary mb-6"> Confirm & Submit</h2>

            <div className="space-y-3 mb-6">
              <div className="glass-card rounded-xl p-4">
                <p className="text-xs text-textsecondary">Department</p>
                <p className="font-semibold text-textprimary">{aiResult?.department}</p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-xs text-textsecondary">PIN Code</p>
                <p className="font-semibold text-textprimary">{pinCode}</p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-xs text-textsecondary">Your Complaint</p>
                <p className="text-sm text-textprimary line-clamp-3">{rawText || 'Submitted via photo/voice'}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={prev} className="flex-1 py-3 rounded-xl border border-border text-textsecondary font-medium min-h-[44px] hover:bg-surface2 transition-colors">← Back</button>
              <motion.button
                id="submit-complaint-btn"
                onClick={handleSubmit}
                disabled={submitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-xl bg-secondary text-white font-bold min-h-[44px] disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : ' Submit Shikayat'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

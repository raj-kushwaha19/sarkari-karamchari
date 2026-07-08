'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/authContext';
import api from '@/lib/apiClient';
import { Mic, MicOff, Camera, X, MapPin, Loader2 } from 'lucide-react';

// Extend Window for webkitSpeechRecognition (non-standard)
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function FileComplaint() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  // States
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [interimText, setInterimText] = useState('');

  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Real Speech Recognition ──────────────────────────────────────────────
  const startRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Aapka browser voice input support nahi karta. Chrome try karein.', 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Choose language based on user's language preference
    const lang =
      user?.language === 'English' ? 'en-IN' :
      user?.language === 'Hindi'   ? 'hi-IN' :
      'hi-IN'; // default to Hindi-India

    recognition.lang = lang;
    recognition.continuous = true;        // keep listening until we stop it
    recognition.interimResults = true;    // show words as they are spoken
    recognition.maxAlternatives = 1;

    // Reset silence timer on each speech event
    const resetSilenceTimer = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        // 2.5 seconds of silence → auto-stop
        stopRecording();
      }, 2500);
    };

    recognition.onstart = () => {
      setIsRecording(true);
      setInterimText('');
      resetSilenceTimer();
    };

    recognition.onresult = (event: any) => {
      resetSilenceTimer(); // user is still speaking, reset silence timer

      let finalSegment = '';
      let interimSegment = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalSegment += transcript + ' ';
        } else {
          interimSegment += transcript;
        }
      }

      if (finalSegment) {
        setText(prev => {
          const trimmed = prev.trimEnd();
          return trimmed ? trimmed + ' ' + finalSegment : finalSegment;
        });
      }
      setInterimText(interimSegment);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'denied') {
        showToast('Microphone permission denied. Browser settings check karein.', 'error');
      } else if (event.error === 'no-speech') {
        // no-speech is handled by silence timer, ignore
      } else {
        showToast(`Voice error: ${event.error}`, 'error');
      }
      stopRecording();
    };

    recognition.onend = () => {
      // If still marked as recording (e.g. browser killed it), clean up
      setIsRecording(false);
      setInterimText('');
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    try {
      recognition.start();
    } catch (err) {
      showToast('Voice recognition start nahi ho pa raha.', 'error');
    }
  };

  const stopRecording = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setInterimText('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Photo ────────────────────────────────────────────────────────────────
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // ── Location / Submit flow ────────────────────────────────────────────────
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [manualPin, setManualPin] = useState('');
  const [locating, setLocating] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  useEffect(() => {
    api.get('/auth/me').then(res => {
      const userAddresses = res.data.addresses || [];
      setAddresses(userAddresses);
      const defaultAddr = userAddresses.find((a: any) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.fullAddress);
        setManualPin(defaultAddr.pincode);
      }
    }).catch(console.error);
  }, []);

  const handleInitialSubmit = () => {
    if (isRecording) stopRecording();
    if (!text.trim() && !photoFile) {
      return showToast('Kuch toh likhiye ya photo bhejiye!', 'error');
    }
    setShowLocationPrompt(true);
  };

  const detectLocation = () => {
    setLocating(true);
    if (!('geolocation' in navigator)) {
      showToast('Geolocation not supported by your browser.', 'error');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          let fetchedPin = '';
          try {
            const r1 = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=15&addressdetails=1`);
            const d1 = await r1.json();
            fetchedPin = d1?.address?.postcode || '';
          } catch (_) {}

          if (!fetchedPin || !/^\d{6}$/.test(fetchedPin)) {
            const r2 = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const d2 = await r2.json();
            fetchedPin = d2?.postcode || d2?.locality || '';
          }

          if (fetchedPin && /^\d{6}$/.test(fetchedPin)) {
            showToast(` Location detected! PIN: ${fetchedPin}`, 'success');
            proceedToSubmit(fetchedPin);
          } else {
            showToast('Could not detect exact PIN. Please enter manually.', 'error');
            setLocating(false);
          }
        } catch (e) {
          showToast('Failed to fetch location data. Enter PIN manually.', 'error');
          setLocating(false);
        }
      },
      () => {
        showToast('Location access denied. Please enter PIN manually.', 'error');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const proceedToSubmit = async (finalPin: string, exactAddress: string = '') => {
    setShowLocationPrompt(false);
    setLocating(false);
    setAiLoading(true);
    try {
      const formData = new FormData();
      if (photoFile) formData.append('image', photoFile);
      if (text) formData.append('text', text);
      formData.append('pinCode', finalPin);
      if (exactAddress) formData.append('selectedAddress', exactAddress);

      const { data: aiResult } = await api.post('/ai/classify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setAiLoading(false);
      setSubmitting(true);

      await api.post('/complaints', {
        department: aiResult.department,
        pinCode: finalPin,
        exactAddress: exactAddress || '',
        officialEmail: aiResult.officialEmail || '',
        description: { raw: text || 'Complaint from photo', aiFormatted: aiResult.formalEmail },
      });

      setSuccess(true);
      setTimeout(() => router.push('/your-complaints'), 2500);

    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
      setAiLoading(false);
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-[70dvh] flex items-center justify-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }} className="text-7xl mb-4"></motion.div>
          <h2 className="text-3xl font-bold text-textprimary mb-2">Complaint Registered!</h2>
          <p className="text-textsecondary">AI has forwarded your complaint to the concerned authority.</p>
        </motion.div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2">
          {user?.language === 'Hindi' ? 'Namaste' : 'Hi'}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-textsecondary text-lg">
          {user?.language === 'Hindi'
            ? 'Kya samasya aa rahi hai? Boliye, likhiye ya photo attach kijiye.'
            : user?.language === 'English'
            ? 'What issue are you facing? Speak, write, or attach a photo.'
            : 'Kya samasya aa rahi hai? Boliye, likhiye ya photo attach kijiye.'}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />

        {/* Integrated Text Area */}
        <div className={`relative z-10 bg-surface/80 backdrop-blur-md rounded-2xl border transition-all ${
          isRecording ? 'border-red-500/60 ring-2 ring-red-500/30' : 'border-border focus-within:ring-2 focus-within:ring-primary/40'
        }`}>
          <textarea
            value={text + (interimText ? (text ? ' ' : '') + interimText : '')}
            onChange={(e) => {
              // Only allow direct edits when not recording
              if (!isRecording) setText(e.target.value);
            }}
            readOnly={isRecording}
            placeholder={
              isRecording
                ? (user?.language === 'Hindi' ? '🎙️ Sun raha hoon... Boliye' : '🎙️ Listening... Please speak')
                : (user?.language === 'Hindi' ? 'Shikayat yahan type karein ya mic dabao...' : 'Type your complaint here or press mic...')
            }
            className="w-full min-h-[160px] p-6 bg-transparent text-textprimary placeholder:text-textsecondary/60 resize-none focus:outline-none text-lg"
          />

          {/* Interim text indicator */}
          <AnimatePresence>
            {isRecording && interimText && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute bottom-20 left-6 text-sm text-red-400/80 italic pointer-events-none"
              >
                {interimText}…
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Bar inside textarea */}
          <div className="absolute bottom-4 right-4 flex items-center gap-3">
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm font-medium"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {user?.language === 'Hindi' ? 'Sun raha hoon...' : 'Listening...'}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mic Button */}
            <motion.button
              onClick={isRecording ? stopRecording : startRecording}
              whileTap={{ scale: 0.9 }}
              animate={isRecording ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={isRecording ? { duration: 1.2, repeat: Infinity } : {}}
              title={isRecording ? 'Stop recording' : 'Start voice input'}
              className={`w-12 h-12 flex items-center justify-center rounded-full transition-all shadow-md ${
                isRecording
                  ? 'bg-red-500 text-white shadow-red-500/40 shadow-lg'
                  : 'bg-surface2 text-textprimary hover:bg-border hover:text-primary'
              }`}
            >
              {isRecording
                ? <MicOff className="w-5 h-5" />
                : <Mic className="w-5 h-5" />
              }
            </motion.button>

            {/* Camera Button */}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoSelect} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-surface2 text-textprimary hover:bg-border transition-all"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mic hint */}
        <AnimatePresence>
          {isRecording && (
            <motion.p
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center text-xs text-red-400 mt-2"
            >
              🎙️ {user?.language === 'Hindi'
                ? '2.5 sec chup rehne pe automatically band ho jayega'
                : 'Auto-stops after 2.5s of silence — tap mic to stop early'}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Photo Preview */}
        <AnimatePresence>
          {photoPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="relative z-10"
            >
              <div className="relative inline-block group">
                <img src={photoPreview} alt="Attached" className="h-24 w-24 object-cover rounded-xl border-2 border-border shadow-sm" style={{ width: '96px', height: '96px', minWidth: '96px' }} />
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <motion.button
          onClick={handleInitialSubmit}
          disabled={aiLoading || submitting || (!text.trim() && !photoFile)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full relative z-10 mt-6 bg-gradient-to-r from-primary to-primary-hover text-white font-bold py-4 rounded-xl shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[56px] text-lg flex items-center justify-center overflow-hidden"
        >
          {aiLoading || submitting ? (
            <span className="flex items-center gap-3 relative z-10">
              <Loader2 className="w-5 h-5 animate-spin" />
              {aiLoading
                ? (user?.language === 'English' ? 'AI is analyzing & routing...' : 'AI check kar raha hai...')
                : (user?.language === 'English' ? 'Dispatching to Authority...' : 'Authority ko bhej rahe hain...')}
            </span>
          ) : (
            <span className="relative z-10">
              {user?.language === 'English' ? 'Submit Complaint Automatically' : 'Submit Shikayat Automatically'}
            </span>
          )}

          {(aiLoading || submitting) && (
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </motion.button>

        <p className="text-center text-xs text-textsecondary mt-4 relative z-10">
          {user?.language === 'English'
            ? 'AI will automatically detect the problem, find the local authority, and email them on your behalf.'
            : 'AI automatically problem detect karke, local authority ko email bhej degi.'}
        </p>
      </motion.div>

      {/* Location Modal */}
      <AnimatePresence>
        {showLocationPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12121E] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden text-zinc-300"
            >
              <h3 className="text-xl font-bold text-white mb-2">Select Location</h3>
              <p className="text-xs text-zinc-400 mb-6">
                We need to know the location of the issue to find the correct local authority (MLA/Corporator).
              </p>

              {addresses.length > 0 && (
                <div className="mb-6 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Saved Addresses</span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {addresses.map((addr) => (
                      <button
                        key={addr._id}
                        onClick={() => {
                          setSelectedAddress(addr.fullAddress);
                          proceedToSubmit(addr.pincode, addr.fullAddress);
                        }}
                        className="w-full text-left p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all flex flex-col gap-0.5 group"
                      >
                        <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">{addr.tag}</span>
                        <span className="text-[11px] text-zinc-400 truncate">{addr.fullAddress}</span>
                        <span className="text-[9px] text-zinc-500 font-mono">PIN: {addr.pincode}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 py-2">
                    <div className="h-px bg-white/10 flex-1" />
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">OR</span>
                    <div className="h-px bg-white/10 flex-1" />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Use a New Address</span>

                <button
                  onClick={detectLocation}
                  disabled={locating}
                  className="w-full bg-primary/10 text-primary hover:bg-primary/20 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  {locating ? 'Detecting...' : 'Use My Current GPS Location'}
                </button>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={manualPin}
                    onChange={e => setManualPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit PIN Code"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => {
                      if (manualPin.length === 6) {
                        proceedToSubmit(manualPin, '');
                      } else {
                        showToast('Please enter a 6-digit PIN', 'error');
                      }
                    }}
                    disabled={manualPin.length !== 6}
                    className="bg-primary hover:bg-primary-hover text-white font-bold px-6 rounded-xl disabled:opacity-50 transition-all text-sm"
                  >
                    Confirm
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowLocationPrompt(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

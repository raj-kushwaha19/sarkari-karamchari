'use client';
import { motion } from 'framer-motion';
import { Mail, ShieldCheck, MapPin, Building } from 'lucide-react';

export default function ContactUs() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-3">
          Contact Us
        </h1>
        <p className="text-textsecondary text-lg">
          Have questions or feedback? We would love to hear from you.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Info Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-8 space-y-6"
        >
          <h3 className="text-xl font-bold text-textprimary mb-2">Platform Support</h3>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-textsecondary uppercase tracking-wider">Official Email</h4>
              <p className="text-sm font-semibold text-textprimary mt-0.5 break-all">
                sarkari.karamchari.official@gmail.com
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-textsecondary uppercase tracking-wider">Developer Agency</h4>
              <p className="text-sm font-semibold text-textprimary mt-0.5">
                Gen-Z Solutions
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-textsecondary uppercase tracking-wider">Operating Jurisdiction</h4>
              <p className="text-sm font-semibold text-textprimary mt-0.5">
                New Delhi, India
              </p>
            </div>
          </div>
        </motion.div>

        {/* Security Shield Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/5 blur-[60px] rounded-full pointer-events-none" />
          
          <div>
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-textprimary mb-3">Secure Communications</h3>
            <p className="text-textsecondary text-sm leading-relaxed mb-6">
              All complaints are securely classified and dispatched directly via encrypted SMTP servers. 
              We do not share your private onboarding address details with third parties.
            </p>
          </div>

          <p className="text-[11px] text-textsecondary">
            Response turnaround is usually within 24 business hours.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

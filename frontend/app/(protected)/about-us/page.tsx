'use client';
import { motion } from 'framer-motion';
import { Shield, Users, Trophy, Sparkles } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-3">
          About Sarkari Karamchari
        </h1>
        <p className="text-textsecondary text-lg max-w-2xl mx-auto">
          Empowering citizens through transparent, AI-driven civic grievance routing.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-textprimary mb-3">Our Mission</h3>
          <p className="text-textsecondary text-sm leading-relaxed">
            Sarkari Karamchari acts as a digital bridge between citizens and government mailrooms. 
            Our platform simplifies grievance submission by automatically identifying the correct department, 
            drafting a professional petition, and notifying authorities instantly.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-6">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-textprimary mb-3">AI Intelligence</h3>
          <p className="text-textsecondary text-sm leading-relaxed">
            By utilizing advanced LLMs, we parse raw inputs (voice, text, or photos) and structure them 
            into highly formal emails. This ensures government officers receive clean, actionable issues 
            without language barriers.
          </p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-3xl p-8 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
        <h3 className="text-2xl font-bold text-textprimary mb-4">Owned & Developed by Gen-Z Solutions</h3>
        <p className="text-textsecondary text-sm max-w-2xl mx-auto leading-relaxed mb-6">
          Sarkari Karamchari is conceptualized, designed, and maintained by Gen-Z Solutions. We are dedicated 
          to building modern, high-impact digital applications that solve real-world community challenges.
        </p>
        <div className="flex justify-center items-center gap-6 text-sm text-textsecondary">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>Dedicated Team</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-border" />
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" />
            <span>Civic Innovation</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

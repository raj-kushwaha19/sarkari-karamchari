'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const faqs: FaqItem[] = [
    {
      question: "How does the AI auto-routing system work?",
      answer: "When you submit a grievance (via voice record, photo, or typed text), our AI models analyze the content to extract key entities, classify the problem domain, identify your local municipal ward, and retrieve the correct officer's official contact email from our database of over 1,500+ government mailrooms."
    },
    {
      question: "How are emails dispatched to departments?",
      answer: "Once classified, the system automatically drafts a formal email petition detailing the civic issue. It is sent immediately using an official, secure SMTP channel (sarkari.karamchari.official@gmail.com). You receive a unique Complaint Code to track real-time status updates."
    },
    {
      question: "What is the Watchdog Auto-Escalation system?",
      answer: "If the local department does not respond or take action within 48 hours, our backend watchdog job automatically triggers an escalation node, routing the grievance email up to HQ levels or state commissioners, requesting priority resolution."
    },
    {
      question: "Is my private home address shared with authorities?",
      answer: "No. The system only includes the location of the reported issue (PIN code or area GPS coordinates) to ensure jurisdiction routing. Your onboarding home address details are kept fully encrypted in your secure profile and are not shared."
    },
    {
      question: "Can I submit complaints in regional languages?",
      answer: "Yes. Our AI models dynamically translate and interpret multiple regional languages (such as Hindi, Hinglish, etc.) and convert them into standard, formal English letters before emailing them to officials."
    }
  ];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-3">
          Frequently Asked Questions
        </h1>
        <p className="text-textsecondary text-lg">
          Answers to commonly asked questions about our AI civic platform.
        </p>
      </motion.div>

      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = activeIndex === index;
          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card rounded-2xl overflow-hidden border border-border transition-all"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full text-left p-6 flex items-center justify-between gap-4 font-bold text-textprimary hover:bg-white/[0.02] transition-colors"
              >
                <span className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                  {faq.question}
                </span>
                {isOpen ? <ChevronUp className="w-5 h-5 text-zinc-500 shrink-0" /> : <ChevronDown className="w-5 h-5 text-zinc-500 shrink-0" />}
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 text-sm text-textsecondary leading-relaxed border-t border-border/20">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

'use client';
import { motion } from 'framer-motion';
import { FileText, Mail, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

// The 5-stage tracking flow
const STAGES = [
  { key: 'submitted',           label: 'Filed',            icon: <FileText className="w-5 h-5" />, desc: 'Complaint submitted' },
  { key: 'department_received', label: 'Mail Sent',        icon: <Mail className="w-5 h-5" />, desc: 'Email dispatched to dept' },
  { key: 'followup',            label: 'Follow-Up',        icon: <RefreshCw className="w-5 h-5" />, desc: 'Follow-up sent (Day 4)' },
  { key: 'hq_escalated',        label: 'HQ Escalated',     icon: <AlertTriangle className="w-5 h-5" />, desc: 'Escalated to HQ/MLA (Day 9)' },
  { key: 'resolved',            label: 'Resolved',         icon: <CheckCircle2 className="w-5 h-5" />, desc: 'Issue resolved' },
];

const STATUS_ORDER = ['submitted', 'department_received', 'followup', 'hq_escalated', 'resolved'];

// Map backend statuses to our display stages
const normalizeStatus = (status: string, escalationLevel: number) => {
  if (status === 'resolved' || status === 'rejected') return 'resolved';
  if (status === 'hq_escalated') return 'hq_escalated';
  if (escalationLevel >= 1) return 'followup';
  if (status === 'department_received') return 'department_received';
  return 'submitted';
};

interface TimelineEntry {
  stage: string;
  timestamp: string;
  note: string;
}

interface Props {
  status: string;
  escalationLevel?: number;
  timeline: TimelineEntry[];
}

export default function StatusTimeline({ status, escalationLevel = 0, timeline }: Props) {
  const displayStatus = normalizeStatus(status, escalationLevel);
  const currentIndex = STATUS_ORDER.indexOf(displayStatus);

  // Get latest timeline entry notes
  const getNote = (stageKey: string) => {
    // Map stage keys to timeline stage values
    const match = timeline.filter(t => {
      if (stageKey === 'followup' && t.note?.includes('follow-up')) return true;
      if (stageKey === 'hq_escalated' && t.stage === 'hq_escalated') return true;
      if (stageKey === 'department_received' && t.stage === 'department_received') return true;
      if (stageKey === 'submitted' && t.stage === 'submitted') return true;
      if (stageKey === 'resolved' && t.stage === 'resolved') return true;
      return false;
    });
    return match[match.length - 1] || null;
  };

  return (
    <div className="w-full">
      {/* Mobile + Desktop: Vertical timeline */}
      <div className="flex flex-col gap-0">
        {STAGES.map((stage, i) => {
          const isCompleted = STATUS_ORDER.indexOf(stage.key) <= currentIndex;
          const isCurrent = stage.key === displayStatus;
          const entry = getNote(stage.key);
          const isLast = i === STAGES.length - 1;

          return (
            <div key={stage.key} className="flex items-stretch gap-4">
              {/* Left: dot + line */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1, type: 'spring' }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 border-2 transition-all ${
                    isCompleted
                      ? isCurrent
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30 ring-4 ring-primary/20'
                        : 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface2 border-border text-textsecondary'
                  }`}
                >
                  {isCurrent && !isCompleted ? (
                    <span className="animate-spin text-base">⟳</span>
                  ) : (
                    <span className={isCompleted ? '' : 'opacity-30'}>{stage.icon}</span>
                  )}
                </motion.div>
                {!isLast && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.1 + 0.05 }}
                    className={`w-0.5 flex-1 min-h-[32px] origin-top my-1 ${
                      STATUS_ORDER.indexOf(STAGES[i + 1].key) <= currentIndex
                        ? 'bg-primary'
                        : 'bg-border'
                    }`}
                  />
                )}
              </div>

              {/* Right: content */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold text-sm ${
                    isCompleted ? 'text-textprimary' : 'text-textsecondary'
                  }`}>
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium animate-pulse">
                      CURRENT
                    </span>
                  )}
                </div>
                <p className="text-xs text-textsecondary mb-1">{stage.desc}</p>

                {entry && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 bg-surface2 border border-border rounded-xl p-3"
                  >
                    <p className="text-xs text-textprimary leading-relaxed">{entry.note}</p>
                    <p className="text-[10px] text-textsecondary mt-1">
                      {new Date(entry.timestamp).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* What happens next */}
      {status !== 'resolved' && status !== 'rejected' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 bg-primary/5 border border-primary/20 rounded-xl p-4"
        >
          <p className="text-xs font-semibold text-primary mb-1">What happens next?</p>
          <p className="text-xs text-textsecondary leading-relaxed">
            {escalationLevel === 0
              ? 'Our AI watchdog monitors this complaint every 6 hours. If the department doesn\'t reply in 4 days, a strict follow-up email will be auto-sent on your behalf.'
              : escalationLevel === 1
              ? 'Follow-up email has been sent. If no response in 5 more days, your complaint will be auto-escalated to the Head of Department / MLA.'
              : escalationLevel === 2
              ? 'Escalated to HQ/MLA. If no response in 5 more days, this will be sent directly to the Ministry / CM Office.'
              : 'This complaint has been escalated to the highest level — the Ministry / CM Office.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}

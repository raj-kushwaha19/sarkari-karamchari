'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Complaint {
  _id: string;
  complaintCode?: string;
  department: string;
  status: string;
  description: { raw: string; aiFormatted: string };
  lastUpdatedAt: string;
  createdAt: string;
  userActionRequired: string;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-primary/10 text-primary',
  department_received: 'bg-accent/20 text-orange-700',
  hq_escalated: 'bg-orange-100 text-orange-700',
  resolved: 'bg-secondary/20 text-green-700',
  rejected: 'bg-danger/20 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  department_received: 'Dept. Received',
  hq_escalated: 'HQ Escalated',
  resolved: 'Resolved ',
  rejected: 'Rejected',
};

const isOverdue = (complaint: Complaint) => {
  return complaint.userActionRequired === 'needs_followup' || complaint.userActionRequired === 'needs_escalation';
};

export default function ComplaintCard({ complaint, index }: { complaint: Complaint; index: number }) {
  const overdue = isOverdue(complaint);
  const handleAction = async (action: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://sarkari-karamchari.onrender.com/api'}/complaints/${complaint._id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ y: -2 }}
    >
      <Link href={`/complaint/${complaint._id}`}>
        <div className={`glass-card rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md ${
          overdue ? 'border-l-4 border-l-danger' : ''
        }`}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="font-semibold text-textprimary text-sm line-clamp-1">{complaint.department}</span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[complaint.status] || 'bg-gray-100 text-gray-700'}`}>
              {STATUS_LABELS[complaint.status] || complaint.status}
            </span>
          </div>
          {complaint.complaintCode && (
            <div className="text-[10px] font-mono text-textsecondary tracking-wider mb-2">
              Code: {complaint.complaintCode}
            </div>
          )}

          <p className="text-xs text-textsecondary line-clamp-2 mb-3">
            {complaint.description.raw}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-textsecondary">
              {new Date(complaint.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            {overdue && (
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xs font-semibold text-danger bg-danger/10 px-2 py-0.5 rounded-full"
              >
                Action Required
              </motion.span>
            )}
          </div>

          {complaint.userActionRequired && complaint.userActionRequired !== 'none' && (
            <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 flex flex-col gap-2 relative z-20" onClick={e => e.stopPropagation()}>
              <p className="text-xs font-semibold text-red-800">
                {complaint.userActionRequired === 'needs_followup' 
                  ? "5 days passed! Did you get a reply?" 
                  : "Follow-up ignored! Escalate to Minister?"}
              </p>
              <div className="flex gap-2">
                {complaint.userActionRequired === 'needs_followup' && (
                  <button 
                    onClick={(e) => { e.preventDefault(); handleAction('resolve'); }}
                    className="flex-1 bg-green-500 text-white text-xs py-1.5 rounded-lg font-medium hover:bg-green-600 transition"
                  >
                    Yes, Resolved
                  </button>
                )}
                <button 
                  onClick={(e) => { e.preventDefault(); handleAction(complaint.userActionRequired === 'needs_followup' ? 'followup' : 'escalate'); }}
                  className="flex-1 bg-red-500 text-white text-xs py-1.5 rounded-lg font-medium hover:bg-red-600 transition"
                >
                  {complaint.userActionRequired === 'needs_followup' ? 'No, Send Follow-up' : 'Yes, Escalate Now'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

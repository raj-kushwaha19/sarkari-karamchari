'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/authContext';
import { useState, useEffect } from 'react';
import api from '@/lib/apiClient';
import { Shield, Bell, Building2, Sun, Moon } from 'lucide-react';

interface Notification {
  _id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  read: boolean;
  createdAt: string;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showBell, setShowBell] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Fetch all unread notifications from complaints
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/complaints');
        const allNotifs: Notification[] = [];
        data.forEach((c: any) => {
          if (c.notifications) {
            c.notifications
              .filter((n: Notification) => !n.read)
              .forEach((n: Notification) => allNotifs.push(n));
          }
        });
        setNotifications(allNotifs);
      } catch (_) {}
    };
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const TYPE_COLORS: Record<string, string> = {
    info: 'border-l-blue-400 bg-blue-500/10 text-white',
    warning: 'border-l-yellow-400 bg-yellow-500/10 text-white',
    success: 'border-l-green-400 bg-green-500/10 text-white',
    danger: 'border-l-red-500 bg-red-500/10 text-white',
  };

  const navLinks = [
    { href: '/dashboard', label: 'Home' },
    { href: '/your-complaints', label: 'Your Complaints' },
    { href: '/about-us', label: 'About Us' },
    { href: '/contact-us', label: 'Contact Us' },
    { href: '/faq', label: 'FAQ' },
    { href: '/profile', label: 'Profile' },
    ...(user.role === 'admin' ? [
      { href: '/admin/review-queue', label: 'Review Queue', icon: <Shield className="inline w-3.5 h-3.5 ml-1 text-primary" /> },
      { href: '/admin/complaints', label: 'All Complaints' }
    ] : []),
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="hidden md:flex fixed top-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border shadow-sm px-6 py-3 items-center justify-between"
    >
      <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-primary">
        <img src="/logo.svg" className="w-7 h-7" alt="Logo" /> <span>Sarkari Karamchari</span>
      </Link>

      <div className="flex items-center gap-6">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === link.href ? 'text-primary' : 'text-textsecondary'
            }`}
          >
            {link.label} {link.icon}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full bg-surface2 flex items-center justify-center hover:bg-border transition-all text-textsecondary hover:text-textprimary"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/*  Notification Bell */}
        <div className="relative">
          <button
            onClick={async () => {
              setShowBell(v => !v);
              if (!showBell && unreadCount > 0) {
                try {
                  await api.post('/complaints/notifications/read');
                  setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                } catch (e) {}
              }
            }}
            className="relative w-9 h-9 rounded-full bg-surface2 flex items-center justify-center hover:bg-border transition-all"
          >
            <Bell className="w-5 h-5 text-textsecondary" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
              >
                {unreadCount}
              </motion.span>
            )}
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {showBell && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute right-0 top-12 w-96 bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden z-50"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold text-textprimary flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</h3>
                  {unreadCount > 0 && <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-semibold">{unreadCount} new</span>}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-textsecondary text-sm py-8">No new notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n._id} className={`border-l-4 p-4 ${TYPE_COLORS[n.type] || TYPE_COLORS.info}`}>
                        <p className="text-sm text-textprimary leading-relaxed">{n.message}</p>
                        <p className="text-xs text-textsecondary mt-1">
                          {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-border">
                  <Link href="/your-complaints" onClick={() => setShowBell(false)} className="block text-center text-xs text-primary font-semibold hover:underline">
                    View all complaints →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="text-sm text-textsecondary hidden lg:block">{user.name}</span>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <button
          id="logout-btn"
          onClick={logout}
          className="text-sm text-danger hover:text-danger/80 font-medium transition-colors min-h-[44px] px-3"
        >
          Logout
        </button>
      </div>
    </motion.nav>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { FileText, ClipboardList, User } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: <FileText className="w-6 h-6" /> },
  { href: '/your-complaints', label: 'Complaints', icon: <ClipboardList className="w-6 h-6" /> },
  { href: '/profile', label: 'Profile', icon: <User className="w-6 h-6" /> },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border safe-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-safe">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={i}
              href={item.href}
              className={`flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center px-2 py-1 rounded-xl transition-all ${
                isActive ? 'text-primary' : 'text-textsecondary hover:text-primary'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

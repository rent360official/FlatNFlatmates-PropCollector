'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, ListOrdered, UserCheck } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  // Do not show on login page
  if (pathname === '/login') return null;

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: 'New Property',
      href: '/properties/new',
      icon: PlusCircle,
      isActive: pathname === '/properties/new',
      highlight: true,
    },
    {
      label: 'Properties',
      href: '/properties',
      icon: ListOrdered,
      isActive: pathname.startsWith('/properties') && pathname !== '/properties/new',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-lg pb-safe">
      <div className="grid h-16 grid-cols-3 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                item.isActive
                  ? 'text-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.highlight ? (
                <div className="flex h-10 w-10 -mt-3 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-600/30 text-white">
                  <Icon className="h-5 w-5" />
                </div>
              ) : (
                <Icon className={`h-5 w-5 ${item.isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              )}
              <span className={`text-[11px] ${item.highlight ? '-mt-0.5' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

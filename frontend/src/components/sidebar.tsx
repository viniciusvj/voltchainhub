'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  LayoutDashboard,
  TrendingUp,
  Cpu,
  ArrowLeftRight,
  User,
  Zap,
  Menu,
  X,
} from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/market', label: 'Marketplace', icon: TrendingUp },
  { href: '/devices', label: 'Dispositivos', icon: Cpu },
  { href: '/trades', label: 'Trades', icon: ArrowLeftRight },
  { href: '/profile', label: 'Perfil', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-volt-dark-800 border-r border-volt-dark-600 w-64">
      {/* Logo / Title */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-volt-dark-600">
        <Zap className="w-7 h-7 text-[#0066FF] fill-[#0066FF]" />
        <span className="text-lg font-bold text-white tracking-tight">
          VoltchainHub
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#0066FF]/15 text-[#0066FF] border border-[#0066FF]/30'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-volt-dark-700'
              }`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? 'text-[#0066FF]' : 'text-gray-500'
                }`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ConnectButton */}
      <div className="px-4 py-4 border-t border-volt-dark-600">
        <ConnectButton
          accountStatus="avatar"
          chainStatus="icon"
          showBalance={false}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile: Hamburger Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-volt-dark-800 border border-volt-dark-600 text-gray-300 hover:text-white"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Abrir menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile: Overlay Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile: Sliding Sidebar */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-40 h-full transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

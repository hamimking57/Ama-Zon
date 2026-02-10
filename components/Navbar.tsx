
import React from 'react';
import { LayoutDashboard, LogOut, ShieldCheck, PlusCircle, ArrowDownCircle } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}

export const BrandLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 80L50 20L80 80" stroke="url(#logo-grad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M30 85C40 92 60 92 70 85" stroke="#EAB308" strokeWidth="6" strokeLinecap="round" className="animate-pulse"/>
    <defs>
      <linearGradient id="logo-grad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FACC15"/>
        <stop offset="1" stopColor="#B45309"/>
      </linearGradient>
    </defs>
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigate, currentPage, onOpenDeposit, onOpenWithdraw }) => {
  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center cursor-pointer group" onClick={() => onNavigate('home')}>
            <div className="mr-3 transform group-hover:scale-110 transition-transform duration-300">
              <BrandLogo className="w-9 h-9 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-white">
              Ama<span className="text-gold-500">.zon</span>
            </span>
          </div>

          <div className="flex items-center space-x-6">
            {!user ? (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => onNavigate('login')}
                  className="text-sm font-bold text-slate-300 hover:text-white transition uppercase tracking-widest"
                >
                  Login
                </button>
                <button 
                  onClick={() => onNavigate('signup')}
                  className="px-4 py-2 bg-gold-500/10 border border-gold-500/50 rounded-lg text-gold-500 text-xs font-black uppercase tracking-widest hover:bg-gold-500 hover:text-black transition-all"
                >
                  Join
                </button>
              </div>
            ) : (
              <>
                <div className="hidden lg:flex items-center space-x-6 mr-4">
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Liquid Balance</span>
                    <span className="text-gold-400 font-mono font-bold">${user.balance.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={onOpenDeposit} className="p-1.5 hover:bg-gold-500/10 rounded-lg text-gold-500 transition-colors" title="Deposit">
                      <PlusCircle size={18} />
                    </button>
                    <button onClick={onOpenWithdraw} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors" title="Withdraw">
                      <ArrowDownCircle size={18} />
                    </button>
                  </div>
                </div>
                
                {user.role === 'ADMIN' && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                      currentPage === 'admin' 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShieldCheck size={14} />
                    <span>Admin</span>
                  </button>
                )}

                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    currentPage === 'dashboard' 
                      ? 'bg-gold-500/20 text-gold-400 border border-gold-500/50' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutDashboard size={14} />
                  <span>Dashboard</span>
                </button>

                <button onClick={onLogout} className="text-slate-400 hover:text-white transition">
                  <LogOut size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

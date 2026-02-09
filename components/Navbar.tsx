
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

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigate, currentPage, onOpenDeposit, onOpenWithdraw }) => {
  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold-400 to-amber-700 flex items-center justify-center mr-2">
              <span className="text-white font-serif font-bold text-lg">A</span>
            </div>
            <span className="font-serif text-xl font-bold tracking-wide text-white">
              Ama<span className="text-gold-500">.zon</span>
            </span>
          </div>

          <div className="flex items-center space-x-6">
            {!user ? (
              <button 
                onClick={() => onNavigate('login')}
                className="text-sm font-medium text-slate-300 hover:text-white transition"
              >
                Sign In
              </button>
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


import React, { useState } from 'react';
import { X, ArrowDownRight, ShieldCheck, Wallet, ArrowRight, Hash, Building2, AlertCircle } from 'lucide-react';
import { PaymentGateway } from '../types';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestWithdrawal: (amount: number, payoutDetails: string) => void;
  currentBalance: number;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ 
  isOpen, 
  onClose, 
  onRequestWithdrawal, 
  currentBalance
}) => {
  const [amount, setAmount] = useState<string>('1000');
  const [details, setDetails] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleRequest = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    if (val > currentBalance) {
      alert("Insufficient balance for this withdrawal.");
      return;
    }
    if (!details.trim()) {
      alert("Please provide your payout details (Bank name, Account Number or Wallet Address).");
      return;
    }
    
    setIsProcessing(true);
    setTimeout(() => {
      onRequestWithdrawal(val, details);
      setIsProcessing(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
      <div className="bg-slate-900 border border-red-500/20 rounded-[3.5rem] w-full max-w-4xl overflow-hidden shadow-[0_0_100px_rgba(239,68,68,0.1)]">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left Panel */}
          <div className="hidden md:flex flex-col justify-between w-[35%] bg-black/40 p-12 border-r border-white/5">
            <div>
              <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20">
                <ArrowDownRight className="text-red-500" size={32} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 leading-tight">Secure Liquidation</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Withdraw your balance directly to your bank or digital wallet. Requests are processed within 24 hours of approval.
              </p>
              
              <div className="p-6 bg-slate-800/20 rounded-2xl border border-white/5">
                <div className="flex items-center space-x-3 text-xs text-white font-bold mb-4 uppercase tracking-widest">
                  <ShieldCheck size={16} className="text-red-500" />
                  <span>Verified Payouts</span>
                </div>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-loose">
                  Our compliance team ensures all withdrawals are settled securely to your designated accounts.
                </p>
              </div>
            </div>
            
            <div className="pt-10">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                <span>Security Level</span>
                <span className="text-red-500">Maximum</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                <div className="w-full h-full bg-red-500/50"></div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-grow p-12 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-4xl font-bold text-white tracking-tight">Withdraw Funds</h2>
                <div className="flex items-center space-x-2 mt-2">
                   <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Available Balance: ${currentBalance.toLocaleString()}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition text-slate-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Amount */}
              <div>
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4 block">Amount to Withdraw (USD)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-red-500 font-bold text-3xl">$</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={currentBalance}
                    className="w-full bg-black border border-white/10 rounded-[2.5rem] px-14 py-7 text-3xl font-mono text-white focus:border-red-500 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Payout Details */}
              <div>
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4 block">Payout Destination (Bank/Wallet Details)</label>
                <textarea 
                  placeholder="Example: Nagad 017XXXXXX / Standard Chartered Acc: 123456789 / BTC Wallet: bc1q..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-[1.5rem] px-6 py-5 text-sm font-mono text-white focus:border-red-500 outline-none transition-all placeholder:text-slate-800 min-h-[120px]"
                />
              </div>

              <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl space-y-3">
                <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-red-500">
                  <AlertCircle size={14} />
                  <span>Liquidation Note</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Withdrawals are finalized by human operators. Please ensure your destination details are 100% correct. We are not responsible for funds sent to incorrect addresses provided by the user.
                </p>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleRequest}
                  disabled={isProcessing || currentBalance <= 0}
                  className="w-full py-7 bg-red-600 text-white font-black rounded-[2.5rem] shadow-[0_0_50px_rgba(220,38,38,0.3)] hover:bg-red-500 hover:scale-[1.02] transition-all flex items-center justify-center space-x-4 disabled:opacity-50 active:scale-95"
                >
                  {isProcessing ? (
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="uppercase tracking-[0.2em] text-sm font-black">Confirm Liquidation</span>
                      <ArrowRight size={20} strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

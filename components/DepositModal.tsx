
import React, { useState, useEffect } from 'react';
import { X, CreditCard, ShieldCheck, Zap, Globe, ArrowRight, Hash, Building2, Link as LinkIcon, Info, Percent, AlertCircle } from 'lucide-react';
import { PaymentGateway } from '../types';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestDeposit: (amount: number, reference: string) => void;
  currentBalance: number;
  activeGateways: PaymentGateway[];
}

export const DepositModal: React.FC<DepositModalProps> = ({ 
  isOpen, 
  onClose, 
  onRequestDeposit, 
  currentBalance,
  activeGateways 
}) => {
  const [amount, setAmount] = useState<string>('100');
  const [reference, setReference] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-select first gateway when modal opens or gateways update
  useEffect(() => {
    if (activeGateways.length > 0 && !selectedMethod) {
      setSelectedMethod(activeGateways[0].name);
    }
  }, [activeGateways, isOpen]);

  if (!isOpen) return null;

  const currentGateway = activeGateways.find(g => g.name === selectedMethod);

  const handleRequest = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    
    if (currentGateway) {
      if (val < (currentGateway.minDeposit || 0)) {
        alert(`Minimum deposit for this method is $${currentGateway.minDeposit}`);
        return;
      }
      if (val > (currentGateway.maxDeposit || 1000000)) {
        alert(`Maximum deposit for this method is $${currentGateway.maxDeposit}`);
        return;
      }
    }

    if (!reference.trim()) {
      alert("Please enter your Payment Transaction ID / Reference.");
      return;
    }
    
    setIsProcessing(true);
    setTimeout(() => {
      onRequestDeposit(val, reference);
      setIsProcessing(false);
      onClose();
    }, 1500);
  };

  const renderGatewayLogo = (gw: PaymentGateway, isSelected: boolean) => {
    if (gw.logoUrl) {
      return (
        <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-black/50 border ${isSelected ? 'border-gold-500/50' : 'border-white/5'}`}>
          <img src={gw.logoUrl} alt={gw.name} className="w-full h-full object-contain p-1" />
        </div>
      );
    }
    const n = gw.name.toLowerCase();
    const colorClass = isSelected ? 'text-gold-500' : 'text-slate-500';
    if (n.includes('card') || n.includes('bank')) return <CreditCard size={28} className={colorClass} />;
    if (n.includes('crypto') || n.includes('globe') || n.includes('link')) return <Globe size={28} className={colorClass} />;
    return <Zap size={28} className={colorClass} />;
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
      <div className="bg-slate-900 border border-gold-500/20 rounded-[3.5rem] w-full max-w-4xl overflow-hidden shadow-[0_0_100px_rgba(234,179,8,0.1)]">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left Panel */}
          <div className="hidden md:flex flex-col justify-between w-[35%] bg-black/40 p-12 border-r border-white/5">
            <div>
              <div className="w-16 h-16 bg-gold-500/10 rounded-3xl flex items-center justify-center mb-8 border border-gold-500/20">
                <Globe className="text-gold-500" size={32} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 leading-tight">Elite Global Settlement</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Fund your account via our secure merchant network. All transactions are manually audited within 15 minutes.
              </p>
              <div className="p-6 bg-slate-800/20 rounded-2xl border border-white/5">
                <div className="flex items-center space-x-3 text-xs text-white font-bold mb-4 uppercase tracking-widest">
                  <ShieldCheck size={16} className="text-gold-500" />
                  <span>Escrow Protection</span>
                </div>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-loose">
                  Funds are held in high-liquidity cold storage during the verification process.
                </p>
              </div>
            </div>
            <div className="space-y-4 pt-10">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                <span>Network Status</span>
                <span className="text-green-500">Live</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-gold-500/50"></div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-grow p-12 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-4xl font-bold text-white tracking-tight">Add Funds</h2>
                <div className="flex items-center space-x-2 mt-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Active Balance: ${currentBalance.toLocaleString()}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition text-slate-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {activeGateways.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-black/40 rounded-[3rem] border border-white/5">
                <AlertCircle size={48} className="text-gold-500/30 mb-4" />
                <h4 className="text-white font-bold mb-2">No Active Gateways</h4>
                <p className="text-slate-500 text-xs uppercase tracking-widest font-black leading-relaxed">
                  The administrator has not configured any payment methods yet. <br/> Please login as Admin to add Bkash/Nagad in Merchant Settings.
                </p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Gateway Selection */}
                <div>
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4 block">Select Gateway</label>
                  <div className="flex overflow-x-auto space-x-4 pb-4 custom-scrollbar">
                    {activeGateways.map((gw) => (
                      <button 
                        key={gw.name}
                        onClick={() => setSelectedMethod(gw.name)} 
                        className={`flex-shrink-0 min-w-[140px] p-6 rounded-[2.5rem] border transition-all flex flex-col items-center space-y-4 ${selectedMethod === gw.name ? 'bg-gold-500/10 border-gold-500 shadow-lg' : 'bg-black border-white/5 hover:border-white/20'}`}
                      >
                        {renderGatewayLogo(gw, selectedMethod === gw.name)}
                        <span className="text-[10px] font-black uppercase tracking-widest text-center truncate w-full">{gw.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4 block">Amount (USD)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-500 font-bold text-3xl">$</span>
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-[2.5rem] px-14 py-7 text-3xl font-mono text-white focus:border-gold-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {currentGateway && (
                    <div className="flex flex-col justify-center space-y-3 p-6 bg-black/40 rounded-[2rem] border border-white/5">
                      <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest">
                         <span className="text-slate-600">Limits:</span>
                         <span className="text-white">${currentGateway.minDeposit?.toLocaleString()} - ${currentGateway.maxDeposit?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest">
                         <span className="text-slate-600">Fee:</span>
                         <span className="text-red-400">{currentGateway.feePercent || 0}% Verification Fee</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Details */}
                {currentGateway && (
                  <div className="p-8 bg-[#0b101b] border border-gold-500/20 rounded-[3rem] space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-gold-500">
                        <Building2 size={16} />
                        <span>Company Receiving Details</span>
                      </div>
                      {currentGateway.link && (
                        <a href={currentGateway.link} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase text-gold-500 hover:text-white flex items-center transition-colors">
                          Direct Link <LinkIcon size={12} className="ml-2"/>
                        </a>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Provider</p>
                        <p className="text-xl font-bold text-white">{currentGateway.bankName || currentGateway.name}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Account / Wallet Address</p>
                        <div className="flex items-center justify-between bg-black/50 p-3 rounded-xl border border-white/5">
                          <span className="text-base font-mono font-bold text-white truncate mr-4">{currentGateway.accountNumber}</span>
                          <button 
                            onClick={() => {
                              if (currentGateway.accountNumber) {
                                navigator.clipboard.writeText(currentGateway.accountNumber);
                                alert("Copied to clipboard!");
                              }
                            }}
                            className="text-[9px] font-black uppercase bg-gold-500 text-black px-4 py-2 rounded-lg hover:bg-gold-400"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reference Input */}
                <div>
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4 block">Transaction Reference (TXID)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Enter Transaction ID from your payment app..."
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-[1.5rem] px-6 py-5 text-sm font-mono text-white focus:border-gold-500 outline-none transition-all"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-800">
                      <Hash size={20} />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleRequest}
                    disabled={isProcessing || !selectedMethod}
                    className="w-full py-7 bg-gold-500 text-black font-black rounded-[2.5rem] shadow-[0_0_50px_rgba(234,179,8,0.3)] hover:bg-gold-400 hover:scale-[1.01] transition-all flex items-center justify-center space-x-4 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="uppercase tracking-[0.2em] text-sm font-black">Secure Deposit Submission</span>
                        <ArrowRight size={20} strokeWidth={3} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-center space-x-3 text-[10px] text-slate-600 font-black uppercase tracking-widest mt-6">
               <AlertCircle size={14} />
               <span>Manual verification required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

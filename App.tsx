
import React, { useState, useEffect, useCallback } from 'react';
import { Asset, User, Transaction, TransactionType, TransactionStatus, PaymentGateway, AssetType } from './types';
import { INITIAL_ASSETS, fluctuatePrices, generateId } from './services/mockData';
import { Navbar } from './components/Navbar';
import { AssetCard } from './components/AssetCard';
import { AdminPanel } from './components/AdminPanel';
import { NewsTicker } from './components/NewsTicker';
import { AIAssistant } from './components/AIAssistant';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { DB } from './services/db';
import { isSupabaseConfigured } from './services/supabase';
import { Sparkles, BarChart3, Wallet, ArrowRight, AlertTriangle, Plus, ArrowUpRight, ArrowDownRight, UserPlus, LogIn, MapPin, Phone, Mail, Shield } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup States
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    phone: ''
  });

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.BUY);
  const [amount, setAmount] = useState<string>('1');
  const [modalOpen, setModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const [u, t, g] = await Promise.all([
          DB.fetchUsers(),
          DB.fetchTransactions(),
          DB.fetchGateways()
        ]);
        setUsers(u);
        setTransactions(t);
        setGateways(g.length > 0 ? g : [
          { name: 'Manual Transfer', active: true, apiKey: 'man', bankName: 'Elite Global', accountNumber: 'Elite-01-99', currency: 'USD', logoUrl: 'https://img.icons8.com/color/96/bank.png', merchantName: 'Ama.zon Corp', minDeposit: 10, maxDeposit: 1000000, feePercent: 0 }
        ]);
      } catch (err) {
        console.error("Database connection error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setAssets(prev => fluctuatePrices(prev)), 5000);
    return () => clearInterval(interval);
  }, []);

  const calculateNetWorth = (targetUser: User) => {
    const portfolioValue = assets.reduce((acc, asset) => {
      return acc + (targetUser.portfolio[asset.type] || 0) * asset.price;
    }, 0);
    return Number(targetUser.balance) + portfolioValue;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputEmail = email.trim();
    const inputPass = password.trim();
    
    if (inputEmail === 'emukhan580' && inputPass === 'Imran2015@!@!') {
      const admin: User = { 
        id: 'admin-1', 
        name: 'Master Admin', 
        email: 'emukhan580', 
        role: 'ADMIN', 
        balance: 9999999, 
        portfolio: {} as any 
      };
      setUser(admin);
      setCurrentPage('admin');
      return;
    }

    const existingUser = users.find(u => u.email.toLowerCase() === inputEmail.toLowerCase());
    if (existingUser) {
      setUser(existingUser);
      setCurrentPage('dashboard');
    } else {
      alert("Invalid credentials. If you are new, please Sign Up.");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, address, phone } = signupForm;
    
    if (!name || !email || !address || !phone) {
      alert("Please fill all fields.");
      return;
    }

    const normalizedEmail = email.toLowerCase();
    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      alert("User with this email already exists.");
      return;
    }

    const newUser: User = { 
      id: generateId(), 
      name, 
      email: normalizedEmail, 
      address,
      phone,
      role: 'USER', 
      balance: 5000, // Welcome bonus
      portfolio: { 
        [AssetType.BITCOIN]: 0, 
        [AssetType.GOLD]: 0, 
        [AssetType.DIAMOND]: 0, 
        [AssetType.SILVER]: 0, 
        [AssetType.PLATINUM]: 0,
        [AssetType.ANTIMATTER]: 0,
        [AssetType.AI_COMPUTE]: 0,
        [AssetType.FUSION_ENERGY]: 0,
        [AssetType.NEURAL_LINK]: 0
      } as any 
    };

    await DB.syncUser(newUser);
    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
    setCurrentPage('dashboard');
  };

  const submitTransaction = async () => {
    if (!user || !selectedAsset) return;
    const qty = parseFloat(amount);
    const totalCost = qty * selectedAsset.price;
    
    if (transactionType === TransactionType.BUY && totalCost > user.balance) {
      alert("Insufficient Funds.");
      return;
    }

    const newTx: Transaction = {
      id: generateId(), userId: user.id, userName: user.name, assetType: selectedAsset.type,
      amount: qty, priceAtRequest: selectedAsset.price, totalValue: totalCost,
      type: transactionType, status: TransactionStatus.APPROVED, date: new Date().toISOString()
    };

    await DB.addTransaction(newTx);
    setTransactions(prev => [newTx, ...prev]);
    
    const updatedUser = { ...user };
    if (transactionType === TransactionType.BUY) {
      updatedUser.balance -= totalCost;
      updatedUser.portfolio[selectedAsset.type] = (updatedUser.portfolio[selectedAsset.type] || 0) + qty;
    } else {
      updatedUser.balance += totalCost;
      updatedUser.portfolio[selectedAsset.type] = Math.max(0, (updatedUser.portfolio[selectedAsset.type] || 0) - qty);
    }
    
    setUser(updatedUser);
    await DB.syncUser(updatedUser);
    setModalOpen(false);
  };

  const handleDeposit = async (amt: number, ref: string) => {
    if (!user) return;
    const tx: Transaction = { id: generateId(), userId: user.id, userName: user.name, amount: amt, priceAtRequest: 1, totalValue: amt, type: TransactionType.DEPOSIT, status: TransactionStatus.PENDING, date: new Date().toISOString(), externalTxId: ref };
    await DB.addTransaction(tx);
    setTransactions(prev => [tx, ...prev]);
    alert("Deposit request submitted for audit.");
  };

  const handleWithdraw = async (amt: number, details: string) => {
    if (!user) return;
    const tx: Transaction = { id: generateId(), userId: user.id, userName: user.name, amount: amt, priceAtRequest: 1, totalValue: amt, type: TransactionType.WITHDRAW, status: TransactionStatus.PENDING, date: new Date().toISOString(), payoutDetails: details };
    await DB.addTransaction(tx);
    setTransactions(prev => [tx, ...prev]);
    
    const updatedUser = { ...user, balance: user.balance - amt };
    setUser(updatedUser);
    await DB.syncUser(updatedUser);
    alert("Withdrawal request submitted.");
  };

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center font-mono text-gold-500 animate-pulse uppercase tracking-[0.5em]">Establishing Secure Link...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-black text-slate-100 font-sans selection:bg-gold-500/30 overflow-x-hidden">
      <NewsTicker />
      <Navbar 
        user={user} 
        onLogout={() => { setUser(null); setCurrentPage('home'); }} 
        onNavigate={setCurrentPage} 
        currentPage={currentPage} 
        onOpenDeposit={() => setDepositModalOpen(true)} 
        onOpenWithdraw={() => setWithdrawModalOpen(true)} 
      />
      
      <main className="flex-grow pb-10">
        {currentPage === 'home' && (
          <div className="relative py-24 md:py-40 flex flex-col items-center text-center px-4 overflow-hidden">
            <div className="max-w-5xl mx-auto relative z-10">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gold-500/10 border border-gold-500/20 rounded-full mb-10">
                <Sparkles className="text-gold-500" size={14}/>
                <span className="text-gold-500 text-[10px] font-black uppercase tracking-widest">Premium Asset Management</span>
              </div>
              <h1 className="text-6xl md:text-9xl font-serif font-bold text-white mb-8 tracking-tighter leading-none">
                Elite <span className="text-gold-500 italic">Exchange.</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-16 font-light">
                Diamond, Gold, Silver, Platinum and Bitcoin trading for the modern investor.
              </p>
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
                <button 
                  onClick={() => setCurrentPage('login')} 
                  className="group relative px-12 py-6 bg-gold-500 text-black font-black rounded-2xl shadow-[0_0_40px_rgba(234,179,8,0.2)] hover:shadow-[0_0_60px_rgba(234,179,8,0.4)] transition-all text-xl w-full md:w-auto"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => setCurrentPage('signup')} 
                  className="px-12 py-6 border-2 border-gold-500/50 text-gold-500 font-black rounded-2xl hover:bg-gold-500/10 transition-all text-xl w-full md:w-auto"
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'login' && (
          <div className="flex items-center justify-center py-20 px-4">
            <div className="w-full max-w-md bg-slate-900 border border-white/10 p-12 rounded-[3rem] shadow-2xl">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gold-500/10 rounded-3xl border border-gold-500/20">
                  <LogIn className="text-gold-500" size={32} />
                </div>
              </div>
              <h2 className="text-4xl font-serif font-bold text-white mb-4 text-center">Welcome Back</h2>
              <p className="text-slate-500 text-center text-xs uppercase font-black tracking-widest mb-10">Verify your credentials</p>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input type="text" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-12 py-4 text-white outline-none focus:border-gold-500/50" placeholder="Username or Email"/>
                </div>
                <div className="relative">
                  <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-12 py-4 text-white outline-none focus:border-gold-500/50" placeholder="Passcode"/>
                </div>
                <button type="submit" className="w-full py-5 bg-gold-500 text-black font-black rounded-2xl uppercase tracking-[0.2em] text-sm shadow-xl hover:bg-gold-400 transition-all">Authorize Access</button>
              </form>
              <p className="mt-8 text-center text-slate-400 text-sm">
                New applicant? <button onClick={() => setCurrentPage('signup')} className="text-gold-500 font-bold hover:underline">Apply for Membership</button>
              </p>
            </div>
          </div>
        )}

        {currentPage === 'signup' && (
          <div className="flex items-center justify-center py-20 px-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-white/10 p-12 rounded-[3rem] shadow-2xl">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gold-500/10 rounded-3xl border border-gold-500/20">
                  <UserPlus className="text-gold-500" size={32} />
                </div>
              </div>
              <h2 className="text-4xl font-serif font-bold text-white mb-4 text-center">Membership Application</h2>
              <p className="text-slate-500 text-center text-xs uppercase font-black tracking-widest mb-10">Join the world's most exclusive asset network</p>
              <form onSubmit={handleSignup} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Full Identity</label>
                    <input type="text" required value={signupForm.name} onChange={(e) => setSignupForm({...signupForm, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-white outline-none focus:border-gold-500/50" placeholder="Legal Full Name"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Contact Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                      <input type="email" required value={signupForm.email} onChange={(e) => setSignupForm({...signupForm, email: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-6 py-4 text-white outline-none focus:border-gold-500/50" placeholder="Official Email"/>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Home/Office Residence</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                    <input type="text" required value={signupForm.address} onChange={(e) => setSignupForm({...signupForm, address: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-6 py-4 text-white outline-none focus:border-gold-500/50" placeholder="Physical Address for Documentation"/>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Secure Line</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                      <input type="tel" required value={signupForm.phone} onChange={(e) => setSignupForm({...signupForm, phone: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-6 py-4 text-white outline-none focus:border-gold-500/50" placeholder="+1 (555) 000-0000"/>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Account Passcode</label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                      <input type="password" required value={signupForm.password} onChange={(e) => setSignupForm({...signupForm, password: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-6 py-4 text-white outline-none focus:border-gold-500/50" placeholder="Create Secure Key"/>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full py-5 bg-gold-500 text-black font-black rounded-2xl uppercase tracking-[0.2em] text-sm shadow-xl hover:bg-gold-400 transition-all">Submit Application</button>
                </div>
              </form>
              <p className="mt-8 text-center text-slate-400 text-sm">
                Already a member? <button onClick={() => setCurrentPage('login')} className="text-gold-500 font-bold hover:underline">Secure Login</button>
              </p>
            </div>
          </div>
        )}

        {currentPage === 'dashboard' && user && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-4xl font-serif font-bold text-white mb-2">Portfolio Overview</h2>
                <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">Active Account: {user.name}</p>
              </div>
              <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center space-x-3">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                 <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Global Sync Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
               <div className="lg:col-span-4 bg-slate-900 border border-gold-500/20 p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between">
                 <div>
                   <div className="flex items-center space-x-3 mb-6">
                      <Wallet className="text-gold-500" size={24} />
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Available Balance</span>
                   </div>
                   <div className="text-5xl font-mono text-white font-black tracking-tight mb-8">${user.balance.toLocaleString()}</div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <button 
                     onClick={() => setDepositModalOpen(true)}
                     className="flex items-center justify-center space-x-2 py-4 bg-gold-500 text-black font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-gold-400 hover:scale-[1.02] transition-all shadow-lg active:scale-95"
                   >
                     <Plus size={14} />
                     <span>Deposit</span>
                   </button>
                   <button 
                     onClick={() => setWithdrawModalOpen(true)}
                     className="flex items-center justify-center space-x-2 py-4 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/5 hover:scale-[1.02] transition-all active:scale-95"
                   >
                     <ArrowDownRight size={14} />
                     <span>Withdraw</span>
                   </button>
                 </div>
              </div>
              <div className="lg:col-span-8 bg-slate-900 border border-white/10 p-10 rounded-[3rem] shadow-2xl flex flex-col justify-center">
                 <div className="flex items-center space-x-3 mb-6">
                    <BarChart3 className="text-slate-400" size={24} />
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Wealth</span>
                 </div>
                 <div className="text-5xl font-mono text-gold-500 font-black tracking-tight">${calculateNetWorth(user).toLocaleString()}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {assets.map(asset => (
                <AssetCard key={asset.type} asset={asset} userOwnedAmount={user.portfolio[asset.type] || 0} onBuy={(a) => { setSelectedAsset(a); setTransactionType(TransactionType.BUY); setAmount('1'); setModalOpen(true); }} onSell={(a) => { setSelectedAsset(a); setTransactionType(TransactionType.SELL); setAmount('1'); setModalOpen(true); }} />
              ))}
            </div>
          </div>
        )}

        {currentPage === 'admin' && user?.role === 'ADMIN' && (
          <AdminPanel 
            transactions={transactions} 
            users={users} 
            assets={assets} 
            onProcessTransaction={async (id, status) => {
              await DB.updateTransactionStatus(id, status);
              setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
              if (status === TransactionStatus.APPROVED) {
                const tx = transactions.find(t => t.id === id);
                if (tx && (tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.WITHDRAW)) {
                   const target = users.find(u => u.id === tx.userId);
                   if (target) {
                     const updated = { ...target, balance: tx.type === TransactionType.DEPOSIT ? target.balance + tx.amount : target.balance };
                     await DB.syncUser(updated);
                     setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
                   }
                }
              }
            }} 
            gateways={gateways} 
            onUpdateGateway={async (n, a) => {
              const gw = gateways.find(g => g.name === n);
              if (gw) {
                const updated = { ...gw, active: a };
                await DB.saveGateway(updated);
                setGateways(prev => prev.map(g => g.name === n ? updated : g));
              }
            }} 
            onAddGateway={async (g) => {
              const newGw = { ...g, apiKey: generateId() };
              await DB.saveGateway(newGw);
              setGateways(prev => [...prev, newGw]);
            }} 
            onRemoveGateway={(n) => setGateways(prev => prev.filter(g => g.name !== n))} 
          />
        )}
      </main>

      <AIAssistant assets={assets} />
      <DepositModal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} onRequestDeposit={handleDeposit} currentBalance={user?.balance || 0} activeGateways={gateways.filter(g => g.active)} />
      <WithdrawModal isOpen={withdrawModalOpen} onClose={() => setWithdrawModalOpen(false)} onRequestWithdrawal={handleWithdraw} currentBalance={user?.balance || 0} />

      {modalOpen && selectedAsset && user && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <div className="bg-slate-900 border border-gold-500/20 rounded-[3rem] p-10 w-full max-w-md shadow-2xl">
            <h3 className="text-3xl font-serif font-bold text-white mb-8 text-center">{transactionType} {selectedAsset.name}</h3>
            <div className="space-y-6">
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white text-3xl font-mono text-center outline-none focus:border-gold-500" />
              <div className="p-4 bg-gold-500/5 rounded-2xl border border-gold-500/10 flex justify-between items-center font-mono">
                <span className="text-[10px] text-gold-500/60 uppercase font-black">Est. Value</span>
                <span className="text-white font-bold">${(parseFloat(amount || '0') * selectedAsset.price).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setModalOpen(false)} className="py-4 rounded-2xl text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all">Cancel</button>
                <button onClick={submitTransaction} className="py-4 rounded-2xl bg-gold-500 text-black font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-gold-400 transition-all">Execute</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

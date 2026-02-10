
import React, { useState, useEffect } from 'react';
import { Asset, User, Transaction, TransactionType, TransactionStatus, PaymentGateway, AssetType } from './types';
import { INITIAL_ASSETS, fluctuatePrices, generateId } from './services/mockData';
import { Navbar, BrandLogo } from './components/Navbar';
import { AssetCard } from './components/AssetCard';
import { AdminPanel } from './components/AdminPanel';
import { NewsTicker } from './components/NewsTicker';
import { AIAssistant } from './components/AIAssistant';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { DB } from './services/db';
import { Sparkles, BarChart3, Wallet, Plus, ArrowDownRight, Mail, Shield, RefreshCcw, MapPin, Phone } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup States
  const [signupForm, setSignupForm] = useState({
    name: '', email: '', password: '', address: '', phone: ''
  });

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.BUY);
  const [amount, setAmount] = useState<string>('1');
  const [modalOpen, setModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // Initial Load & Session Recovery
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const savedUser = localStorage.getItem('ama_session_user');
      
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setCurrentPage(parsed.role === 'ADMIN' ? 'admin' : 'dashboard');
      }

      await fetchData(true);
      setIsLoading(false);
    };
    init();
  }, []);

  // Global Data Fetcher
  const fetchData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [u, t, g] = await Promise.all([
        DB.fetchUsers(),
        DB.fetchTransactions(),
        DB.fetchGateways()
      ]);
      
      setUsers(u);
      setTransactions(t);
      if (g.length > 0) setGateways(g);
      
      // Sync current logged in user with latest database state
      const currentSessionId = localStorage.getItem('ama_session_user_id');
      if (currentSessionId) {
        const freshUser = u.find(x => x.id === currentSessionId);
        // Master Admin case
        if (currentSessionId === 'admin-1') {
          // Keep admin session as is
        } else if (freshUser) {
          setUser(freshUser);
          localStorage.setItem('ama_session_user', JSON.stringify(freshUser));
        }
      }
    } catch (err) {
      console.error("Critical Sync Error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => setAssets(prev => fluctuatePrices(prev)), 15000);
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
        id: 'admin-1', name: 'Master Admin', email: 'emukhan580', 
        role: 'ADMIN', balance: 9999999, portfolio: {} as any 
      };
      setUser(admin);
      localStorage.setItem('ama_session_user', JSON.stringify(admin));
      localStorage.setItem('ama_session_user_id', admin.id);
      setCurrentPage('admin');
      fetchData(true);
      return;
    }

    const foundUser = users.find(u => u.email.toLowerCase() === inputEmail.toLowerCase());
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('ama_session_user', JSON.stringify(foundUser));
      localStorage.setItem('ama_session_user_id', foundUser.id);
      setCurrentPage('dashboard');
    } else {
      alert("Invalid credentials. Please Sign Up.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ama_session_user');
    localStorage.removeItem('ama_session_user_id');
    setCurrentPage('home');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email: sEmail, address, phone } = signupForm;
    if (!name || !sEmail) { alert("Fill required fields"); return; }

    const newUser: User = { 
      id: generateId(), name, email: sEmail.toLowerCase(), 
      address, phone, role: 'USER', balance: 0, 
      portfolio: { [AssetType.BITCOIN]: 0, [AssetType.GOLD]: 0, [AssetType.DIAMOND]: 0, [AssetType.SILVER]: 0, [AssetType.PLATINUM]: 0 } as any 
    };

    try {
      await DB.syncUser(newUser);
      setUsers(prev => [...prev, newUser]);
      setUser(newUser);
      localStorage.setItem('ama_session_user', JSON.stringify(newUser));
      localStorage.setItem('ama_session_user_id', newUser.id);
      setCurrentPage('dashboard');
    } catch (err) {
      alert("Registration failed. Check DB connection.");
    }
  };

  const handleDeposit = async (amt: number, ref: string) => {
    if (!user) return;
    const tx: Transaction = { 
      id: generateId(), userId: user.id, userName: user.name, 
      amount: amt, priceAtRequest: 1, totalValue: amt, 
      type: TransactionType.DEPOSIT, status: TransactionStatus.PENDING, 
      date: new Date().toISOString(), externalTxId: ref 
    };
    
    await DB.addTransaction(tx);
    alert("Deposit submitted. Admin will verify Reference: " + ref);
    await fetchData(true); // Force re-sync so admin sees it instantly
  };

  const handleWithdraw = async (amt: number, details: string) => {
    if (!user) return;
    const tx: Transaction = { 
      id: generateId(), userId: user.id, userName: user.name, 
      amount: amt, priceAtRequest: 1, totalValue: amt, 
      type: TransactionType.WITHDRAW, status: TransactionStatus.PENDING, 
      date: new Date().toISOString(), payoutDetails: details 
    };
    
    await DB.addTransaction(tx);
    const updatedUser = { ...user, balance: user.balance - amt };
    await DB.syncUser(updatedUser);
    setUser(updatedUser);
    localStorage.setItem('ama_session_user', JSON.stringify(updatedUser));
    alert("Withdrawal submitted. Amount deducted from balance.");
    await fetchData(true);
  };

  const handleProcessTransaction = async (id: string, status: TransactionStatus) => {
    try {
      await DB.updateTransactionStatus(id, status);
      const tx = transactions.find(t => t.id === id);
      if (!tx) return;

      const targetUser = users.find(u => u.id === tx.userId);
      if (targetUser) {
        let newBalance = Number(targetUser.balance);
        if (status === TransactionStatus.APPROVED && tx.type === TransactionType.DEPOSIT) {
          newBalance += tx.amount;
        } else if (status === TransactionStatus.REJECTED && tx.type === TransactionType.WITHDRAW) {
          newBalance += tx.amount;
        }
        const updated = { ...targetUser, balance: newBalance };
        await DB.syncUser(updated);
      }
      await fetchData(true);
    } catch (err) {
      alert("Error processing transaction.");
    }
  };

  // handleAdminUpdateUser: Updates user data in database and refreshes local state
  const handleAdminUpdateUser = async (updatedUser: User) => {
    try {
      await DB.syncUser(updatedUser);
      await fetchData(true);
    } catch (err) {
      alert("Failed to update user.");
    }
  };

  // handleAdminDeleteUser: Removes user from database and logs them out if it was the current session
  const handleAdminDeleteUser = async (userId: string) => {
    try {
      await DB.deleteUser(userId);
      await fetchData(true);
      if (user && user.id === userId) {
        handleLogout();
      }
    } catch (err) {
      alert("Failed to delete user.");
    }
  };

  if (isLoading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-gold-500 animate-pulse">
    <BrandLogo className="w-20 h-20 mb-8" />
    <span className="uppercase tracking-[0.5em]">Syncing Secure Data...</span>
  </div>;

  return (
    <div className="min-h-screen flex flex-col bg-black text-slate-100 font-sans selection:bg-gold-500/30 overflow-x-hidden">
      <NewsTicker />
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
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
              <div className="flex justify-center mb-10"><BrandLogo className="w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]" /></div>
              <h1 className="text-6xl md:text-9xl font-serif font-bold text-white mb-8 tracking-tighter leading-none">Elite <span className="text-gold-500 italic">Exchange.</span></h1>
              <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-16 font-light">Diamond, Gold, Silver, Platinum and Bitcoin trading for the modern investor.</p>
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
                <button onClick={() => setCurrentPage('login')} className="px-12 py-6 bg-gold-500 text-black font-black rounded-2xl shadow-xl transition-all text-xl w-full md:w-auto">Sign In</button>
                <button onClick={() => setCurrentPage('signup')} className="px-12 py-6 border-2 border-gold-500/50 text-gold-500 font-black rounded-2xl transition-all text-xl w-full md:w-auto">Apply Now</button>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'login' && (
          <div className="flex items-center justify-center py-20 px-4">
            <div className="w-full max-w-md bg-slate-900 border border-white/10 p-12 rounded-[3rem] shadow-2xl">
              <h2 className="text-4xl font-serif font-bold text-white mb-10 text-center">Welcome Back</h2>
              <form onSubmit={handleLogin} className="space-y-6">
                <input type="text" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-white outline-none focus:border-gold-500/50" placeholder="Username or Email"/>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-white outline-none focus:border-gold-500/50" placeholder="Passcode"/>
                <button type="submit" className="w-full py-5 bg-gold-500 text-black font-black rounded-2xl uppercase tracking-widest shadow-xl">Authorize Access</button>
              </form>
              <p className="mt-8 text-center text-slate-400 text-sm">New applicant? <button onClick={() => setCurrentPage('signup')} className="text-gold-500 font-bold hover:underline">Apply</button></p>
            </div>
          </div>
        )}

        {currentPage === 'signup' && (
          <div className="flex items-center justify-center py-20 px-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-white/10 p-12 rounded-[3rem] shadow-2xl">
              <h2 className="text-4xl font-serif font-bold text-white mb-10 text-center">Membership Application</h2>
              <form onSubmit={handleSignup} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input type="text" required value={signupForm.name} onChange={(e) => setSignupForm({...signupForm, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-white outline-none" placeholder="Legal Full Name"/>
                  <input type="email" required value={signupForm.email} onChange={(e) => setSignupForm({...signupForm, email: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-white outline-none" placeholder="Official Email"/>
                </div>
                <input type="text" required value={signupForm.address} onChange={(e) => setSignupForm({...signupForm, address: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-white outline-none" placeholder="Physical Address"/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input type="tel" required value={signupForm.phone} onChange={(e) => setSignupForm({...signupForm, phone: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-white outline-none" placeholder="+1 (555) 000-0000"/>
                  <input type="password" required value={signupForm.password} onChange={(e) => setSignupForm({...signupForm, password: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-white outline-none" placeholder="Create Secure Key"/>
                </div>
                <button type="submit" className="w-full py-5 bg-gold-500 text-black font-black rounded-2xl uppercase tracking-widest shadow-xl">Submit Application</button>
              </form>
              <p className="mt-8 text-center text-slate-400 text-sm">Already a member? <button onClick={() => setCurrentPage('login')} className="text-gold-500 font-bold hover:underline">Secure Login</button></p>
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
              <button onClick={() => fetchData()} className={`p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition flex items-center space-x-2 ${isRefreshing ? 'animate-spin' : ''}`}><RefreshCcw size={18} /></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
               <div className="lg:col-span-4 bg-slate-900 border border-gold-500/20 p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between">
                 <div>
                   <div className="flex items-center space-x-3 mb-6"><Wallet className="text-gold-500" size={24} /><span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Liquid Balance</span></div>
                   <div className="text-5xl font-mono text-white font-black tracking-tight mb-8">${Number(user.balance).toLocaleString()}</div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => setDepositModalOpen(true)} className="py-4 bg-gold-500 text-black font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg transition-all"><Plus size={14} className="inline mr-2"/>Deposit</button>
                   <button onClick={() => setWithdrawModalOpen(true)} className="py-4 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all"><ArrowDownRight size={14} className="inline mr-2"/>Withdraw</button>
                 </div>
              </div>
              <div className="lg:col-span-8 bg-slate-900 border border-white/10 p-10 rounded-[3rem] shadow-2xl flex flex-col justify-center">
                 <div className="flex items-center space-x-3 mb-6"><BarChart3 className="text-slate-400" size={24} /><span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Wealth</span></div>
                 <div className="text-5xl font-mono text-gold-500 font-black tracking-tight">${calculateNetWorth(user).toLocaleString()}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {assets.map(asset => (
                <AssetCard key={asset.type} asset={asset} userOwnedAmount={user.portfolio[asset.type] || 0} onBuy={() => { setSelectedAsset(asset); setTransactionType(TransactionType.BUY); setModalOpen(true); }} onSell={() => { setSelectedAsset(asset); setTransactionType(TransactionType.SELL); setModalOpen(true); }} />
              ))}
            </div>
          </div>
        )}

        {currentPage === 'admin' && user?.role === 'ADMIN' && (
          <AdminPanel 
            transactions={transactions} 
            users={users} 
            assets={assets} 
            onProcessTransaction={handleProcessTransaction} 
            onUpdateUser={handleAdminUpdateUser}
            onDeleteUser={handleAdminDeleteUser}
            onRefresh={() => fetchData()}
            isRefreshing={isRefreshing}
            gateways={gateways} 
            onUpdateGateway={async (n, a) => {
              const gw = gateways.find(g => g.name === n);
              if (gw) {
                const updated = { ...gw, active: a };
                await DB.saveGateway(updated);
                await fetchData(true);
              }
            }} 
            onAddGateway={async (g) => {
              const newGw = { ...g, apiKey: generateId() };
              await DB.saveGateway(newGw);
              await fetchData(true);
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
                <button onClick={async () => {
                  const qty = parseFloat(amount);
                  const cost = qty * selectedAsset.price;
                  if (transactionType === TransactionType.BUY && cost > user.balance) { alert("Insufficient Balance"); return; }
                  const updatedUser = { ...user };
                  if (transactionType === TransactionType.BUY) {
                    updatedUser.balance -= cost;
                    updatedUser.portfolio[selectedAsset.type] = (updatedUser.portfolio[selectedAsset.type] || 0) + qty;
                  } else {
                    updatedUser.balance += cost;
                    updatedUser.portfolio[selectedAsset.type] = Math.max(0, (updatedUser.portfolio[selectedAsset.type] || 0) - qty);
                  }
                  await DB.syncUser(updatedUser);
                  setUser(updatedUser);
                  localStorage.setItem('ama_session_user', JSON.stringify(updatedUser));
                  setModalOpen(false);
                  fetchData(true);
                }} className="py-4 rounded-2xl bg-gold-500 text-black font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-gold-400 transition-all">Execute</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

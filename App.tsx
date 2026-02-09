
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
import { Sparkles, BarChart3, Wallet, ArrowRight, AlertTriangle, Plus, ArrowUpRight } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.BUY);
  const [amount, setAmount] = useState<string>('1');
  const [modalOpen, setModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // Sync with DB
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
        console.error("DB Init failed:", err);
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.toLowerCase();
    
    if (normalizedEmail.includes('admin')) {
      const admin: User = { id: 'admin-1', name: 'Master Admin', email: 'admin@ama.zon', role: 'ADMIN', balance: 9999999, portfolio: {} as any };
      setUser(admin);
      setCurrentPage('admin');
      return;
    }

    const existingUser = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      setUser(existingUser);
      setCurrentPage('dashboard');
    } else {
      const newUser: User = { 
        id: generateId(), 
        name: email.split('@')[0], 
        email, 
        role: 'USER', 
        balance: 5000, 
        portfolio: { [AssetType.BITCOIN]: 0, [AssetType.GOLD]: 0, [AssetType.DIAMOND]: 0, [AssetType.SILVER]: 0, [AssetType.PLATINUM]: 0, [AssetType.ANTIMATTER]: 0, [AssetType.AI_COMPUTE]: 0 } as any 
      };
      await DB.syncUser(newUser);
      setUsers(prev => [...prev, newUser]);
      setUser(newUser);
      setCurrentPage('dashboard');
    }
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
      {!isSupabaseConfigured && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-4 flex items-center justify-center space-x-2 text-amber-500 text-[10px] font-black uppercase tracking-widest z-[100]">
          <AlertTriangle size={14} />
          <span>Notice: Local Sandbox Mode. Connect Supabase for real-time storage.</span>
        </div>
      )}
      
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
              <button 
                onClick={() => setCurrentPage('login')} 
                className="group relative px-12 py-6 bg-gold-500 text-black font-black rounded-2xl shadow-[0_0_40px_rgba(234,179,8,0.2)] hover:shadow-[0_0_60px_rgba(234,179,8,0.4)] transition-all text-xl"
              >
                Start Trading
              </button>
            </div>
          </div>
        )}

        {currentPage === 'login' && (
          <div className="flex items-center justify-center py-20 px-4">
            <div className="w-full max-w-md bg-slate-900 border border-white/10 p-12 rounded-[3rem] shadow-2xl">
              <h2 className="text-4xl font-serif font-bold text-white mb-10 text-center">Identity Portal</h2>
              <form onSubmit={handleAuth} className="space-y-6">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-white outline-none focus:border-gold-500/50" placeholder="Username or Email"/>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-white outline-none focus:border-gold-500/50" placeholder="Passcode"/>
                <button type="submit" className="w-full py-5 bg-gold-500 text-black font-black rounded-2xl uppercase tracking-[0.2em] text-sm shadow-xl hover:bg-gold-400 transition-all">Authorize</button>
              </form>
            </div>
          </div>
        )}

        {currentPage === 'dashboard' && user && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
               <div className="lg:col-span-4 bg-slate-900 border border-gold-500/20 p-10 rounded-[3rem] shadow-2xl">
                 <div className="flex items-center space-x-3 mb-6">
                    <Wallet className="text-gold-500" size={24} />
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Available Balance</span>
                 </div>
                 <div className="text-5xl font-mono text-white font-black tracking-tight">${user.balance.toLocaleString()}</div>
              </div>
              <div className="lg:col-span-8 bg-slate-900 border border-white/10 p-10 rounded-[3rem] shadow-2xl">
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

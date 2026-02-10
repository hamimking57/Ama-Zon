
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionStatus, TransactionType, PaymentGateway, User, Asset } from '../types';
import { DB } from '../services/db';
import { 
  CheckCircle, XCircle, CreditCard, ExternalLink, ShieldCheck, Plus, Trash2, 
  Link as LinkIcon, Building2, Hash, Globe, Percent, ArrowDownToLine, 
  ArrowUpToLine, UserCircle, Image as ImageIcon, Wallet, ArrowDownRight, 
  Users, Mail, PieChart, Database, Terminal, FileJson, Trash, Server, 
  Activity, Copy, Check, Filter, Calendar, Search, Edit3, Settings, AlertTriangle, X, RefreshCw
} from 'lucide-react';

interface AdminPanelProps {
  transactions: Transaction[];
  users: User[];
  assets: Asset[];
  onProcessTransaction: (id: string, status: TransactionStatus) => void;
  gateways: PaymentGateway[];
  onUpdateGateway: (name: string, active: boolean) => void;
  onAddGateway: (gateway: Omit<PaymentGateway, 'apiKey'>) => void;
  onRemoveGateway: (name: string) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  transactions, 
  users,
  assets,
  onProcessTransaction, 
  gateways, 
  onUpdateGateway,
  onAddGateway,
  onRemoveGateway,
  onUpdateUser,
  onDeleteUser,
  onRefresh,
  isRefreshing
}) => {
  const [tab, setTab] = useState('requests');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceAdjustment, setBalanceAdjustment] = useState<string>('0');
  
  const [form, setForm] = useState({
    name: '', bankName: '', accountNumber: '', link: '', currency: 'USD',
    merchantName: '', minDeposit: 10, maxDeposit: 1000000, feePercent: 0, logoUrl: ''
  });
  
  const pendingRequests = useMemo(() => 
    transactions.filter(t => t.status === TransactionStatus.PENDING && (t.type === TransactionType.DEPOSIT || t.type === TransactionType.WITHDRAW)),
    [transactions]
  );

  const filteredHistory = useMemo(() => {
    return transactions.filter(tx => {
      const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;
      return matchesType && matchesStatus;
    });
  }, [transactions, typeFilter, statusFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim()) {
      onAddGateway({
        name: form.name.trim(), active: true, bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim(), link: form.link.trim(), currency: form.currency.trim(),
        merchantName: form.merchantName.trim() || 'Ama.zon Corporate',
        minDeposit: Number(form.minDeposit), maxDeposit: Number(form.maxDeposit),
        feePercent: Number(form.feePercent), logoUrl: form.logoUrl.trim()
      });
      setForm({ name: '', bankName: '', accountNumber: '', link: '', currency: 'USD', merchantName: '', minDeposit: 10, maxDeposit: 1000000, feePercent: 0, logoUrl: '' });
    }
  };

  const calculateUserNetWorth = (targetUser: User) => {
    const portfolioValue = assets.reduce((acc, asset) => {
      return acc + (targetUser.portfolio[asset.type] || 0) * asset.price;
    }, 0);
    return Number(targetUser.balance) + portfolioValue;
  };

  const handleAdjustBalance = (type: 'ADD' | 'SUBTRACT') => {
    if (!selectedUser) return;
    const adj = parseFloat(balanceAdjustment);
    if (isNaN(adj) || adj <= 0) return;

    const newBalance = type === 'ADD' 
      ? Number(selectedUser.balance) + adj 
      : Math.max(0, Number(selectedUser.balance) - adj);
    
    const updated = { ...selectedUser, balance: newBalance };
    onUpdateUser(updated);
    setSelectedUser(updated);
    setBalanceAdjustment('0');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-10 border-b border-white/5">
        <div className="flex space-x-12 relative overflow-x-auto pb-1 custom-scrollbar">
          <button onClick={() => setTab('requests')} className={`pb-4 px-2 font-black uppercase tracking-[0.2em] text-[11px] whitespace-nowrap transition-all relative ${tab === 'requests' ? 'text-gold-500' : 'text-slate-500 hover:text-slate-300'}`}>
            Pending Requests ({pendingRequests.length})
            {tab === 'requests' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>}
          </button>
          <button onClick={() => setTab('history')} className={`pb-4 px-2 font-black uppercase tracking-[0.2em] text-[11px] whitespace-nowrap transition-all relative ${tab === 'history' ? 'text-gold-500' : 'text-slate-500 hover:text-slate-300'}`}>
            Transaction History
            {tab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>}
          </button>
          <button onClick={() => setTab('users')} className={`pb-4 px-2 font-black uppercase tracking-[0.2em] text-[11px] whitespace-nowrap transition-all relative ${tab === 'users' ? 'text-gold-500' : 'text-slate-500 hover:text-slate-300'}`}>
            User Maintenance ({users.length})
            {tab === 'users' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>}
          </button>
          <button onClick={() => setTab('settings')} className={`pb-4 px-2 font-black uppercase tracking-[0.2em] text-[11px] whitespace-nowrap transition-all relative ${tab === 'settings' ? 'text-gold-500' : 'text-slate-500 hover:text-slate-300'}`}>
            Merchant Settings
            {tab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>}
          </button>
        </div>
        
        <button 
          onClick={onRefresh}
          className={`flex items-center space-x-2 px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all mb-4 ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {tab === 'requests' && (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl animate-in fade-in duration-500">
          <table className="w-full text-left">
            <thead className="bg-black/40 text-slate-500 text-[10px] uppercase font-black tracking-[0.3em]">
              <tr><th className="p-8">Type / User</th><th className="p-8">Reference / Details</th><th className="p-8 text-center">Amount</th><th className="p-8 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pendingRequests.map(tx => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-8">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${tx.type === TransactionType.DEPOSIT ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{tx.type === TransactionType.DEPOSIT ? <Plus size={16}/> : <ArrowDownRight size={16}/>}</div>
                      <div><div className="text-white font-bold">{tx.userName}</div><div className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{tx.type}</div></div>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="max-w-md">
                      {tx.type === TransactionType.DEPOSIT ? (
                        <div className="flex items-center space-x-2 bg-black/50 px-3 py-2 rounded-xl border border-white/5 w-fit font-mono text-gold-500/80 text-xs"><span>{tx.externalTxId || tx.id}</span><ExternalLink size={12} className="opacity-40" /></div>
                      ) : (
                        <div className="text-xs text-slate-300 bg-red-500/5 border border-red-500/10 p-3 rounded-xl font-mono">{tx.payoutDetails}</div>
                      )}
                      <div className="text-[10px] text-slate-500 font-mono mt-2 uppercase tracking-wider">{new Date(tx.date).toLocaleString()}</div>
                    </div>
                  </td>
                  <td className="p-8 text-center"><div className="font-mono text-xl text-white font-bold">${tx.totalValue.toLocaleString()}</div></td>
                  <td className="p-8 text-right space-x-4">
                    <button onClick={() => onProcessTransaction(tx.id, TransactionStatus.REJECTED)} className="text-red-500 font-black uppercase text-[10px] bg-red-500/5 px-4 py-2 rounded-xl border border-red-500/10 transition-colors hover:bg-red-500 hover:text-white">Reject</button>
                    <button onClick={() => onProcessTransaction(tx.id, TransactionStatus.APPROVED)} className="text-green-500 font-black uppercase text-[10px] bg-green-500/5 px-4 py-2 rounded-xl border border-green-500/10 transition-colors hover:bg-green-500 hover:text-white">Approve</button>
                  </td>
                </tr>
              ))}
              {pendingRequests.length === 0 && (
                <tr><td colSpan={4} className="p-32 text-center text-slate-500 font-black uppercase text-xs tracking-widest">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Database size={48} className="text-slate-800" />
                    <span>No pending liquidity movements.</span>
                    <button onClick={onRefresh} className="text-gold-500 hover:underline">Click to refresh</button>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/50 rounded-[2rem] border border-white/5">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gold-500/10 rounded-xl">
                <Filter className="text-gold-500" size={20} />
              </div>
              <h4 className="text-white font-bold uppercase text-xs tracking-widest">Filter Archive</h4>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest ml-1">Type</p>
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-black border border-white/10 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl outline-none focus:border-gold-500 transition-colors"
                >
                  <option value="ALL">All Types</option>
                  <option value={TransactionType.BUY}>Buy</option>
                  <option value={TransactionType.SELL}>Sell</option>
                  <option value={TransactionType.DEPOSIT}>Deposit</option>
                  <option value={TransactionType.WITHDRAW}>Withdraw</option>
                </select>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest ml-1">Status</p>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-black border border-white/10 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl outline-none focus:border-gold-500 transition-colors"
                >
                  <option value="ALL">All Status</option>
                  <option value={TransactionStatus.APPROVED}>Approved</option>
                  <option value={TransactionStatus.PENDING}>Pending</option>
                  <option value={TransactionStatus.REJECTED}>Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-black/40 text-slate-500 text-[10px] uppercase font-black tracking-[0.3em]">
                  <tr>
                    <th className="p-8">Type / User</th>
                    <th className="p-8">Date / Time</th>
                    <th className="p-8 text-center">Amount</th>
                    <th className="p-8 text-center">Asset/Ref</th>
                    <th className="p-8 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredHistory.map(tx => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-8">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.BUY 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-red-500/10 text-red-500'
                          }`}>
                            {tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.BUY ? <ArrowUpToLine size={16}/> : <ArrowDownToLine size={16}/>}
                          </div>
                          <div>
                            <div className="text-white font-bold">{tx.userName}</div>
                            <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{tx.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-8">
                        <div className="text-xs text-slate-300 font-mono">{new Date(tx.date).toLocaleDateString()}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-wider">{new Date(tx.date).toLocaleTimeString()}</div>
                      </td>
                      <td className="p-8 text-center">
                        <div className="font-mono text-lg text-white font-bold">${tx.totalValue.toLocaleString()}</div>
                        <div className="text-[9px] text-slate-500 font-mono">Qty: {tx.amount.toFixed(4)}</div>
                      </td>
                      <td className="p-8 text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">{tx.assetType || 'FIAT'}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-1 max-w-[120px] truncate mx-auto">{tx.externalTxId || tx.id}</div>
                      </td>
                      <td className="p-8 text-right">
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border ${
                          tx.status === TransactionStatus.APPROVED ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                          tx.status === TransactionStatus.PENDING ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr><td colSpan={5} className="p-32 text-center text-slate-500 font-black uppercase text-xs tracking-widest">No matching history records.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/50 rounded-[2rem] border border-white/5">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gold-500/10 rounded-xl">
                <Users className="text-gold-500" size={20} />
              </div>
              <h4 className="text-white font-bold uppercase text-xs tracking-widest">Search Member Directory</h4>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input 
                type="text" 
                placeholder="Name or Email..." 
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-12 py-3 text-white text-xs outline-none focus:border-gold-500 transition-colors"
              />
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-black/40 text-slate-500 text-[10px] uppercase font-black tracking-[0.3em]">
                <tr><th className="p-8">Identity</th><th className="p-8">Role</th><th className="p-8 text-center">Balance</th><th className="p-8 text-center">Net Worth</th><th className="p-8 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-8"><div className="flex items-center space-x-4"><div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center border border-gold-500/20"><UserCircle className="text-gold-500" size={24} /></div><div><div className="text-white font-bold">{user.name}</div><div className="text-[10px] text-slate-500 font-mono">{user.email}</div></div></div></td>
                    <td className="p-8"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${user.role === 'ADMIN' ? 'bg-red-500/10 text-red-500' : 'bg-gold-500/10 text-gold-500'}`}>{user.role}</span></td>
                    <td className="p-8 text-center"><div className="font-mono text-lg text-white font-bold">${Number(user.balance).toLocaleString()}</div></td>
                    <td className="p-8 text-center"><div className="font-mono text-lg text-gold-500 font-bold">${calculateUserNetWorth(user).toLocaleString()}</div></td>
                    <td className="p-8 text-right">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="p-3 bg-white/5 rounded-xl hover:bg-gold-500/10 transition-colors group"
                      >
                        <Settings size={18} className="text-slate-400 group-hover:text-gold-500 transition-colors"/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="grid lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
          <div className="lg:col-span-12 bg-[#0b101b] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
            <h4 className="text-2xl font-bold text-white mb-8 flex items-center"><CreditCard size={28} className="mr-4 text-gold-500"/> Merchant Account Setup</h4>
            <form onSubmit={handleAddNew} className="mb-10 p-8 bg-black/40 rounded-[2.5rem] border border-white/5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Gateway Name</label>
                  <input type="text" required placeholder="e.g. Bkash, Nagad, Visa" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-black/60 rounded-xl border border-white/10 px-4 py-3 text-white outline-none focus:border-gold-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Merchant Title</label>
                  <input type="text" placeholder="e.g. Ama.zon Corporate" value={form.merchantName} onChange={e => setForm({...form, merchantName: e.target.value})} className="w-full bg-black/60 rounded-xl border border-white/10 px-4 py-3 text-white outline-none focus:border-gold-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Settlement Currency</label>
                  <input type="text" placeholder="USD, BDT, BTC" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="w-full bg-black/60 rounded-xl border border-white/10 px-4 py-3 text-white outline-none focus:border-gold-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Provider/Bank Name</label>
                  <input type="text" placeholder="Bank Name or Provider" value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})} className="w-full bg-black/60 rounded-xl border border-white/10 px-4 py-3 text-white outline-none focus:border-gold-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Account Number / Wallet ID</label>
                  <input type="text" placeholder="Account or Wallet Address" value={form.accountNumber} onChange={e => setForm({...form, accountNumber: e.target.value})} className="w-full bg-black/60 rounded-xl border border-white/10 px-4 py-3 text-white outline-none focus:border-gold-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Merchant Logo URL</label>
                  <div className="relative">
                    <input type="text" placeholder="https://image-link.com/logo.png" value={form.logoUrl} onChange={e => setForm({...form, logoUrl: e.target.value})} className="w-full bg-black/60 rounded-xl border border-white/10 px-4 py-3 pl-10 text-white outline-none focus:border-gold-500" />
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Direct Payment Link (Optional)</label>
                  <div className="relative">
                    <input type="text" placeholder="https://payment-gateway.com/pay" value={form.link} onChange={e => setForm({...form, link: e.target.value})} className="w-full bg-black/60 rounded-xl border border-white/10 px-4 py-3 pl-10 text-white outline-none focus:border-gold-500" />
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Min Deposit</label>
                  <input type="number" value={form.minDeposit} onChange={e => setForm({...form, minDeposit: Number(e.target.value)})} className="w-full bg-black/60 rounded-xl border border-white/10 px-4 py-3 text-white outline-none focus:border-gold-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Max Deposit</label>
                  <input type="number" value={form.maxDeposit} onChange={e => setForm({...form, maxDeposit: Number(e.target.value)})} className="w-full bg-black/60 rounded-xl border border-white/10 px-4 py-3 text-white outline-none focus:border-gold-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Fee %</label>
                  <input type="number" step="0.1" value={form.feePercent} onChange={e => setForm({...form, feePercent: Number(e.target.value)})} className="w-full bg-black/60 rounded-xl border border-white/10 px-4 py-3 text-white outline-none focus:border-gold-500" />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-gold-500 text-black font-black uppercase text-xs rounded-2xl hover:bg-gold-400 transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)]">Add Merchant Gateway</button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gateways.map(gw => (
                <div key={gw.name} className="p-6 bg-black/40 rounded-[2.5rem] border border-white/5 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <button onClick={() => onRemoveGateway(gw.name)} className="text-slate-600 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center overflow-hidden">
                      {gw.logoUrl ? (
                        <img src={gw.logoUrl} alt={gw.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 size={24} className="text-slate-700" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">{gw.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{gw.currency}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] uppercase font-black tracking-widest">
                      <span className="text-slate-600">Status:</span>
                      <span className={gw.active ? 'text-green-500' : 'text-red-500'}>{gw.active ? 'Active' : 'Disabled'}</span>
                    </div>
                    <div className="flex justify-between text-[9px] uppercase font-black tracking-widest">
                      <span className="text-slate-600">Fee:</span>
                      <span className="text-slate-300">{gw.feePercent}%</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={gw.active}
                        onChange={(e) => onUpdateGateway(gw.name, e.target.checked)}
                      />
                      <div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:bg-gold-500/50 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-gold-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                      <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-slate-500 peer-checked:text-gold-500">Enable</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
          <div className="bg-slate-900 border border-white/10 rounded-[3.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in fade-in duration-300">
             <div className="p-10">
                <div className="flex justify-between items-start mb-10">
                  <div className="flex items-center space-x-6">
                     <div className="w-20 h-20 bg-gold-500/10 rounded-[2rem] border border-gold-500/20 flex items-center justify-center">
                        <UserCircle className="text-gold-500" size={48} />
                     </div>
                     <div>
                        <h2 className="text-3xl font-bold text-white mb-1">{selectedUser.name}</h2>
                        <p className="text-slate-500 font-mono text-sm">{selectedUser.email}</p>
                        <div className="flex items-center space-x-2 mt-2">
                           <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase text-slate-400">ID: {selectedUser.id}</span>
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${selectedUser.role === 'ADMIN' ? 'bg-red-500/10 text-red-500' : 'bg-gold-500/10 text-gold-500'}`}>{selectedUser.role}</span>
                        </div>
                     </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-slate-500 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-10">
                   <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Liquid Balance</p>
                      <p className="text-3xl font-mono font-bold text-white">${Number(selectedUser.balance).toLocaleString()}</p>
                   </div>
                   <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Total Equity</p>
                      <p className="text-3xl font-mono font-bold text-gold-500">${calculateUserNetWorth(selectedUser).toLocaleString()}</p>
                   </div>
                </div>

                <div className="space-y-8">
                   <div>
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4 block">Manual Balance Adjustment</label>
                      <div className="flex items-center space-x-4">
                         <div className="relative flex-grow">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500 font-bold">$</span>
                            <input 
                              type="number" 
                              value={balanceAdjustment}
                              onChange={(e) => setBalanceAdjustment(e.target.value)}
                              className="w-full bg-black border border-white/10 rounded-2xl px-10 py-4 text-white font-mono outline-none focus:border-gold-500 transition-all"
                            />
                         </div>
                         <button 
                            onClick={() => handleAdjustBalance('SUBTRACT')}
                            className="px-6 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all font-black uppercase text-[10px]"
                         >
                            Subtract
                         </button>
                         <button 
                            onClick={() => handleAdjustBalance('ADD')}
                            className="px-6 py-4 bg-green-500/10 text-green-500 border border-green-500/20 rounded-2xl hover:bg-green-500 hover:text-white transition-all font-black uppercase text-[10px]"
                         >
                            Add Funds
                         </button>
                      </div>
                   </div>

                   <div className="pt-8 border-t border-white/5">
                      <div className="flex items-center justify-between p-6 bg-red-500/5 border border-red-500/10 rounded-[2rem]">
                         <div className="flex items-center space-x-4">
                            <div className="p-3 bg-red-500/10 rounded-xl">
                               <AlertTriangle className="text-red-500" size={20} />
                            </div>
                            <div>
                               <p className="text-white font-bold text-sm">Delete Account</p>
                               <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Permanent action - cannot be undone</p>
                            </div>
                         </div>
                         <button 
                            onClick={() => {
                              if (confirm(`Are you absolutely sure you want to delete ${selectedUser.name}'s account? This will erase all their portfolio data.`)) {
                                onDeleteUser(selectedUser.id);
                                setSelectedUser(null);
                              }
                            }}
                            className="px-6 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] hover:bg-red-700 transition-all shadow-lg"
                         >
                            Terminated Account
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};


import { User, Transaction, PaymentGateway } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

export const DB = {
  // --- USERS ---
  fetchUsers: async (): Promise<User[]> => {
    if (!isSupabaseConfigured || !supabase) return JSON.parse(localStorage.getItem('local_users') || '[]');
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error("Fetch Users Error:", error.message);
      return [];
    }
    return data as User[];
  },

  syncUser: async (user: User) => {
    if (!isSupabaseConfigured || !supabase) {
      const local = JSON.parse(localStorage.getItem('local_users') || '[]');
      const index = local.findIndex((u: any) => u.id === user.id);
      if (index > -1) local[index] = user; else local.push(user);
      localStorage.setItem('local_users', JSON.stringify(local));
      return;
    }
    
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      phone: user.phone,
      role: user.role,
      balance: user.balance,
      portfolio: user.portfolio
    });
    
    if (error) {
      console.error("Sync User Error:", error.message, error.details);
      throw new Error(`Failed to save user to database: ${error.message}`);
    }
  },

  deleteUser: async (userId: string) => {
    if (!isSupabaseConfigured || !supabase) {
      const local = JSON.parse(localStorage.getItem('local_users') || '[]');
      const filtered = local.filter((u: any) => u.id !== userId);
      localStorage.setItem('local_users', JSON.stringify(filtered));
      return;
    }
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) {
      console.error("Delete User Error:", error.message);
      throw error;
    }
  },

  // --- TRANSACTIONS ---
  fetchTransactions: async (): Promise<Transaction[]> => {
    if (!isSupabaseConfigured || !supabase) return JSON.parse(localStorage.getItem('local_txs') || '[]');
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Fetch Transactions Error:", error.message);
      return [];
    }

    return (data || []).map((t: any) => ({
      id: t.id,
      userId: t.user_id,
      userName: t.user_name,
      assetType: t.asset_type,
      amount: Number(t.amount),
      priceAtRequest: Number(t.price_at_request),
      totalValue: Number(t.total_value),
      type: t.type,
      status: t.status,
      date: t.created_at || t.date,
      externalTxId: t.external_tx_id,
      payoutDetails: t.payout_details
    })) as Transaction[];
  },

  addTransaction: async (tx: Transaction) => {
    if (!isSupabaseConfigured || !supabase) {
      const local = JSON.parse(localStorage.getItem('local_txs') || '[]');
      local.unshift(tx);
      localStorage.setItem('local_txs', JSON.stringify(local));
      return;
    }
    const { error } = await supabase.from('transactions').insert([{
      id: tx.id,
      user_id: tx.userId,
      user_name: tx.userName,
      asset_type: tx.assetType,
      amount: tx.amount,
      price_at_request: tx.priceAtRequest,
      total_value: tx.totalValue,
      type: tx.type,
      status: tx.status,
      external_tx_id: tx.externalTxId,
      payout_details: tx.payoutDetails
    }]);
    if (error) {
      console.error("Add Transaction Error:", error.message);
    }
  },

  updateTransactionStatus: async (id: string, status: string) => {
    if (!isSupabaseConfigured || !supabase) {
      const local = JSON.parse(localStorage.getItem('local_txs') || '[]');
      const index = local.findIndex((t: any) => t.id === id);
      if (index > -1) local[index].status = status;
      localStorage.setItem('local_txs', JSON.stringify(local));
      return;
    }
    const { error } = await supabase.from('transactions').update({ status }).eq('id', id);
    if (error) console.error("Update Status Error:", error.message);
  },

  // --- GATEWAYS ---
  fetchGateways: async (): Promise<PaymentGateway[]> => {
    if (!isSupabaseConfigured || !supabase) return JSON.parse(localStorage.getItem('local_gateways') || '[]');
    const { data, error } = await supabase.from('payment_gateways').select('*');
    if (error) {
      console.error("Fetch Gateways Error:", error.message);
      return [];
    }
    return (data || []).map((g: any) => ({
      name: g.name,
      active: g.active,
      apiKey: g.api_key,
      bankName: g.bank_name,
      accountNumber: g.account_number,
      merchantName: g.merchant_name,
      currency: g.currency,
      minDeposit: g.min_deposit,
      maxDeposit: g.max_deposit,
      feePercent: g.fee_percent,
      logoUrl: g.logo_url
    })) as PaymentGateway[];
  },

  saveGateway: async (gw: PaymentGateway) => {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.from('payment_gateways').upsert({
      name: gw.name,
      active: gw.active,
      api_key: gw.apiKey,
      bank_name: gw.bankName,
      account_number: gw.accountNumber,
      merchant_name: gw.merchantName,
      currency: gw.currency,
      min_deposit: gw.minDeposit,
      max_deposit: gw.maxDeposit,
      fee_percent: gw.feePercent,
      logo_url: gw.logoUrl
    });
    if (error) console.error("Save Gateway Error:", error.message);
  }
};

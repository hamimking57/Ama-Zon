
import { User, Transaction, PaymentGateway } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

// High-integrity Local Backup system
const LocalBackup = {
  get: (key: string) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("LocalBackup Get Error:", e);
      return [];
    }
  },
  set: (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("LocalBackup Set Error:", e);
    }
  },
  saveItem: (key: string, item: any, idKey: string = 'id') => {
    const data = LocalBackup.get(key);
    const index = data.findIndex((i: any) => i[idKey] === item[idKey]);
    if (index > -1) {
      data[index] = { ...data[index], ...item };
    } else {
      data.push(item);
    }
    LocalBackup.set(key, data);
  }
};

export const DB = {
  // --- USERS ---
  fetchUsers: async (): Promise<User[]> => {
    const localData = LocalBackup.get('ama_users');
    if (!isSupabaseConfigured || !supabase) return localData;

    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      if (data) {
        const formatted = data.map((u: any) => ({
          ...u,
          lastLogin: u.last_login || u.lastLogin || new Date().toISOString()
        }));
        LocalBackup.set('ama_users', formatted);
        return formatted as User[];
      }
      return localData;
    } catch (err) {
      console.error("Cloud Fetch Users Failed:", err);
      return localData;
    }
  },

  syncUser: async (user: User) => {
    LocalBackup.saveItem('ama_users', user);
    const currentId = localStorage.getItem('ama_session_user_id');
    if (currentId === user.id) {
      localStorage.setItem('ama_session_user', JSON.stringify(user));
    }
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('users').upsert({
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        phone: user.phone,
        role: user.role,
        balance: user.balance,
        portfolio: user.portfolio,
        last_login: user.lastLogin
      }, { onConflict: 'id' });
    } catch (err) {
      console.error("User Sync Error:", err);
    }
  },

  deleteUser: async (userId: string) => {
    const local = LocalBackup.get('ama_users').filter((u: any) => u.id !== userId);
    LocalBackup.set('ama_users', local);
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('users').delete().eq('id', userId);
    } catch (err) {
      console.error("Delete User Error:", err);
    }
  },

  // --- TRANSACTIONS ---
  fetchTransactions: async (): Promise<Transaction[]> => {
    const localTx = LocalBackup.get('ama_txs');
    if (!isSupabaseConfigured || !supabase) return localTx;
    try {
      const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const formatted = data.map((t: any) => ({
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
        }));
        LocalBackup.set('ama_txs', formatted);
        return formatted as Transaction[];
      }
      return localTx;
    } catch (err) {
      return localTx;
    }
  },

  addTransaction: async (tx: Transaction) => {
    LocalBackup.saveItem('ama_txs', tx);
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('transactions').insert([{
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
    } catch (err) {
      console.error("Transaction Creation Error:", err);
    }
  },

  updateTransactionStatus: async (id: string, status: string) => {
    const local = LocalBackup.get('ama_txs');
    const index = local.findIndex((t: any) => t.id === id);
    if (index > -1) local[index].status = status;
    LocalBackup.set('ama_txs', local);
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('transactions').update({ status }).eq('id', id);
    } catch (err) {
      console.error("Status Update Failed:", err);
    }
  },

  // --- GATEWAYS ---
  fetchGateways: async (): Promise<PaymentGateway[]> => {
    const localGw = LocalBackup.get('ama_gateways');
    if (!isSupabaseConfigured || !supabase) return localGw;
    try {
      const { data, error } = await supabase.from('payment_gateways').select('*');
      if (error) throw error;
      if (data) {
        const formatted = data.map((g: any) => ({
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
        }));
        LocalBackup.set('ama_gateways', formatted);
        return formatted as PaymentGateway[];
      }
      return []; // Return empty array if no data
    } catch (err) {
      console.error("Gateway Fetch Error:", err);
      return localGw;
    }
  },

  saveGateway: async (gw: PaymentGateway) => {
    LocalBackup.saveItem('ama_gateways', gw, 'name');
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('payment_gateways').upsert({
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
      }, { onConflict: 'name' });
    } catch (err) {
      console.error("Gateway Save Error:", err);
    }
  }
};

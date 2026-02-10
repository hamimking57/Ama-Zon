
import { User, Transaction, PaymentGateway } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

// Helper to manage local storage backups
const LocalBackup = {
  get: (key: string) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data)),
  saveItem: (key: string, item: any, idKey: string = 'id') => {
    const data = LocalBackup.get(key);
    const index = data.findIndex((i: any) => i[idKey] === item[idKey]);
    if (index > -1) data[index] = item; else data.push(item);
    LocalBackup.set(key, data);
  }
};

export const DB = {
  // --- USERS ---
  fetchUsers: async (): Promise<User[]> => {
    const localData = LocalBackup.get('local_users');
    if (!isSupabaseConfigured || !supabase) return localData;

    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        LocalBackup.set('local_users', data); // Update local backup with cloud data
        return data as User[];
      }
      return localData;
    } catch (err) {
      console.warn("DB Fetch Users failed, using local backup:", err);
      return localData;
    }
  },

  syncUser: async (user: User) => {
    // Always save to local first for instant persistence
    LocalBackup.saveItem('local_users', user);

    if (!isSupabaseConfigured || !supabase) return;

    try {
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
      if (error) throw error;
    } catch (err) {
      console.error("Cloud Sync User Error:", err);
    }
  },

  deleteUser: async (userId: string) => {
    const local = LocalBackup.get('local_users').filter((u: any) => u.id !== userId);
    LocalBackup.set('local_users', local);

    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
    } catch (err) {
      console.error("Cloud Delete User Error:", err);
    }
  },

  // --- TRANSACTIONS ---
  fetchTransactions: async (): Promise<Transaction[]> => {
    const localTx = LocalBackup.get('local_txs');
    if (!isSupabaseConfigured || !supabase) return localTx;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
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
        LocalBackup.set('local_txs', formatted);
        return formatted as Transaction[];
      }
      return localTx;
    } catch (err) {
      console.warn("DB Fetch Transactions failed, using local backup:", err);
      return localTx;
    }
  },

  addTransaction: async (tx: Transaction) => {
    // Local first
    const local = LocalBackup.get('local_txs');
    local.unshift(tx);
    LocalBackup.set('local_txs', local);

    if (!isSupabaseConfigured || !supabase) return;

    try {
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
      if (error) throw error;
    } catch (err) {
      console.error("Cloud Add Transaction Error:", err);
    }
  },

  updateTransactionStatus: async (id: string, status: string) => {
    const local = LocalBackup.get('local_txs');
    const index = local.findIndex((t: any) => t.id === id);
    if (index > -1) local[index].status = status;
    LocalBackup.set('local_txs', local);

    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase.from('transactions').update({ status }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error("Cloud Update Status Error:", err);
    }
  },

  // --- GATEWAYS ---
  fetchGateways: async (): Promise<PaymentGateway[]> => {
    const localGw = LocalBackup.get('local_gateways');
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
        LocalBackup.set('local_gateways', formatted);
        return formatted as PaymentGateway[];
      }
      return localGw;
    } catch (err) {
      return localGw;
    }
  },

  saveGateway: async (gw: PaymentGateway) => {
    LocalBackup.saveItem('local_gateways', gw, 'name');
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
      });
    } catch (err) {
      console.error("Cloud Save Gateway Error:", err);
    }
  }
};

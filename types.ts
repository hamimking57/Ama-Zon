
export enum AssetType {
  DIAMOND = 'DIAMOND',
  GOLD = 'GOLD',
  ANTIMATTER = 'ANTIMATTER',
  AI_COMPUTE = 'AI_COMPUTE',
  BITCOIN = 'BITCOIN',
  SILVER = 'SILVER',
  PLATINUM = 'PLATINUM',
  FUSION_ENERGY = 'FUSION_ENERGY',
  NEURAL_LINK = 'NEURAL_LINK'
}

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface Asset {
  type: AssetType;
  name: string;
  symbol: string;
  price: number;
  change24h: number; // Percentage
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  balance: number;
  portfolio: Record<AssetType, number>; // Amount owned
  lastLogin?: string; // ISO string of last activity
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  assetType?: AssetType; // Optional because DEPOSIT doesn't have an asset
  amount: number; // Quantity
  priceAtRequest: number; // Price per unit
  totalValue: number;
  type: TransactionType;
  status: TransactionStatus;
  date: string;
  externalTxId?: string; // For Admin verification of deposits/withdrawals
  payoutDetails?: string; // For withdrawals
}

export interface PaymentGateway {
  name: string;
  active: boolean;
  apiKey: string;
  bankName?: string;
  accountNumber?: string;
  link?: string;
  currency?: string;
  minDeposit?: number;
  maxDeposit?: number;
  feePercent?: number;
  merchantName?: string;
  logoUrl?: string;
}

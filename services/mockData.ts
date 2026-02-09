
import { Asset, AssetType } from '../types';

export const INITIAL_ASSETS: Asset[] = [
  { 
    type: AssetType.BITCOIN, 
    name: 'Bitcoin', 
    symbol: 'BTC', 
    price: 94250.50, 
    change24h: 2.1, 
    color: '#F7931A' 
  },
  { 
    type: AssetType.DIAMOND, 
    name: 'Blue Diamond', 
    symbol: 'DMD', 
    price: 15500.00, 
    change24h: -0.2, 
    color: '#60A5FA' 
  },
  { 
    type: AssetType.GOLD, 
    name: '24K Gold', 
    symbol: 'XAU', 
    price: 2750.80, 
    change24h: 0.4, 
    color: '#FACC15' 
  },
  { 
    type: AssetType.PLATINUM, 
    name: 'Platinum', 
    symbol: 'XPT', 
    price: 980.50, 
    change24h: 1.2, 
    color: '#E5E4E2' 
  },
  { 
    type: AssetType.SILVER, 
    name: 'Silver', 
    symbol: 'XAG', 
    price: 32.40, 
    change24h: 1.5, 
    color: '#C0C0C0' 
  }
];

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const fluctuatePrices = (assets: Asset[]): Asset[] => {
  return assets.map(asset => {
    const volatility = asset.type === AssetType.BITCOIN ? 0.015 : 0.005; 
    const change = 1 + (Math.random() * volatility * 2 - volatility);
    const newPrice = asset.price * change;
    return {
      ...asset,
      price: parseFloat(newPrice.toFixed(2)),
      change24h: parseFloat((asset.change24h + (Math.random() * 0.4 - 0.2)).toFixed(2))
    };
  });
};

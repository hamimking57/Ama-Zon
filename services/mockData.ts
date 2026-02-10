
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
    type: AssetType.ANTIMATTER, 
    name: 'Anti-Matter Particles', 
    symbol: 'AM', 
    price: 625000000, 
    change24h: 0.05, 
    color: '#D8B4FE' 
  },
  { 
    type: AssetType.AI_COMPUTE, 
    name: 'AGI Compute Tokens', 
    symbol: 'AIX', 
    price: 125400.00, 
    change24h: 8.4, 
    color: '#22D3EE' 
  },
  { 
    type: AssetType.NEURAL_LINK, 
    name: 'Neural Link Arrays', 
    symbol: 'NLA', 
    price: 45200.00, 
    change24h: -1.2, 
    color: '#FB7185' 
  },
  { 
    type: AssetType.FUSION_ENERGY, 
    name: 'Fusion Energy Credits', 
    symbol: 'FEC', 
    price: 8500.00, 
    change24h: 4.7, 
    color: '#34D399' 
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
  }
];

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
};

export const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

export const fluctuatePrices = (assets: Asset[]): Asset[] => {
  return assets.map(asset => {
    const volatility = (asset.type === AssetType.BITCOIN || asset.type === AssetType.AI_COMPUTE || asset.type === AssetType.FUSION_ENERGY) ? 0.015 : 0.005; 
    const change = 1 + (Math.random() * volatility * 2 - volatility);
    const newPrice = asset.price * change;
    return {
      ...asset,
      price: parseFloat(newPrice.toFixed(2)),
      change24h: parseFloat((asset.change24h + (Math.random() * 0.4 - 0.2)).toFixed(2))
    };
  });
};

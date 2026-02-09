import { Asset, AssetType } from './types';

export const INITIAL_ASSETS: Asset[] = [
  { 
    type: AssetType.ANTIMATTER, 
    name: 'Anti-Matter Particles', 
    symbol: 'AM', 
    price: 625000000, // Representing a fractional gram price
    change24h: 0.05, 
    color: '#D8B4FE' // Violet/Glow
  },
  { 
    type: AssetType.AI_COMPUTE, 
    name: 'AGI Compute Tokens', 
    symbol: 'AIX', 
    price: 125400.00, 
    change24h: 8.4, 
    color: '#22D3EE' // Cyan
  },
  { 
    type: AssetType.BITCOIN, 
    name: 'Bitcoin', 
    symbol: 'BTC', 
    price: 94250.50, 
    change24h: 2.1, 
    color: '#F7931A' // Orange
  },
  { 
    type: AssetType.DIAMOND, 
    name: 'Blue Diamond', 
    symbol: 'BDMD', 
    price: 3950000.00, 
    change24h: -0.2, 
    color: '#60A5FA' // Blue
  },
  { 
    type: AssetType.GOLD, 
    name: '24K Pure Gold', 
    symbol: 'XAU', 
    price: 2750.80, 
    change24h: 0.4, 
    color: '#FACC15' // Gold
  },
];

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const fluctuatePrices = (assets: Asset[]): Asset[] => {
  return assets.map(asset => {
    // High volatility for AI and Bitcoin, stable for Gold and Diamonds
    const volatility = asset.type === AssetType.AI_COMPUTE || asset.type === AssetType.BITCOIN ? 0.015 : 0.003; 
    const change = 1 + (Math.random() * volatility * 2 - volatility);
    const newPrice = asset.price * change;
    return {
      ...asset,
      price: parseFloat(newPrice.toFixed(2)),
      change24h: parseFloat((asset.change24h + (Math.random() * 0.4 - 0.2)).toFixed(2))
    };
  });
};
import React from 'react';
import { TrendingUp, TrendingDown, Bitcoin, Atom, Cpu, Gem, CircleDot } from 'lucide-react';
import { Asset, AssetType } from './types';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface AssetCardProps {
  asset: Asset;
  onBuy: (asset: Asset) => void;
  onSell: (asset: Asset) => void;
  userOwnedAmount: number;
}

const getIcon = (type: AssetType) => {
  switch (type) {
    case AssetType.ANTIMATTER: return <Atom className="text-purple-400 animate-pulse" size={32} />;
    case AssetType.AI_COMPUTE: return <Cpu className="text-cyan-400" size={32} />;
    case AssetType.BITCOIN: return <Bitcoin className="text-orange-500" size={32} />;
    case AssetType.DIAMOND: return <Gem className="text-blue-400" size={32} />;
    case AssetType.GOLD: return <CircleDot className="text-gold-500" size={32} />;
    default: return <CircleDot size={32} />;
  }
};

const generateChartData = (currentPrice: number) => {
  const data = [];
  let price = currentPrice * 0.95;
  for (let i = 0; i < 20; i++) {
    price = price * (1 + (Math.random() * 0.02 - 0.01));
    data.push({ price });
  }
  data.push({ price: currentPrice });
  return data;
};

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onBuy, onSell, userOwnedAmount }) => {
  const isPositive = asset.change24h >= 0;
  const chartData = React.useMemo(() => generateChartData(asset.price), [asset.price]);

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl hover:border-gold-500/50 transition-all duration-500 group">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-black border border-white/5 group-hover:bg-gold-500/10 transition-colors duration-500">
            {getIcon(asset.type)}
          </div>
          <div>
            <h3 className="font-bold text-white text-xl">{asset.name}</h3>
            <span className="text-xs text-slate-500 font-mono tracking-widest uppercase">{asset.symbol}</span>
          </div>
        </div>
        <div className={`flex items-center text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp size={18} className="mr-1" /> : <TrendingDown size={18} className="mr-1" />}
          {Math.abs(asset.change24h)}%
        </div>
      </div>

      <div className="h-32 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`gradient-${asset.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={asset.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={asset.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Area type="monotone" dataKey="price" stroke={asset.color} fillOpacity={1} fill={`url(#gradient-${asset.symbol})`} strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-slate-500 text-[10px] mb-1 uppercase font-black tracking-[0.2em]">Unit Valuation</p>
          <p className="text-2xl font-bold font-mono text-white">
            ${asset.price > 1000000 ? (asset.price / 1000000).toFixed(2) + 'M' : asset.price.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-500 text-[10px] mb-1 uppercase font-black tracking-[0.2em]">Held</p>
          <p className="text-lg font-bold text-gold-500">{userOwnedAmount.toFixed(asset.type === AssetType.ANTIMATTER ? 6 : 2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onSell(asset)} disabled={userOwnedAmount <= 0} className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all disabled:opacity-20">Sell</button>
        <button onClick={() => onBuy(asset)} className="py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-bold shadow-lg transition-all hover:scale-[1.02]">Buy</button>
      </div>
    </div>
  );
};
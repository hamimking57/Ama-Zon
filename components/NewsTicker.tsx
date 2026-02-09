import React from 'react';
import { Radio } from 'lucide-react';

const NEWS_ITEMS = [
  "CERN announces breakthrough in Anti-Matter stabilization; prices expected to surge.",
  "OpenAI's AGI 2.0 release causes massive volatility in Compute Tokens.",
  "Central Banks increase Gold reserves as global digital currency adoption spikes.",
  "Rare Blue Diamond discovered in Martian crater; BDMD market stabilizes.",
  "SEC approves leveraged Bitcoin ETFs for institutional Quantum accounts.",
  "Ama.zon reaches $100T in managed asset valuation."
];

export const NewsTicker: React.FC = () => {
  return (
    <div className="bg-black border-b border-gold-500/20 py-2 overflow-hidden whitespace-nowrap relative z-[60]">
      <div className="flex items-center space-x-8 animate-marquee">
        {[...NEWS_ITEMS, ...NEWS_ITEMS].map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2">
            <Radio size={12} className="text-gold-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {item}
            </span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 60s linear infinite;
        }
      `}</style>
    </div>
  );
};
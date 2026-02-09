import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Asset } from '../types';

interface AIAssistantProps {
  assets: Asset[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ assets }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: "Welcome to the Ama.zon Intelligence Portal. I am your Quantum Analyst. How can I assist your portfolio today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const marketContext = assets.map(a => `${a.name} (${a.symbol}) is currently priced at $${a.price.toLocaleString()}`).join(', ');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are the Ama.zon AI Market Analyst. The current market state is: ${marketContext}. 
                  The user says: "${userMsg}". 
                  Provide a brief, high-end, professional financial analysis or answer. Keep it under 100 words.`,
      });

      setMessages(prev => [...prev, { role: 'bot', text: response.text || "I am currently recalibrating my data streams. Please try again." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "Connection to Quantum Core lost. Please check your credentials." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-gold-500 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.4)] flex items-center justify-center text-black hover:scale-110 transition-all group"
        >
          <Bot size={32} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-black rounded-full animate-ping"></span>
        </button>
      ) : (
        <div className="w-80 md:w-96 h-[500px] bg-slate-900 border border-gold-500/30 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="p-5 bg-black border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gold-500/10 rounded-lg">
                <Sparkles className="text-gold-500" size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Quantum Analyst</h4>
                <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Active Core</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-grow p-5 overflow-y-auto space-y-4 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-gold-500 text-black font-medium rounded-tr-none' 
                    : 'bg-black border border-white/5 text-slate-300 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-black border border-white/5 p-4 rounded-2xl rounded-tl-none">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-black border-t border-white/5">
            <div className="flex space-x-2">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask about market volatility..."
                className="flex-grow bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-gold-500 transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={isTyping}
                className="p-2 bg-gold-500 text-black rounded-xl hover:bg-gold-400 transition-all disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
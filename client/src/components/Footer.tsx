import React from 'react';
import { Compass, Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-emerald-950 border-t border-emerald-900/60 py-8 px-4 mt-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-lime-400 to-emerald-600 p-2 rounded-xl text-emerald-950 font-black shadow-lg shadow-lime-500/20">
              <Compass size={20} className="animate-spin-slow" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3 text-xs text-emerald-200/60">
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-lime-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-lime-400 transition-colors">Contact Support</a>
            <a href="#" className="flex items-center gap-1 hover:text-emerald-100 transition-colors">
              <Github size={14} />
              <span>GitHub</span>
            </a>
          </div>
          <p className="text-center md:text-right mt-2 md:mt-0 italic opacity-80">
            Hackathon submission for Hack2skill PromptWars Challenge 4.<br />
            Not an official FIFA product.
          </p>
        </div>
      </div>
    </footer>
  );
};

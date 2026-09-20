import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface HelpTipProps {
  id?: string;
  title?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  variant?: 'amber' | 'blue' | 'emerald';
  badgeText?: string;
}

export const HelpTip: React.FC<HelpTipProps> = ({
  id,
  title = '이렇게 하면 돼요!',
  children,
  defaultExpanded = true,
  variant = 'amber',
  badgeText = '선생님 & 학생 도움말'
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  const colors = {
    amber: {
      bg: 'bg-amber-50/90 border-amber-200 text-amber-900',
      iconBg: 'bg-amber-500 text-white',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      header: 'text-amber-900 font-bold',
      toggleBtn: 'text-amber-700 hover:bg-amber-100/60'
    },
    blue: {
      bg: 'bg-sky-50/90 border-sky-200 text-sky-900',
      iconBg: 'bg-sky-500 text-white',
      badge: 'bg-sky-100 text-sky-800 border-sky-300',
      header: 'text-sky-900 font-bold',
      toggleBtn: 'text-sky-700 hover:bg-sky-100/60'
    },
    emerald: {
      bg: 'bg-emerald-50/90 border-emerald-200 text-emerald-900',
      iconBg: 'bg-emerald-500 text-white',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      header: 'text-emerald-900 font-bold',
      toggleBtn: 'text-emerald-700 hover:bg-emerald-100/60'
    }
  }[variant];

  return (
    <div
      id={id}
      className={`rounded-2xl border p-4 my-3 transition-all duration-200 shadow-xs ${colors.bg}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${colors.iconBg}`}>
            <Lightbulb className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full border font-semibold tracking-wide uppercase">
                {badgeText}
              </span>
            </div>
            <h4 className={`text-base tracking-tight mt-0.5 ${colors.header}`}>
              💡 {title}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${colors.toggleBtn}`}
          aria-expanded={isOpen}
        >
          <span>{isOpen ? '접기' : '자세히 보기'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-current/10 text-sm leading-relaxed space-y-2 text-slate-700">
          {children}
        </div>
      )}
    </div>
  );
};

export const MiniHelp: React.FC<{ text: string }> = ({ text }) => {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300/80">
      <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <span>{text}</span>
    </span>
  );
};

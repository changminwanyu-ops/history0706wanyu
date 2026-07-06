import React from 'react';
import { HistoryEvent } from '../types';
import { Castle, Ship, Scroll, Compass, HelpCircle, Info } from 'lucide-react';

interface HistoryCardProps {
  event: HistoryEvent;
  isDragging: boolean;
  showYears: boolean;
  onDragStart: (e: React.DragEvent, eventId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onShowDetail: (event: HistoryEvent) => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  event,
  isDragging,
  showYears,
  onDragStart,
  onDragEnd,
  onShowDetail,
}) => {
  // Map icons
  const renderIcon = () => {
    const iconClass = "w-5 h-5 transition-transform group-hover:scale-110";
    switch (event.iconName) {
      case 'Castle':
        return <Castle className={iconClass} />;
      case 'Ship':
        return <Ship className={iconClass} />;
      case 'Scroll':
        return <Scroll className={iconClass} />;
      case 'Compass':
        return <Compass className={iconClass} />;
      default:
        return <HelpCircle className={iconClass} />;
    }
  };

  // Theme styling mapping
  const themeClasses = {
    amber: {
      border: 'border-amber-200 hover:border-amber-400 bg-amber-50/70 text-amber-900',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      iconContainer: 'bg-amber-100 text-amber-700',
      shadow: 'shadow-amber-100/50 hover:shadow-amber-200/50',
      accentBar: 'bg-amber-500',
    },
    emerald: {
      border: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/70 text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconContainer: 'bg-emerald-100 text-emerald-700',
      shadow: 'shadow-emerald-100/50 hover:shadow-emerald-200/50',
      accentBar: 'bg-emerald-500',
    },
    rose: {
      border: 'border-rose-200 hover:border-rose-400 bg-rose-50/70 text-rose-900',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      iconContainer: 'bg-rose-100 text-rose-700',
      shadow: 'shadow-rose-100/50 hover:shadow-rose-200/50',
      accentBar: 'bg-rose-500',
    },
    indigo: {
      border: 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/70 text-indigo-900',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      iconContainer: 'bg-indigo-100 text-indigo-700',
      shadow: 'shadow-indigo-100/50 hover:shadow-indigo-200/50',
      accentBar: 'bg-indigo-500',
    },
  }[event.colorTheme];

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart(e, event.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={`
        group relative flex flex-col justify-between 
        w-full sm:w-64 min-h-[175px] p-4 
        border-2 rounded-lg shadow-md cursor-grab active:cursor-grabbing
        transition-all duration-300 transform hover:-translate-y-1
        ${themeClasses.border} ${themeClasses.shadow}
        ${isDragging ? 'opacity-40 scale-95 border-dashed border-slate-400 bg-slate-100/50' : 'opacity-100'}
      `}
      id={`card-${event.id}`}
    >
      {/* Decorative Top Accent Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-md ${themeClasses.accentBar}`} />

      {/* Header section with Icon, Title and optionally Year */}
      <div>
        <div className="flex items-start justify-between gap-2 mt-1 mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${themeClasses.iconContainer}`}>
              {renderIcon()}
            </div>
            <h3 className="font-sans font-bold text-base tracking-tight leading-snug">
              {event.title}
            </h3>
          </div>

          {/* Year/Period Badge */}
          {showYears && (
            <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${themeClasses.badge} shrink-0`}>
              {event.period}
            </span>
          )}
        </div>

        {/* Short Highlight Highlight sentence */}
        <p className="text-xs font-semibold text-slate-700 mb-1.5 line-clamp-1">
          ✦ {event.highlight}
        </p>

        {/* Short description preview */}
        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
          {event.description}
        </p>
      </div>

      {/* Quick Details Trigger in Footer */}
      <div className="mt-4 pt-2.5 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-mono">ID: {event.id.replace('-era', '')}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowDetail(event);
          }}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-900 font-medium transition-colors"
          title="看詳細事件歷史故事"
          id={`btn-detail-${event.id}`}
        >
          <Info className="w-3.5 h-3.5" />
          故事背景
        </button>
      </div>
    </div>
  );
};

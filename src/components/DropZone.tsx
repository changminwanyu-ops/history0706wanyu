import React, { useState } from 'react';
import { HistoryEvent } from '../types';
import { PlusCircle, Move } from 'lucide-react';

interface DropZoneProps {
  index: number;
  assignedCard: HistoryEvent | null;
  onCardDrop: (eventId: string, targetSlotIndex: number) => void;
  onCardDragStartFromSlot: (e: React.DragEvent, eventId: string, slotIndex: number) => void;
  onCardDragEnd: (e: React.DragEvent) => void;
  onShowDetail: (event: HistoryEvent) => void;
  showYears: boolean;
  currentlyDraggingId: string | null;
}

export const DropZone: React.FC<DropZoneProps> = ({
  index,
  assignedCard,
  onCardDrop,
  onCardDragStartFromSlot,
  onCardDragEnd,
  onShowDetail,
  showYears,
  currentlyDraggingId,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Label names for chronological slots in Taiwan's history flow
  const slotLabels = ['第一時期', '第二時期', '第三時期', '第四時期'];
  const slotHistoricalHints = ['最早期', '第二順位', '第三順位', '最晚期'];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required to allow drop
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const eventId = e.dataTransfer.getData('text/plain');
    if (eventId) {
      onCardDrop(eventId, index);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center
        w-full sm:w-68 min-h-[200px] rounded-lg border-2 border-dashed
        transition-all duration-300 ease-out p-1
        ${
          assignedCard
            ? 'border-slate-300 bg-slate-50/20'
            : isDragOver
            ? 'border-indigo-500 bg-indigo-50/80 scale-102 shadow-md' // Darker background and scale hint on hover
            : currentlyDraggingId
            ? 'border-slate-400 bg-slate-100/60 animate-pulse' // Subtle highlight when user is holding a card
            : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/50'
        }
      `}
      id={`drop-zone-${index}`}
    >
      {/* Background Index Indicator */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-0 select-none">
        <span className="font-mono text-xs font-bold text-slate-400">
          0{index + 1}
        </span>
        <span className="text-[10px] font-semibold text-slate-400 px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200">
          {slotLabels[index]}
        </span>
      </div>

      {assignedCard ? (
        // Inner drag handle to let card be dragged out of the DropZone
        <div
          draggable
          onDragStart={(e) => onCardDragStartFromSlot(e, assignedCard.id, index)}
          onDragEnd={onCardDragEnd}
          className="w-full h-full p-2 cursor-grab active:cursor-grabbing"
        >
          {/* Re-render the HistoryCard, styled perfectly */}
          <div className="pointer-events-none">
            {/* Card Content rendered statically inside DropZone wrapper */}
            <div className="relative flex flex-col justify-between w-full p-4 border rounded-lg bg-white shadow-sm border-slate-200">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-indigo-500" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-slate-900">{assignedCard.title}</h4>
                  {showYears && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border">
                      {assignedCard.period}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1 italic mb-1">
                  ✦ {assignedCard.highlight}
                </p>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {assignedCard.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                  <Move className="w-3 h-3" />
                  按住可重新拖曳
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowDetail(assignedCard);
                  }}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer pointer-events-auto"
                >
                  看詳細背景
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Empty Slot Content
        <div className="flex flex-col items-center justify-center text-center p-6 select-none z-10">
          <PlusCircle className={`w-8 h-8 mb-2 transition-transform duration-300 ${isDragOver ? 'scale-125 text-indigo-600' : 'text-slate-300'}`} />
          <p className="text-xs font-medium text-slate-500 mb-1">
            {isDragOver ? '放開以放置此卡片' : '拖曳卡片放置至此'}
          </p>
          <span className="text-[10px] text-slate-400 font-sans">
            ({slotHistoricalHints[index]})
          </span>
        </div>
      )}
    </div>
  );
};

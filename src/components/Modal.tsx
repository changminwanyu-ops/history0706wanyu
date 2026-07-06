import React, { useState, useEffect } from 'react';
import { HistoryEvent } from '../types';
import { X, CheckCircle2, AlertTriangle, BookOpen, RotateCcw, Send, Sparkles, Trophy, Clock, HelpCircle } from 'lucide-react';
import { playSound } from '../utils/audio';
import { saveScore } from '../lib/firebase';

interface ModalProps {
  isOpen: boolean;
  type: 'detail' | 'success' | 'failure';
  event?: HistoryEvent | null; // For detail view
  onClose: () => void;
  onResetGame?: () => void; // For success view to play again
  timeInSeconds?: number;
  attempts?: number;
  showYearsUsed?: boolean;
  onScoreSubmitted?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  type,
  event,
  onClose,
  onResetGame,
  timeInSeconds = 0,
  attempts = 1,
  showYearsUsed = false,
  onScoreSubmitted,
}) => {
  const [playerName, setPlayerName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Reset local state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPlayerName('');
      setIsSubmitting(false);
      setIsSubmitted(false);
      setSubmissionError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = playerName.trim();
    if (!trimmedName) return;

    playSound('click');
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      await saveScore({
        name: trimmedName,
        timeInSeconds,
        attempts,
        showYearsUsed,
      });
      setIsSubmitted(true);
      playSound('success');
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    } catch (err) {
      console.error('Error submitting score:', err);
      setSubmissionError('網路連線不穩或伺服器忙碌，請稍後重試！');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHeaderIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 mb-3 animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>
        );
      case 'failure':
        return (
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-rose-100 text-rose-600 mb-3 animate-pulse">
            <AlertTriangle className="w-9 h-9" />
          </div>
        );
      case 'detail':
        return (
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-50 text-indigo-600">
            <BookOpen className="w-5 h-5" />
          </div>
        );
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = (seconds % 60).toFixed(2);
      return `${mins} 分 ${secs} 秒`;
    }
    return `${seconds.toFixed(2)} 秒`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop overlay */}
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
          aria-hidden="true"
          onClick={() => {
            playSound('click');
            onClose();
          }}
        />

        {/* Trick to center the modal contents */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-100">
          
          {/* Header Close button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => {
                playSound('click');
                onClose();
              }}
              className="bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full p-1.5 transition-all cursor-pointer"
              id="modal-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white px-6 pt-6 pb-6">
            <div className="sm:flex sm:items-start w-full">
              
              {type === 'detail' ? (
                // ------------------ 1. DETAIL VIEW ------------------
                <div className="w-full">
                  <div className="flex items-center gap-3 mb-4">
                    {renderHeaderIcon()}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-6" id="modal-title">
                        {event?.title}
                      </h3>
                      <span className="inline-block text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 mt-1">
                        時期：{event?.period}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 bg-indigo-50/40 border border-indigo-100 rounded-lg p-4 mb-4">
                    <p className="text-xs font-bold text-indigo-900 mb-1">
                      ✦ 重點整理：{event?.highlight}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">
                      這段歷史標誌著台灣由原住民社會走入多元統治與現代化體系的轉折。
                    </p>
                  </div>

                  <div className="prose prose-slate max-w-none">
                    <h4 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">事件詳細背景與影響</h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-sans whitespace-pre-wrap">
                      {event?.description}
                    </p>
                  </div>
                </div>
              ) : type === 'success' ? (
                // ------------------ 2. SUCCESS CELEBRATION VIEW ------------------
                <div className="w-full text-center">
                  {renderHeaderIcon()}
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">
                    太厲害了！排序正確 🎉
                  </h3>
                  <p className="text-xs text-slate-500 mb-4 font-sans">
                    你完美的重現了台灣四大歷史時期的先後順序！
                  </p>

                  {/* Personal Score Summary Badge */}
                  <div className="grid grid-cols-3 gap-2 bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 mb-4 text-center">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">⏱️ 通關時間</p>
                      <p className="text-sm font-extrabold text-indigo-900 font-mono mt-0.5">{formatTime(timeInSeconds)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">🔄 檢查次數</p>
                      <p className="text-sm font-extrabold text-indigo-900 font-mono mt-0.5">{attempts} 次</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">💡 年份提示</p>
                      <p className="text-sm font-extrabold text-indigo-900 mt-0.5">
                        {showYearsUsed ? (
                          <span className="text-amber-600">已使用</span>
                        ) : (
                          <span className="text-emerald-600 font-black">無提示 👑</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Leaderboard Submission Form */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4 mb-5 text-left">
                    <h4 className="text-xs font-bold text-slate-700 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      登錄全球線上排行榜
                    </h4>

                    {isSubmitted ? (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-md p-3 text-center text-xs text-emerald-800 font-medium">
                        🎉 恭喜！您的成績已成功登入排行榜！
                      </div>
                    ) : (
                      <form onSubmit={handleScoreSubmit} className="space-y-3">
                        <p className="text-[11px] text-slate-500">
                          輸入您的暱稱，與線上所有玩家一較高下，看看誰是真正的台灣歷史大師！
                        </p>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            maxLength={20}
                            placeholder="輸入歷史學家暱稱 (例如: 開台聖王)"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            disabled={isSubmitting}
                            className="flex-1 min-w-0 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-100"
                          />
                          <button
                            type="submit"
                            disabled={isSubmitting || !playerName.trim()}
                            className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm disabled:bg-slate-300 transition-colors cursor-pointer"
                          >
                            {isSubmitting ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                提交
                              </>
                            )}
                          </button>
                        </div>
                        {submissionError && (
                          <p className="text-[10px] text-rose-600 font-medium">{submissionError}</p>
                        )}
                      </form>
                    )}
                  </div>

                  {/* Summary of full history sequence */}
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-left mb-5">
                    <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3 text-center">
                      台灣四大歷史時期發展軸線
                    </h4>
                    
                    <div className="space-y-3.5">
                      {[
                        { time: '1624 年起', name: '荷蘭人建城', desc: '興建熱蘭遮城，台灣躍上國際貿易舞台。' },
                        { time: '1662 年起', name: '鄭成功來台', desc: '建立東寧王國，漢人政權首度統治台灣。' },
                        { time: '1683 年起', name: '清領時期', desc: '納入大清版圖，展開長達兩百多年的清領統治。' },
                        { time: '1895 年起', name: '日治時期', desc: '簽訂馬關條約割讓，引入現代化制度與建設。' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-2.5 relative">
                          {idx < 3 && (
                            <div className="absolute left-[8px] top-5 bottom-[-16px] w-[1.5px] bg-emerald-200" />
                          )}
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold z-10 shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-800">{item.name}</span>
                              <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 px-1 py-0.1 rounded border border-emerald-100">{item.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-sans mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-5">
                    <button
                      onClick={() => {
                        playSound('click');
                        if (onResetGame) onResetGame();
                        onClose();
                      }}
                      className="inline-flex justify-center items-center gap-1.5 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-200/50 transition-all cursor-pointer"
                      id="modal-replay-btn"
                    >
                      <RotateCcw className="w-4 h-4" />
                      重新挑戰
                    </button>
                    <button
                      onClick={() => {
                        playSound('click');
                        onClose();
                      }}
                      className="inline-flex justify-center px-5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      關閉視窗
                    </button>
                  </div>
                </div>
              ) : (
                // ------------------ 3. FAILURE VIEW ------------------
                <div className="w-full text-center py-2">
                  {renderHeaderIcon()}
                  <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">
                    順序還有點不對喔，再試試看！
                  </h3>
                  <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto font-sans">
                    不用擔心！你可以調整卡片的位置，或者點擊卡片下方的「故事背景」複習歷史細節，再重新排序挑戰！
                  </p>

                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => {
                        playSound('click');
                        onClose();
                      }}
                      className="inline-flex justify-center px-6 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-200/50 transition-all cursor-pointer"
                      id="modal-retry-btn"
                    >
                      繼續挑戰
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

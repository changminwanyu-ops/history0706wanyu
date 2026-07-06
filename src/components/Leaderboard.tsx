import React, { useEffect, useState } from 'react';
import { getTopScores, LeaderboardEntry } from '../lib/firebase';
import { Trophy, Clock, Award, Star, ListOrdered, RefreshCw, AlertTriangle } from 'lucide-react';
import { playSound } from '../utils/audio';
import firebaseConfig from '../../firebase-applet-config.json';

interface LeaderboardProps {
  refreshTrigger?: number; // Used to trigger reload when score is submitted
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ refreshTrigger = 0 }) => {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = async (isManual = false) => {
    if (isManual) {
      playSound('click');
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const data = await getTopScores(10);
      setScores(data);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, [refreshTrigger]);

  const renderRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600 border border-amber-300 font-bold text-xs" title="冠軍">
            <Trophy className="w-3.5 h-3.5" />
          </span>
        );
      case 2:
        return (
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 border border-slate-300 font-bold text-xs" title="亞軍">
            <Award className="w-3.5 h-3.5 text-slate-500" />
          </span>
        );
      case 3:
        return (
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 border border-orange-200 font-bold text-xs" title="季軍">
            <Award className="w-3.5 h-3.5 text-orange-600" />
          </span>
        );
      default:
        return (
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-50 text-slate-500 border border-slate-200 font-mono text-xs">
            {rank}
          </span>
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
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-full" id="leaderboard-section">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="font-sans font-extrabold text-base text-slate-800">
            全球線上排行榜 (Top 10)
          </h2>
        </div>
        <button
          onClick={() => fetchScores(true)}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          title="重新整理排行"
          disabled={refreshing || loading}
          id="btn-refresh-leaderboard"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Leaderboard Table / List */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">正在載入最新排行資料...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 text-center bg-rose-50/50 border border-rose-100 rounded-lg select-none">
          <AlertTriangle className="w-8 h-8 text-rose-500 mb-2" />
          <p className="text-xs font-bold text-rose-800">連線失敗</p>
          <p className="text-[10px] text-slate-500 leading-relaxed max-w-[220px] mt-1">
            {error.includes('permission-denied') || error.includes('Missing or insufficient permissions')
              ? '安全規則拒絕讀取。請在您的 Firebase 專案中部署正確的 Firestore 安全規則。'
              : error.includes('not-found') || error.includes('database') || error.includes('failed to get document')
              ? `找不到資料庫。請至 Firebase Console 確認您已為專案「${firebaseConfig.projectId}」啟用「Firestore Database」並建立了 (default) 資料庫。`
              : `錯誤詳情：${error}`}
          </p>
          <button 
            onClick={() => fetchScores(true)}
            className="mt-3 px-3 py-1 bg-white hover:bg-slate-50 text-rose-600 font-bold text-xs rounded border border-rose-200 transition-colors cursor-pointer"
          >
            按此重試
          </button>
        </div>
      ) : scores.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center select-none text-slate-400">
          <Star className="w-8 h-8 text-slate-200 mb-2" />
          <p className="text-xs font-semibold text-slate-500">目前尚無排行資料</p>
          <p className="text-[10px] text-slate-400 mt-0.5">快來完成挑戰，留下你的名字吧！</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2 px-1 text-center w-10">名次</th>
                <th className="py-2 px-2">歷史學家</th>
                <th className="py-2 px-2 text-right">花費時間</th>
                <th className="py-2 px-2 text-center">檢查</th>
                <th className="py-2 px-1 text-center">提示</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {scores.map((entry, index) => (
                <tr key={entry.id || index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-1 flex justify-center items-center">
                    {renderRankBadge(index + 1)}
                  </td>
                  <td className="py-2.5 px-2 font-bold text-slate-700 truncate max-w-[120px]" title={entry.name}>
                    {entry.name}
                  </td>
                  <td className="py-2.5 px-2 font-mono font-bold text-slate-900 text-right">
                    {formatTime(entry.timeInSeconds)}
                  </td>
                  <td className="py-2.5 px-2 font-mono text-center text-slate-500">
                    {entry.attempts}次
                  </td>
                  <td className="py-2.5 px-1 text-center">
                    {entry.showYearsUsed ? (
                      <span className="inline-block text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.2 rounded" title="開啟了年份提示">
                        提示
                      </span>
                    ) : (
                      <span className="inline-block text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.2 rounded font-semibold" title="無提示挑戰">
                        無
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Simple Footer stats summary */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>排行依時間由短至長排列</span>
        <span>共計 {scores.length} 名探險者</span>
      </div>

    </div>
  );
};

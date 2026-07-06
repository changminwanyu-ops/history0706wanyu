import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { HistoryEvent } from './types';
import { HistoryCard } from './components/HistoryCard';
import { DropZone } from './components/DropZone';
import { Modal } from './components/Modal';
import { Leaderboard } from './components/Leaderboard';
import { playSound } from './utils/audio';
import { saveScore } from './lib/firebase';
import { 
  RotateCcw, 
  CheckCircle, 
  Volume2, 
  VolumeX, 
  History, 
  ArrowRight, 
  Lightbulb,
  Sparkles,
  Clock,
  Send,
  HelpCircle,
  Trophy,
  Award,
  Play
} from 'lucide-react';

const TAIWAN_EVENTS: HistoryEvent[] = [
  {
    id: 'dutch-era',
    title: '荷蘭人建城',
    period: '西元 1624 年',
    year: 1624,
    highlight: '安平興建熱蘭遮城，開啟貿易時期',
    description: '荷蘭東印度公司於西元 1624 年佔領大員（今台南安平），並開始興建「熱蘭遮城」（今安平古堡）與「普羅民遮城」（今赤崁樓）作為統治與貿易基地。此舉正式將台灣納入全球貿易網絡，並引進了水牛、文字（新港文書）及早期的農業開墾制度，是台灣歷史進入文字記載與國際交會的重要起點。',
    colorTheme: 'amber',
    iconName: 'Castle'
  },
  {
    id: 'koxinga-era',
    title: '鄭成功來台',
    period: '西元 1662 年',
    year: 1662,
    highlight: '擊敗荷軍，建立東寧政權首度漢化',
    description: '明鄭時期的將領鄭成功為了尋找「反清復明」的根據地，於西元 1661 年率領大軍在鹿耳門登陸，圍困熱蘭遮城長達九個月。最終於 1662 年迫使荷蘭長官揆一開城投降，結束荷蘭統治。鄭氏政權在台設立府縣、開辦學校（孔廟），將漢人典章制度與文教體系首度引入台灣。',
    colorTheme: 'emerald',
    iconName: 'Ship'
  },
  {
    id: 'qing-era',
    title: '清領時期',
    period: '西元 1683 年',
    year: 1683,
    highlight: '施琅率水師破鄭，台灣納入清帝國版圖',
    description: '西元 1683 年，清朝派水師提督施琅率軍擊敗鄭氏政權。康熙皇帝於 1684 年正式將台灣設府，隸屬福建省，開啟了長達 212 年的清領時期。此時期伴隨著大量的閩粵移民渡過「黑水溝」來台開墾，形成台灣漢人社會的主體結構，並留下了許多珍貴的媽祖廟、城隍廟及古井等文化資產。',
    colorTheme: 'rose',
    iconName: 'Scroll'
  },
  {
    id: 'japanese-era',
    title: '日治時期',
    period: '西元 1895 年',
    year: 1895,
    highlight: '馬關條約割讓，台灣展開近代化基礎建設',
    description: '西元 1895 年中日甲午戰爭清廷戰敗，簽訂《馬關條約》將台灣割讓給日本。日本隨後實施殖民統治直至 1945 年。日治時期在台推行了多項近代化基礎建設，包括縱貫鐵路、日月潭水力發電、阿里山鐵路、戶口普查、公學校制度與現代化公共衛生管理，對台灣社會結構與都市發展產生了深遠影響。',
    colorTheme: 'indigo',
    iconName: 'Compass'
  }
];

export default function App() {
  // Game states
  const [deck, setDeck] = useState<HistoryEvent[]>([]);
  const [timeline, setTimeline] = useState<(HistoryEvent | null)[]>([null, null, null, null]);
  const [currentlyDraggingId, setCurrentlyDraggingId] = useState<string | null>(null);
  const [draggedSource, setDraggedSource] = useState<{ type: 'deck' | 'timeline'; index?: number } | null>(null);

  // Settings states
  const [showYears, setShowYears] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showGameRules, setShowGameRules] = useState<boolean>(true);

  // Stats / Speedrun states
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [usedHint, setUsedHint] = useState<boolean>(false);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState<boolean>(false);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Leaderboard communication state
  const [refreshLeaderboardTrigger, setRefreshLeaderboardTrigger] = useState<number>(0);
  const [playerName, setPlayerName] = useState<string>('');
  const [isSubmittingScore, setIsSubmittingScore] = useState<boolean>(false);
  const [isScoreSubmitted, setIsScoreSubmitted] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'detail' | 'success' | 'failure'>('detail');
  const [activeDetailEvent, setActiveDetailEvent] = useState<HistoryEvent | null>(null);

  // Status message for guidance
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'warning' | 'success' }>({
    text: '請將上方卡片依據歷史發生先後順序，拖曳至下方的空槽中！',
    type: 'info'
  });

  // Initialize and shuffle game on mount
  useEffect(() => {
    initializeGame();
    return () => stopTimer();
  }, []);

  // Timer loop when game is active
  useEffect(() => {
    if (hasStartedPlaying && !isSolved) {
      startTimer();
    } else {
      stopTimer();
    }
    return () => stopTimer();
  }, [hasStartedPlaying, isSolved]);

  const startTimer = () => {
    if (timerIntervalRef.current) return;
    const startTime = Date.now() - elapsedTime * 1000;
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 100);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const initializeGame = () => {
    stopTimer();
    setElapsedTime(0);
    setAttempts(0);
    setUsedHint(false);
    setIsSolved(false);
    setHasStartedPlaying(false);
    setIsGameStarted(false);
    setIsScoreSubmitted(false);
    setSubmissionError(null);

    // Fisher-Yates Shuffle algorithm to mix cards randomly
    const shuffled = [...TAIWAN_EVENTS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Ensure the initial shuffle is actually randomized (not accidentally perfectly correct)
    const isPerfect = shuffled.every((ev, index) => ev.id === TAIWAN_EVENTS[index].id);
    if (isPerfect) {
      // Shift one item to break order
      const first = shuffled.shift()!;
      shuffled.push(first);
    }

    setDeck(shuffled);
    setTimeline([null, null, null, null]);
    setStatusMessage({
      text: '遊戲準備就緒！請點擊下方「開始挑戰」按鈕展開計時排序！',
      type: 'info'
    });
  };

  const startPlayTimerIfNeeded = () => {
    if (!hasStartedPlaying) {
      setHasStartedPlaying(true);
    }
  };

  const handleDragStartFromDeck = (e: React.DragEvent, eventId: string) => {
    startPlayTimerIfNeeded();
    e.dataTransfer.setData('text/plain', eventId);
    setCurrentlyDraggingId(eventId);
    setDraggedSource({ type: 'deck' });
  };

  const handleDragStartFromSlot = (e: React.DragEvent, eventId: string, slotIndex: number) => {
    startPlayTimerIfNeeded();
    e.dataTransfer.setData('text/plain', eventId);
    setCurrentlyDraggingId(eventId);
    setDraggedSource({ type: 'timeline', index: slotIndex });
  };

  const handleDragEnd = () => {
    setCurrentlyDraggingId(null);
    setDraggedSource(null);
  };

  // Drop on the deck container (retrieving cards from the timeline)
  const handleDragOverDeck = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnDeck = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedSource?.type === 'timeline') {
      const sourceIndex = draggedSource.index!;
      const card = timeline[sourceIndex];
      if (card) {
        if (soundEnabled) playSound('drop');
        
        // Remove from timeline, insert back into deck
        setTimeline(prev => {
          const updated = [...prev];
          updated[sourceIndex] = null;
          return updated;
        });
        setDeck(prev => [...prev, card]);
        
        setStatusMessage({
          text: `已將「${card.title}」移回牌庫。`,
          type: 'info'
        });
      }
    }
  };

  // Dropping cards into a specific slot on the timeline
  const handleCardDrop = (eventId: string, targetSlotIndex: number) => {
    startPlayTimerIfNeeded();
    if (soundEnabled) playSound('drop');

    const updatedTimeline = [...timeline];
    const updatedDeck = [...deck];

    if (draggedSource?.type === 'timeline') {
      // Case 1: Dragged from timeline slot A to slot B (or same slot)
      const sourceIndex = draggedSource.index!;
      if (sourceIndex === targetSlotIndex) return; // Dropped on self

      const cardToMove = updatedTimeline[sourceIndex];
      const targetCard = updatedTimeline[targetSlotIndex];

      if (cardToMove) {
        // Swap or move
        updatedTimeline[targetSlotIndex] = cardToMove;
        updatedTimeline[sourceIndex] = targetCard; // swap (could be null)
        setTimeline(updatedTimeline);

        setStatusMessage({
          text: targetCard 
            ? `已對調「${cardToMove.title}」與「${targetCard.title}」的位置。`
            : `已將「${cardToMove.title}」移至新位置。`,
          type: 'info'
        });
      }
    } else {
      // Case 2: Dragged from the unsorted deck into slot B
      const cardToPlace = updatedDeck.find(c => c.id === eventId);
      if (cardToPlace) {
        const indexInDeck = updatedDeck.findIndex(c => c.id === eventId);
        if (indexInDeck !== -1) {
          updatedDeck.splice(indexInDeck, 1);
        }

        const targetCard = updatedTimeline[targetSlotIndex];
        if (targetCard) {
          // If the slot is already occupied, return the occupant to the deck
          updatedDeck.push(targetCard);
        }

        updatedTimeline[targetSlotIndex] = cardToPlace;
        
        setDeck(updatedDeck);
        setTimeline(updatedTimeline);

        setStatusMessage({
          text: `已放置「${cardToPlace.title}」至第 ${targetSlotIndex + 1} 時期。`,
          type: 'info'
        });
      }
    }
  };

  // Verification mechanism
  const checkAnswer = () => {
    startPlayTimerIfNeeded();
    // Increment checking attempts count
    setAttempts(prev => prev + 1);

    // 1. Check if all slots are occupied
    const slotsFilledCount = timeline.filter(item => item !== null).length;
    if (slotsFilledCount < 4) {
      if (soundEnabled) playSound('error');
      setStatusMessage({
        text: `排序尚未完成喔！目前放了 ${slotsFilledCount} / 4 個事件，請放滿後再檢查。`,
        type: 'warning'
      });
      return;
    }

    // 2. Validate chronological order
    const correctSequence = ['dutch-era', 'koxinga-era', 'qing-era', 'japanese-era'];
    const currentSequence = timeline.map(item => item?.id);

    const isCorrect = correctSequence.every((val, idx) => val === currentSequence[idx]);

    if (isCorrect) {
      setIsSolved(true);
      stopTimer();

      // Trigger confetti celebration!
      if (soundEnabled) playSound('success');
      confetti({
        particleCount: 150,
        spread: 85,
        origin: { y: 0.6 }
      });
      
      // Open success modal
      setModalType('success');
      setModalOpen(true);
      setStatusMessage({
        text: '太棒了！100% 排序正確，你太優秀了！快來登錄您的成績吧！',
        type: 'success'
      });
    } else {
      // Friendly Modal Warning (as requested)
      if (soundEnabled) playSound('error');
      setModalType('failure');
      setModalOpen(true);
      setStatusMessage({
        text: '順序還有點不對喔，再試試看！',
        type: 'warning'
      });
    }
  };

  const handleShowDetail = (event: HistoryEvent) => {
    if (soundEnabled) playSound('click');
    setActiveDetailEvent(event);
    setModalType('detail');
    setModalOpen(true);
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      setTimeout(() => playSound('click'), 100);
    }
  };

  const toggleYears = () => {
    if (soundEnabled) playSound('click');
    setShowYears(!showYears);
    if (!showYears) {
      setUsedHint(true); // Flag that hint was used
    }
  };

  const handleScoreSubmittedCallback = () => {
    setIsScoreSubmitted(true);
    // Increment refresh trigger to reload the Leaderboard database records
    setRefreshLeaderboardTrigger(prev => prev + 1);
  };

  const handleOnPageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = playerName.trim();
    if (!trimmedName) return;

    if (soundEnabled) playSound('click');
    setIsSubmittingScore(true);
    setSubmissionError(null);

    try {
      await saveScore({
        name: trimmedName,
        timeInSeconds: elapsedTime,
        attempts: attempts,
        showYearsUsed: usedHint,
      });
      setIsScoreSubmitted(true);
      if (soundEnabled) playSound('success');
      // Increment refresh trigger to reload the Leaderboard database records
      setRefreshLeaderboardTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error submitting score:', err);
      setSubmissionError('網路連線不穩或伺服器忙碌，請稍後重試！');
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const formatElapsedTime = (seconds: number) => {
    return seconds.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col justify-between font-sans selection:bg-indigo-100 antialiased" id="main-container">
      
      {/* Top Navigation / Header Panel */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-md shadow-indigo-100">
              <History className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                台灣歷史事件排序小遊戲
                <span className="text-[10px] tracking-normal font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded-full uppercase">
                  Online
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                拖曳重要歷史大事，重現正確的台灣歷史發展軸線，並與線上玩家一較高下！
              </p>
            </div>
          </div>

          {/* Active speedrun timers */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="w-4 h-4 text-indigo-500 animate-spin-slow" />
              <span className="font-medium">計時器:</span>
              <span className="font-mono font-extrabold text-sm text-slate-800 w-12 text-right">
                {formatElapsedTime(elapsedTime)}s
              </span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="font-medium">檢查次數:</span>
              <span className="font-mono font-extrabold text-sm text-slate-800">
                {attempts}次
              </span>
            </div>
          </div>

          {/* Control Utility bar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Year Hint Toggle */}
            <button
              onClick={toggleYears}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer
                ${
                  showYears
                    ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                }
              `}
              title="顯示或隱藏卡片年份"
              id="btn-toggle-years"
            >
              <Lightbulb className={`w-3.5 h-3.5 ${showYears ? 'fill-amber-400 text-amber-600' : ''}`} />
              {showYears ? '關閉年份提示' : '開啟年份提示'}
            </button>

            {/* Sound Effects Toggle */}
            <button
              onClick={toggleSound}
              className={`
                p-2 rounded-lg border transition-all cursor-pointer
                ${
                  soundEnabled
                    ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-400'
                }
              `}
              title={soundEnabled ? '靜音模式' : '開啟音效'}
              id="btn-toggle-sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Reset Button */}
            <button
              onClick={() => {
                if (soundEnabled) playSound('click');
                initializeGame();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
              title="重新打亂卡片"
              id="btn-reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重新洗牌
            </button>
          </div>

        </div>
      </header>

      {/* Main Container Grid */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col justify-between gap-6 animate-fade-in" id="game-stage">
        
        {/* Game Instructions Alert Bar */}
        {showGameRules && (
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-3 sm:p-4 relative flex items-start gap-3">
            <div className="p-1 rounded-md bg-indigo-100 text-indigo-700 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs sm:text-sm font-bold text-indigo-900 mb-1">
                🎮 遊戲玩法指南 (全新線上排行榜版)：
              </h3>
              <ul className="text-xs text-indigo-950 space-y-1 leading-relaxed font-sans list-disc list-inside">
                <li>將上方打亂的 4 個歷史事件卡片，<b>拖曳</b>到下方的 4 個空槽 (Drop Zones) 中。</li>
                <li>移動第一張卡片將<b>啟動計時器</b>，看看您能花費多少秒完美通關！</li>
                <li>完成後，點擊「<b>檢查答案</b>」，100% 正確即可觸發<b>全螢幕彩帶</b>並登錄名字到<b>線上排行榜</b>！</li>
                <li>若在過關前開啟<b>年份提示</b>，排行將標註「提示」，快試試在不看年份的情況下挑戰極限吧！</li>
              </ul>
            </div>
            <button 
              onClick={() => setShowGameRules(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1 rounded hover:bg-indigo-100/50 cursor-pointer absolute top-2 right-2"
              title="隱藏玩法"
              id="btn-hide-rules"
            >
              隱藏
            </button>
          </div>
        )}

        {/* 2-Column Bento Grid: Left Column (Game), Right Column (Firestore Leaderboard) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT: Game Screen */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {!isGameStarted ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[460px] bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center select-none" id="lobby-zone">
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 animate-pulse">
                  <Play className="w-8 h-8 fill-indigo-600 ml-1" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  台灣歷史大事紀：時間軸排序挑戰
                </h2>
                <p className="text-sm text-slate-500 mt-2.5 max-w-md leading-relaxed font-sans">
                  考考您對台灣重要歷史大事的熟悉度！點擊「開始挑戰」後，卡片將被揭開並立刻啟動計時器！
                </p>
                
                <div className="mt-8 bg-slate-50/80 rounded-xl p-5 border border-slate-100 text-left max-w-md w-full space-y-3 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">挑戰規則：</h4>
                  <div className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-700">1</span>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                      系統將隨機抽出 4 張歷史事件卡片。
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-black text-amber-700">2</span>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                      請將卡片依據<b>歷史發生先後順序</b>（左起最早 ➔ 右至最晚）拖曳到下方空槽中。
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700">3</span>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                      全對時可解鎖<b>全球線上排行榜</b>，留下您的大名！
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (soundEnabled) playSound('click');
                    setIsGameStarted(true);
                    setHasStartedPlaying(true);
                    setStatusMessage({
                      text: '挑戰已開始！計時器已啟動，請迅速排列卡片並點擊「檢查答案」！',
                      type: 'warning'
                    });
                  }}
                  className="mt-8 px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                  id="btn-start-challenge"
                >
                  <Play className="w-4 h-4 fill-white" />
                  開始挑戰
                </button>
              </div>
            ) : (
              <>
                {/* 1. Unsorted Deck Container */}
                <div className="flex-1 flex flex-col justify-center min-h-[220px] bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3.5 mb-4 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-600 animate-ping shrink-0" />
                      <h2 className="font-sans font-extrabold text-sm sm:text-base text-slate-800">
                        待整理事件牌庫
                      </h2>
                      <span className="text-xs text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full border">
                        剩餘 {deck.length} 張未分類
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-sans">
                      * 點擊並按住卡片拖曳到下方的時間軸空槽上
                    </p>
                  </div>

                  {/* Draggable Cards Deck Zone */}
                  <div 
                    onDragOver={handleDragOverDeck}
                    onDrop={handleDropOnDeck}
                    className={`
                      flex-1 flex flex-wrap items-center justify-center gap-4 rounded-lg p-2 transition-all min-h-[140px]
                      ${currentlyDraggingId && draggedSource?.type === 'timeline' ? 'bg-slate-50 border-2 border-dashed border-slate-200' : ''}
                    `}
                    id="deck-zone"
                  >
                    {deck.length > 0 ? (
                      deck.map((event) => (
                        <HistoryCard
                          key={event.id}
                          event={event}
                          isDragging={currentlyDraggingId === event.id}
                          showYears={showYears}
                          onDragStart={handleDragStartFromDeck}
                          onDragEnd={handleDragEnd}
                          onShowDetail={handleShowDetail}
                        />
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-6 select-none text-slate-400">
                        <p className="text-sm font-semibold text-indigo-600">
                          🎉 所有卡片都已經放置在時間軸上囉！
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          如果不滿意擺放，可以隨時按住卡片「拖曳回此處」或「互相對調」。
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Timeline Axis Title */}
                <div className="relative text-center my-1 select-none">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-300" />
                  </div>
                  <span className="relative inline-flex items-center gap-1 bg-slate-100 px-4 py-1 text-xs font-bold text-slate-500 rounded-full border border-slate-300">
                    歷史時間軸發展方向 (左起最早 ➔ 右至最晚)
                  </span>
                </div>

                {/* 3. Horizontal Timeline Slots (Drop Zones) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="timeline-container">
                  {timeline.map((card, idx) => (
                    <div key={idx} className="flex flex-col">
                      <DropZone
                        index={idx}
                        assignedCard={card}
                        onCardDrop={handleCardDrop}
                        onCardDragStartFromSlot={handleDragStartFromSlot}
                        onCardDragEnd={handleDragEnd}
                        onShowDetail={handleShowDetail}
                        showYears={showYears}
                        currentlyDraggingId={currentlyDraggingId}
                      />
                      {/* Timeline Flow Arrow between zones */}
                      {idx < 3 && (
                        <div className="hidden md:flex justify-center items-center mt-2 text-slate-400">
                          <ArrowRight className="w-4 h-4 ml-auto" style={{ transform: 'translateX(1.8rem)' }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* On-Page Score Submission Form when Game is Solved */}
            {isSolved && (
              <div className="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/30 rounded-xl p-5 shadow-sm mt-6 text-left" id="onpage-submission">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
                      挑戰成功！登錄全球線上排行榜
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      您的成績：花費 <span className="font-mono font-bold text-indigo-600">{formatElapsedTime(elapsedTime)}s</span>、檢查 <span className="font-mono font-bold text-indigo-600">{attempts}次</span> {usedHint ? '(有提示)' : '(無提示 👑)'}
                    </p>
                  </div>
                  {isScoreSubmitted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200">
                      <CheckCircle className="w-4 h-4" />
                      成績已成功登錄
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                      等待登錄
                    </span>
                  )}
                </div>

                {isScoreSubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center">
                    <p className="text-xs font-bold text-emerald-800">
                      🎉 恭喜！您的名字與成績已成功登入全球線上排行榜！
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      快看右側排行榜，您排在第幾名呢？可以點擊下方「重新挑戰」可再次挑戰突破極限！
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleOnPageSubmit} className="space-y-3">
                    <p className="text-xs text-slate-600">
                      請在下方輸入您的暱稱，與線上所有台灣歷史達人一較高下：
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="text"
                        required
                        maxLength={20}
                        placeholder="請輸入您的暱稱 (例如：福爾摩沙冒險家)"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        disabled={isSubmittingScore}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-100 font-medium"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingScore || !playerName.trim()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-md hover:shadow-lg disabled:bg-slate-300 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 shrink-0"
                      >
                        {isSubmittingScore ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            登錄成績
                          </>
                        )}
                      </button>
                    </div>
                    {submissionError && (
                      <p className="text-xs text-rose-600 font-semibold">{submissionError}</p>
                    )}
                  </form>
                )}
              </div>
            )}

          </div>

          {/* RIGHT: Live Firestore Leaderboard */}
          <div className="lg:col-span-4 flex flex-col">
            <Leaderboard refreshTrigger={refreshLeaderboardTrigger} />
          </div>

        </div>

        {/* 4. Action and Status Feedback Panel */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Status Prompt Message */}
          <div className="flex items-center gap-3">
            <div className={`
              p-2 rounded-full shrink-0
              ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-100 text-emerald-600'
                  : statusMessage.type === 'warning'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-indigo-100 text-indigo-600'
              }
            `}>
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono tracking-wider uppercase font-bold">遊戲狀態與建議</p>
              <p className={`text-sm font-bold ${statusMessage.type === 'warning' ? 'text-amber-700' : 'text-slate-800'}`}>
                {statusMessage.text}
              </p>
            </div>
          </div>

          {/* Big Validation Actions */}
          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
            {isSolved ? (
              <button
                onClick={() => {
                  if (soundEnabled) playSound('click');
                  initializeGame();
                }}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-lg shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                id="btn-restart-game"
              >
                重新挑戰
              </button>
            ) : isGameStarted ? (
              <button
                onClick={checkAnswer}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-lg shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                id="btn-check-answer"
              >
                檢查答案
              </button>
            ) : (
              <button
                disabled
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-400 font-black text-sm rounded-lg border border-slate-200 cursor-not-allowed"
                id="btn-check-answer-disabled"
              >
                檢查答案
              </button>
            )}
          </div>

        </div>

      </main>

      {/* Footer Branding and Historical details */}
      <footer className="bg-white border-t border-slate-200/80 py-4 mt-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <p>© 2026 台灣歷史時期排序互動線上版. 本遊戲資料由 Firestore 即時安全同步儲存。</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-600 cursor-pointer" onClick={() => { if (soundEnabled) playSound('click'); setModalType('success'); setModalOpen(true); }}>
              通關攻略
            </span>
            <span>|</span>
            <span className="hover:text-slate-600 cursor-pointer" onClick={() => setShowGameRules(true)}>
              重新顯示規則
            </span>
          </div>
        </div>
      </footer>

      {/* Custom Popup Modal for Details, Success Celebration and Incorrect prompt */}
      <Modal
        isOpen={modalOpen}
        type={modalType}
        event={activeDetailEvent}
        onClose={() => setModalOpen(false)}
        onResetGame={initializeGame}
        timeInSeconds={elapsedTime}
        attempts={attempts}
        showYearsUsed={usedHint}
        onScoreSubmitted={handleScoreSubmittedCallback}
      />

    </div>
  );
}

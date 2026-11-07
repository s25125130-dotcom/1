import React, { useState } from 'react';
import { Play, BookOpen, Volume2, ShieldAlert, Award, Sparkles, Fuel, Skull, Users } from 'lucide-react';
import { sounds } from '../utils/audio';

interface TitleScreenModalProps {
  onStartGame: () => void;
  onOpenTutorial: () => void;
  highScore?: number;
}

export const TitleScreenModal: React.FC<TitleScreenModalProps> = ({
  onStartGame,
  onOpenTutorial,
  highScore = 0,
}) => {
  const [showBestiary, setShowBestiary] = useState<boolean>(false);

  const handleStart = () => {
    sounds.playStoreDingDong();
    onStartGame();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none font-pixel-tc overflow-y-auto p-4">
      {/* Background ambient night grid and retro scanlines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none scanlines opacity-40 z-20" />

      {/* Main Container */}
      <div className="relative w-full max-w-xl bg-zinc-950 border-4 border-black pixel-box shadow-[0_0_50px_rgba(16,185,129,0.35)] text-white p-6 sm:p-8 flex flex-col items-center text-center z-30 my-auto">
        
        {/* Neon Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950 border-2 border-emerald-500 text-emerald-400 text-xs font-bold mb-4 animate-pulse pixel-box-sm">
          <Fuel className="w-4 h-4 text-emerald-400" />
          <span>省道台一線 33.7K ‧ 24H 中興加油站</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 drop-shadow-[0_4px_10px_rgba(245,158,11,0.5)] mb-1">
          碰！大夜加油站
        </h1>
        <div className="text-xs sm:text-sm font-pixel text-zinc-400 tracking-widest uppercase mb-4">
          Boom! Night Shift Gas Station
        </div>

        {/* Narrative Lore */}
        <div className="bg-black/90 border-2 border-zinc-800 pixel-box-sm p-3.5 mb-6 text-xs text-zinc-300 leading-relaxed text-left max-w-md">
          <p className="text-amber-300 font-bold mb-1 flex items-center gap-1.5">
            <span>🌙</span> 今夜大夜班簡報（23:00 ～ 06:00）：
          </p>
          <p className="text-zinc-400">
            你是今晚唯一的當班值班人員「阿強」。深夜省道各路神仙齊聚：從改管拉轉少年、醉漢阿伯到神秘送菜貨車。請精準加油、妥善找零載具，並隨時持滅火器撲滅危險火源，平安撐到早上 6 點交班！
          </p>
          <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
            <span>🕒 加油/結帳時：<strong className="text-emerald-400">時間完全靜止</strong></span>
            <span>⌨️ 操作：<strong className="text-cyan-300">WASD / 方向鍵 / 點擊</strong></span>
          </div>
        </div>

        {/* Buttons Action Group */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleStart}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-lg border-2 border-emerald-300 pixel-btn shadow-[0_4px_0_#065f46] hover:shadow-[0_2px_0_#065f46] hover:translate-y-0.5 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>打卡上班（開始遊戲）</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenTutorial}
              className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-amber-300 font-bold text-xs border-2 border-zinc-700 pixel-btn flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>店員工作指南</span>
            </button>

            <button
              onClick={() => setShowBestiary(!showBestiary)}
              className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-cyan-300 font-bold text-xs border-2 border-zinc-700 pixel-btn flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>大夜怪客圖鑑</span>
            </button>
          </div>
        </div>

        {/* Customer & Danger Bestiary drawer */}
        {showBestiary && (
          <div className="w-full max-w-md mt-4 p-3 bg-zinc-900/95 border-2 border-zinc-700 pixel-box-sm text-left max-h-48 overflow-y-auto text-xs space-y-2">
            <div className="text-amber-400 font-bold flex items-center gap-1">
              <Skull className="w-3.5 h-3.5" />
              <span>深夜可能遇到的特殊顧客與突發危機：</span>
            </div>
            <div className="space-y-1.5 text-zinc-300">
              <div className="bg-black/60 p-1.5 border border-zinc-800 flex items-start gap-2">
                <span className="text-lg">🛵</span>
                <div>
                  <strong className="text-yellow-400">勁戰改管少年</strong>：脾氣急躁，喜歡加 95 加 50 元。若讓他在站內拉轉過久會引發噪音投訴，請盡速服務或用警報驅離。
                </div>
              </div>
              <div className="bg-black/60 p-1.5 border border-zinc-800 flex items-start gap-2">
                <span className="text-lg">🚬</span>
                <div>
                  <strong className="text-red-400">點菸奧客</strong>：在加油島旁邊突然拿打火機抽菸！必須立刻裝備【1】滅火器或【2】辣椒水將火撲滅，否則有氣爆風險！
                </div>
              </div>
              <div className="bg-black/60 p-1.5 border border-zinc-800 flex items-start gap-2">
                <span className="text-lg">🍺</span>
                <div>
                  <strong className="text-amber-400">發酒瘋醉漢</strong>：在便利商店門口丟酒瓶。用【4】防暴盾牌格擋或【3】電擊棒制伏，也可按緊急報警鈴【110】。
                </div>
              </div>
              <div className="bg-black/60 p-1.5 border border-zinc-800 flex items-start gap-2">
                <span className="text-lg">🚚</span>
                <div>
                  <strong className="text-emerald-400">深夜送菜得利卡</strong>：大宗柴油顧客，常會索取統編與提神保力達B，收益極高！
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 text-[10px] text-zinc-400 flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-emerald-400" /> 支援復古 8-Bit 音效
          </span>
          <span>•</span>
          <span>支援手機觸控 & 鍵盤控制</span>
        </div>
      </div>
    </div>
  );
};

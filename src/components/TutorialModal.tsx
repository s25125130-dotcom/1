import React from 'react';
import { Flame, X } from 'lucide-react';

interface TutorialModalProps {
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-pixel-tc select-none">
      <div className="relative w-full max-w-2xl bg-zinc-950 border-4 border-black pixel-box shadow-[0_0_35px_rgba(16,185,129,0.3)] text-white flex flex-col max-h-[90vh] overflow-hidden">
        {/* Retro scanlines */}
        <div className="absolute inset-0 pointer-events-none scanlines opacity-35 z-20" />

        {/* Top Banner */}
        <div className="bg-amber-400 text-black px-4 py-1 text-xs font-black flex items-center justify-between border-b-2 border-black z-10">
          <span className="flex items-center gap-1.5 font-pixel">
            ★ 大夜加油站店員手冊（新人受訓必讀） ★
          </span>
          <span className="text-[10px] bg-black text-amber-300 px-1.5 py-0.5">STAFF HANDBOOK</span>
        </div>

        {/* Header */}
        <div className="bg-zinc-900 p-4 border-b-4 border-zinc-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-1 bg-amber-950 border-2 border-amber-600 pixel-box-sm">📖</span>
            <div>
              <h3 className="font-bold text-base text-amber-300 tracking-wider">
                深夜 23:00 至 06:00 生存指南
              </h3>
              <p className="text-xs text-zinc-400">鍵盤移動、精準加滿湊整數、找零結帳、撲滅點菸奧客</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-zinc-800 hover:bg-red-800 text-zinc-300 hover:text-white border-2 border-zinc-600 pixel-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-zinc-300 leading-relaxed z-10">
          {/* Section 0: Movement & Time Freezing */}
          <div className="bg-black p-3.5 border-2 border-zinc-800 pixel-box-sm">
            <h4 className="font-bold text-sm text-cyan-400 flex items-center gap-2 mb-1.5">
              <span>🎮</span> 0. 角色移動與時間靜止機制 (重要！)
            </h4>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li>
                鍵盤按鍵：<strong className="text-yellow-300">W / A / S / D</strong> 或 <strong className="text-yellow-300">方向鍵 ↑ ↓ ← →</strong> 可以隨心所欲自由移動「阿強」，或用滑鼠直接點選畫面移動。
              </li>
              <li>
                <strong className="text-emerald-400">時間靜止保護</strong>：當您進入「加油操作台」或「POS 機結帳台」時，<strong className="text-white">遊戲時間與所有突發威脅皆為完全靜止狀態</strong>，您可以放鬆專注進行微操作，不會受到倒數扣分壓力！
              </li>
              <li>
                車道等待車輛過少時，可點擊上方或下方的 <strong className="text-cyan-300">「📢 招攬顧客」</strong> 主動揮旗召喚車輛進站。
              </li>
            </ul>
          </div>

          {/* Section 1 */}
          <div className="bg-black p-3.5 border-2 border-zinc-800 pixel-box-sm">
            <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2 mb-1.5">
              <span>⛽</span> 1. 核心加油操作技巧
            </h4>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li>點擊停妥在加油島的顧客車輛開啟注油機。</li>
              <li>選擇顧客指定油品（<span className="text-green-400 font-bold">92</span> / <span className="text-red-400 font-bold">95</span> / <span className="text-blue-400 font-bold">98</span> / <span className="text-amber-400 font-bold">超級柴油</span>）。</li>
              <li>
                <strong className="text-zinc-200">長按空白鍵 [SPACE]</strong> 或點擊扣板機注油。加滿模式過頭會引發<span className="text-red-400 font-bold">溢油扣款</span>；精準加滿跳槍可拿額外小費！
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="bg-black p-3.5 border-2 border-zinc-800 pixel-box-sm">
            <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2 mb-1.5">
              <span>💰</span> 2. POS 機收銀找零與載具
            </h4>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li>
                <strong className="text-zinc-200">找零點選</strong>：顧客給大鈔時，點擊 500/100/50/10/5/1 面額按鈕湊齊找零金額。解鎖 AI POS 機可點擊一鍵智慧找零！
              </li>
              <li>
                <strong className="text-zinc-200">發票與載具</strong>：遇到手機載具顧客點擊「嗶載具」；統編司機點擊帶入 8 碼統編。
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="bg-black p-3.5 border-2 border-zinc-800 pixel-box-sm">
            <h4 className="font-bold text-sm text-rose-400 flex items-center gap-2 mb-1.5">
              <Flame className="w-4 h-4 text-rose-400" /> 3. 深夜突發危機處理
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <div className="bg-zinc-900 p-2 border border-zinc-700">
                <span className="font-bold text-red-400 block mb-0.5">🚬 站內點菸危機</span>
                <span>按鍵 <strong>[1] 滅火器</strong> 迅速噴滅客人打火機！否則會引發爆炸！</span>
              </div>
              <div className="bg-zinc-900 p-2 border border-zinc-700">
                <span className="font-bold text-amber-400 block mb-0.5">🍺 醉漢砸店</span>
                <span>切換 <strong>[2] 辣椒噴霧</strong> 或 <strong>[5] 掃把</strong> 點擊驅離！</span>
              </div>
              <div className="bg-zinc-900 p-2 border border-zinc-700">
                <span className="font-bold text-cyan-400 block mb-0.5">🏍️ 飆仔群聚</span>
                <span>時限內按下 <strong>[110 緊急報警]</strong>，巡邏警車會迅速驅離！</span>
              </div>
              <div className="bg-zinc-900 p-2 border border-zinc-700">
                <span className="font-bold text-indigo-400 block mb-0.5">⚾ 翻滾閃避</span>
                <span>地面出現紅色預警線時按下 <strong>[空白鍵]</strong> 翻滾避開傷害！</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-zinc-900 border-t-4 border-zinc-800 flex justify-end z-10">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-700 hover:bg-emerald-600 text-white border-2 border-emerald-400 pixel-btn font-bold text-xs cursor-pointer"
          >
            我瞭解了，開始大夜班！
          </button>
        </div>
      </div>
    </div>
  );
};

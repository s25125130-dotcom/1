import React from 'react';
import { DailyReport } from '../types/game';
import { Award, ChevronRight, ShoppingBag } from 'lucide-react';

interface DailyReportModalProps {
  report: DailyReport;
  onProceedToShop: () => void;
  onStartNextDay: () => void;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  report,
  onProceedToShop,
  onStartNextDay,
}) => {
  const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
    S: { bg: 'bg-amber-950', text: 'text-yellow-400', border: 'border-yellow-400' },
    A: { bg: 'bg-emerald-950', text: 'text-emerald-400', border: 'border-emerald-400' },
    B: { bg: 'bg-blue-950', text: 'text-cyan-400', border: 'border-cyan-400' },
    C: { bg: 'bg-orange-950', text: 'text-orange-400', border: 'border-orange-400' },
    F: { bg: 'bg-red-950', text: 'text-red-500', border: 'border-red-500' },
  };

  const currentGradeStyle = gradeColors[report.grade] || gradeColors.B;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-pixel-tc select-none">
      <div className="relative w-full max-w-2xl bg-zinc-950 border-4 border-black pixel-box shadow-[0_0_35px_rgba(245,158,11,0.3)] text-white flex flex-col max-h-[95vh] overflow-hidden">
        {/* Retro scanlines */}
        <div className="absolute inset-0 pointer-events-none scanlines opacity-35 z-20" />

        {/* Arcade Stage Clear Top Banner */}
        <div className="bg-amber-400 text-black px-4 py-1 text-xs font-black flex items-center justify-between border-b-2 border-black z-10">
          <span className="flex items-center gap-1.5 font-pixel">
            ★ DAY {report.day} SHIFT CLEAR! (06:00 晨光照耀) ★
          </span>
          <span className="text-[10px] bg-black text-amber-300 px-1.5 py-0.5">DAILY REPORT</span>
        </div>

        {/* Morning Dawn Header */}
        <div className="bg-zinc-900 p-4 border-b-4 border-zinc-800 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌅</span>
              <h2 className="text-base sm:text-lg font-bold text-amber-300 tracking-wider">
                第 {report.day} 天 大夜班下班考核結算
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">平安熬過台灣深夜！來檢視今日的營業額、加滿手藝與治安防衛績效</p>
          </div>

          {/* S/A/B/C/F 16-Bit Retro Grade Stamp */}
          <div
            className={`w-20 h-20 flex flex-col items-center justify-center border-4 pixel-box-sm ${currentGradeStyle.bg} ${currentGradeStyle.border}`}
          >
            <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-300 font-pixel">GRADE</span>
            <span className={`text-4xl font-black font-pixel ${currentGradeStyle.text} drop-shadow-[0_0_8px_currentColor]`}>
              {report.grade}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 z-10">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-black p-3 border-2 border-zinc-800 pixel-box-sm">
              <span className="text-[10px] text-zinc-400 block font-pixel">今日淨利潤</span>
              <span className="text-lg font-pixel font-bold text-emerald-400">
                +${report.revenue - report.fuelCost + report.storeProfit}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5 font-pixel">營收 ${report.revenue}</span>
            </div>

            <div className="bg-black p-3 border-2 border-zinc-800 pixel-box-sm">
              <span className="text-[10px] text-zinc-400 block font-pixel">顧客滿意度</span>
              <span className="text-lg font-pixel font-bold text-yellow-400">
                {report.satisfaction}%
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5 font-pixel">
                完美服務 {report.perfectFuelCount} 次
              </span>
            </div>

            <div className="bg-black p-3 border-2 border-zinc-800 pixel-box-sm">
              <span className="text-[10px] text-zinc-400 block font-pixel">治安防衛分</span>
              <span className="text-lg font-pixel font-bold text-cyan-400">
                +{report.threatsPrevented * 500}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5 font-pixel">
                擊退危機 {report.threatsPrevented} 件
              </span>
            </div>

            <div className="bg-black p-3 border-2 border-zinc-800 pixel-box-sm">
              <span className="text-[10px] text-zinc-400 block font-pixel">總結綜合評分</span>
              <span className="text-lg font-pixel font-bold text-amber-400">
                {report.totalScore}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5 font-pixel">
                修繕扣款 -${report.damagePenalty}
              </span>
            </div>
          </div>

          {/* Detailed Score Breakdown */}
          <div className="bg-black p-3.5 border-2 border-zinc-800 pixel-box-sm text-xs space-y-1.5">
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              明細考核計算公式
            </div>

            <div className="flex justify-between py-1 border-b border-zinc-900">
              <span className="text-zinc-300">汽油銷售純利 (淨額 × 1.5):</span>
              <span className="text-emerald-400 font-pixel font-bold">
                +${Math.round((report.revenue - report.fuelCost) * 1.5)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-zinc-900">
              <span className="text-zinc-300">附設超商商品銷售利潤:</span>
              <span className="text-emerald-400 font-pixel font-bold">+${report.storeProfit}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-zinc-900">
              <span className="text-zinc-300">服務滿意度獎金 ({report.satisfaction}% × 20):</span>
              <span className="text-yellow-400 font-pixel font-bold">+{report.satisfaction * 20}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-zinc-900">
              <span className="text-zinc-300">成功制止點菸/奧客 (治安獎勵金):</span>
              <span className="text-cyan-400 font-pixel font-bold">+{report.threatsPrevented * 500}</span>
            </div>

            {report.damagePenalty > 0 && (
              <div className="flex justify-between py-1 border-b border-zinc-900 text-red-400">
                <span>設施毀損維修與溢油清理費:</span>
                <span className="font-pixel font-bold">-${report.damagePenalty}</span>
              </div>
            )}
          </div>

          {/* Taiwanese Manager Commentary */}
          <div className="bg-zinc-900 p-3.5 border-2 border-zinc-700 pixel-box-sm flex gap-3.5 items-start">
            <span className="text-3xl p-1 bg-black border-2 border-zinc-700 pixel-box-sm shrink-0">🧔🏻‍♂️</span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs text-zinc-100">站長「老林」評語:</h4>
                <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-300 font-pixel border border-zinc-600">
                  加盟總部日結考核
                </span>
              </div>
              <p className="text-xs text-amber-200 mt-1 leading-relaxed">
                「{report.managerComment}」
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-zinc-900 border-t-4 border-zinc-800 flex flex-col sm:flex-row justify-between gap-3 z-10">
          <button
            onClick={onProceedToShop}
            className="flex-1 py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 border-2 border-zinc-600 pixel-btn cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>前往裝備與站體改建中心</span>
          </button>

          <button
            onClick={onStartNextDay}
            className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 border-2 border-emerald-400 pixel-btn cursor-pointer shadow-lg active:scale-95"
          >
            <span>開始第 {report.day + 1} 天大夜班 (23:00)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

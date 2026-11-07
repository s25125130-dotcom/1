import React from 'react';
import { PlayerStats } from '../types/game';
import { sounds } from '../utils/audio';
import { Heart, Wind } from 'lucide-react';

interface ActionControlsProps {
  player: PlayerStats;
  onSelectTool: (tool: PlayerStats['selectedTool']) => void;
  onDodge: () => void;
  onEmergencyAlarm: () => void;
  onOpenStore: () => void;
  onOpenShop: () => void;
  onDirectionStart?: (dir: 'up' | 'down' | 'left' | 'right') => void;
  onDirectionEnd?: () => void;
  onDirectionMove?: (dir: 'up' | 'down' | 'left' | 'right') => void;
  onCallCustomer?: () => void;
  alarmCooldown: number;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  player,
  onSelectTool,
  onDodge,
  onEmergencyAlarm,
  onOpenStore,
  onOpenShop,
  onDirectionStart,
  onDirectionEnd,
  onDirectionMove,
  onCallCustomer,
  alarmCooldown,
}) => {
  const tools: Array<{
    id: PlayerStats['selectedTool'];
    name: string;
    icon: string;
    key: string;
    desc: string;
    color: string;
  }> = [
    { id: 'extinguisher', name: '滅火器', icon: '🧯', key: '1', desc: '撲滅加油站內點菸危機', color: 'border-red-600 hover:border-red-400' },
    { id: 'spray', name: '辣椒防身噴霧', icon: '🧴', key: '2', desc: '噴灑醉漢與鬧事奧客', color: 'border-amber-600 hover:border-amber-400' },
    { id: 'baton', name: '強力電擊棒', icon: '⚡', key: '3', desc: '一擊制服持械暴力分子', color: 'border-yellow-500 hover:border-yellow-300' },
    { id: 'shield', name: '防暴盾牌', icon: '🛡️', key: '4', desc: '格擋正面飛來汽水罐與球棒', color: 'border-blue-600 hover:border-blue-400' },
    { id: 'broom', name: '大夜掃把', icon: '🧹', key: '5', desc: '清理油污與驅趕閒雜人等', color: 'border-emerald-600 hover:border-emerald-400' },
  ];

  return (
    <div className="bg-zinc-950 border-4 border-black pixel-box shadow-[6px_6px_0px_#000] p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-white select-none">
      {/* Player HP & Stamina Status */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-950 border-2 border-red-800 pixel-box-sm">
            <Heart className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <div>
            <div className="flex justify-between text-xs font-pixel-tc mb-1">
              <span className="text-zinc-400 font-bold">阿強體力</span>
              <span className="text-red-400 font-pixel text-[10px]">{player.hp}/{player.maxHp}</span>
            </div>
            {/* Segmented Pixel Health Blocks */}
            <div className="flex gap-1 p-0.5 bg-black border-2 border-zinc-700">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2.5 h-3 ${
                    idx < Math.ceil((player.hp / player.maxHp) * 10)
                      ? 'bg-red-500 shadow-[inset_1px_1px_0px_#fca5a5]'
                      : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Quick Dodge Button */}
        <button
          onClick={onDodge}
          disabled={player.dodgeCooldown > 0}
          className={`px-3 py-2 font-pixel-tc text-xs font-bold flex items-center gap-1.5 border-2 pixel-btn ${
            player.dodgeCooldown > 0
              ? 'bg-zinc-900 border-zinc-700 text-zinc-600 cursor-not-allowed'
              : 'bg-indigo-900 hover:bg-indigo-800 border-indigo-400 text-indigo-100 cursor-pointer shadow-md active:scale-95'
          }`}
          title="按下以翻滾躲避飛來投擲物與球棒攻擊 (空白鍵)"
        >
          <Wind className="w-4 h-4 text-indigo-400" />
          <span>翻滾閃避 [空白鍵]</span>
          {player.dodgeCooldown > 0 && <span className="text-[10px] text-zinc-400 font-pixel">({player.dodgeCooldown.toFixed(1)}s)</span>}
        </button>

        {/* On-screen Directional D-Pad (Up, Down, Left, Right) with Continuous Touch/Hold */}
        <div className="flex items-center gap-1 bg-black p-1.5 border-2 border-zinc-800 pixel-box-sm">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onDirectionStart?.('left');
            }}
            onPointerUp={onDirectionEnd}
            onPointerLeave={onDirectionEnd}
            onClick={() => onDirectionMove?.('left')}
            className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 active:bg-cyan-700 active:scale-95 flex items-center justify-center font-bold text-xs text-zinc-200 border-2 border-black pixel-btn cursor-pointer"
            title="往左移動 (A / ◀)"
          >
            ◀
          </button>
          <div className="flex flex-col gap-1">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onDirectionStart?.('up');
              }}
              onPointerUp={onDirectionEnd}
              onPointerLeave={onDirectionEnd}
              onClick={() => onDirectionMove?.('up')}
              className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 active:bg-cyan-700 active:scale-95 flex items-center justify-center font-bold text-xs text-zinc-200 border-2 border-black pixel-btn cursor-pointer"
              title="往上移動 (W / ▲)"
            >
              ▲
            </button>
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onDirectionStart?.('down');
              }}
              onPointerUp={onDirectionEnd}
              onPointerLeave={onDirectionEnd}
              onClick={() => onDirectionMove?.('down')}
              className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 active:bg-cyan-700 active:scale-95 flex items-center justify-center font-bold text-xs text-zinc-200 border-2 border-black pixel-btn cursor-pointer"
              title="往下移動 (S / ▼)"
            >
              ▼
            </button>
          </div>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onDirectionStart?.('right');
            }}
            onPointerUp={onDirectionEnd}
            onPointerLeave={onDirectionEnd}
            onClick={() => onDirectionMove?.('right')}
            className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 active:bg-cyan-700 active:scale-95 flex items-center justify-center font-bold text-xs text-zinc-200 border-2 border-black pixel-btn cursor-pointer"
            title="往右移動 (D / ▶)"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Tool Selector Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto py-1">
        {tools.map((t) => {
          const isSelected = player.selectedTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                sounds.playNozzleClick();
                onSelectTool(t.id);
              }}
              className={`px-3 py-2 text-xs font-pixel-tc font-bold border-2 transition flex items-center gap-2 pixel-btn cursor-pointer ${
                isSelected
                  ? 'bg-amber-950 border-amber-400 text-yellow-300 ring-2 ring-yellow-400'
                  : 'bg-zinc-900 border-black text-zinc-300 hover:bg-zinc-800'
              }`}
              title={`${t.name} (數字鍵 ${t.key}) - ${t.desc}`}
            >
              <span className="text-base">{t.icon}</span>
              <span className="hidden sm:inline">{t.name}</span>
              <span className="text-[10px] font-pixel text-zinc-400 bg-black/60 px-1 py-0.5 border border-zinc-700">[{t.key}]</span>
            </button>
          );
        })}
      </div>

      {/* Quick Action Station Shortcuts */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        {/* Spawn Customer Button */}
        {onCallCustomer && (
          <button
            onClick={onCallCustomer}
            className="px-3 py-2 border-2 border-cyan-400 bg-cyan-900 hover:bg-cyan-800 text-cyan-200 text-xs font-bold font-pixel-tc pixel-btn flex items-center gap-1 cursor-pointer active:scale-95"
            title="主動揮旗招攬顧客，引導一台車輛進站！"
          >
            <span>📢 招攬顧客</span>
          </button>
        )}

        {/* Emergency Police 110 Alarm Button */}
        <button
          onClick={onEmergencyAlarm}
          disabled={alarmCooldown > 0}
          className={`px-3 py-2 text-xs font-bold font-pixel-tc border-2 pixel-btn flex items-center gap-1.5 transition ${
            alarmCooldown > 0
              ? 'bg-zinc-900 border-zinc-700 text-zinc-600 cursor-not-allowed'
              : 'bg-red-800 hover:bg-red-700 border-red-400 text-white cursor-pointer active:scale-95'
          }`}
          title="通報派出所警車馳援 (驅逐改裝飆仔車隊與醉漢)"
        >
          <span>🚨 110 警報</span>
          {alarmCooldown > 0 && <span className="text-[10px] font-pixel">({alarmCooldown.toFixed(0)}s)</span>}
        </button>

        {/* Open Store */}
        <button
          onClick={onOpenStore}
          className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 border-2 border-emerald-400 text-white font-bold font-pixel-tc text-xs pixel-btn flex items-center gap-1 cursor-pointer active:scale-95"
        >
          <span>🏪 超商庫存</span>
        </button>

        {/* Open Equipment / Station Shop */}
        <button
          onClick={onOpenShop}
          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-600 text-amber-300 font-bold font-pixel-tc text-xs pixel-btn flex items-center gap-1 cursor-pointer active:scale-95"
        >
          <span>🛠️ 升級裝備</span>
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { EquipmentUpgrade, IslandConfig } from '../types/game';
import { sounds } from '../utils/audio';
import { Check, Shield, ShoppingCart, Sparkles, Wrench, X } from 'lucide-react';

interface ShopAndLayoutModalProps {
  upgrades: EquipmentUpgrade[];
  islands: IslandConfig[];
  playerFunds: number;
  onBuyUpgrade: (upgradeId: string, cost: number) => void;
  onUnlockIsland: (islandId: string, cost: number) => void;
  onInstallSprinkler: (islandId: string, cost: number) => void;
  onClose: () => void;
}

export const ShopAndLayoutModal: React.FC<ShopAndLayoutModalProps> = ({
  upgrades,
  islands,
  playerFunds,
  onBuyUpgrade,
  onUnlockIsland,
  onInstallSprinkler,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'gear' | 'station'>('gear');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleBuy = (u: EquipmentUpgrade) => {
    if (playerFunds < u.price) {
      sounds.playError();
      return;
    }
    sounds.playCashRegister();
    onBuyUpgrade(u.id, u.price);
    setSuccessMsg(`成功購買並裝備【${u.name}】！`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleIslandUnlock = (island: IslandConfig) => {
    if (playerFunds < island.cost) {
      sounds.playError();
      return;
    }
    sounds.playCashRegister();
    onUnlockIsland(island.id, island.cost);
    setSuccessMsg(`成功擴建解鎖【${island.name}】！`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleSprinklerInstall = (island: IslandConfig) => {
    const cost = 1200;
    if (playerFunds < cost) {
      sounds.playError();
      return;
    }
    sounds.playCashRegister();
    onInstallSprinkler(island.id, cost);
    setSuccessMsg(`成功在【${island.name}】加裝自動感應滅火噴頭！`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-pixel-tc select-none">
      <div className="relative w-full max-w-3xl bg-zinc-950 border-4 border-black pixel-box shadow-[0_0_35px_rgba(16,185,129,0.3)] text-white flex flex-col max-h-[90vh] overflow-hidden">
        {/* Retro scanlines */}
        <div className="absolute inset-0 pointer-events-none scanlines opacity-35 z-20" />

        {/* Top Banner */}
        <div className="bg-cyan-500 text-black px-4 py-1 text-xs font-black flex items-center justify-between border-b-2 border-black z-10">
          <span className="flex items-center gap-1.5 font-pixel">
            ★ 大夜裝備升級與站體擴建中心 (SHOP & EXPANSION) ★
          </span>
          <span className="text-[10px] bg-black text-cyan-300 px-1.5 py-0.5">HEADQUARTERS</span>
        </div>

        {/* Header */}
        <div className="bg-zinc-900 p-4 border-b-4 border-zinc-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-1 bg-cyan-950 border-2 border-cyan-600 pixel-box-sm">🏪🛠️</span>
            <div>
              <h3 className="font-bold text-base text-cyan-400 tracking-wider">
                防身裝備・工具・車道自動化
              </h3>
              <p className="text-xs text-zinc-400">強化店員防身術、加速注油幫浦與加油站安全自動化</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block font-pixel">目前結餘資金</span>
              <span className="text-base font-pixel font-bold text-emerald-400">${playerFunds}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 bg-zinc-800 hover:bg-red-800 text-zinc-300 hover:text-white border-2 border-zinc-600 pixel-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b-4 border-zinc-800 bg-black px-4 gap-2 pt-2 z-10">
          <button
            onClick={() => setActiveTab('gear')}
            className={`py-2 px-4 font-bold text-xs flex items-center gap-2 border-t-2 border-x-2 pixel-btn transition ${
              activeTab === 'gear'
                ? 'border-cyan-400 bg-zinc-900 text-cyan-300'
                : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>店員防護與工具升級 ({upgrades.filter((u) => u.owned).length}/{upgrades.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('station')}
            className={`py-2 px-4 font-bold text-xs flex items-center gap-2 border-t-2 border-x-2 pixel-btn transition ${
              activeTab === 'station'
                ? 'border-cyan-400 bg-zinc-900 text-cyan-300'
                : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>站體車道擴建與安全噴淋設施</span>
          </button>
        </div>

        {successMsg && (
          <div className="bg-emerald-950 border-b-2 border-emerald-500 text-emerald-300 text-xs px-4 py-1.5 flex items-center gap-2 z-10">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 z-10">
          {activeTab === 'gear' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upgrades.map((u) => {
                const canAfford = playerFunds >= u.price;
                return (
                  <div
                    key={u.id}
                    className={`p-3.5 border-2 transition flex flex-col justify-between pixel-box-sm ${
                      u.owned
                        ? 'bg-emerald-950/20 border-emerald-600'
                        : 'bg-black border-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-3xl p-1 bg-zinc-900 border-2 border-zinc-700 pixel-box-sm">
                          {u.icon}
                        </span>
                        {u.owned ? (
                          <span className="text-xs px-2 py-0.5 bg-emerald-950 text-emerald-300 font-bold border border-emerald-600 flex items-center gap-1 font-pixel">
                            <Check className="w-3 h-3" />
                            已裝備
                          </span>
                        ) : (
                          <span className="text-sm font-pixel font-bold text-amber-400">
                            ${u.price}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-zinc-100 mt-2">{u.name}</h4>
                      <p className="text-xs text-zinc-400 mt-1">{u.description}</p>

                      <div className="mt-2.5 p-2 bg-zinc-900 border border-zinc-800 text-xs font-pixel text-cyan-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                        <span>效果: {u.statBonus}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2">
                      {!u.owned ? (
                        <button
                          onClick={() => handleBuy(u)}
                          disabled={!canAfford}
                          className={`w-full py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 border-2 pixel-btn transition ${
                            canAfford
                              ? 'bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-400 cursor-pointer shadow'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          購買裝備 (${u.price})
                        </button>
                      ) : (
                        <div className="w-full py-1.5 text-center text-xs text-emerald-400 font-pixel">
                          ✓ 裝備已生效
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-pixel">
                加油島動線與設施擴充
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {islands.map((island) => (
                  <div
                    key={island.id}
                    className="bg-black p-3.5 border-2 border-zinc-800 flex flex-col justify-between pixel-box-sm"
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-zinc-200">{island.name}</span>
                        <span
                          className={`text-xs px-2 py-0.5 border font-pixel font-bold ${
                            island.unlocked
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : 'bg-zinc-900 text-zinc-500 border-zinc-700'
                          }`}
                        >
                          {island.unlocked ? '● 營運中' : '未解鎖'}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-zinc-400 space-y-1">
                        <div>油品支援: {island.fuels.join(' / ').toUpperCase()}</div>
                        <div>
                          自動噴淋滅火器: {island.hasSprinkler ? '已加裝 (可防點菸)' : '無'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 space-y-2">
                      {!island.unlocked ? (
                        <button
                          onClick={() => handleIslandUnlock(island)}
                          disabled={playerFunds < island.cost}
                          className={`w-full py-2 px-3 text-xs font-bold border-2 pixel-btn transition flex items-center justify-center gap-1.5 ${
                            playerFunds >= island.cost
                              ? 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-400 cursor-pointer'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                          }`}
                        >
                          擴建解鎖此島 (${island.cost})
                        </button>
                      ) : !island.hasSprinkler ? (
                        <button
                          onClick={() => handleSprinklerInstall(island)}
                          disabled={playerFunds < 1200}
                          className={`w-full py-2 px-3 text-xs font-bold border-2 pixel-btn transition flex items-center justify-center gap-1.5 ${
                            playerFunds >= 1200
                              ? 'bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-400 cursor-pointer'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                          }`}
                        >
                          加裝頂棚感應噴淋滅火器 ($1200)
                        </button>
                      ) : (
                        <div className="text-center text-xs text-cyan-400 font-pixel py-1">
                          ✓ 已配備全自動感應噴水滅火系統
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-zinc-900 border-t-4 border-zinc-800 flex justify-end z-10">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-700 hover:bg-emerald-600 text-white border-2 border-emerald-400 pixel-btn font-bold text-xs cursor-pointer"
          >
            完成配置並返回
          </button>
        </div>
      </div>
    </div>
  );
};

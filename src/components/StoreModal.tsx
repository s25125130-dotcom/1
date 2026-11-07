import React, { useState } from 'react';
import { StoreItem } from '../types/game';
import { sounds } from '../utils/audio';
import { AlertTriangle, Check, PackagePlus, X } from 'lucide-react';

interface StoreModalProps {
  items: StoreItem[];
  playerFunds: number;
  onRestock: (itemId: string, count: number, cost: number) => void;
  onClose: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  items,
  playerFunds,
  onRestock,
  onClose,
}) => {
  const [restockAmount] = useState<number>(10);
  const [message, setMessage] = useState<string>('');

  const handleRestock = (item: StoreItem) => {
    const totalCost = item.cost * restockAmount;
    if (playerFunds < totalCost) {
      sounds.playError();
      setMessage('營收資金不足，無法進貨！');
      return;
    }
    sounds.playCashRegister();
    onRestock(item.id, restockAmount, totalCost);
    setMessage(`成功進貨 ${item.name} x${restockAmount}！`);
    setTimeout(() => setMessage(''), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-pixel-tc select-none">
      <div className="relative w-full max-w-3xl bg-zinc-950 border-4 border-black pixel-box shadow-[0_0_35px_rgba(16,185,129,0.25)] text-white flex flex-col max-h-[90vh] overflow-hidden">
        {/* Retro scanlines */}
        <div className="absolute inset-0 pointer-events-none scanlines opacity-35 z-20" />

        {/* Top Banner */}
        <div className="bg-emerald-500 text-black px-4 py-1 text-xs font-black flex items-center justify-between border-b-2 border-black z-10">
          <span className="flex items-center gap-1.5 font-pixel">
            ★ 加油站附設便利超商（補貨與庫存中心） ★
          </span>
          <span className="text-[10px] bg-black text-emerald-300 px-1.5 py-0.5">CONVENIENCE STORE</span>
        </div>

        {/* Header */}
        <div className="bg-zinc-900 p-3.5 border-b-4 border-zinc-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-1 bg-emerald-950 border-2 border-emerald-600 pixel-box-sm">🏪</span>
            <div>
              <h3 className="font-bold text-base text-emerald-400 tracking-wider">
                深夜熱食與補給專區
              </h3>
              <p className="text-xs text-zinc-400">大夜司機與夜貓子顧客最愛的茶葉蛋、熱狗與保力達B</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block font-pixel">目前營收資金</span>
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

        {message && (
          <div className="bg-emerald-950 border-b-2 border-emerald-500 text-emerald-300 text-xs px-4 py-1.5 flex items-center gap-2 z-10">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

        {/* Goods shelf */}
        <div className="p-5 overflow-y-auto space-y-4 z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const totalCost = item.cost * restockAmount;
              const canAfford = playerFunds >= totalCost;
              const isLowStock = item.stock <= 5;

              return (
                <div
                  key={item.id}
                  className={`bg-black p-3.5 border-2 transition flex flex-col justify-between pixel-box-sm ${
                    isLowStock
                      ? 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : 'border-zinc-800'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="text-3xl p-1 bg-zinc-900 border-2 border-zinc-700 pixel-box-sm">
                        {item.icon}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 border font-pixel font-bold ${
                          isLowStock
                            ? 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-600'
                        }`}
                      >
                        庫存: {item.stock}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-zinc-100 mt-2">{item.name}</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{item.description}</p>

                    <div className="mt-2.5 pt-2 border-t border-zinc-800 flex justify-between text-xs font-pixel">
                      <span className="text-zinc-500">進價:${item.cost}</span>
                      <span className="text-emerald-400 font-bold">售價:${item.price}</span>
                      <span className="text-yellow-400 font-bold">利潤:+${item.price - item.cost}</span>
                    </div>

                    {item.requiresAgeCheck && (
                      <div className="mt-2 text-[10px] text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>需確認滿18歲・嚴禁站內飲用</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2">
                    <button
                      onClick={() => handleRestock(item)}
                      disabled={!canAfford}
                      className={`w-full py-1.5 px-2 text-xs font-bold flex items-center justify-center gap-1.5 border-2 pixel-btn transition ${
                        canAfford
                          ? 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-400 cursor-pointer shadow'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                      }`}
                    >
                      <PackagePlus className="w-4 h-4" />
                      進貨 x{restockAmount} (花費 ${totalCost})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-zinc-900 border-t-4 border-zinc-800 flex justify-between items-center text-xs text-zinc-400 z-10">
          <span>💡 保持熱狗、茶葉蛋充足，大夜班顧客常在加油時額外加購！</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white border-2 border-zinc-600 pixel-btn font-bold cursor-pointer"
          >
            返回加油站車道
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { FuelType, VehicleCustomer } from '../types/game';
import { FUEL_PRICES } from '../utils/gameData';
import { sounds } from '../utils/audio';
import { AlertCircle, CheckCircle2, Flame, Gauge, X } from 'lucide-react';

interface FuelingModalProps {
  customer: VehicleCustomer;
  onFinishFueling: (result: {
    actualAmount: number;
    actualLiters: number;
    isPerfect: boolean;
    isSpilled: boolean;
    selectedFuel: FuelType;
  }) => void;
  onClose: () => void;
  hasFastNozzle: boolean;
}

export const FuelingModal: React.FC<FuelingModalProps> = ({
  customer,
  onFinishFueling,
  onClose,
  hasFastNozzle,
}) => {
  const [selectedNozzle, setSelectedNozzle] = useState<FuelType | null>(null);
  const [isInserted, setIsInserted] = useState<boolean>(false);
  const [isDispensing, setIsDispensing] = useState<boolean>(false);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isSpilled, setIsSpilled] = useState<boolean>(false);
  const [isPerfect, setIsPerfect] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>('');

  const animFrameRef = useRef<number | null>(null);
  const fuelRatePerSec = (hasFastNozzle ? 14 : 9) * 55; // NT$ per second
  const unitPrice = FUEL_PRICES[customer.fuelType].price;

  // Max fuel for vehicle
  const maxCapacityAmount = customer.fuelDemandMode === 'full'
    ? customer.targetAmount * 1.12
    : customer.targetAmount * 1.35;

  const handlePickNozzle = (type: FuelType) => {
    sounds.playNozzleClick();
    setSelectedNozzle(type);
    if (type !== customer.fuelType) {
      setWarningMessage(`⚠️ 顧客要求的是【${FUEL_PRICES[customer.fuelType].name}】，別加錯油了！`);
      sounds.playError();
    } else {
      setWarningMessage('');
    }
  };

  const handleInsertNozzle = () => {
    if (!selectedNozzle) return;
    sounds.playNozzleClick();
    setIsInserted(true);
  };

  const startDispensing = () => {
    if (!isInserted || isFinished || isSpilled) return;
    setIsDispensing(true);
  };

  const stopDispensing = () => {
    if (!isDispensing) return;
    setIsDispensing(false);
  };

  // Keyboard Spacebar listener to pump fuel
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (e.type === 'keydown') {
          if (isInserted && !isFinished && !isSpilled) {
            setIsDispensing(true);
          }
        } else if (e.type === 'keyup') {
          setIsDispensing(false);
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
    };
  }, [isInserted, isFinished, isSpilled]);

  // Pumping animation loop
  useEffect(() => {
    if (!isDispensing) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();
    let soundTimer = 0;

    const pump = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      soundTimer += dt;
      if (soundTimer > 0.12) {
        sounds.playFuelFlow();
        soundTimer = 0;
      }

      setCurrentAmount((prev) => {
        const next = prev + fuelRatePerSec * dt;

        // Check overflow for full mode
        if (customer.fuelDemandMode === 'full' && next >= maxCapacityAmount) {
          setIsDispensing(false);
          setIsSpilled(true);
          sounds.playError();
          sounds.playExplosion();
          return maxCapacityAmount;
        }

        // Limit maximum runaway in amount mode
        if (next >= maxCapacityAmount) {
          setIsDispensing(false);
          return maxCapacityAmount;
        }

        return next;
      });

      animFrameRef.current = requestAnimationFrame(pump);
    };

    animFrameRef.current = requestAnimationFrame(pump);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isDispensing, customer.fuelDemandMode, fuelRatePerSec, maxCapacityAmount]);

  const handleCompleteFueling = () => {
    if (currentAmount <= 0) return;
    sounds.playNozzleClick();

    let perfect = false;
    if (customer.fuelDemandMode === 'amount') {
      const diff = Math.abs(currentAmount - customer.targetAmount);
      if (diff === 0) {
        perfect = true;
      } else if (diff <= 10 && hasFastNozzle) {
        perfect = true;
      }
    } else {
      // Full tank mode: between 95% and 100% of target amount
      const ratio = currentAmount / customer.targetAmount;
      if (ratio >= 0.95 && ratio <= 1.05 && !isSpilled) {
        perfect = true;
      }
    }

    if (perfect) {
      sounds.playPerfect();
      setIsPerfect(true);
    }

    setIsFinished(true);

    setTimeout(() => {
      onFinishFueling({
        actualAmount: Math.round(currentAmount),
        actualLiters: Number((currentAmount / unitPrice).toFixed(2)),
        isPerfect: perfect,
        isSpilled,
        selectedFuel: selectedNozzle || customer.fuelType,
      });
    }, 1200);
  };

  // Progress calculation
  const progressPercent = Math.min(100, Math.round((currentAmount / customer.targetAmount) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 scanlines">
      <div className="relative w-full max-w-2xl bg-zinc-950 border-4 border-black pixel-box shadow-[8px_8px_0px_#000] overflow-hidden text-white flex flex-col">
        {/* Header */}
        <div className="bg-zinc-900 p-4 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-1 bg-black border-2 border-zinc-700 pixel-box-sm">{customer.avatarIcon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-yellow-400 font-pixel-tc">{customer.roleTitle} - {customer.name}</h3>
                <span className="text-[9px] px-2 py-0.5 bg-yellow-400 text-black font-pixel border border-black animate-pulse">
                  ⏸️ TIME FROZEN
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5 font-pixel-tc">
                "{customer.speechText}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 border-2 border-black pixel-btn text-zinc-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demand Banner */}
        <div className="bg-black border-b-2 border-zinc-800 px-6 py-2.5 flex items-center justify-between text-xs font-pixel-tc">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">指定油品:</span>
            <span className={`px-2 py-0.5 font-bold text-white border border-black ${FUEL_PRICES[customer.fuelType].badgeColor}`}>
              {FUEL_PRICES[customer.fuelType].name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">加油要求:</span>
            {customer.fuelDemandMode === 'full' ? (
              <span className="text-amber-400 font-bold bg-amber-950 px-2 py-0.5 border border-amber-600">
                加滿 (約 ${customer.targetAmount}，切勿溢油！)
              </span>
            ) : (
              <span className="text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 border border-emerald-600">
                定額 ${customer.targetAmount} (精準湊整數)
              </span>
            )}
          </div>
        </div>

        {warningMessage && (
          <div className="bg-red-950 border-b-2 border-red-500 text-red-300 px-4 py-2 text-xs flex items-center gap-2 animate-pulse font-pixel-tc">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{warningMessage}</span>
          </div>
        )}

        {/* Gas Station POS Display */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 bg-zinc-950">
          {/* LED Meter Panel */}
          <div className="bg-black p-4 border-2 border-zinc-800 pixel-box-sm flex flex-col justify-between">
            <div className="text-center pb-2 border-b-2 border-zinc-800 flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-pixel">CPC DISPENSER</span>
              <span className="text-[9px] text-emerald-400 font-pixel flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 animate-ping" />
                ONLINE
              </span>
            </div>

            <div className="space-y-3 my-3">
              <div className="bg-zinc-950 p-2.5 border-2 border-zinc-800">
                <div className="text-[10px] text-zinc-400 flex justify-between font-pixel-tc">
                  <span>金額 (NT$)</span>
                  <span className="text-zinc-500 font-pixel text-[8px]">AMOUNT</span>
                </div>
                <div className="text-3xl text-right font-black tracking-wider text-emerald-400 font-pixel drop-shadow-[0_0_6px_#34d399]">
                  ${Math.round(currentAmount)}
                </div>
              </div>

              <div className="bg-zinc-950 p-2.5 border-2 border-zinc-800">
                <div className="text-[10px] text-zinc-400 flex justify-between font-pixel-tc">
                  <span>公升數 (Liters)</span>
                  <span className="text-zinc-500 font-pixel text-[8px]">VOLUME</span>
                </div>
                <div className="text-2xl text-right font-black tracking-wider text-amber-400 font-pixel drop-shadow-[0_0_6px_#fbbf24]">
                  {(currentAmount / unitPrice).toFixed(2)} L
                </div>
              </div>

              <div className="bg-zinc-950 p-2 border border-zinc-800 flex justify-between items-center text-xs font-pixel-tc">
                <span className="text-zinc-400">牌價:</span>
                <span className="text-sm font-bold text-zinc-200 font-pixel">${unitPrice.toFixed(1)}/L</span>
              </div>
            </div>


            {/* QTE Gauge / Target Progress */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono">
                <span className="text-zinc-400">油箱容積 / 目標進度</span>
                <span className={progressPercent > 100 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {progressPercent}%
                </span>
              </div>
              <div className="h-4 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700 relative">
                {/* Target line */}
                <div className="absolute top-0 bottom-0 left-[85%] w-1 bg-yellow-400 z-10" title="目標區間" />
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    isSpilled
                      ? 'bg-red-600 animate-pulse'
                      : progressPercent >= 98 && progressPercent <= 102
                      ? 'bg-gradient-to-r from-emerald-500 to-green-300'
                      : progressPercent > 100
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
                <span>0</span>
                <span>$ {Math.round(customer.targetAmount * 0.5)}</span>
                <span className="text-yellow-400 font-bold">目標 ${customer.targetAmount}</span>
                <span className="text-red-500 font-bold">溢油警戒</span>
              </div>
            </div>
          </div>

          {/* Interactive Fuel Gun Rack & Actions */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-emerald-400" />
                步驟 1: 拿起對應油槍
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {(['92', '95', '98', 'diesel'] as FuelType[]).map((type) => {
                  const info = FUEL_PRICES[type];
                  const isSelected = selectedNozzle === type;
                  const isCorrect = type === customer.fuelType;

                  return (
                    <button
                      key={type}
                      onClick={() => handlePickNozzle(type)}
                      disabled={isInserted}
                      className={`p-2.5 border-2 text-left transition relative flex flex-col justify-between pixel-btn ${
                        isSelected
                          ? 'border-yellow-400 bg-zinc-800 ring-2 ring-yellow-400 shadow-md'
                          : 'border-black bg-zinc-900 hover:bg-zinc-800'
                      } ${isInserted ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">⛽</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 border border-black text-white font-pixel ${info.badgeColor}`}>
                          {type.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1 font-pixel-tc">
                        <div className="text-xs font-bold text-zinc-100">{info.name}</div>
                        <div className="text-[10px] text-zinc-400 font-pixel">${info.price.toFixed(1)}/L</div>
                      </div>
                      {isCorrect && !selectedNozzle && (
                        <span className="absolute top-1 right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 bg-yellow-400"></span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 font-pixel-tc">
                步驟 2: 插入油箱蓋
              </h4>
              {!isInserted ? (
                <button
                  onClick={handleInsertNozzle}
                  disabled={!selectedNozzle}
                  className={`w-full py-2.5 font-bold font-pixel-tc text-xs flex items-center justify-center gap-2 border-2 pixel-btn transition ${
                    selectedNozzle
                      ? 'bg-emerald-600 hover:bg-emerald-500 border-black text-white cursor-pointer shadow-md'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <span>插上油槍至車輛油箱</span>
                </button>
              ) : (
                <div className="bg-emerald-950 border-2 border-emerald-500 text-emerald-300 p-2 text-center text-xs flex items-center justify-center gap-2 font-pixel-tc pixel-box-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>油槍已接合！按住板機或長按 [空白鍵] 開始注油</span>
                </div>
              )}
            </div>

            {/* Step 3: Trigger */}
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 font-pixel-tc">
                步驟 3: 按住扣板機加油 (到達目標時放開)
              </h4>
              <div className="flex gap-2">
                <button
                  onMouseDown={startDispensing}
                  onMouseUp={stopDispensing}
                  onTouchStart={startDispensing}
                  onTouchEnd={stopDispensing}
                  disabled={!isInserted || isFinished || isSpilled}
                  className={`flex-1 py-3 px-3 font-black text-sm tracking-wider flex items-center justify-center gap-2 transition select-none active:scale-95 border-4 border-black pixel-btn font-pixel-tc ${
                    isDispensing
                      ? 'bg-yellow-400 text-black shadow-inner ring-4 ring-yellow-400/40'
                      : !isInserted || isFinished || isSpilled
                      ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer'
                  }`}
                >
                  <Gauge className="w-5 h-5" />
                  {isDispensing ? '正在高速注入汽油中...' : '長按【扣板機注油】(或長按空白鍵)'}
                </button>
              </div>
            </div>

            {/* Finish Button */}
            {isInserted && !isFinished && (
              <button
                onClick={handleCompleteFueling}
                disabled={currentAmount <= 0}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border-2 border-black pixel-btn font-bold text-xs text-zinc-200 transition font-pixel-tc"
              >
                加好收槍，準備結帳
              </button>
            )}

            {isSpilled && (
              <div className="bg-red-950/90 border border-red-500 p-3 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-400 animate-bounce" />
                <span>油箱溢出！滿地汽油引發安全警報，商譽受到嚴重影響！</span>
              </div>
            )}

            {isPerfect && (
              <div className="bg-yellow-950/90 border border-yellow-500 p-3 rounded-xl text-yellow-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                <span>神級操作！精準湊整數跳槍！獲得客人小費 + 滿意度大加分！</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

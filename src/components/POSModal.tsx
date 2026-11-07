import React, { useState, useEffect } from 'react';
import { VehicleCustomer, StoreItem } from '../types/game';
import { sounds } from '../utils/audio';
import { STORE_ITEMS } from '../utils/gameData';
import { Check, CreditCard, DollarSign, QrCode, Receipt, Sparkles, X } from 'lucide-react';

interface POSModalProps {
  customer: VehicleCustomer;
  fuelAmount: number;
  hasSmartPos: boolean;
  onFinishCheckout: (result: {
    totalRevenue: number;
    tip: number;
    isCorrectChange: boolean;
    hasTaxIdDone: boolean;
    hasCarrierDone: boolean;
  }) => void;
  onClose: () => void;
}

export const POSModal: React.FC<POSModalProps> = ({
  customer,
  fuelAmount,
  hasSmartPos,
  onFinishCheckout,
  onClose,
}) => {
  // Store item calculation if customer wants one
  const storeProduct = customer.wantsStoreItem
    ? STORE_ITEMS.find((item) => item.id === customer.storeProductWanted)
    : null;
  const storePrice = storeProduct ? storeProduct.price : 0;
  const totalBill = fuelAmount + storePrice;

  // Determine cash handed by customer
  const cashHanded = customer.cashPaid || (
    totalBill <= 100 ? 100 :
    totalBill <= 500 ? 500 :
    totalBill <= 1000 ? 1000 :
    Math.ceil(totalBill / 500) * 500
  );

  const exactChangeNeeded = customer.paymentMethod === 'cash' ? cashHanded - totalBill : 0;

  // State
  const [tenderedChange, setTenderedChange] = useState<number>(0);
  const [enteredTaxId, setEnteredTaxId] = useState<string>('');
  const [isCarrierScanned, setIsCarrierScanned] = useState<boolean>(false);
  const [isReceiptPrinting, setIsReceiptPrinting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Taiwan coin and bill denominations
  const denominations = [
    { value: 500, label: '$500', sub: '紙鈔', color: 'bg-amber-900 border-amber-600 text-amber-200 hover:bg-amber-800' },
    { value: 100, label: '$100', sub: '紙鈔', color: 'bg-rose-900 border-rose-600 text-rose-200 hover:bg-rose-800' },
    { value: 50, label: '$50', sub: '金幣', color: 'bg-yellow-800 border-yellow-500 text-yellow-200 hover:bg-yellow-700' },
    { value: 10, label: '$10', sub: '銀幣', color: 'bg-zinc-800 border-zinc-500 text-zinc-100 hover:bg-zinc-700' },
    { value: 5, label: '$5', sub: '銀幣', color: 'bg-zinc-900 border-zinc-600 text-zinc-300 hover:bg-zinc-800' },
    { value: 1, label: '$1', sub: '銅幣', color: 'bg-amber-950 border-amber-800 text-amber-300 hover:bg-amber-900' },
  ];

  const handleAddChange = (val: number) => {
    sounds.playCashRegister();
    setTenderedChange((prev) => prev + val);
  };

  const handleClearChange = () => {
    setTenderedChange(0);
  };

  const handleAutoSmartChange = () => {
    sounds.playCashRegister();
    setTenderedChange(exactChangeNeeded);
  };

  const handleScanCarrier = () => {
    sounds.playCashRegister();
    setIsCarrierScanned(true);
  };

  const handleQuickFillTaxId = () => {
    if (customer.taxIdNumber) {
      setEnteredTaxId(customer.taxIdNumber);
      sounds.playNozzleClick();
    }
  };

  const handleFinalSubmit = () => {
    const isCashOk = customer.paymentMethod !== 'cash' || tenderedChange === exactChangeNeeded;
    const isTaxIdOk = customer.invoiceType !== 'tax_id' || enteredTaxId.length === 8;
    const isCarrierOk = customer.invoiceType !== 'carrier' || isCarrierScanned;

    setIsReceiptPrinting(true);
    sounds.playCashRegister();

    setTimeout(() => {
      setIsCompleted(true);
      setTimeout(() => {
        onFinishCheckout({
          totalRevenue: totalBill,
          tip: isCashOk && isTaxIdOk ? 30 : 0,
          isCorrectChange: isCashOk,
          hasTaxIdDone: isTaxIdOk,
          hasCarrierDone: isCarrierOk,
        });
      }, 700);
    }, 800);
  };

  const canSubmit =
    (customer.paymentMethod !== 'cash' || tenderedChange === exactChangeNeeded || tenderedChange > 0) &&
    (customer.invoiceType !== 'carrier' || isCarrierScanned) &&
    (customer.invoiceType !== 'tax_id' || enteredTaxId.length === 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-pixel-tc select-none">
      <div className="relative w-full max-w-2xl bg-zinc-950 border-4 border-black pixel-box shadow-[0_0_30px_rgba(16,185,129,0.3)] text-white flex flex-col overflow-hidden">
        {/* Retro scanlines */}
        <div className="absolute inset-0 pointer-events-none scanlines opacity-40 z-20" />

        {/* Time Frozen Banner */}
        <div className="bg-amber-400 text-black px-4 py-1 text-xs font-black flex items-center justify-between border-b-2 border-black z-10">
          <span className="flex items-center gap-1.5 animate-pulse">
            <span className="w-2.5 h-2.5 bg-black inline-block" />
            <span>⏸️ TIME FROZEN (時間靜止中・請安心收銀結帳)</span>
          </span>
          <span className="text-[10px] bg-black text-amber-300 px-1.5 py-0.5">POS TERMINAL</span>
        </div>

        {/* Header */}
        <div className="bg-zinc-900 p-3.5 border-b-4 border-zinc-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-1 bg-zinc-950 border-2 border-zinc-700 pixel-box-sm">
              {customer.avatarIcon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-emerald-400 tracking-wider">
                  台灣石油 大夜收銀 POS 系統
                </h3>
                <span className="text-[11px] px-2 py-0.5 bg-emerald-950 text-emerald-300 border-2 border-emerald-600 font-pixel">
                  {customer.paymentMethod.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                顧客：<span className="text-yellow-300">{customer.roleTitle} {customer.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-zinc-800 hover:bg-red-800 text-zinc-300 hover:text-white border-2 border-zinc-600 pixel-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 bg-zinc-950 z-10">
          {/* Authentic Taiwanese Dot-Matrix Pixel Receipt */}
          <div className="bg-[#f4efe0] text-zinc-900 p-4 font-pixel-tc text-xs flex flex-col justify-between border-4 border-[#333] shadow-inner relative overflow-hidden">
            {/* Top saw-tooth receipt header */}
            <div className="text-center border-b-2 border-dashed border-zinc-700 pb-2">
              <div className="font-bold text-sm tracking-wider">台灣大夜加油站股份有限公司</div>
              <div className="text-[10px] text-zinc-700">門市代號: NO.09487　統編: 03799856</div>
              <div className="text-[10px] text-zinc-600 font-pixel">2026-10-31 02:45:12</div>
              <div className="text-xs font-black mt-1 tracking-widest text-emerald-900 border-y border-zinc-800 py-0.5 my-1">
                ★ 電子發票證明聯 ★
              </div>
              <div className="text-sm font-black tracking-widest font-pixel">
                TW-98234177
              </div>
            </div>

            {/* Items table */}
            <div className="py-2.5 border-b-2 border-dashed border-zinc-700 space-y-1.5 flex-1">
              <div className="flex justify-between font-bold border-b border-zinc-400 pb-1 text-[11px]">
                <span>品名 / 單價</span>
                <span>金額</span>
              </div>
              <div className="flex justify-between">
                <span>{customer.fuelType.toUpperCase()} 汽油</span>
                <span className="font-bold font-pixel">${fuelAmount}</span>
              </div>
              {storeProduct && (
                <div className="flex justify-between text-emerald-900 font-bold">
                  <span>附設超商: {storeProduct.name}</span>
                  <span className="font-pixel">${storePrice}</span>
                </div>
              )}
            </div>

            {/* Total calculation */}
            <div className="py-2 border-b-2 border-dashed border-zinc-700 space-y-1">
              <div className="flex justify-between text-sm font-black">
                <span>應收總計 TOTAL:</span>
                <span className="text-emerald-800 text-base font-pixel">${totalBill}</span>
              </div>
              {customer.paymentMethod === 'cash' ? (
                <>
                  <div className="flex justify-between text-zinc-700 text-xs">
                    <span>收取現鈔 CASH:</span>
                    <span className="font-bold font-pixel">${cashHanded}</span>
                  </div>
                  <div className="flex justify-between text-zinc-900 font-bold text-sm bg-yellow-200/70 px-1 py-0.5 border border-yellow-600">
                    <span>應找零錢 CHANGE:</span>
                    <span className="text-red-700 font-black font-pixel">${exactChangeNeeded}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-blue-900 font-bold text-xs bg-blue-100 p-1 border border-blue-400">
                  <span>支付方式:</span>
                  <span>{customer.paymentMethod === 'credit' ? '💳 信用卡感應 / 晶片' : '📱 行動支付已完成'}</span>
                </div>
              )}
            </div>

            {/* Invoice footer info */}
            <div className="pt-2 text-[10px] text-zinc-700 text-center">
              {customer.invoiceType === 'carrier' && (
                <span className="text-blue-800 font-bold">★ 顧客使用手機條碼載具結帳</span>
              )}
              {customer.invoiceType === 'tax_id' && (
                <span className="text-amber-900 font-bold">★ 需開立買方統編: {customer.taxIdNumber}</span>
              )}
              {customer.invoiceType === 'paper' && <span>感謝惠顧 祝您中獎 發票隨附</span>}
            </div>

            {/* 8-bit Barcode */}
            <div className="mt-2 flex justify-center items-center h-7 bg-zinc-950 text-white tracking-widest text-[8px] font-pixel border-2 border-zinc-800">
              ||| | |||| || ||||| |||| || | |||
            </div>
          </div>

          {/* Interactive POS Controls */}
          <div className="space-y-4 flex flex-col justify-between">
            {/* Payment Method Details */}
            {customer.paymentMethod === 'cash' ? (
              <div className="bg-zinc-900 p-3.5 border-4 border-black pixel-box-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    找零操作盤 (目標: ${exactChangeNeeded})
                  </span>
                  {hasSmartPos && (
                    <button
                      onClick={handleAutoSmartChange}
                      className="text-[11px] px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1 border-2 border-emerald-400 pixel-btn"
                    >
                      <Sparkles className="w-3 h-3 text-yellow-300" />
                      AI 一鍵找零
                    </button>
                  )}
                </div>

                {/* Tendered Change Display */}
                <div className="bg-black p-2.5 border-2 border-zinc-700 mb-3 flex justify-between items-center pixel-box-sm">
                  <span className="text-xs text-zinc-400">當前找零合計:</span>
                  <span
                    className={`text-xl font-pixel font-bold ${
                      tenderedChange === exactChangeNeeded
                        ? 'text-emerald-400'
                        : tenderedChange > exactChangeNeeded
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }`}
                  >
                    ${tenderedChange}
                  </span>
                </div>

                {/* Chunky Pixel Cash Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {denominations.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => handleAddChange(d.value)}
                      className={`py-2 px-1 text-xs font-bold border-2 pixel-btn active:scale-95 flex flex-col items-center justify-center cursor-pointer ${d.color}`}
                    >
                      <span className="font-pixel text-sm">{d.label}</span>
                      <span className="text-[10px] opacity-80">{d.sub}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-2 flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500">
                    {tenderedChange === exactChangeNeeded
                      ? '✓ 找零金額完全正確'
                      : tenderedChange < exactChangeNeeded
                      ? `還差 $${exactChangeNeeded - tenderedChange}`
                      : `超過 $${tenderedChange - exactChangeNeeded}`}
                  </span>
                  <button
                    onClick={handleClearChange}
                    className="text-xs text-zinc-400 hover:text-red-400 border border-zinc-700 px-2 py-0.5 bg-zinc-800 pixel-btn"
                  >
                    歸零重找
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 p-4 border-4 border-black pixel-box-sm flex flex-col items-center justify-center text-center">
                <CreditCard className="w-10 h-10 text-cyan-400 mb-2 animate-bounce" />
                <h4 className="font-bold text-sm text-zinc-200">
                  {customer.paymentMethod === 'credit' ? '💳 信用卡感應完成' : '📱 行動支付條碼已確認'}
                </h4>
                <p className="text-xs text-emerald-400 mt-1 font-pixel">金額 ${totalBill} 已自動入帳</p>
              </div>
            )}

            {/* Invoice Specific Steps */}
            <div className="bg-zinc-900 p-3.5 border-4 border-black pixel-box-sm space-y-2">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-400" />
                發票開立規格
              </span>

              {customer.invoiceType === 'carrier' && (
                <div className="flex items-center justify-between bg-black p-2 border-2 border-zinc-700">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-blue-400" />
                    <span className="text-xs font-pixel text-zinc-300">手機條碼: /7U92-X9</span>
                  </div>
                  <button
                    onClick={handleScanCarrier}
                    disabled={isCarrierScanned}
                    className={`px-3 py-1 text-xs font-bold border-2 pixel-btn cursor-pointer ${
                      isCarrierScanned
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-600 cursor-default'
                        : 'bg-blue-700 hover:bg-blue-600 text-white border-blue-400'
                    }`}
                  >
                    {isCarrierScanned ? '✓ 嗶條碼成功' : '嗶手機載具'}
                  </button>
                </div>
              )}

              {customer.invoiceType === 'tax_id' && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={8}
                      placeholder="請輸入8碼統編"
                      value={enteredTaxId}
                      onChange={(e) => setEnteredTaxId(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 bg-black border-2 border-zinc-700 p-1.5 text-xs font-pixel text-center text-emerald-400 focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      onClick={handleQuickFillTaxId}
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold border-2 border-zinc-600 pixel-btn"
                    >
                      帶入統編 ({customer.taxIdNumber})
                    </button>
                  </div>
                  {enteredTaxId.length === 8 ? (
                    <div className="text-[11px] text-emerald-400">✓ 8碼統編格式正確</div>
                  ) : (
                    <div className="text-[11px] text-amber-400">需輸入完整8位數字</div>
                  )}
                </div>
              )}

              {customer.invoiceType === 'paper' && (
                <p className="text-xs text-zinc-400">傳統紙本統一發票證明聯（含明細）</p>
              )}
            </div>

            {/* Complete checkout button */}
            <button
              onClick={handleFinalSubmit}
              disabled={!canSubmit || isReceiptPrinting}
              className={`w-full py-3 text-sm font-black tracking-wider flex items-center justify-center gap-2 border-4 border-black pixel-btn transition ${
                !canSubmit || isReceiptPrinting
                  ? 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer shadow-lg active:scale-95'
              }`}
            >
              <Check className="w-5 h-5" />
              {isReceiptPrinting ? '正在列印發票並完成結帳...' : '確認結帳並送客 (ENTER)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

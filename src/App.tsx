/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DailyReport,
  DangerEvent,
  EquipmentUpgrade,
  FuelType,
  IslandConfig,
  PlayerStats,
  StoreItem,
  VehicleCustomer,
} from './types/game';
import {
  CUSTOMER_POOL,
  FUEL_PRICES,
  INITIAL_ISLANDS,
  INITIAL_UPGRADES,
  STORE_ITEMS,
} from './utils/gameData';
import { sounds } from './utils/audio';
import { StationCanvas } from './components/StationCanvas';
import { FuelingModal } from './components/FuelingModal';
import { POSModal } from './components/POSModal';
import { StoreModal } from './components/StoreModal';
import { DailyReportModal } from './components/DailyReportModal';
import { ShopAndLayoutModal } from './components/ShopAndLayoutModal';
import { TutorialModal } from './components/TutorialModal';
import { TitleScreenModal } from './components/TitleScreenModal';
import { ActionControls } from './components/ActionControls';
import {
  AlertTriangle,
  Award,
  Bell,
  BookOpen,
  DollarSign,
  Fuel,
  HelpCircle,
  Home,
  Moon,
  Pause,
  Play,
  Settings,
  Shield,
  ShoppingBag,
  Sun,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';

export default function App() {
  // Game Time State
  const [day, setDay] = useState<number>(1);
  const [currentHour, setCurrentHour] = useState<number>(23); // 23 to 6
  const [currentMinute, setCurrentMinute] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gameSpeed, setGameSpeed] = useState<number>(1); // 1x or 2x
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Economic & Performance State
  const [funds, setFunds] = useState<number>(1500);
  const [dayRevenue, setDayRevenue] = useState<number>(0);
  const [dayFuelCost, setDayFuelCost] = useState<number>(0);
  const [dayStoreProfit, setDayStoreProfit] = useState<number>(0);
  const [satisfaction, setSatisfaction] = useState<number>(95);
  const [satisfiedCount, setSatisfiedCount] = useState<number>(0);
  const [angryCount, setAngryCount] = useState<number>(0);
  const [threatsPrevented, setThreatsPrevented] = useState<number>(0);
  const [threatsFailed, setThreatsFailed] = useState<number>(0);
  const [damagePenalty, setDamagePenalty] = useState<number>(0);
  const [perfectFuelCount, setPerfectFuelCount] = useState<number>(0);

  // Entity States
  const [islands, setIslands] = useState<IslandConfig[]>(INITIAL_ISLANDS);
  const [upgrades, setUpgrades] = useState<EquipmentUpgrade[]>(INITIAL_UPGRADES);
  const [storeInventory, setStoreInventory] = useState<StoreItem[]>(STORE_ITEMS);
  const [customers, setCustomers] = useState<VehicleCustomer[]>([]);
  const [dangerEvents, setDangerEvents] = useState<DangerEvent[]>([]);
  const [activeParticles, setActiveParticles] = useState<
    Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>
  >([]);

  // Player State
  const [player, setPlayer] = useState<PlayerStats>({
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    moveSpeed: 3.5,
    x: 480,
    y: 360,
    facing: 'down',
    selectedTool: 'extinguisher',
    isDodging: false,
    dodgeCooldown: 0,
  });

  const [alarmCooldown, setAlarmCooldown] = useState<number>(0);

  // Movement & Key tracking refs
  const keysPressedRef = useRef<Set<string>>(new Set());
  const playerTargetPosRef = useRef<{ x: number; y: number } | null>(null);

  // Modals
  const [showTitleScreen, setShowTitleScreen] = useState<boolean>(true);
  const [activeCustomerForFuel, setActiveCustomerForFuel] = useState<VehicleCustomer | null>(null);
  const [activeCustomerForPOS, setActiveCustomerForPOS] = useState<VehicleCustomer | null>(null);
  const [posFuelAmount, setPosFuelAmount] = useState<number>(0);
  const [showStoreModal, setShowStoreModal] = useState<boolean>(false);
  const [showShopModal, setShowShopModal] = useState<boolean>(false);
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);

  // Notifications / Toast banners
  const [toasts, setToasts] = useState<Array<{ id: string; text: string; type: 'info' | 'success' | 'danger' }>>([]);

  const addToast = useCallback((text: string, type: 'info' | 'success' | 'danger' = 'info') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev.slice(-3), { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Equipment perks
  const hasSneakers = upgrades.find((u) => u.id === 'sneakers')?.owned ?? false;
  const hasVest = upgrades.find((u) => u.id === 'vest')?.owned ?? false;
  const hasFastNozzle = upgrades.find((u) => u.id === 'fast_nozzle')?.owned ?? false;
  const hasSmartPos = upgrades.find((u) => u.id === 'smart_pos')?.owned ?? false;
  const hasSprinklers = upgrades.find((u) => u.id === 'sprinklers')?.owned ?? false;
  const hasCCTV = upgrades.find((u) => u.id === 'cctv_alarm')?.owned ?? false;
  const hasGuard = upgrades.find((u) => u.id === 'guard_uncle')?.owned ?? false;

  // Sound mute toggle
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.setMuted(nextMuted);
  };

  // Dodge Action
  const handleDodge = useCallback(() => {
    if (player.dodgeCooldown > 0) return;
    sounds.playDodge();
    setPlayer((prev) => ({
      ...prev,
      isDodging: true,
      dodgeCooldown: 2.5,
    }));

    setTimeout(() => {
      setPlayer((prev) => ({ ...prev, isDodging: false }));
    }, 450);
  }, [player.dodgeCooldown]);

  // Keyboard navigation & tool selection (Continuous Press & Release)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        keysPressedRef.current.add(key);
      } else if (e.key === '1') {
        setPlayer((p) => ({ ...p, selectedTool: 'extinguisher' }));
      } else if (e.key === '2') {
        setPlayer((p) => ({ ...p, selectedTool: 'spray' }));
      } else if (e.key === '3') {
        setPlayer((p) => ({ ...p, selectedTool: 'baton' }));
      } else if (e.key === '4') {
        setPlayer((p) => ({ ...p, selectedTool: 'shield' }));
      } else if (e.key === '5') {
        setPlayer((p) => ({ ...p, selectedTool: 'broom' }));
      } else if (e.key === ' ') {
        e.preventDefault();
        handleDodge();
      } else if (key === 'p') {
        setIsPaused((p) => !p);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressedRef.current.delete(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleDodge]);

  // Active virtual D-Pad direction for smooth holding
  const [activeDpadDir, setActiveDpadDir] = useState<'up' | 'down' | 'left' | 'right' | null>(null);

  // Smooth customer arrival and departure callbacks from canvas
  const handleCustomerArrived = useCallback((customerId: string) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId && c.status === 'arriving'
          ? { ...c, status: 'waiting_fuel' as const }
          : c
      )
    );
  }, []);

  const handleCustomerLeft = useCallback((customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  }, []);

  // Player position sync from 60fps canvas engine (throttled)
  const handlePlayerPosSync = useCallback(
    (x: number, y: number, facing: 'left' | 'right' | 'up' | 'down', isMoving: boolean) => {
      setPlayer((prev) => ({
        ...prev,
        x,
        y,
        facing,
        isMoving,
      }));
    },
    []
  );

  // Player Target Movement (via click)
  const handleMovePlayer = (targetX: number, targetY: number) => {
    playerTargetPosRef.current = {
      x: Math.max(50, Math.min(930, targetX)),
      y: Math.max(185, Math.min(570, targetY)),
    };
  };

  // Alarm action
  const handleEmergencyAlarm = useCallback(() => {
    if (alarmCooldown > 0) return;
    sounds.playPoliceSiren();
    setAlarmCooldown(20);
    addToast('🚨 派出所巡邏警車已火速馳援！所有飆仔與滋事分子被全數驅離！', 'success');

    // Clear active street gang or drunk threats
    setDangerEvents((prev) =>
      prev.map((ev) =>
        ev.type === 'gang_revving' || ev.type === 'drunk_rampage'
          ? { ...ev, status: 'resolved' as const }
          : ev
      )
    );
    setThreatsPrevented((p) => p + 1);
    setFunds((p) => p + 500); // Police bounty bonus
  }, [alarmCooldown, addToast]);

  // Directional move from On-screen D-Pad
  const handleDirectionMove = (dir: 'up' | 'down' | 'left' | 'right') => {
    setActiveDpadDir(dir);
    setTimeout(() => setActiveDpadDir(null), 150);
  };

  // Resolve danger when clicked or handled
  const handleResolveDanger = useCallback(
    (ev: DangerEvent) => {
      if (ev.status !== 'active') return;

      const currentTool = player.selectedTool;
      let isSuccess = false;

      if (ev.type === 'smoking') {
        if (currentTool === 'extinguisher' || hasSprinklers) {
          sounds.playExtinguisher();
          isSuccess = true;
          addToast('🧯 成功使用滅火器撲滅香菸！解除加油站爆炸危機！+500 治安獎金', 'success');
        } else {
          sounds.playError();
          addToast('⚠️ 必須切換為【滅火器】才能撲滅香菸火苗！', 'danger');
        }
      } else if (ev.type === 'drunk_rampage') {
        if (currentTool === 'spray' || currentTool === 'baton' || currentTool === 'broom' || hasGuard) {
          sounds.playPepperSpray();
          isSuccess = true;
          addToast('🧴 成功以防身裝備制服鬧事醉漢！超商設施保全完好！+300 獎勵', 'success');
        } else {
          sounds.playError();
          addToast('⚠️ 請使用防身噴霧、電擊棒或掃把驅離醉漢！', 'danger');
        }
      } else if (ev.type === 'gang_revving') {
        if (alarmCooldown > 0) {
          isSuccess = true;
        } else {
          handleEmergencyAlarm();
          isSuccess = true;
        }
      } else if (ev.type === 'physical_attack') {
        if (player.isDodging || currentTool === 'shield') {
          isSuccess = true;
          addToast('🛡️ 漂亮閃避正面投擲攻擊！毫髮無傷！', 'success');
        } else {
          isSuccess = true;
          const damage = hasVest ? 15 : 30;
          setPlayer((p) => ({ ...p, hp: Math.max(0, p.hp - damage) }));
          sounds.playError();
          addToast(`💥 被丟中！體力扣除 ${damage} 點！`, 'danger');
        }
      }

      if (isSuccess) {
        setDangerEvents((prev) =>
          prev.map((d) => (d.id === ev.id ? { ...d, status: 'resolved' } : d))
        );
        setThreatsPrevented((p) => p + 1);
        setFunds((p) => p + 300);

        // Spawn sparkle particles
        for (let i = 0; i < 15; i++) {
          setActiveParticles((p) => [
            ...p,
            {
              x: ev.x,
              y: ev.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              color: '#34d399',
              life: 1.0,
            },
          ]);
        }
      }
    },
    [player.selectedTool, hasSprinklers, hasGuard, hasVest, player.isDodging, alarmCooldown, handleEmergencyAlarm, addToast]
  );

  // Start shift from title screen
  const handleStartGame = () => {
    setShowTitleScreen(false);
    addToast('🌙 23:00 大夜班開始！祝阿強店員值勤平安，注意安全與業績！', 'success');
  };

  // Freeze time during title screen, fueling, POS cashier checkout, or any popup modal!
  const isTimeFrozen =
    showTitleScreen ||
    isPaused ||
    dailyReport !== null ||
    activeCustomerForFuel !== null ||
    activeCustomerForPOS !== null ||
    showStoreModal ||
    showShopModal ||
    showTutorialModal;

  // Time & Game Loop (Frozen during fueling & POS checkout)
  useEffect(() => {
    if (isTimeFrozen) return;

    const interval = setInterval(() => {
      // Advance minute
      setCurrentMinute((prevMin) => {
        let nextMin = prevMin + (gameSpeed === 2 ? 4 : 2);
        if (nextMin >= 60) {
          nextMin = 0;
          setCurrentHour((prevHr) => {
            let nextHr = prevHr + 1;
            if (nextHr >= 24) nextHr = 0;

            // Check for Shift End at 06:00 AM!
            if (nextHr === 6) {
              triggerDaySettlement();
            }
            return nextHr;
          });
        }
        return nextMin;
      });

      // Update Cooldowns (every 200ms)
      setPlayer((p) => ({
        ...p,
        dodgeCooldown: Math.max(0, p.dodgeCooldown - 0.2),
      }));
      setAlarmCooldown((c) => Math.max(0, c - 0.2));

      // Update Customers Patience (Physical movement is smoothly handled at 60 FPS by StationCanvas)
      setCustomers((prev) =>
        prev.map((c) => {
          let curPatience = c.patience;
          if (c.status === 'waiting_fuel' || c.status === 'waiting_payment') {
            curPatience = Math.max(0, c.patience - 0.7);
            if (curPatience <= 0) {
              sounds.playCarRev();
              sounds.playError();
              addToast(`😤 顧客【${c.name}】等太久生氣開走了！商譽受損！`, 'danger');
              setAngryCount((a) => a + 1);
              setSatisfaction((s) => Math.max(20, s - 6));
              return {
                ...c,
                status: 'angry_left' as const,
                targetY: -90,
                speed: 6.5,
              };
            }
          }

          return {
            ...c,
            patience: curPatience,
          };
        })
      );

      // Update Danger Event Timers
      setDangerEvents((prev) =>
        prev
          .map((ev) => {
            if (ev.status !== 'active') return ev;

            // Auto sprinklers check
            if (ev.type === 'smoking' && hasSprinklers) {
              sounds.playExtinguisher();
              addToast('🚿 頂棚自動滅火感應噴淋啟動！瞬間熄滅點菸危機！', 'success');
              return { ...ev, status: 'resolved' as const };
            }

            const nextCd = ev.countdown - 0.2 * (hasCCTV ? 0.75 : 1);
            if (nextCd <= 0) {
              // Danger Exploded / Failed!
              sounds.playExplosion();
              sounds.playError();
              if (ev.type === 'smoking') {
                addToast('💥 加油站香菸引燃火災！緊急噴水撲滅，商譽大受重創！扣除 $1000 維修費', 'danger');
                setDamagePenalty((d) => d + 1000);
                setFunds((f) => Math.max(0, f - 1000));
                setSatisfaction((s) => Math.max(10, s - 25));
              } else {
                addToast(`💥 騷亂未即時防禦成功！設施遭砸壞，損失修復費 $500！`, 'danger');
                setDamagePenalty((d) => d + 500);
                setFunds((f) => Math.max(0, f - 500));
              }
              setThreatsFailed((f) => f + 1);
              return { ...ev, status: 'detonated' as const };
            }
            return { ...ev, countdown: nextCd };
          })
          .filter((ev) => ev.status === 'active')
      );
    }, 200);

    return () => clearInterval(interval);
  }, [
    isPaused,
    dailyReport,
    gameSpeed,
    hasCCTV,
    hasSprinklers,
    addToast,
  ]);

  // Customer Spawning Logic Callback
  const spawnCustomer = useCallback((manual = false) => {
    // Find open unlocked island
    const availableIslands = islands.filter(
      (island) =>
        island.unlocked &&
        !customers.some(
          (c) =>
            c.assignedIslandId === island.id &&
            c.status !== 'leaving' &&
            c.status !== 'angry_left'
        )
    );

    if (availableIslands.length === 0) {
      if (manual) {
        addToast('⚠️ 目前所有營業中加油島皆有車輛！請先完成服務或擴建新島位！', 'info');
      }
      return;
    }

    // Pick random template from expanded diverse customer pool
    const template = CUSTOMER_POOL[Math.floor(Math.random() * CUSTOMER_POOL.length)];
    // Match island type if possible
    const targetIsland =
      availableIslands.find((i) =>
        template.vehicleType === 'scooter' || template.vehicleType === 'delivery'
          ? i.type === 'scooter'
          : i.type === 'car'
      ) || availableIslands[0];

    const newCustomer: VehicleCustomer = {
      id: Math.random().toString(),
      name: template.name,
      roleTitle: template.roleTitle,
      vehicleType: template.vehicleType,
      vehicleColor: template.vehicleColor,
      avatarIcon: template.avatarIcon,
      assignedIslandId: targetIsland.id,
      slotIndex: 0,
      speechText: template.speechText,
      fuelType: template.fuelType,
      fuelDemandMode: template.fuelDemandMode,
      targetAmount: template.targetAmount,
      targetLiters: Number((template.targetAmount / FUEL_PRICES[template.fuelType].price).toFixed(2)),
      unitPrice: FUEL_PRICES[template.fuelType].price,
      paymentMethod: template.paymentMethod,
      invoiceType: template.invoiceType,
      taxIdNumber: template.taxIdNumber,
      wantsStoreItem: template.wantsStoreItem,
      storeProductWanted: template.storeProductWanted,
      status: 'arriving',
      patience: 100,
      maxPatience: 100,
      arrivalHour: currentHour,
      x: targetIsland.x - 30,
      y: 650, // Drives in smoothly from bottom road
      targetX: targetIsland.x - 30,
      targetY: targetIsland.y + 40,
      speed: 4.5,
    };

    sounds.playCarRev();
    setCustomers((prev) => [...prev, newCustomer]);
    if (manual) {
      addToast(`📢 招攬成功！客人【${newCustomer.roleTitle}】駛入 ${targetIsland.name}！`, 'success');
    } else {
      addToast(`🚗 客人【${newCustomer.roleTitle}】駛入 ${targetIsland.name}！`, 'info');
    }

    // Random danger trigger on high risk customer
    if (template.isHighRisk && Math.random() < 0.8) {
      setTimeout(() => {
        sounds.playLighterFlick();
        setDangerEvents((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            type: 'smoking',
            title: '站內點菸危機！',
            description: '顧客正在點火抽菸！快用滅火器噴滅！',
            threatTargetId: newCustomer.id,
            x: targetIsland.x - 30,
            y: targetIsland.y + 10,
            countdown: hasCCTV ? 6.5 : 4.5,
            maxCountdown: hasCCTV ? 6.5 : 4.5,
            requiredTool: 'extinguisher',
            status: 'active',
            warningColor: '#ef4444',
            targetRadius: 40,
          },
        ]);
      }, 1500);
    }
  }, [islands, customers, currentHour, hasCCTV, addToast]);

  // Periodic Auto Customer Spawning
  useEffect(() => {
    if (isTimeFrozen) return;

    // Immediately call one in if empty
    if (customers.length === 0) {
      spawnCustomer(false);
    }

    const spawnTimer = setInterval(() => {
      spawnCustomer(false);
    }, 2800 / gameSpeed);

    return () => clearInterval(spawnTimer);
  }, [isTimeFrozen, customers.length, gameSpeed, spawnCustomer]);

  // Random midnight spontaneous threats (Drunk guy or Gang racers)
  useEffect(() => {
    if (isTimeFrozen) return;

    const threatTimer = setInterval(() => {
      if (Math.random() < (hasGuard ? 0.2 : 0.45)) {
        const threatKind = Math.random() > 0.5 ? 'drunk_rampage' : 'gang_revving';

        if (threatKind === 'drunk_rampage') {
          sounds.playError();
          setDangerEvents((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              type: 'drunk_rampage',
              title: '醉漢踢館鬧事！',
              description: '醉漢在便利超商前咆哮砸東西！用防身噴霧制服！',
              x: 690,
              y: 280,
              countdown: hasCCTV ? 7.0 : 5.0,
              maxCountdown: hasCCTV ? 7.0 : 5.0,
              requiredTool: 'spray',
              status: 'active',
              warningColor: '#f59e0b',
              targetRadius: 45,
            },
          ]);
          addToast('🚨 突發狀況！醉漢闖進超商門口砸東西，快用噴霧制服！', 'danger');
        } else {
          sounds.playCarRev();
          setDangerEvents((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              type: 'gang_revving',
              title: '改裝飆仔車隊佔道！',
              description: '改裝車隊拉轉製造噪音！按下 110 緊急報警！',
              x: 380,
              y: 520,
              countdown: hasCCTV ? 8.0 : 6.0,
              maxCountdown: hasCCTV ? 8.0 : 6.0,
              requiredTool: 'alarm',
              status: 'active',
              warningColor: '#dc2626',
              targetRadius: 55,
            },
          ]);
          addToast('🚨 改裝車飆仔在車道大迴轉拉轉，快按 110 警報！', 'danger');
        }
      }
    }, 14000 / gameSpeed);

    return () => clearInterval(threatTimer);
  }, [isTimeFrozen, hasGuard, hasCCTV, gameSpeed, addToast]);

  // Click on customer vehicle
  const handleSelectCustomer = (customer: VehicleCustomer) => {
    // Automatically walk player over to vehicle
    handleMovePlayer(customer.x + 25, customer.y);

    if (customer.status === 'waiting_fuel') {
      setActiveCustomerForFuel(customer);
    } else if (customer.status === 'waiting_payment') {
      setPosFuelAmount(customer.targetAmount);
      setActiveCustomerForPOS(customer);
    }
  };

  // Fueling Completed
  const handleFinishFueling = (result: {
    actualAmount: number;
    actualLiters: number;
    isPerfect: boolean;
    isSpilled: boolean;
    selectedFuel: FuelType;
  }) => {
    if (!activeCustomerForFuel) return;
    const customer = activeCustomerForFuel;

    if (result.isSpilled) {
      setDamagePenalty((p) => p + 150);
      setSatisfaction((s) => Math.max(10, s - 10));
      addToast(`⚠️ 油箱溢油！扣除清理費 $150，顧客相當不滿！`, 'danger');
    }

    if (result.isPerfect) {
      setPerfectFuelCount((p) => p + 1);
      setSatisfaction((s) => Math.min(100, s + 3));
      addToast(`✨ 精準湊整數！顧客心滿意足，送上 $50 感謝小費！`, 'success');
      setFunds((f) => f + 50);
    }

    // Advance state to waiting payment
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customer.id
          ? {
              ...c,
              targetAmount: result.actualAmount,
              targetLiters: result.actualLiters,
              status: 'waiting_payment',
              patience: 100,
            }
          : c
      )
    );

    setActiveCustomerForFuel(null);
  };

  // Checkout Completed
  const handleFinishCheckout = (result: {
    totalRevenue: number;
    tip: number;
    isCorrectChange: boolean;
    hasTaxIdDone: boolean;
    hasCarrierDone: boolean;
  }) => {
    if (!activeCustomerForPOS) return;
    const customer = activeCustomerForPOS;

    const fuelCost = Math.round(result.totalRevenue * 0.7);
    const profit = result.totalRevenue - fuelCost + result.tip;

    setFunds((f) => f + profit);
    setDayRevenue((r) => r + result.totalRevenue);
    setDayFuelCost((fc) => fc + fuelCost);

    if (customer.wantsStoreItem) {
      setDayStoreProfit((p) => p + 25);
    }

    setSatisfiedCount((sc) => sc + 1);
    setSatisfaction((s) => Math.min(100, s + (result.isCorrectChange ? 2 : -5)));

    // Leave animation - smoothly drives out onto highway exit
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customer.id
          ? { ...c, status: 'leaving' as const, targetY: -90, speed: 5.0 }
          : c
      )
    );

    addToast(`🧾 顧客【${customer.name}】完成結帳，入帳淨額 $${profit}！`, 'success');
    setActiveCustomerForPOS(null);
  };

  // Convenience Store Restock
  const handleRestockStore = (itemId: string, count: number, cost: number) => {
    setFunds((f) => f - cost);
    setStoreInventory((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, stock: item.stock + count } : item))
    );
  };

  // Buy Upgrades
  const handleBuyUpgrade = (upgradeId: string, cost: number) => {
    setFunds((f) => f - cost);
    setUpgrades((prev) =>
      prev.map((u) => (u.id === upgradeId ? { ...u, owned: true, level: u.level + 1 } : u))
    );
  };

  const handleUnlockIsland = (islandId: string, cost: number) => {
    setFunds((f) => f - cost);
    setIslands((prev) =>
      prev.map((i) => (i.id === islandId ? { ...i, unlocked: true } : i))
    );
  };

  const handleInstallSprinkler = (islandId: string, cost: number) => {
    setFunds((f) => f - cost);
    setIslands((prev) =>
      prev.map((i) => (i.id === islandId ? { ...i, hasSprinkler: true } : i))
    );
  };

  // Trigger End of Day Settlement (06:00 AM)
  const triggerDaySettlement = () => {
    sounds.playPerfect();

    const netProfit = dayRevenue - dayFuelCost + dayStoreProfit;
    const safetyScore = threatsPrevented * 500 - threatsFailed * 2000;
    // Formula from GDD: Total Score = (營利 * 1.5) + (滿意度 * 20) + 安全維護分 - 損失修復費
    const totalScore = Math.round(
      Math.max(0, netProfit * 1.5 + satisfaction * 20 + safetyScore - damagePenalty)
    );

    let grade: 'S' | 'A' | 'B' | 'C' | 'F' = 'B';
    let managerComment = '';

    if (totalScore >= 4500 && satisfaction >= 90 && threatsFailed === 0) {
      grade = 'S';
      managerComment =
        '太神啦阿強！你簡直是大夜神人！面對點菸、改裝飆仔面不改色，發票找零零失誤！總部決定頒發最高榮譽治安大紅包！明天繼續維持！';
    } else if (totalScore >= 3200 && threatsFailed <= 1) {
      grade = 'A';
      managerComment =
        '表現非常出色！大夜班能有這般營業額與滿意度相當不容易，顧客對你的加滿手藝讚譽有加，老林我看好你升店長！';
    } else if (totalScore >= 2000) {
      grade = 'B';
      managerComment =
        '及格過關！雖然有少數幾組奧客抱怨等待過久，但至少沒有把加油站引爆，平安下班最要緊，回家好好補眠！';
    } else if (totalScore >= 1000) {
      grade = 'C';
      managerComment =
        '阿強啊...今天差點讓奧客把店內熱狗機踢翻，扣除修繕費你今天差點白幹了！動作要再更俐落、更警覺一點！';
    } else {
      grade = 'F';
      managerComment =
        '天啊！滅火器放在哪都不知道嗎？！警車鳴笛整個街區都聽到了！明天早上九點準時到站長辦公室寫檢討報告！';
    }

    setDailyReport({
      day,
      revenue: dayRevenue,
      fuelCost: dayFuelCost,
      storeProfit: dayStoreProfit,
      satisfaction,
      satisfiedCount,
      angryCount,
      threatsPrevented,
      threatsFailed,
      damagePenalty,
      bountyReward: threatsPrevented * 500,
      perfectFuelCount,
      totalScore,
      grade,
      managerComment,
    });
  };

  // Start Next Day Shift
  const handleStartNextDay = () => {
    setDay((d) => d + 1);
    setCurrentHour(23);
    setCurrentMinute(0);
    setDayRevenue(0);
    setDayFuelCost(0);
    setDayStoreProfit(0);
    setSatisfiedCount(0);
    setAngryCount(0);
    setThreatsPrevented(0);
    setThreatsFailed(0);
    setDamagePenalty(0);
    setPerfectFuelCount(0);
    setCustomers([]);
    setDangerEvents([]);
    setDailyReport(null);
    setPlayer((p) => ({ ...p, hp: 100 }));
    addToast(`🌅 第 ${day + 1} 天大夜班開始！願平安順利！`, 'info');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans select-none antialiased">
      {/* Top Banner Navigation */}
      <header className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-black border-b border-zinc-800 px-4 py-3 sticky top-0 z-40 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* App Title & Taiwan Gas Station Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-xl shadow-lg border border-emerald-400">
            碰
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-lg tracking-wider text-emerald-400">
                碰！大夜加油站
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                TAIWAN NIGHT SHIFT
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              加滿湊整數・載具統編・點菸撲滅・迎戰奧客與飆仔
            </p>
          </div>
        </div>

        {/* Live Clock & Shift Progress */}
        <div className="flex items-center gap-4 bg-zinc-950 px-4 py-2 rounded-2xl border border-zinc-800 shadow-inner">
          <div className="flex items-center gap-2">
            {currentHour >= 5 ? (
              <Sun className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
            ) : (
              <Moon className="w-5 h-5 text-indigo-400 animate-pulse" />
            )}
            <div>
              <span className="text-[10px] text-zinc-500 block font-mono">大夜值勤時間 (DAY {day})</span>
              <span className="text-base sm:text-lg font-mono font-black text-zinc-100 tracking-wider">
                {currentHour.toString().padStart(2, '0')}:{currentMinute.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="h-7 w-px bg-zinc-800" />

          {/* Funds */}
          <div>
            <span className="text-[10px] text-zinc-500 block font-mono">營收結餘</span>
            <span className="text-base sm:text-lg font-mono font-black text-emerald-400">
              ${funds}
            </span>
          </div>

          <div className="h-7 w-px bg-zinc-800" />

          {/* Satisfaction */}
          <div>
            <span className="text-[10px] text-zinc-500 block font-mono">商譽滿意度</span>
            <span
              className={`text-base sm:text-lg font-mono font-black ${
                satisfaction >= 80 ? 'text-yellow-400' : 'text-red-400'
              }`}
            >
              {satisfaction}%
            </span>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* Time Freeze Indicator Badge */}
          {(activeCustomerForFuel !== null || activeCustomerForPOS !== null) && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-amber-950/80 text-yellow-300 border-2 border-yellow-400 text-xs font-bold font-pixel-tc animate-pulse pixel-box-sm shadow-md">
              <span className="w-2 h-2 bg-yellow-400" />
              <span>⏸️ 服務中・時間已凍結</span>
            </div>
          )}

          {/* Quick Call Customer Button */}
          <button
            onClick={() => spawnCustomer(true)}
            className="px-2.5 py-1.5 border-2 border-cyan-400 bg-cyan-900 hover:bg-cyan-800 text-cyan-200 text-xs font-bold pixel-btn flex items-center gap-1 active:scale-95 cursor-pointer"
            title="主動揮旗招攬顧客，引導一台車輛進站！"
          >
            <span>📢 招攬顧客</span>
          </button>

          {/* Pause / Play */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
              isPaused
                ? 'bg-amber-600 border-amber-400 text-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
            title="暫停遊戲 (快速鍵 P)"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Speed Toggle (1x / 2x) */}
          <button
            onClick={() => setGameSpeed(gameSpeed === 1 ? 2 : 1)}
            className="px-2.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-bold text-zinc-300 transition"
            title="切換遊戲時間倍速"
          >
            {gameSpeed}x
          </button>

          {/* Mute Toggle */}
          <button
            onClick={toggleMute}
            className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition"
            title="切換音效"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Tutorial Handbook */}
          <button
            onClick={() => setShowTutorialModal(true)}
            className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
            title="查看大夜班員工教戰手冊"
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">店員手冊</span>
          </button>

          {/* Title Screen / Menu */}
          <button
            onClick={() => setShowTitleScreen(true)}
            className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
            title="主選單與故事設定"
          >
            <Home className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">主畫面</span>
          </button>
        </div>
      </header>

      {/* Main Play Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4 relative">
        {/* Floating Toasts Notification System */}
        <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`p-3 rounded-xl border text-xs font-bold shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2 ${
                t.type === 'danger'
                  ? 'bg-red-950/95 border-red-500 text-red-200'
                  : t.type === 'success'
                  ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
                  : 'bg-zinc-900/95 border-zinc-700 text-zinc-200'
              }`}
            >
              {t.type === 'danger' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
              {t.type === 'success' && <Award className="w-4 h-4 text-emerald-400 shrink-0" />}
              <span>{t.text}</span>
            </div>
          ))}
        </div>

        {/* Status Bar Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-zinc-400">目前車道在席:</span>
            <span className="font-bold text-sky-400">{customers.length} 台</span>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-zinc-400">安全危機防禦:</span>
            <span className="font-bold text-emerald-400">{threatsPrevented} 次成功</span>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-zinc-400">完美服務湊整:</span>
            <span className="font-bold text-yellow-400">{perfectFuelCount} 次跳槍</span>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-zinc-400">當前裝備工具:</span>
            <span className="font-bold text-zinc-200 uppercase">{player.selectedTool}</span>
          </div>
        </div>

        {/* Gas Station Canvas Field */}
        <StationCanvas
          player={player}
          customers={customers}
          dangerEvents={dangerEvents}
          islands={islands}
          currentHour={currentHour}
          currentMinute={currentMinute}
          onSelectCustomer={handleSelectCustomer}
          onResolveDanger={handleResolveDanger}
          onMovePlayer={handleMovePlayer}
          onCustomerArrived={handleCustomerArrived}
          onCustomerLeft={handleCustomerLeft}
          onPlayerPosSync={handlePlayerPosSync}
          activeDpadDir={activeDpadDir}
          hasCCTV={hasCCTV}
          hasGuard={hasGuard}
          hasSneakers={hasSneakers}
          activeParticles={activeParticles}
        />

        {/* Action Controls Toolbar at Bottom */}
        <ActionControls
          player={player}
          onSelectTool={(tool) => setPlayer((p) => ({ ...p, selectedTool: tool }))}
          onDodge={handleDodge}
          onEmergencyAlarm={handleEmergencyAlarm}
          onOpenStore={() => {
            sounds.playStoreDingDong();
            setShowStoreModal(true);
          }}
          onOpenShop={() => setShowShopModal(true)}
          onDirectionStart={(dir) => setActiveDpadDir(dir)}
          onDirectionEnd={() => setActiveDpadDir(null)}
          onDirectionMove={handleDirectionMove}
          onCallCustomer={() => spawnCustomer(true)}
          alarmCooldown={alarmCooldown}
        />
      </main>

      {/* Interactive Modals */}
      {activeCustomerForFuel && (
        <FuelingModal
          customer={activeCustomerForFuel}
          hasFastNozzle={hasFastNozzle}
          onFinishFueling={handleFinishFueling}
          onClose={() => setActiveCustomerForFuel(null)}
        />
      )}

      {activeCustomerForPOS && (
        <POSModal
          customer={activeCustomerForPOS}
          fuelAmount={posFuelAmount}
          hasSmartPos={hasSmartPos}
          onFinishCheckout={handleFinishCheckout}
          onClose={() => setActiveCustomerForPOS(null)}
        />
      )}

      {showStoreModal && (
        <StoreModal
          items={storeInventory}
          playerFunds={funds}
          onRestock={handleRestockStore}
          onClose={() => setShowStoreModal(false)}
        />
      )}

      {showShopModal && (
        <ShopAndLayoutModal
          upgrades={upgrades}
          islands={islands}
          playerFunds={funds}
          onBuyUpgrade={handleBuyUpgrade}
          onUnlockIsland={handleUnlockIsland}
          onInstallSprinkler={handleInstallSprinkler}
          onClose={() => setShowShopModal(false)}
        />
      )}

      {showTutorialModal && (
        <TutorialModal onClose={() => setShowTutorialModal(false)} />
      )}

      {dailyReport && (
        <DailyReportModal
          report={dailyReport}
          onProceedToShop={() => {
            setDailyReport(null);
            setShowShopModal(true);
          }}
          onStartNextDay={handleStartNextDay}
        />
      )}

      {showTitleScreen && (
        <TitleScreenModal
          onStartGame={handleStartGame}
          onOpenTutorial={() => setShowTutorialModal(true)}
          highScore={funds}
        />
      )}
    </div>
  );
}

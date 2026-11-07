import React, { useEffect, useRef } from 'react';
import { DangerEvent, IslandConfig, PlayerStats, VehicleCustomer } from '../types/game';

interface StationCanvasProps {
  player: PlayerStats;
  customers: VehicleCustomer[];
  dangerEvents: DangerEvent[];
  islands: IslandConfig[];
  currentHour: number;
  currentMinute: number;
  onSelectCustomer: (customer: VehicleCustomer) => void;
  onResolveDanger: (event: DangerEvent) => void;
  onMovePlayer: (x: number, y: number) => void;
  onCustomerArrived?: (customerId: string) => void;
  onCustomerLeft?: (customerId: string) => void;
  onPlayerPosSync?: (x: number, y: number, facing: 'left' | 'right' | 'up' | 'down', isMoving: boolean) => void;
  activeDpadDir?: 'up' | 'down' | 'left' | 'right' | null;
  hasCCTV: boolean;
  hasGuard: boolean;
  hasSneakers?: boolean;
  activeParticles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
}

export const StationCanvas: React.FC<StationCanvasProps> = (props) => {
  const {
    onSelectCustomer,
    onResolveDanger,
    onMovePlayer,
    onCustomerArrived,
    onCustomerLeft,
    onPlayerPosSync,
    activeDpadDir,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Store latest props in a ref so the 60 FPS animation loop never needs to restart
  const propsRef = useRef(props);
  propsRef.current = props;

  // Active keyboard keys
  const keysRef = useRef<Set<string>>(new Set());

  // Real-time smoothed player state (runs at 60 FPS independent of React renders)
  const playerPosRef = useRef({
    x: props.player.x,
    y: props.player.y,
    facing: props.player.facing,
    isMoving: false,
  });

  // Mouse/Touch click destination
  const mouseTargetRef = useRef<{ x: number; y: number } | null>(null);

  // Real-time smoothed vehicle positions (Map: customer.id -> { x, y })
  const vehiclePosMapRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Local particles for 60fps smoothness
  const localParticlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>>([]);

  // Sync new particles from props
  useEffect(() => {
    if (props.activeParticles.length > 0) {
      localParticlesRef.current = [...localParticlesRef.current, ...props.activeParticles];
    }
  }, [props.activeParticles]);

  // Window key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        keysRef.current.add(k);
        mouseTargetRef.current = null;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current.delete(k);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle external movement command (e.g. click customer -> walk to pump)
  useEffect(() => {
    if (Math.abs(props.player.x - playerPosRef.current.x) > 90 || Math.abs(props.player.y - playerPosRef.current.y) > 90) {
      playerPosRef.current.x = props.player.x;
      playerPosRef.current.y = props.player.y;
    }
  }, [props.player.x, props.player.y]);

  // Canvas click handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const { dangerEvents, customers } = propsRef.current;

    // 1. Check Danger event click
    for (const danger of dangerEvents) {
      if (danger.status === 'active') {
        const dist = Math.hypot(danger.x - clickX, danger.y - clickY);
        if (dist <= danger.targetRadius + 25) {
          onResolveDanger(danger);
          return;
        }
      }
    }

    // 2. Check Customer vehicle click (using real-time rendered position)
    for (const customer of customers) {
      const pos = vehiclePosMapRef.current.get(customer.id) || { x: customer.x, y: customer.y };
      const inX = Math.abs(pos.x - clickX) <= 50;
      const inY = clickY >= pos.y - 85 && clickY <= pos.y + 45;
      if (inX && inY) {
        onSelectCustomer(customer);
        return;
      }
    }

    // 3. Otherwise smooth walk to target
    const targetX = Math.max(50, Math.min(930, clickX));
    const targetY = Math.max(185, Math.min(570, clickY));
    mouseTargetRef.current = { x: targetX, y: targetY };
    onMovePlayer(targetX, targetY);
  };

  // Main Persistent 60 FPS Animation & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let syncTimer = 0;

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      syncTimer += dt;

      const {
        customers,
        dangerEvents,
        islands,
        currentHour,
        currentMinute,
        hasCCTV,
        hasGuard,
        hasSneakers,
        player,
      } = propsRef.current;

      // ----------------------------------------------------
      // 1. Smooth 60 FPS Player Movement Physics
      // ----------------------------------------------------
      const keys = keysRef.current;
      const dpad = activeDpadDir;

      let dx = 0;
      let dy = 0;

      if (keys.has('w') || keys.has('arrowup') || dpad === 'up') dy -= 1;
      if (keys.has('s') || keys.has('arrowdown') || dpad === 'down') dy += 1;
      if (keys.has('a') || keys.has('arrowleft') || dpad === 'left') dx -= 1;
      if (keys.has('d') || keys.has('arrowright') || dpad === 'right') dx += 1;

      const playerPos = playerPosRef.current;
      const speed = (hasSneakers ? 280 : 200);

      if (dx !== 0 || dy !== 0) {
        mouseTargetRef.current = null;
        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }

        playerPos.x += dx * speed * dt;
        playerPos.y += dy * speed * dt;
        playerPos.x = Math.max(50, Math.min(930, playerPos.x));
        playerPos.y = Math.max(185, Math.min(570, playerPos.y));

        playerPos.facing =
          Math.abs(dx) > Math.abs(dy)
            ? dx > 0
              ? 'right'
              : 'left'
            : dy > 0
            ? 'down'
            : 'up';
        playerPos.isMoving = true;
      } else if (mouseTargetRef.current) {
        const target = mouseTargetRef.current;
        const tdx = target.x - playerPos.x;
        const tdy = target.y - playerPos.y;
        const dist = Math.hypot(tdx, tdy);

        if (dist <= 4) {
          mouseTargetRef.current = null;
          playerPos.isMoving = false;
        } else {
          const moveStep = Math.min(dist, speed * dt);
          playerPos.x += (tdx / dist) * moveStep;
          playerPos.y += (tdy / dist) * moveStep;
          playerPos.facing =
            Math.abs(tdx) > Math.abs(tdy)
              ? tdx > 0
                ? 'right'
                : 'left'
              : tdy > 0
              ? 'down'
              : 'up';
          playerPos.isMoving = true;
        }
      } else {
        playerPos.isMoving = false;
      }

      // Sync position to React state periodically (every 120ms) or when stopped, to prevent React from 60fps re-rendering
      if (syncTimer > 0.12) {
        syncTimer = 0;
        onPlayerPosSync?.(playerPos.x, playerPos.y, playerPos.facing, playerPos.isMoving);
      }

      // ----------------------------------------------------
      // 2. Smooth 60 FPS Customer Vehicle Movement
      // ----------------------------------------------------
      const vMap = vehiclePosMapRef.current;
      customers.forEach((c) => {
        let cur = vMap.get(c.id);
        if (!cur) {
          cur = { x: c.x, y: c.y };
          vMap.set(c.id, cur);
        }

        const tdx = c.targetX - cur.x;
        const tdy = c.targetY - cur.y;
        const dist = Math.hypot(tdx, tdy);

        if (dist > 1.5) {
          const carSpeed = (c.speed || 4.5) * 55;
          const step = Math.min(dist, carSpeed * dt);
          cur.x += (tdx / dist) * step;
          cur.y += (tdy / dist) * step;
        }

        // Notify arrival when reached target
        if (c.status === 'arriving' && dist <= 5) {
          onCustomerArrived?.(c.id);
        }

        // Notify departure when left canvas
        if ((c.status === 'leaving' || c.status === 'angry_left') && cur.y <= -75) {
          onCustomerLeft?.(c.id);
          vMap.delete(c.id);
        }
      });

      // ----------------------------------------------------
      // 3. Smooth Particle Physics
      // ----------------------------------------------------
      const particles = localParticlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt * 50;
        p.y += p.vy * dt * 50;
        p.life -= dt * 1.6;
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      // ----------------------------------------------------
      // 4. Render Canvas Frame
      // ----------------------------------------------------
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 16-bit Retro Pixel Sky & Night Taiwanese street background
      let skyGrad = ctx.createLinearGradient(0, 0, 0, 160);
      if (currentHour >= 5) {
        skyGrad.addColorStop(0, '#090d16');
        skyGrad.addColorStop(1, '#1e293b');
      } else {
        skyGrad.addColorStop(0, '#020617');
        skyGrad.addColorStop(1, '#090d16');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, 160);

      // Pixel stars in the night sky
      ctx.fillStyle = '#fef08a';
      for (let s = 0; s < 25; s++) {
        const sx = (s * 41 + 17) % canvas.width;
        const sy = (s * 23 + 11) % 90;
        ctx.fillRect(sx, sy, s % 2 === 0 ? 2 : 3, s % 2 === 0 ? 2 : 3);
      }

      // Distant elevated highway
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 100, canvas.width, 18);
      ctx.fillStyle = '#1e293b';
      for (let x = 60; x < canvas.width; x += 140) {
        ctx.fillRect(x, 118, 16, 42);
      }

      // Neon sign: 幼齒檳榔
      ctx.save();
      const neonFlicker = Math.sin(now / 200) > -0.3;
      ctx.fillStyle = neonFlicker ? '#f43f5e' : '#881337';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = neonFlicker ? 12 : 2;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('⚡ 幼齒檳榔 雙子星 ⚡', 30, 85);
      ctx.restore();

      // Distant highway cars driving
      const carOffset = (now / 15) % (canvas.width + 100) - 50;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(canvas.width - carOffset, 106, 6, 3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(carOffset, 108, 6, 3);

      // Gas Station Main Concrete Ground & Lanes
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 160, canvas.width, canvas.height - 160);

      // Yellow lane lines and arrows
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(180, 170);
      ctx.lineTo(180, canvas.height - 10);
      ctx.moveTo(480, 170);
      ctx.lineTo(480, canvas.height - 10);
      ctx.moveTo(760, 170);
      ctx.lineTo(760, canvas.height - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      // Lane guide text
      ctx.fillStyle = '#eab308';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('▲ 汽車專用', 230, 560);
      ctx.fillText('▲ 機車專用道', 530, 560);
      ctx.fillText('▲ 熄火加油 嚴禁煙火', 340, 585);

      // Convenience Store attached to station (Top Right)
      ctx.fillStyle = '#27272a';
      ctx.fillRect(660, 160, 310, 190);
      const storeGlow = ctx.createLinearGradient(660, 160, 970, 350);
      storeGlow.addColorStop(0, '#fef08a');
      storeGlow.addColorStop(1, '#ffffff');
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(670, 170, 290, 170);

      // Store signboard
      ctx.fillStyle = '#059669';
      ctx.fillRect(660, 140, 310, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('🏪 大夜生鮮便利超商 24H', 720, 157);

      // Interior counters & Oden / Tea egg pots
      ctx.fillStyle = '#78350f';
      ctx.fillRect(685, 230, 80, 50);
      ctx.fillStyle = '#b45309';
      ctx.font = '10px sans-serif';
      ctx.fillText('🥚茶葉蛋 🍢關東煮', 690, 222);

      // Steam puffs from oden
      const steamY = (now / 30) % 15;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(710, 215 - steamY, 4, 0, Math.PI * 2);
      ctx.arc(740, 218 - steamY * 0.8, 5, 0, Math.PI * 2);
      ctx.fill();

      // Beverage Fridge in store
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(860, 180, 85, 80);
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('冷藏飲料/保力達B', 865, 195);

      // POS Cashier Counter
      ctx.fillStyle = '#10b981';
      ctx.fillRect(685, 295, 60, 35);
      ctx.fillStyle = '#064e3b';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('POS收銀', 692, 316);

      // Emergency Tool Rack on wall
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(630, 220, 24, 70);
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px sans-serif';
      ctx.fillText('滅', 636, 242);
      ctx.fillText('火', 636, 258);
      ctx.fillText('器', 636, 274);

      // Emergency Police Alarm Button on wall
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(642, 320, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px sans-serif';
      ctx.fillText('警報', 634, 323);

      // Huge Illuminated Gas Station Canopy (加油站大雨棚)
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(140, 150, 480, 30);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(140, 140, 480, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(140, 144, 480, 3);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(140, 147, 480, 4);

      // Brand Sign on Canopy
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 15px sans-serif';
      ctx.fillText('中 華 碰 碰 國 營 加 油 站', 240, 172);

      // Price Board on Left Column
      ctx.fillStyle = '#09090b';
      ctx.fillRect(20, 160, 110, 170);
      ctx.strokeStyle = '#27272a';
      ctx.strokeRect(20, 160, 110, 170);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('今日油價看板', 32, 180);

      const prices = [
        { label: '92 無鉛', val: '29.5', color: '#22c55e' },
        { label: '95 無鉛', val: '31.0', color: '#ef4444' },
        { label: '98 無鉛', val: '33.0', color: '#3b82f6' },
        { label: '超級柴油', val: '27.2', color: '#f59e0b' },
      ];
      prices.forEach((p, idx) => {
        ctx.fillStyle = p.color;
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(p.label, 30, 205 + idx * 28);
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`$${p.val}`, 88, 205 + idx * 28);
      });

      // Canopy Light Cones
      ctx.save();
      const lightBeam1 = ctx.createRadialGradient(280, 220, 10, 280, 320, 180);
      lightBeam1.addColorStop(0, 'rgba(254, 240, 138, 0.25)');
      lightBeam1.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = lightBeam1;
      ctx.fillRect(160, 180, 240, 280);

      const lightBeam2 = ctx.createRadialGradient(580, 220, 10, 580, 320, 180);
      lightBeam2.addColorStop(0, 'rgba(254, 240, 138, 0.25)');
      lightBeam2.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = lightBeam2;
      ctx.fillRect(460, 180, 240, 280);
      ctx.restore();

      // Gas Pump Islands
      islands.forEach((island) => {
        if (!island.unlocked) {
          ctx.strokeStyle = '#3f3f46';
          ctx.setLineDash([6, 6]);
          ctx.strokeRect(island.x - 45, island.y - 35, 90, 70);
          ctx.setLineDash([]);
          ctx.fillStyle = '#71717a';
          ctx.font = '10px sans-serif';
          ctx.fillText('未解鎖島位', island.x - 25, island.y);
          ctx.fillText(`$${island.cost}`, island.x - 16, island.y + 14);
          return;
        }

        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(island.x - 50, island.y - 35, 100, 70);
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 2;
        ctx.strokeRect(island.x - 50, island.y - 35, 100, 70);

        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(island.x - 22, island.y - 30, 44, 60);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(island.name.substring(0, 2), island.x - 10, island.y - 14);

        // Nozzles colored tabs
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(island.x - 18, island.y + 2, 7, 14);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(island.x - 8, island.y + 2, 7, 14);
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(island.x + 2, island.y + 2, 7, 14);
        if (island.fuels.includes('diesel')) {
          ctx.fillStyle = '#d97706';
          ctx.fillRect(island.x + 12, island.y + 2, 7, 14);
        }

        if (island.hasSprinkler) {
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(island.x, island.y - 45, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Security Guard Uncle if hired
      if (hasGuard) {
        ctx.save();
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(660, 360, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        ctx.fillText('👮', 653, 365);
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#93c5fd';
        ctx.fillText('勇伯', 652, 382);
        ctx.restore();
      }

      // ----------------------------------------------------
      // Draw Customer Vehicles (Using 60 FPS Smoothed Coords)
      // ----------------------------------------------------
      customers.forEach((c) => {
        const pos = vMap.get(c.id) || { x: c.x, y: c.y };
        ctx.save();

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y + 12, 28, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Vehicle Body
        if (c.vehicleType === 'scooter' || c.vehicleType === 'delivery') {
          ctx.fillStyle = c.vehicleColor;
          ctx.beginPath();
          ctx.roundRect(pos.x - 14, pos.y - 20, 28, 40, 8);
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          if (c.vehicleType === 'delivery') {
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(pos.x - 10, pos.y + 4, 20, 16);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 7px sans-serif';
            ctx.fillText('DELIVER', pos.x - 9, pos.y + 14);
          }

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y - 20, 4, 0, Math.PI * 2);
          ctx.fill();

          if (c.roleTitle.includes('勁戰')) {
            ctx.shadowColor = '#6366f1';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = '#818cf8';
            ctx.strokeRect(pos.x - 15, pos.y - 21, 30, 42);
          }
        } else if (c.vehicleType === 'taxi') {
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.roundRect(pos.x - 24, pos.y - 36, 48, 72, 8);
          ctx.fill();
          ctx.strokeStyle = '#ca8a04';
          ctx.stroke();

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(pos.x - 18, pos.y - 24, 36, 14);
          ctx.fillRect(pos.x - 18, pos.y + 10, 36, 12);

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(pos.x - 10, pos.y - 5, 20, 8);
          ctx.fillStyle = '#dc2626';
          ctx.font = 'bold 6px sans-serif';
          ctx.fillText('TAXI', pos.x - 6, pos.y + 1);
        } else if (c.vehicleType === 'police') {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(pos.x - 24, pos.y - 38, 48, 76, 8);
          ctx.fill();
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(pos.x - 24, pos.y - 12, 6, 24);
          ctx.fillRect(pos.x + 18, pos.y - 12, 6, 24);

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(pos.x - 18, pos.y - 25, 36, 14);
          ctx.fillRect(pos.x - 18, pos.y + 11, 36, 12);

          const isBlue = Math.sin(now / 120) > 0;
          ctx.fillStyle = isBlue ? '#3b82f6' : '#ef4444';
          ctx.shadowColor = isBlue ? '#3b82f6' : '#ef4444';
          ctx.shadowBlur = 8;
          ctx.fillRect(pos.x - 12, pos.y - 5, 24, 7);
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 6px sans-serif';
          ctx.fillText('POLICE', pos.x - 11, pos.y + 1);
        } else if (c.vehicleType === 'ambulance') {
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.roundRect(pos.x - 26, pos.y - 42, 52, 84, 8);
          ctx.fill();
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(pos.x - 20, pos.y - 32, 40, 14);

          ctx.fillStyle = '#dc2626';
          ctx.fillRect(pos.x - 8, pos.y - 4, 16, 5);
          ctx.fillRect(pos.x - 2.5, pos.y - 9.5, 5, 16);

          const isFlashing = Math.sin(now / 100) > 0;
          ctx.fillStyle = isFlashing ? '#ef4444' : '#7f1d1d';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = isFlashing ? 10 : 0;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y - 18, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (c.vehicleType === 'bus') {
          ctx.fillStyle = '#166534';
          ctx.beginPath();
          ctx.roundRect(pos.x - 27, pos.y - 48, 54, 96, 6);
          ctx.fill();
          ctx.strokeStyle = '#14532d';
          ctx.stroke();

          ctx.fillStyle = '#020617';
          ctx.fillRect(pos.x - 22, pos.y - 42, 44, 16);
          ctx.fillRect(pos.x - 24, pos.y - 18, 48, 12);
          ctx.fillRect(pos.x - 24, pos.y + 2, 48, 12);
          ctx.fillRect(pos.x - 22, pos.y + 22, 44, 14);

          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 7px sans-serif';
          ctx.fillText('台北-桃園機場', pos.x - 21, pos.y - 28);
        } else if (c.vehicleType === 'truck') {
          ctx.fillStyle = c.vehicleColor || '#2563eb';
          ctx.beginPath();
          ctx.roundRect(pos.x - 26, pos.y - 42, 52, 84, 6);
          ctx.fill();

          ctx.fillStyle = '#78716c';
          ctx.fillRect(pos.x - 22, pos.y - 2, 44, 40);

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(pos.x - 20, pos.y - 34, 40, 16);
        } else {
          ctx.fillStyle = c.vehicleColor;
          ctx.beginPath();
          ctx.roundRect(pos.x - 25, pos.y - 40, 50, 80, 8);
          ctx.fill();
          ctx.strokeStyle = '#334155';
          ctx.stroke();

          ctx.fillStyle = '#020617';
          ctx.fillRect(pos.x - 20, pos.y - 26, 40, 14);
          ctx.fillRect(pos.x - 20, pos.y + 12, 40, 14);
        }

        // Customer Avatar
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px sans-serif';
        ctx.fillText(c.avatarIcon, pos.x - 8, pos.y - 42);

        // Patience Meter (0-100)
        const barWidth = 44;
        const barHeight = 5;
        const barX = pos.x - barWidth / 2;
        const barY = pos.y - 62;
        ctx.fillStyle = '#27272a';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const patienceRatio = Math.max(0, c.patience / c.maxPatience);
        ctx.fillStyle = patienceRatio > 0.5 ? '#22c55e' : patienceRatio > 0.25 ? '#eab308' : '#ef4444';
        ctx.fillRect(barX, barY, barWidth * patienceRatio, barHeight);

        // Status Badge above car
        let badgeText = '';
        let badgeBg = '#0284c7';
        if (c.status === 'waiting_fuel') {
          badgeText = `⛽ ${c.fuelType.toUpperCase()} ${c.fuelDemandMode === 'full' ? '加滿' : '$' + c.targetAmount}`;
          badgeBg = '#059669';
        } else if (c.status === 'fueling') {
          badgeText = '⌛ 正在注油...';
          badgeBg = '#d97706';
        } else if (c.status === 'waiting_payment') {
          badgeText = `💰 待結帳 $${c.targetAmount}`;
          badgeBg = '#7c3aed';
        }

        if (badgeText) {
          ctx.fillStyle = badgeBg;
          ctx.beginPath();
          ctx.roundRect(pos.x - 48, pos.y - 82, 96, 18, 4);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(badgeText, pos.x, pos.y - 70);
          ctx.textAlign = 'left';
        }

        ctx.restore();
      });

      // ----------------------------------------------------
      // Draw Danger Events
      // ----------------------------------------------------
      dangerEvents.forEach((ev) => {
        if (ev.status !== 'active') return;

        ctx.save();
        const pulse = (Math.sin(now / 150) + 1) * 0.5;
        ctx.strokeStyle = ev.warningColor;
        ctx.lineWidth = 2 + pulse * 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(ev.x, ev.y, ev.targetRadius + pulse * 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = ev.warningColor + '33';
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(ev.x - 65, ev.y - 65, 130, 34, 8);
        ctx.fill();
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`🚨 ${ev.title}`, ev.x - 55, ev.y - 48);

        const cdRatio = Math.max(0, ev.countdown / ev.maxCountdown);
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(ev.x - 55, ev.y - 42, 110, 6);
        ctx.fillStyle = cdRatio > 0.4 ? '#fbbf24' : '#ef4444';
        ctx.fillRect(ev.x - 55, ev.y - 42, 110 * cdRatio, 6);

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 9px sans-serif';
        const toolMap: Record<string, string> = {
          extinguisher: '拿滅火器噴射！',
          spray: '用防身噴霧制服！',
          alarm: '快按警報按鈕！',
          dodge: '按空白鍵閃避！',
          baton: '拿電擊棒制伏！',
          shield: '防暴盾牌格擋！',
          broom: '拿掃把驅趕！',
        };
        ctx.fillText(`👉 ${toolMap[ev.requiredTool] || '點擊處理'}`, ev.x - 45, ev.y - 26);
        ctx.restore();
      });

      // ----------------------------------------------------
      // Draw Player Character "阿強" (Ultra-Smooth Position)
      // ----------------------------------------------------
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(playerPos.x, playerPos.y + 14, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      if (player.isDodging) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(playerPos.x, playerPos.y, 22, 0, Math.PI * 2);
        ctx.stroke();
      }

      const walkOffset = playerPos.isMoving ? (Math.sin(now / 90) > 0 ? 3 : -3) : 0;

      // Pixel Black Outline for Body
      ctx.fillStyle = '#000000';
      ctx.fillRect(playerPos.x - 13, playerPos.y - 29, 26, 44);

      // Pixel Legs & Boots
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(playerPos.x - 8, playerPos.y + 6, 6, 10 + walkOffset);
      ctx.fillRect(playerPos.x + 2, playerPos.y + 6, 6, 10 - walkOffset);

      ctx.fillStyle = '#451a03';
      ctx.fillRect(playerPos.x - 9, playerPos.y + 14 + walkOffset, 8, 4);
      ctx.fillRect(playerPos.x + 1, playerPos.y + 14 - walkOffset, 8, 4);

      // Pixel Vest
      ctx.fillStyle = '#eab308';
      ctx.fillRect(playerPos.x - 11, playerPos.y - 12, 22, 19);

      // Reflective silver stripe
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(playerPos.x - 11, playerPos.y - 2, 22, 4);

      // Pixel Head
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(playerPos.x - 9, playerPos.y - 24, 18, 13);

      // Pixel Eyes / Facing
      ctx.fillStyle = '#0f172a';
      if (playerPos.facing === 'left') {
        ctx.fillRect(playerPos.x - 8, playerPos.y - 20, 4, 3);
      } else if (playerPos.facing === 'right') {
        ctx.fillRect(playerPos.x + 4, playerPos.y - 20, 4, 3);
      } else {
        ctx.fillRect(playerPos.x - 6, playerPos.y - 20, 3, 3);
        ctx.fillRect(playerPos.x + 3, playerPos.y - 20, 3, 3);
      }

      // Gas station pixel cap
      ctx.fillStyle = '#15803d';
      ctx.fillRect(playerPos.x - 11, playerPos.y - 29, 22, 6);
      ctx.fillStyle = '#166534';
      ctx.fillRect(playerPos.x - (playerPos.facing === 'left' ? 14 : 9), playerPos.y - 23, 16, 3);

      // Equipped Tool in hand
      const toolIcons: Record<string, string> = {
        extinguisher: '🧯',
        spray: '🧴',
        baton: '⚡',
        shield: '🛡️',
        broom: '🧹',
      };
      ctx.font = '14px sans-serif';
      ctx.fillText(toolIcons[player.selectedTool] || '🧯', playerPos.x + 9, playerPos.y + 2);

      // Retro Pixel Name tag over player
      ctx.fillStyle = '#000000';
      ctx.fillRect(playerPos.x - 22, playerPos.y - 39, 44, 12);
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 8px "DotGothic16", monospace';
      ctx.fillText('店員 阿強', playerPos.x - 18, playerPos.y - 30);
      ctx.restore();

      // ----------------------------------------------------
      // Render Active Particles
      // ----------------------------------------------------
      particles.forEach((p) => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, Math.ceil(4 * p.life), Math.ceil(4 * p.life));
        ctx.restore();
      });

      // CCTV Camera visual overlay if owned
      if (hasCCTV) {
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px "DotGothic16", monospace';
        ctx.fillText(
          `● REC [CAM-01 站前車道] 2026/10/31 0${currentHour}:${currentMinute.toString().padStart(2, '0')}`,
          20,
          26
        );
        ctx.restore();
      }

      // On-Canvas Control Bar Hint (Pixel Style)
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.fillRect(14, canvas.height - 34, 480, 24);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(14, canvas.height - 34, 480, 24);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px "DotGothic16", monospace';
      ctx.fillText('🕹️ [W A S D / 方向鍵]：移動店員阿強  |  點擊車輛：加油/收銀 (時間靜止)', 22, canvas.height - 18);
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeDpadDir, onCustomerArrived, onCustomerLeft, onPlayerPosSync]);

  return (
    <div className="relative w-full h-[580px] bg-black rounded-lg overflow-hidden pixel-box shadow-[6px_6px_0px_#000] border-4 border-black select-none">
      <canvas
        ref={canvasRef}
        width={980}
        height={600}
        onClick={handleCanvasClick}
        className="w-full h-full object-cover cursor-crosshair scanlines"
      />
    </div>
  );
};

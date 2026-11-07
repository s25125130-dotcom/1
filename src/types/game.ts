export type FuelType = '92' | '95' | '98' | 'diesel';

export type PaymentMethod = 'cash' | 'credit' | 'mobile';

export type InvoiceType = 'paper' | 'carrier' | 'tax_id';

export interface VehicleCustomer {
  id: string;
  name: string;
  roleTitle: string; // e.g. "勁戰改管少年", "運將大哥", "熊貓外送員", "藍色貨車司機", "叼菸刺青男", "醉醺醺大叔"
  vehicleType: 'scooter' | 'taxi' | 'delivery' | 'truck' | 'sports_car' | 'gang_car' | 'police' | 'ambulance' | 'bus';
  vehicleColor: string;
  avatarIcon: string;
  assignedIslandId: string;
  slotIndex: number;
  speechText: string;
  fuelType: FuelType;
  fuelDemandMode: 'amount' | 'full'; // 'amount' e.g. 500, or 'full'
  targetAmount: number; // in NT$
  targetLiters: number;
  unitPrice: number;
  paymentMethod: PaymentMethod;
  cashPaid?: number; // e.g. 1000 when bill is 480
  invoiceType: InvoiceType;
  taxIdNumber?: string;
  wantsStoreItem?: boolean;
  storeProductWanted?: string;
  // State
  status: 'arriving' | 'waiting_fuel' | 'fueling' | 'waiting_payment' | 'paid' | 'leaving' | 'angry_left';
  patience: number; // 0 to 100
  maxPatience: number;
  arrivalHour: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
}

export type DangerType = 'smoking' | 'drunk_rampage' | 'gang_revving' | 'physical_attack';

export interface DangerEvent {
  id: string;
  type: DangerType;
  title: string;
  description: string;
  threatTargetId?: string; // customer or station island or store
  x: number;
  y: number;
  countdown: number; // seconds remaining
  maxCountdown: number;
  requiredTool: 'extinguisher' | 'spray' | 'alarm' | 'dodge' | 'baton' | 'broom' | 'shield';
  status: 'active' | 'resolved' | 'detonated';
  warningColor: string;
  targetRadius: number;
}

export interface StoreItem {
  id: string;
  name: string;
  icon: string;
  cost: number;
  price: number;
  stock: number;
  description: string;
  requiresAgeCheck?: boolean;
}

export interface EquipmentUpgrade {
  id: string;
  name: string;
  category: 'gear' | 'defense' | 'tool' | 'station';
  icon: string;
  price: number;
  owned: boolean;
  level: number;
  maxLevel: number;
  description: string;
  statBonus: string;
}

export interface IslandConfig {
  id: string;
  name: string;
  type: 'car' | 'scooter';
  fuels: FuelType[];
  x: number;
  y: number;
  unlocked: boolean;
  cost: number;
  currentCustomerId: string | null;
  hasSprinkler: boolean;
}

export interface DailyReport {
  day: number;
  revenue: number;
  fuelCost: number;
  storeProfit: number;
  satisfaction: number; // 0-100%
  satisfiedCount: number;
  angryCount: number;
  threatsPrevented: number;
  threatsFailed: number;
  damagePenalty: number;
  bountyReward: number;
  perfectFuelCount: number;
  totalScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'F';
  managerComment: string;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  moveSpeed: number;
  x: number;
  y: number;
  facing: 'left' | 'right' | 'up' | 'down';
  selectedTool: 'extinguisher' | 'spray' | 'baton' | 'shield' | 'broom';
  isDodging: boolean;
  dodgeCooldown: number;
  isMoving?: boolean;
}

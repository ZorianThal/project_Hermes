import React, { useState, useEffect, useRef } from 'react';
import {
  api,
  User,
  Group,
  Post,
  Chat,
  Message,
  Assignment,
  ArPoint,
  LeaderboardEntry,
  Product,
  AdminStats,
  PetData,
  PetType,
  ItemRarity,
  PetEquipped,
  DailyRewardsStatus,
  DailyRewardDay,
  clearToken,
  FriendRequest,
  FriendshipStatus,
} from './services/api';
import {
  Flame,
  MessageSquare,
  CheckSquare,
  MapPin,
  Trophy,
  ShoppingBag,
  User as UserIcon,
  ShieldAlert,
  Send,
  Paperclip,
  LogOut,
  Heart,
  MessageCircle,
  Plus,
  Search,
  Menu,
  X,
  Coins,
  Award,
  Terminal,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Camera,
  Settings,
  Database,
  HardDrive,
  Download,
  Upload,
  Trash2,
  Grid,
  Sliders,
  Pin,
  ArrowLeft,
  Sun,
  Moon,
  UserCheck,
  UserX,
  ShieldCheck,
  CornerUpRight,
  FileText,
  HelpCircle,
  Palette,
  Check,
  Smile,
  Bot,
  Zap,
  Shield,
  Eye,
  Cpu,
  Layers,
  Crosshair,
  Activity,
  Edit2,
  Users,
  UserPlus,
  UserMinus,
  Clock,
  Image as ImageIcon,
} from 'lucide-react';
import { UserAvatar } from './components/UserAvatar';

// --- Client-side Image Resizing & Compression for Avatars ---
function resizeImageToDataUrl(file: File, maxDimension = 512, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- Typewriter Component for Math / Telemetry ---
function TerminalFormula({
  children,
  className = '',
}: {
  children: string;
  className?: string;
}) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setShown(children.slice(0, i + 1));
      i++;
      if (i > children.length) clearInterval(timer);
    }, 24);
    return () => clearInterval(timer);
  }, [children]);

  return (
    <pre
      className={`font-mono text-xs font-semibold tracking-wider text-accent whitespace-pre-wrap ${className}`}
    >
      {shown}
      <span className="inline-block w-2 h-3.5 bg-accent ml-1 align-middle cursor-blink" />
    </pre>
  );
}

// Logo Component
function HermesLogo({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <svg x="18" y="10" width="44" height="44" viewBox="0 0 40 40">
        <path
          d="M8 8l0-8 32 0 0 8-16 0 0 8-8 0 0-8-8 0z m-8 24l0-24 8 0 0 24-8 0z m24 0l0-16 8 0 0 16-8 0z m-16 8l0-8 16 0 0 8-16 0z"
          fill="currentColor"
          className="text-accent"
        />
      </svg>
      <svg x="18" y="55" width="44" height="16" viewBox="0 0 32 16">
        <path
          d="M8.79 4.57l0-4.57-2.2 0 0 2.29-2.2 0 0 2.28-2.2 0 0 2.28-2.2 0 0 2.29 2.2 0 0 2.28 2.2 0 0 2.29 2.2 0 0 2.28 2.2 0 0-4.57 23.2 0 0-6.86-23.2 0z"
          fill="currentColor"
          className="text-ink opacity-80"
        />
      </svg>
    </svg>
  );
}

const ACCENT_COLORS = [
  { id: 'orange', name: 'Сигнальный оранжевый', hex: '#FF5500' },
  { id: 'blue', name: 'Кибернетический синий', hex: '#0071E3' },
  { id: 'violet', name: 'Квантовый фиолетовый', hex: '#8B5CF6' },
  { id: 'emerald', name: 'Терминальный изумруд', hex: '#10B981' },
  { id: 'amber', name: 'Солнечный янтарь', hex: '#F59E0B' },
];

// [HERMES_MAP: COMPONENT_CYBER_PET]
export const RARITY_INFO: Record<ItemRarity, { label: string; color: string; border: string; bg: string; text: string }> = {
  common: { label: 'ОБЫЧНЫЙ', color: '#94A3B8', border: 'border-slate-500/40', bg: 'bg-slate-500/10', text: 'text-slate-400' },
  rare: { label: 'РЕДКИЙ', color: '#38BDF8', border: 'border-sky-500/40', bg: 'bg-sky-500/10', text: 'text-sky-400' },
  epic: { label: 'ЭПИЧЕСКИЙ', color: '#A855F7', border: 'border-purple-500/40', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  legendary: { label: 'ЛЕГЕНДАРНЫЙ', color: '#F59E0B', border: 'border-amber-500/40', bg: 'bg-amber-500/10', text: 'text-amber-400' },
};

export const PET_PLATFORMS: Record<PetType, {
  name: string;
  codename: string;
  role: string;
  desc: string;
  features: string[];
  defaultName: string;
}> = {
  cat: {
    name: 'Механический Кот',
    codename: 'BASTET // MK-IV',
    role: 'Высокоскоростная разведка и кинетическое преследование',
    desc: 'Бионический корпус с гибким кинематическим позвоночником, сервоприводами лап и сенсорным визором сканирования.',
    features: ['Гидравлические лапы', 'Угловые аудио-сенсоры', 'Импульсный хвост-стабилизатор'],
    defaultName: 'КИБЕР-БАСТЕТ',
  },
  owl: {
    name: 'Механическая Сова',
    codename: 'NOCTUA // APEX-02',
    role: 'Аэро-сканирование и ночная телеметрия',
    desc: 'Авиационный разведывательный фюзеляж с клинковыми крыльями, бинокулярными ночными сенсорами и посадочными когтями.',
    features: ['Кинетические крылья-клинки', 'Бинокулярная оптика 360°', 'Аэродинамический корпус'],
    defaultName: 'КИБЕР-НОКТУА',
  },
  snake: {
    name: 'Механическая Змейка',
    codename: 'OUROBOROS // COIL-X',
    role: 'Квантовая перегрузка и плазменный вихрь',
    desc: 'Шарнирный сегментированный серпентарий с парящими антигравитационными кольцами и расширяющимся кобра-визором.',
    features: ['Антигравитационные кольца', 'Спиральный шарнирный каркас', 'Плазменный кобра-эмиттер'],
    defaultName: 'КИБЕР-УРОБОРОС',
  },
  spider: {
    name: 'Механический Паук',
    codename: 'ARACHNE // SYNTH-08',
    role: 'Инфильтрация и многоточечный тактический контроль',
    desc: 'Низкопрофильный титановый каркас с 8 гидравлическими опорами-манипуляторами и шестилинзовой сенсорной матрицей.',
    features: ['8 независимых гидро-опор', 'Гексагональный реакторный отсек', '6-линзовая матрица сканирования'],
    defaultName: 'КИБЕР-АРАХНА',
  },
};

function parseSlotMeta(
  itemId: string | null | undefined,
  defaultPet: PetType,
  _slot: 'head' | 'body' | 'limbs',
  productsList: Product[] = []
): { petType: PetType; rarity: ItemRarity } {
  if (!itemId) {
    return { petType: defaultPet, rarity: 'common' };
  }
  const match = productsList.find((p) => `item_${p.id}` === itemId || p.code === itemId);
  if (match && match.petType) {
    return { petType: match.petType, rarity: match.rarity || 'common' };
  }
  let petType = defaultPet;
  const lower = itemId.toLowerCase();
  if (lower.includes('owl')) petType = 'owl';
  else if (lower.includes('snake')) petType = 'snake';
  else if (lower.includes('spider')) petType = 'spider';
  else if (lower.includes('cat')) petType = 'cat';

  let rarity: ItemRarity = 'common';
  if (lower.includes('legendary')) rarity = 'legendary';
  else if (lower.includes('epic')) rarity = 'epic';
  else if (lower.includes('rare')) rarity = 'rare';

  return { petType, rarity };
}

// --- Interactive Vector Modular Cyber-Pet Component ---
function CyberPetAvatar({
  pet,
  petTypeOverride,
  previewEquipped,
  products = [],
  accent = '#FF5500',
  isEating = false,
  isHappy = false,
  onClick,
  size = 'normal',
}: {
  pet?: PetData | null;
  petTypeOverride?: PetType;
  previewEquipped?: PetEquipped;
  products?: Product[];
  accent?: string;
  isEating?: boolean;
  isHappy?: boolean;
  onClick?: () => void;
  size?: 'compact' | 'normal' | 'large';
}) {
  const activeType: PetType = petTypeOverride || pet?.petType || 'cat';
  const equipped = previewEquipped || pet?.equipped || {};
  const bodyColor = equipped.color || accent || '#FF5500';

  const headMeta = parseSlotMeta(equipped.head || equipped.hat, activeType, 'head', products);
  const bodyMeta = parseSlotMeta(equipped.body || equipped.outfit, activeType, 'body', products);
  const limbsMeta = parseSlotMeta(equipped.limbs || equipped.boots, activeType, 'limbs', products);

  const sizeClasses =
    size === 'large'
      ? 'w-60 h-60 sm:w-72 sm:h-72'
      : size === 'compact'
      ? 'w-24 h-24 sm:w-28 sm:h-28'
      : 'w-44 h-44 sm:w-52 sm:h-52';

  return (
    <div
      onClick={onClick}
      className={`relative mx-auto flex items-center justify-center select-none group ${sizeClasses} ${
        onClick ? 'cursor-pointer' : ''
      }`}
      title="Биомеханический дрон-спутник Hermes"
    >
      {/* Outer Hologram Glow Field */}
      <div
        className="absolute inset-2 sm:inset-4 rounded-full blur-2xl opacity-25 transition-all duration-700 group-hover:opacity-50 animate-pulse pointer-events-none"
        style={{ backgroundColor: bodyColor }}
      />

      {/* Floating SVG Cyber-Pet Model */}
      <svg
        viewBox="0 0 240 240"
        className={`w-full h-full drop-shadow-2xl transition-transform duration-500 ${
          isHappy ? 'animate-bounce' : isEating ? 'animate-pulse' : 'hover:scale-105'
        }`}
      >
        <defs>
          <filter id={`neon-glow-${activeType}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id={`reactor-glow-${activeType}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ================= LAYER 1: BACK LIMBS & STABILIZERS ================= */}
        {limbsMeta.petType === 'owl' && (
          <g className={isHappy ? 'animate-pulse' : ''}>
            {/* Left Kinetic Blade Wing */}
            <path d="M 72 108 L 14 88 L 26 124 L 70 128 Z" fill="#18181f" stroke={bodyColor} strokeWidth="2.5" />
            <path d="M 70 122 L 22 138 L 38 166 L 68 140 Z" fill="#141418" stroke={bodyColor} strokeWidth="2" />
            <path d="M 68 136 L 36 172 L 48 188 L 70 150 Z" fill="#0f0f14" stroke={bodyColor} strokeWidth="1.5" />
            <line x1="20" y1="92" x2="68" y2="114" stroke={bodyColor} strokeWidth="2" filter={`url(#neon-glow-${activeType})`} />

            {/* Right Kinetic Blade Wing */}
            <path d="M 168 108 L 226 88 L 214 124 L 170 128 Z" fill="#18181f" stroke={bodyColor} strokeWidth="2.5" />
            <path d="M 170 122 L 218 138 L 202 166 L 172 140 Z" fill="#141418" stroke={bodyColor} strokeWidth="2" />
            <path d="M 172 136 L 204 172 L 192 188 L 170 150 Z" fill="#0f0f14" stroke={bodyColor} strokeWidth="1.5" />
            <line x1="220" y1="92" x2="172" y2="114" stroke={bodyColor} strokeWidth="2" filter={`url(#neon-glow-${activeType})`} />
          </g>
        )}

        {limbsMeta.petType === 'snake' && (
          <g>
            {/* Floating Upper Hover Induction Ring */}
            <ellipse
              cx="120"
              cy="115"
              rx="64"
              ry="14"
              fill="none"
              stroke={bodyColor}
              strokeWidth="2.5"
              strokeDasharray="14 6"
              opacity="0.8"
            />
            {/* Floating Lower Anti-Grav Field Ring */}
            <ellipse
              cx="120"
              cy="172"
              rx="78"
              ry="18"
              fill="none"
              stroke={bodyColor}
              strokeWidth="3"
              strokeDasharray="20 8"
              filter={`url(#neon-glow-${activeType})`}
            />
            {/* Plasma Induction Emitters */}
            <circle cx="42" cy="172" r="4" fill={bodyColor} filter={`url(#neon-glow-${activeType})`} />
            <circle cx="198" cy="172" r="4" fill={bodyColor} filter={`url(#neon-glow-${activeType})`} />
            <circle cx="56" cy="115" r="3.5" fill={bodyColor} />
            <circle cx="184" cy="115" r="3.5" fill={bodyColor} />
            {/* Hover Plasma Wave */}
            <path
              d="M 75 208 Q 120 224 165 208"
              fill="none"
              stroke={bodyColor}
              strokeWidth="2"
              opacity="0.6"
              className="animate-pulse"
            />
          </g>
        )}

        {limbsMeta.petType === 'spider' && (
          <g>
            {/* Rear Leg 3 Left & Right */}
            <path d="M 74 134 Q 28 142 16 195 L 12 210" fill="none" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
            <path d="M 166 134 Q 212 142 224 195 L 228 210" fill="none" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
            {/* Rear Leg 4 Left & Right */}
            <path d="M 80 152 Q 46 178 34 218 L 30 226" fill="none" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
            <path d="M 160 152 Q 194 178 206 218 L 210 226" fill="none" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
            {/* Needle Grounding Pins */}
            <circle cx="12" cy="210" r="2.5" fill="#FFFFFF" filter={`url(#neon-glow-${activeType})`} />
            <circle cx="228" cy="210" r="2.5" fill="#FFFFFF" filter={`url(#neon-glow-${activeType})`} />
            <circle cx="30" cy="226" r="2.5" fill="#FFFFFF" filter={`url(#neon-glow-${activeType})`} />
            <circle cx="210" cy="226" r="2.5" fill="#FFFFFF" filter={`url(#neon-glow-${activeType})`} />
          </g>
        )}

        {limbsMeta.petType === 'cat' && (
          <g>
            {/* Hind Kinematic Cyber-Legs */}
            <path d="M 68 126 L 46 150 L 54 188 L 44 198 L 60 198 L 70 168 Z" fill="#18181f" stroke={bodyColor} strokeWidth="2.5" />
            <path d="M 172 126 L 194 150 L 186 188 L 196 198 L 180 198 L 170 168 Z" fill="#18181f" stroke={bodyColor} strokeWidth="2.5" />
            <circle cx="50" cy="160" r="3" fill={bodyColor} filter={`url(#neon-glow-${activeType})`} />
            <circle cx="190" cy="160" r="3" fill={bodyColor} filter={`url(#neon-glow-${activeType})`} />
          </g>
        )}

        {/* ================= LAYER 2: CHASSIS & CORE BODY ================= */}
        {bodyMeta.petType === 'cat' && (
          <g>
            {/* Cyber-Tail */}
            <path
              d="M 162 148 C 204 152 222 134 216 98 C 210 74 224 58 226 50"
              fill="none"
              stroke="#18181f"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 162 148 C 204 152 222 134 216 98 C 210 74 224 58 226 50"
              fill="none"
              stroke={bodyColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              filter={`url(#neon-glow-${activeType})`}
            />
            <circle cx="226" cy="50" r="3.5" fill="#FFFFFF" filter={`url(#neon-glow-${activeType})`} />

            {/* Aerodynamic Predatory Chassis */}
            <rect x="74" y="86" width="92" height="88" rx="26" fill="#121216" stroke={bodyColor} strokeWidth="3" />
            <path d="M 86 112 L 120 134 L 154 112" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
            <path d="M 88 152 L 120 168 L 152 152" fill="none" stroke={bodyColor} strokeWidth="1.5" opacity="0.7" />
          </g>
        )}

        {bodyMeta.petType === 'owl' && (
          <g>
            {/* Avian Rudder Tail Fin */}
            <polygon points="110,174 120,204 130,174" fill="#16161c" stroke={bodyColor} strokeWidth="2" />
            {/* Avionics Fuselage */}
            <rect x="76" y="88" width="88" height="88" rx="36" fill="#101016" stroke={bodyColor} strokeWidth="3" />
            <path d="M 94 118 L 120 136 L 146 118" fill="none" stroke={bodyColor} strokeWidth="2" opacity="0.6" />
            <path d="M 98 142 L 120 158 L 142 142" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          </g>
        )}

        {bodyMeta.petType === 'snake' && (
          <g>
            {/* Helical Armored Vertebrae Spine */}
            <path
              d="M 120 68 C 172 84 172 120 125 136 C 78 152 78 186 120 198 C 150 206 158 216 142 224"
              fill="none"
              stroke="#121614"
              strokeWidth="28"
              strokeLinecap="round"
            />
            <path
              d="M 120 68 C 172 84 172 120 125 136 C 78 152 78 186 120 198 C 150 206 158 216 142 224"
              fill="none"
              stroke="#1e2420"
              strokeWidth="20"
              strokeLinecap="round"
            />
            {/* Spinal Energy Conduit */}
            <path
              d="M 120 68 C 172 84 172 120 125 136 C 78 152 78 186 120 198 C 150 206 158 216 142 224"
              fill="none"
              stroke={bodyColor}
              strokeWidth="4"
              strokeLinecap="round"
              filter={`url(#neon-glow-${activeType})`}
            />
            <ellipse cx="148" cy="98" rx="14" ry="7" fill="#121614" stroke={bodyColor} strokeWidth="1.5" />
            <ellipse cx="98" cy="166" rx="14" ry="7" fill="#121614" stroke={bodyColor} strokeWidth="1.5" />
          </g>
        )}

        {bodyMeta.petType === 'spider' && (
          <g>
            {/* Armored Abdomen */}
            <rect x="70" y="126" width="100" height="56" rx="24" fill="#0d0d12" stroke={bodyColor} strokeWidth="3" />
            {/* Hexagonal Reactor Vents */}
            <polygon points="120,140 128,145 128,155 120,160 112,155 112,145" fill="#181822" stroke={bodyColor} strokeWidth="1.5" />
            <polygon points="98,148 104,152 104,160 98,164 92,160 92,152" fill="#181822" stroke={bodyColor} strokeWidth="1" opacity="0.7" />
            <polygon points="142,148 148,152 148,160 142,164 136,160 136,152" fill="#181822" stroke={bodyColor} strokeWidth="1" opacity="0.7" />
            {/* Cephalothorax */}
            <rect x="84" y="92" width="72" height="42" rx="14" fill="#14141a" stroke={bodyColor} strokeWidth="2.5" />
          </g>
        )}

        {/* ================= CENTRAL QUANTUM REACTOR HEART ================= */}
        <g>
          <circle cx="120" cy="136" r="14" fill="#060608" stroke={bodyColor} strokeWidth="2.5" />
          <circle cx="120" cy="136" r="8" fill={bodyColor} className="animate-ping" opacity="0.6" />
          <circle cx="120" cy="136" r="5" fill="#FFFFFF" filter={`url(#neon-glow-${activeType})`} />
        </g>

        {/* ================= LAYER 3: FORE LIMBS & TALONS ================= */}
        {limbsMeta.petType === 'cat' && (
          <g>
            {/* Forelegs With Hydraulic Dampers */}
            <path d="M 88 132 L 76 170 L 72 204 L 88 204 L 94 180 L 98 140 Z" fill="#1c1c24" stroke={bodyColor} strokeWidth="2" />
            <path d="M 152 132 L 164 170 L 168 204 L 152 204 L 146 180 L 142 140 Z" fill="#1c1c24" stroke={bodyColor} strokeWidth="2" />
            <circle cx="78" cy="180" r="3" fill={bodyColor} filter={`url(#neon-glow-${activeType})`} />
            <circle cx="162" cy="180" r="3" fill={bodyColor} filter={`url(#neon-glow-${activeType})`} />
          </g>
        )}

        {limbsMeta.petType === 'owl' && (
          <g>
            {/* Landing Carbon Talons */}
            <path d="M 96 178 L 90 204 L 98 204 L 104 182 Z" fill="#1c1c24" stroke={bodyColor} strokeWidth="1.5" />
            <path d="M 144 178 L 150 204 L 142 204 L 136 182 Z" fill="#1c1c24" stroke={bodyColor} strokeWidth="1.5" />
            <circle cx="94" cy="204" r="2" fill={bodyColor} />
            <circle cx="146" cy="204" r="2" fill={bodyColor} />
          </g>
        )}

        {limbsMeta.petType === 'spider' && (
          <g>
            {/* Front Leg 1 Left & Right */}
            <path d="M 80 98 Q 32 58 14 108 L 10 134" fill="none" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
            <path d="M 160 98 Q 208 58 226 108 L 230 134" fill="none" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
            {/* Front Leg 2 Left & Right */}
            <path d="M 74 116 Q 22 92 8 158 L 6 184" fill="none" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
            <path d="M 166 116 Q 218 92 232 158 L 234 184" fill="none" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
            {/* Hydraulic Pivot Knuckles */}
            <circle cx="32" cy="68" r="3.5" fill="#181822" stroke={bodyColor} strokeWidth="1.5" />
            <circle cx="208" cy="68" r="3.5" fill="#181822" stroke={bodyColor} strokeWidth="1.5" />
            <circle cx="22" cy="102" r="3.5" fill="#181822" stroke={bodyColor} strokeWidth="1.5" />
            <circle cx="218" cy="102" r="3.5" fill="#181822" stroke={bodyColor} strokeWidth="1.5" />
          </g>
        )}

        {/* ================= LAYER 4: HEAD / VISOR / HELMET ================= */}
        {headMeta.petType === 'cat' && (
          <g>
            {/* Bionic Audio Sensor Ears */}
            <polygon points="86,56 70,24 98,44" fill="#1c1c24" stroke={bodyColor} strokeWidth="2.5" />
            <polygon points="154,56 170,24 142,44" fill="#1c1c24" stroke={bodyColor} strokeWidth="2.5" />
            <polygon points="88,52 76,32 94,44" fill={bodyColor} opacity="0.4" />
            <polygon points="152,52 164,32 146,44" fill={bodyColor} opacity="0.4" />
            {/* Angular Cyber-Helmet */}
            <rect x="82" y="50" width="76" height="48" rx="18" fill="#121218" stroke={bodyColor} strokeWidth="3" />
            {/* Visor Frame */}
            <rect x="90" y="64" width="60" height="22" rx="8" fill="#000000" stroke={bodyColor} strokeWidth="1.5" />
            {/* Cat Optical Sensors */}
            {isHappy ? (
              <g stroke={bodyColor} strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M 98 76 Q 106 68 114 76" />
                <path d="M 126 76 Q 134 68 142 76" />
              </g>
            ) : (
              <g fill={bodyColor} filter={`url(#neon-glow-${activeType})`}>
                <ellipse cx="106" cy="75" rx="6" ry="7" />
                <ellipse cx="134" cy="75" rx="6" ry="7" />
                <line x1="106" y1="69" x2="106" y2="81" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                <line x1="134" y1="69" x2="134" y2="81" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              </g>
            )}
          </g>
        )}

        {headMeta.petType === 'owl' && (
          <g>
            {/* Antenna Tuft Crests */}
            <line x1="90" y1="50" x2="80" y2="24" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
            <circle cx="80" cy="24" r="3" fill="#FFFFFF" filter={`url(#neon-glow-${activeType})`} />
            <line x1="150" y1="50" x2="160" y2="24" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
            <circle cx="160" cy="24" r="3" fill="#FFFFFF" filter={`url(#neon-glow-${activeType})`} />
            {/* Surveillance Dome */}
            <rect x="78" y="48" width="84" height="52" rx="26" fill="#101018" stroke={bodyColor} strokeWidth="3" />
            {/* Binocular Nocturnal Optics */}
            <circle cx="100" cy="74" r="14" fill="#000000" stroke={bodyColor} strokeWidth="2" />
            <circle cx="140" cy="74" r="14" fill="#000000" stroke={bodyColor} strokeWidth="2" />
            {isHappy ? (
              <g stroke={bodyColor} strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M 94 76 Q 100 66 106 76" />
                <path d="M 134 76 Q 140 66 146 76" />
              </g>
            ) : (
              <g filter={`url(#neon-glow-${activeType})`}>
                <circle cx="100" cy="74" r="8" fill={bodyColor} />
                <circle cx="140" cy="74" r="8" fill={bodyColor} />
                <circle cx="100" cy="74" r="3.5" fill="#FFFFFF" />
                <circle cx="140" cy="74" r="3.5" fill="#FFFFFF" />
              </g>
            )}
          </g>
        )}

        {headMeta.petType === 'snake' && (
          <g>
            {/* Cobra Hood Flared Side Fins */}
            <polygon points="82,72 54,54 74,86" fill="#141816" stroke={bodyColor} strokeWidth="2" />
            <polygon points="158,72 186,54 166,86" fill="#141816" stroke={bodyColor} strokeWidth="2" />
            {/* Triangular Viper Head */}
            <polygon points="120,36 162,76 78,76" fill="#101412" stroke={bodyColor} strokeWidth="3" />
            {/* Slit Venom Optics */}
            {isHappy ? (
              <g stroke={bodyColor} strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M 98 64 Q 105 56 112 64" />
                <path d="M 128 64 Q 135 56 142 64" />
              </g>
            ) : (
              <g stroke={bodyColor} strokeWidth="3.5" strokeLinecap="round" filter={`url(#neon-glow-${activeType})`}>
                <line x1="98" y1="60" x2="112" y2="66" />
                <line x1="142" y1="60" x2="128" y2="66" />
              </g>
            )}
            {/* Micro-Plasma Discharge Fangs */}
            <line x1="108" y1="76" x2="106" y2="86" stroke={bodyColor} strokeWidth="2.5" strokeLinecap="round" filter={`url(#neon-glow-${activeType})`} />
            <line x1="132" y1="76" x2="134" y2="86" stroke={bodyColor} strokeWidth="2.5" strokeLinecap="round" filter={`url(#neon-glow-${activeType})`} />
          </g>
        )}

        {headMeta.petType === 'spider' && (
          <g>
            {/* Faceted Sensor Turret */}
            <polygon points="90,56 150,56 158,90 82,90" fill="#14121a" stroke={bodyColor} strokeWidth="2.5" />
            {/* 6-Lens Optical Cluster */}
            {isHappy ? (
              <g stroke={bodyColor} strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M 106 74 Q 112 66 118 74" />
                <path d="M 122 74 Q 128 66 134 74" />
              </g>
            ) : (
              <g fill={bodyColor} filter={`url(#neon-glow-${activeType})`}>
                <circle cx="112" cy="74" r="5" />
                <circle cx="128" cy="74" r="5" />
                <circle cx="112" cy="74" r="2" fill="#FFFFFF" />
                <circle cx="128" cy="74" r="2" fill="#FFFFFF" />
                <circle cx="101" cy="68" r="3" />
                <circle cx="139" cy="68" r="3" />
                <circle cx="98" cy="80" r="2.5" />
                <circle cx="142" cy="80" r="2.5" />
              </g>
            )}
            {/* Mandible Shears */}
            <path d="M 106 90 L 102 105 L 112 101" stroke={bodyColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 134 90 L 138 105 L 128 101" stroke={bodyColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>
        )}

        {/* ================= RARITY SPECIAL CORONA OVERLAYS ================= */}
        {headMeta.rarity === 'legendary' && (
          <g filter={`url(#neon-glow-${activeType})`}>
            <polygon points="120,20 128,34 112,34" fill="#F59E0B" />
            <circle cx="120" cy="18" r="3" fill="#FFFFFF" />
          </g>
        )}
        {headMeta.rarity === 'epic' && (
          <g filter={`url(#neon-glow-${activeType})`}>
            <circle cx="120" cy="30" r="3.5" fill="#A855F7" />
          </g>
        )}
      </svg>
    </div>
  );
}

// [HERMES_MAP: COMPONENT_DAILY_REWARDS]
// --- Daily Rewards Streak Card ---
function DailyRewardsCard({
  status,
  onClaim,
  claiming,
}: {
  status: DailyRewardsStatus | null;
  onClaim: () => void;
  claiming: boolean;
}) {
  if (!status) return null;

  return (
    <div className="border border-white/15 bg-paper/80 backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-accent uppercase">
            / PROTOCOL 0x77 // СИСТЕМА ЕЖЕДНЕВНЫХ НАГРАД
          </span>
          <h3 className="font-bit text-2xl sm:text-3xl text-ink mt-0.5">Ежедневный вход</h3>
          <p className="text-xs sm:text-sm text-ink/60">
            Заходите каждый день. Награды растут ежедневно до пятницы и выходных!
          </p>
        </div>

        {/* Claim button if available */}
        {status.canClaimToday && status.todayReward && (
          <button
            onClick={onClaim}
            disabled={claiming}
            className="px-5 py-3 rounded-xl bg-accent text-black font-bit text-sm tracking-wider uppercase hover:bg-white transition-all shadow-lg shadow-accent/25 flex items-center justify-center gap-2 animate-pulse shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            <span>{claiming ? 'НАЧИСЛЕНИЕ...' : `ЗАБРАТЬ: +${status.todayReward.xp} XP / +${status.todayReward.coins} ⟠`}</span>
          </button>
        )}
      </div>

      {/* Broken Streak Alert if user missed a day */}
      {status.isBroken && (
        <div className="p-4 rounded-xl border border-red-500/50 bg-red-500/10 text-red-300 text-xs sm:text-sm flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-red-200">
              ЦЕПОЧКА НАГРАД ПРЕРВАНА НА ЭТОЙ НЕДЕЛЕ
            </div>
            <p className="text-red-300/80 leading-relaxed">
              Один из дней был пропущен. По правилам академии, оставшиеся награды заблокированы до конца недели.
              С понедельника серия автоматически начнется заново с 1-го дня!
            </p>
          </div>
        </div>
      )}

      {/* Days Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
        {status.days.map((d) => {
          const isToday = d.day === status.currentDay;
          const isClaimed = d.status === 'claimed';
          const isCanClaim = d.status === 'can_claim';
          const isMissed = d.status === 'missed';

          return (
            <div
              key={d.day}
              className={`p-3.5 rounded-xl border text-center flex flex-col justify-between transition-all relative overflow-hidden ${
                isClaimed
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                  : isCanClaim
                  ? 'border-accent bg-accent/15 text-ink ring-2 ring-accent/50 shadow-lg shadow-accent/20'
                  : isMissed
                  ? 'border-red-500/30 bg-red-950/20 text-red-400/60 opacity-60'
                  : 'border-white/10 bg-paper/40 text-ink/70'
              }`}
            >
              {isToday && (
                <span className="absolute top-1 right-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-black uppercase">
                  СЕГОДНЯ
                </span>
              )}

              <div>
                <div className="text-[10px] font-mono tracking-wider font-bold opacity-75">
                  {d.label}
                </div>
                <div className="my-2 flex justify-center">
                  {isClaimed ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-sm font-bold">
                      ✓
                    </div>
                  ) : isCanClaim ? (
                    <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent flex items-center justify-center text-accent text-sm font-bold animate-pulse">
                      ★
                    </div>
                  ) : isMissed ? (
                    <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 text-sm font-bold">
                      ✕
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-ink/40 text-xs">
                      <Shield className="h-3.5 w-3.5 text-ink/40" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-0.5 border-t border-white/10 pt-2 mt-1">
                <div className="text-xs font-bold text-accent font-mono">+{d.xp} XP</div>
                <div className="text-[11px] text-amber-400 font-bold font-mono">+{d.coins} ⟠</div>
                <div className="text-[9px] uppercase tracking-wider font-bold mt-1">
                  {isClaimed
                    ? 'Получено'
                    : isCanClaim
                    ? 'Забрать!'
                    : isMissed
                    ? 'Пропущено'
                    : 'Ожидание'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ConfirmDialogOptions {
  title?: string;
  message: string;
  subtext?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmModalState extends ConfirmDialogOptions {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ToastItem {
  id: number;
  text: string;
  type?: 'success' | 'error' | 'info';
}

// [HERMES_MAP: STATE_HUB]
export default function App() {
  // --- Cyber Confirm & Toast Notifications System ---
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      setConfirmModal({
        ...options,
        isOpen: true,
        onConfirm: () => {
          setConfirmModal(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal(null);
          resolve(false);
        },
      });
    });
  }

  function showToast(text: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGroupId, setRegGroupId] = useState<number | ''>('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [authError, setAuthError] = useState('');

  // --- View State ---
  type View =
    | 'feed'
    | 'chats'
    | 'friends'
    | 'assignments'
    | 'map'
    | 'leaderboard'
    | 'shop'
    | 'pet'
    | 'profile'
    | 'settings'
    | 'backups'
    | 'admin';

  const [currentView, setCurrentView] = useState<View>('feed');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // --- Theme & Settings State ---
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('hermes_theme') as any) || 'dark'
  );
  const [accentColor, setAccentColor] = useState<string>(
    localStorage.getItem('hermes_accent') || '#FF5500'
  );
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>(
    (localStorage.getItem('hermes_fontsize') as any) || 'md'
  );
  const [density, setDensity] = useState<'comfortable' | 'compact'>(
    (localStorage.getItem('hermes_density') as any) || 'comfortable'
  );
  const [reduceMotion, setReduceMotion] = useState<boolean>(
    localStorage.getItem('hermes_reducemotion') === 'true'
  );

  // Apply Theme & Accent Color dynamically to :root
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'light') {
      html.classList.add('theme-light');
    } else {
      html.classList.remove('theme-light');
    }
    localStorage.setItem('hermes_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', accentColor);
    localStorage.setItem('hermes_accent', accentColor);
  }, [accentColor]);

  useEffect(() => {
    localStorage.setItem('hermes_fontsize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('hermes_density', density);
  }, [density]);

  useEffect(() => {
    localStorage.setItem('hermes_reducemotion', String(reduceMotion));
  }, [reduceMotion]);

  // --- Backups State ---
  const [backupSettings, setBackupSettings] = useState<{
    intervalDays: number;
    lastBackupAt: number | null;
    nextBackupAt: number | null;
  }>({ intervalDays: 7, lastBackupAt: null, nextBackupAt: null });
  const [backupList, setBackupList] = useState<{ filename: string; size: number; createdAt: number }[]>([]);
  const [backupIntervalInput, setBackupIntervalInput] = useState(7);
  const [backupRestoreFileContent, setBackupRestoreFileContent] = useState<string | null>(null);
  const [backupRestoreFileName, setBackupRestoreFileName] = useState('');
  const [backupMsg, setBackupMsg] = useState('');

  // --- Admin User Management State ---
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [newTeacherFullname, setNewTeacherFullname] = useState('');
  const [newTeacherUsername, setNewTeacherUsername] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [adminActionMsg, setAdminActionMsg] = useState('');

  // --- Data State ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<string | null>(null);
  const [newPostLoading, setNewPostLoading] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [openComments, setOpenComments] = useState<Record<number, boolean>>({});

  // Chats
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [msgMedia, setMsgMedia] = useState<string | null>(null);
  const [pinnedChats, setPinnedChats] = useState<number[]>([]);
  const [chatSearch, setChatSearch] = useState('');
  const [inChatSearch, setInChatSearch] = useState('');
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [forwardModalMsg, setForwardModalMsg] = useState<Message | null>(null);
  const [forwardSearch, setForwardSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Assignments
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignFilter, setAssignFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [submitModalAssignId, setSubmitModalAssignId] = useState<number | null>(null);
  const [submitComment, setSubmitComment] = useState('');
  const [createAssignModalOpen, setCreateAssignModalOpen] = useState(false);
  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignDesc, setNewAssignDesc] = useState('');
  const [newAssignType, setNewAssignType] = useState<'text' | 'test' | 'ar'>('text');
  const [newAssignGroupId, setNewAssignGroupId] = useState<number | 'all'>('all');
  const [newAssignXp, setNewAssignXp] = useState(25);
  const [newAssignCoins, setNewAssignCoins] = useState(5);
  const [newAssignDueDate, setNewAssignDueDate] = useState('');
  const [newAssignArLabel, setNewAssignArLabel] = useState('');
  const [newAssignArLat, setNewAssignArLat] = useState('55.751244');
  const [newAssignArLng, setNewAssignArLng] = useState('37.618423');
  const [newAssignQuestions, setNewAssignQuestions] = useState<
    { text: string; options: { text: string; correct: boolean }[] }[]
  >([
    {
      text: '',
      options: [
        { text: '', correct: true },
        { text: '', correct: false },
      ],
    },
  ]);
  const [testModalAssign, setTestModalAssign] = useState<Assignment | null>(null);
  const [testAnswers, setTestAnswers] = useState<Record<number, number[]>>({});
  const [selectedDetailAssign, setSelectedDetailAssign] = useState<Assignment | null>(null);
  const [detailAnswerText, setDetailAnswerText] = useState('');
  const [submittingDetail, setSubmittingDetail] = useState(false);
  const [detailSubmissions, setDetailSubmissions] = useState<any[]>([]);
  const [loadingDetailSubmissions, setLoadingDetailSubmissions] = useState(false);

  // Map & AR Points
  const [arPoints, setArPoints] = useState<ArPoint[]>([]);

  // Leaderboard
  const [leaderboardTab, setLeaderboardTab] = useState<'level' | 'assignments'>('level');
  const [leaderboard, setLeaderboard] = useState<{
    byLevel: LeaderboardEntry[];
    byAssignments: LeaderboardEntry[];
  }>({ byLevel: [], byAssignments: [] });

  // Shop
  const [products, setProducts] = useState<Product[]>([]);
  const [shopSuccessMsg, setShopSuccessMsg] = useState('');
  const [shopCategory, setShopCategory] = useState<'merch' | 'styles' | 'pet'>('merch');

  // Pet State
  const [pet, setPet] = useState<PetData | null>(null);
  const [petPhrase, setPetPhrase] = useState('');
  const [petIsEating, setPetIsEating] = useState(false);
  const [petIsHappy, setPetIsHappy] = useState(false);
  const [petSlotFilter, setPetSlotFilter] = useState<'all' | 'head' | 'body' | 'limbs' | 'color' | 'hat' | 'outfit' | 'boots'>('all');
  const [petRarityFilter, setPetRarityFilter] = useState<'all' | ItemRarity>('all');
  const [showPlatformSelectModal, setShowPlatformSelectModal] = useState(false);
  const [selectedInitPlatform, setSelectedInitPlatform] = useState<PetType>('cat');
  const [customPetName, setCustomPetName] = useState('');

  // Shop Pet Filters
  const [shopPetSlotFilter, setShopPetSlotFilter] = useState<'all' | 'head' | 'body' | 'limbs'>('all');
  const [shopPetRarityFilter, setShopPetRarityFilter] = useState<'all' | ItemRarity>('all');
  const [shopPetTypeFilter, setShopPetTypeFilter] = useState<'all' | PetType>('all');

  // Daily Streak State
  const [dailyStatus, setDailyStatus] = useState<DailyRewardsStatus | null>(null);
  const [dailyClaiming, setDailyClaiming] = useState(false);

  // Admin Shop Management State
  const [adminShopCategory, setAdminShopCategory] = useState<'style' | 'pet' | 'merch'>('style');
  const [newStyleName, setNewStyleName] = useState('');
  const [newStyleColorHex, setNewStyleColorHex] = useState('#10B981');
  const [newStylePrice, setNewStylePrice] = useState(150);
  const [newStyleDesc, setNewStyleDesc] = useState('');

  const [newPetItemName, setNewPetItemName] = useState('');
  const [newPetItemSlot, setNewPetItemSlot] = useState<'head' | 'body' | 'limbs'>('head');
  const [newPetItemRarity, setNewPetItemRarity] = useState<ItemRarity>('common');
  const [newPetItemType, setNewPetItemType] = useState<PetType>('cat');
  const [newPetItemPrice, setNewPetItemPrice] = useState(100);
  const [newPetItemDesc, setNewPetItemDesc] = useState('');

  const [newMerchName, setNewMerchName] = useState('');
  const [newMerchPrice, setNewMerchPrice] = useState(500);
  const [newMerchDesc, setNewMerchDesc] = useState('');
  const [newMerchMedia, setNewMerchMedia] = useState<string | null>(null);

  // Admin Stats
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  // Profile
  const [profileBio, setProfileBio] = useState('');
  const [bioEditing, setBioEditing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  // User Profile Viewing (other users & wall)
  const [viewingProfileUserId, setViewingProfileUserId] = useState<number | null>(null);
  const [viewedProfileUser, setViewedProfileUser] = useState<User | null>(null);
  const [viewedProfilePosts, setViewedProfilePosts] = useState<Post[]>([]);
  const [viewedProfileFriendship, setViewedProfileFriendship] = useState<FriendshipStatus>('self');
  const [viewedProfileFriendsCount, setViewedProfileFriendsCount] = useState<number>(0);
  const [viewedProfileLoading, setViewedProfileLoading] = useState(false);

  // Profile Wall Post Creation
  const [profileNewPostText, setProfileNewPostText] = useState('');
  const [profileNewPostMedia, setProfileNewPostMedia] = useState<string | null>(null);
  const [profileNewPostLoading, setProfileNewPostLoading] = useState(false);
  const profilePostMediaInputRef = useRef<HTMLInputElement | null>(null);

  // Friends System
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<FriendRequest[]>([]);
  const [outgoingFriendRequests, setOutgoingFriendRequests] = useState<FriendRequest[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsTab, setFriendsTab] = useState<'all' | 'requests' | 'search'>('all');
  const [friendsSearchQuery, setFriendsSearchQuery] = useState('');
  const [friendsSearchResults, setFriendsSearchResults] = useState<User[]>([]);
  const [friendsSearchLoading, setFriendsSearchLoading] = useState(false);

  // Chat Global User Search
  const [chatUserSearchResults, setChatUserSearchResults] = useState<User[]>([]);
  const [chatUserSearchLoading, setChatUserSearchLoading] = useState(false);

  // [HERMES_MAP: INIT_LOADERS]
  // --- Initialize App & Check Token ---
  useEffect(() => {
    checkAuth();
    api.getGroups().then((res) => {
      setGroups(res.groups || []);
      if (res.groups?.length) setRegGroupId(res.groups[0].id);
    }).catch(() => {});
  }, []);

  async function checkAuth() {
    try {
      setAuthLoading(true);
      const res = await api.getMe();
      setUser(res.user);
      setProfileBio(res.user.bio || '');
      loadPet();
      loadDailyStatus();
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }

  // [HERMES_MAP: ROUTER_DATA_LOADERS]
  // --- Load View Specific Data ---
  useEffect(() => {
    if (!user) return;

    if (currentView === 'feed') {
      loadFeed();
      loadDailyStatus();
    } else if (currentView === 'chats') {
      loadChats();
    } else if (currentView === 'assignments') {
      loadAssignments();
    } else if (currentView === 'map') {
      api.getArPoints().then((r) => setArPoints(r.points || [])).catch(() => {});
    } else if (currentView === 'leaderboard') {
      api.getLeaderboard().then((r) => setLeaderboard(r)).catch(() => {});
    } else if (currentView === 'shop') {
      api.getProducts().then((r) => setProducts(r.products || [])).catch(() => {});
    } else if (currentView === 'pet') {
      loadPet();
      loadDailyStatus();
    } else if (currentView === 'admin' && user.role === 'admin') {
      api.getAdminStats().then(setAdminStats).catch(() => {});
      loadAdminUsers();
      api.getProducts().then((r) => setProducts(r.products || [])).catch(() => {});
    } else if (currentView === 'backups' && user.role === 'admin') {
      loadBackups();
    }
  }, [user, currentView]);

  // Poll active chat messages
  useEffect(() => {
    if (!user || currentView !== 'chats' || !activeChatId) return;

    const fetchMsgs = () => {
      api.getMessages(activeChatId).then((r) => setMessages(r.messages || [])).catch(() => {});
    };
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 3000);
    return () => clearInterval(interval);
  }, [user, currentView, activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Auth Handlers ---
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await api.login(loginUsername, loginPassword);
      setUser(res.user);
      setProfileBio(res.user.bio || '');
    } catch (err: any) {
      setAuthError(err.message || 'Ошибка входа');
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    if (!regGroupId) {
      setAuthError('Выберите учебную группу');
      return;
    }
    try {
      const res = await api.register(regUsername, regPassword, regFullName, Number(regGroupId));
      setUser(res.user);
      setProfileBio(res.user.bio || '');
    } catch (err: any) {
      setAuthError(err.message || 'Ошибка регистрации');
    }
  }

  function handleLogout() {
    clearToken();
    setUser(null);
  }

  // [HERMES_MAP: EVENT_HANDLERS_HUB]
  async function loadFeed() {
    try {
      const res = await api.getFeed();
      setPosts(res.posts || []);
    } catch {}
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!newPostText.trim() && !newPostMedia) return;
    try {
      setNewPostLoading(true);
      await api.createPost(newPostText, newPostMedia, true);
      setNewPostText('');
      setNewPostMedia(null);
      await loadFeed();
    } catch (err: any) {
      alert(err.message || 'Не удалось опубликовать пост');
    } finally {
      setNewPostLoading(false);
    }
  }

  async function handleLikePost(postId: number) {
    try {
      const res = await api.likePost(postId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? res.post : p)));
      setViewedProfilePosts((prev) => prev.map((p) => (p.id === postId ? res.post : p)));
    } catch {}
  }

  async function handleAddComment(postId: number) {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    try {
      const res = await api.commentPost(postId, text);
      setPosts((prev) => prev.map((p) => (p.id === postId ? res.post : p)));
      setViewedProfilePosts((prev) => prev.map((p) => (p.id === postId ? res.post : p)));
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch {}
  }


  // --- Chats & Messaging Handlers ---
  async function loadChats() {
    try {
      const res = await api.getChats();
      setChats(res.chats || []);
      // Preserve or set active chat
      if (res.chats?.length && !activeChatId && window.innerWidth >= 768) {
        setActiveChatId(res.chats[0].id);
      }
    } catch {}
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChatId || (!msgInput.trim() && !msgMedia)) return;
    try {
      const res = await api.sendMessage(activeChatId, msgInput.trim(), msgMedia || undefined);
      setMessages((prev) => [...prev, res.message]);
      setMsgInput('');
      setMsgMedia(null);
    } catch (err: any) {
      alert(err.message || 'Ошибка отправки');
    }
  }

  async function handlePinChat(chatId: number, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await api.pinChat(chatId);
      if (res.pinned) {
        setPinnedChats((prev) => [...prev, chatId]);
      } else {
        setPinnedChats((prev) => prev.filter((id) => id !== chatId));
      }
      await loadChats();
    } catch (err: any) {
      alert(err.message || 'Ошибка закрепления');
    }
  }

  async function handleHideChat(chatId: number, e: React.MouseEvent) {
    e.stopPropagation();
    const ok = await confirmDialog({
      title: 'СКРЫТЬ ЧАТ',
      message: 'Скрыть этот диалог из своего списка чатов?',
      subtext: 'Чат не удаляется для собеседников и снова появится в списке при получении новых сообщений.',
      confirmText: 'СКРЫТЬ ЧАТ',
      cancelText: 'ОТМЕНА',
      variant: 'warning',
    });
    if (!ok) return;
    try {
      await api.hideChat(chatId);
      if (activeChatId === chatId) setActiveChatId(null);
      await loadChats();
      showToast('Чат скрыт из списка', 'info');
    } catch (err: any) {
      showToast(err.message || 'Ошибка скрытия чата', 'error');
    }
  }

  async function handleDeleteMessage(msgId: number) {
    const ok = await confirmDialog({
      title: 'УДАЛЕНИЕ СООБЩЕНИЯ',
      message: 'Точно удалить это сообщение?',
      subtext: 'Сообщение будет безвозвратно удалено из базы данных для всех участников диалога.',
      confirmText: 'УДАЛИТЬ У ВСЕХ',
      cancelText: 'ОТМЕНА',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.deleteMessage(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      showToast('Сообщение удалено у всех участников', 'success');
    } catch (err: any) {
      showToast(err.message || 'Ошибка удаления сообщения', 'error');
    }
  }

  async function handleForwardMessage(targetChatId: number) {
    if (!forwardModalMsg) return;
    try {
      const res = await api.forwardMessage(forwardModalMsg.id, targetChatId);
      if (targetChatId === activeChatId) {
        setMessages((prev) => [...prev, res.message]);
      }
      const targetChat = chats.find((c) => c.id === targetChatId);
      setForwardModalMsg(null);
      setForwardSearch('');
      showToast(`Сообщение переслано в «${targetChat?.name || 'чат'}»`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Ошибка пересылки сообщения', 'error');
    }
  }

  // --- Assignments Handlers ---
  async function loadAssignments() {
    try {
      const res = await api.getAssignments();
      setAssignments(res.assignments || []);
    } catch {}
  }

  async function handleDeleteAssignment(assignmentId: number) {
    const ok = await confirmDialog({
      title: 'УДАЛЕНИЕ ЗАДАНИЯ',
      message: 'Удалить это учебное задание из системы?',
      subtext: 'Задание будет удалено из реестра, а все связанные ответы студентов будут архивированы.',
      confirmText: 'УДАЛИТЬ ЗАДАНИЕ',
      cancelText: 'ОТМЕНА',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.deleteAssignment(assignmentId);
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
      if (selectedDetailAssign?.id === assignmentId) setSelectedDetailAssign(null);
      showToast('Задание успешно удалено', 'success');
    } catch (err: any) {
      showToast(err.message || 'Ошибка удаления задания', 'error');
    }
  }

  async function handleCreateAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!newAssignTitle.trim()) {
      alert('Укажите название задания');
      return;
    }

    let assignedTo:
      | { type: 'all' }
      | { type: 'group'; groupId: number }
      | { type: 'students'; studentIds: number[] };
    if (newAssignGroupId === 'all') {
      assignedTo = { type: 'all' };
    } else {
      assignedTo = { type: 'group', groupId: Number(newAssignGroupId) };
    }

    try {
      let questionsPayload = undefined;
      let arLocationPayload = undefined;

      if (newAssignType === 'test') {
        const validQuestions = newAssignQuestions.filter((q) => q.text.trim().length > 0);
        if (!validQuestions.length) {
          alert('Добавьте хотя бы один вопрос с текстом');
          return;
        }
        for (let i = 0; i < validQuestions.length; i++) {
          const q = validQuestions[i];
          const validOpts = q.options.filter((o) => o.text.trim().length > 0);
          if (validOpts.length < 2) {
            alert(`Вопрос ${i + 1}: укажите минимум 2 варианта ответа`);
            return;
          }
          if (!validOpts.some((o) => o.correct)) {
            alert(`Вопрос ${i + 1}: отметьте хотя бы один правильный вариант ответа`);
            return;
          }
        }
        questionsPayload = validQuestions.map((q, idx) => ({
          id: idx + 1,
          text: q.text,
          options: q.options.map((o, oIdx) => ({ id: oIdx + 1, text: o.text, correct: o.correct })),
        }));
      } else if (newAssignType === 'ar') {
        const lat = parseFloat(newAssignArLat);
        const lng = parseFloat(newAssignArLng);
        if (isNaN(lat) || isNaN(lng)) {
          alert('Введите корректные числовые координаты (широта и долгота)');
          return;
        }
        arLocationPayload = {
          lat,
          lng,
          label: newAssignArLabel.trim() || newAssignTitle.trim(),
        };
      }

      await api.createAssignment({
        title: newAssignTitle.trim(),
        description: newAssignDesc.trim(),
        type: newAssignType,
        assignedTo,
        xpReward: Number(newAssignXp) || 25,
        coinsReward: Number(newAssignCoins) || 0,
        dueDate: newAssignDueDate || null,
        questions: questionsPayload,
        arLocation: arLocationPayload,
      });

      alert('Задание успешно создано и опубликовано студентам!');
      setCreateAssignModalOpen(false);
      setNewAssignTitle('');
      setNewAssignDesc('');
      setNewAssignDueDate('');
      setNewAssignQuestions([
        {
          text: '',
          options: [
            { text: '', correct: true },
            { text: '', correct: false },
          ],
        },
      ]);
      await loadAssignments();
    } catch (err: any) {
      alert(err.message || 'Ошибка создания задания');
    }
  }

  async function handleSubmitAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!submitModalAssignId) return;
    try {
      await api.submitAssignment(submitModalAssignId, submitComment);
      const subAssignId = submitModalAssignId;
      setSubmitModalAssignId(null);
      setSubmitComment('');
      await loadAssignments();
      if (selectedDetailAssign?.id === subAssignId) {
        setSelectedDetailAssign((prev) =>
          prev
            ? {
                ...prev,
                mySubmission: {
                  id: Date.now(),
                  status: 'pending',
                  text: submitComment,
                  submittedAt: Date.now(),
                } as any,
              }
            : null
        );
      }
      alert('Задание успешно отправлено на проверку преподавателю!');
    } catch (err: any) {
      alert(err.message || 'Ошибка сдачи задания');
    }
  }

  function openAssignment(item: Assignment) {
    setSelectedDetailAssign(item);
    setDetailAnswerText('');
    if (user?.role === 'teacher' || user?.role === 'admin') {
      loadDetailSubmissions(item.id);
    }
  }

  async function loadDetailSubmissions(assignmentId: number) {
    setLoadingDetailSubmissions(true);
    try {
      const res = await api.getAssignmentSubmissions(assignmentId);
      setDetailSubmissions(res.submissions || []);
    } catch (err) {
      console.error('Failed to load submissions', err);
      setDetailSubmissions([]);
    } finally {
      setLoadingDetailSubmissions(false);
    }
  }

  async function handleInlineSubmitDetail(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDetailAssign || !detailAnswerText.trim()) return;
    setSubmittingDetail(true);
    try {
      await api.submitAssignment(selectedDetailAssign.id, detailAnswerText);
      const assignId = selectedDetailAssign.id;
      const sentText = detailAnswerText;
      setDetailAnswerText('');
      await loadAssignments();
      setSelectedDetailAssign((prev) =>
        prev && prev.id === assignId
          ? {
              ...prev,
              mySubmission: {
                id: Date.now(),
                status: 'pending',
                text: sentText,
                submittedAt: Date.now(),
              } as any,
            }
          : prev
      );
      alert('Решение успешно отправлено на проверку преподавателю!');
    } catch (err: any) {
      alert(err.message || 'Ошибка отправки решения');
    } finally {
      setSubmittingDetail(false);
    }
  }

  async function handleGradeSubmission(subId: number, gradeVal: string, xpVal: number, coinsVal: number) {
    try {
      await api.gradeSubmission(subId, gradeVal, xpVal, coinsVal);
      alert('Оценка и награда успешно выставлены!');
      if (selectedDetailAssign) {
        loadDetailSubmissions(selectedDetailAssign.id);
      }
      await loadAssignments();
    } catch (err: any) {
      alert(err.message || 'Ошибка оценивания ответа');
    }
  }

  async function handleSubmitTest(e: React.FormEvent) {
    e.preventDefault();
    if (!testModalAssign) return;
    try {
      const res = await api.submitAssignment(testModalAssign.id, undefined, testAnswers);
      const sub = res.submission;
      const testedId = testModalAssign.id;
      setTestModalAssign(null);
      setTestAnswers({});
      await loadAssignments();
      if (user) {
        const me = await api.getMe();
        setUser(me.user);
      }
      if (selectedDetailAssign?.id === testedId) {
        setSelectedDetailAssign((prev) => (prev ? { ...prev, mySubmission: sub } : null));
      }
      alert(`Тест завершен! Результат: ${sub?.grade || (sub?.autoScore ? sub.autoScore + '%' : '100%')}`);
    } catch (err: any) {
      alert(err.message || 'Ошибка отправки ответов на тест');
    }
  }

  // --- Pet & Daily Rewards Handlers ---
  async function loadPet() {
    try {
      const res = await api.getPet();
      setPet(res.pet);
    } catch {}
  }

  async function loadDailyStatus() {
    try {
      const res = await api.getDailyRewardsStatus();
      setDailyStatus(res);
    } catch {}
  }

  async function handleClaimDailyReward() {
    if (dailyClaiming) return;
    try {
      setDailyClaiming(true);
      const res = await api.claimDailyReward();
      if (res.user) setUser(res.user);
      if (res.pet) setPet(res.pet);
      setPetIsHappy(true);
      setTimeout(() => setPetIsHappy(false), 3000);
      showToast(`Награда за день получена: +${res.reward?.xp} XP / +${res.reward?.coins} ⟠!`, 'success');
      await loadDailyStatus();
    } catch (err: any) {
      showToast(err.message || 'Ошибка получения награды', 'error');
    } finally {
      setDailyClaiming(false);
    }
  }

  async function handleFeedPet(foodType: 'battery' | 'crystal' | 'pie') {
    try {
      setPetIsEating(true);
      const res = await api.feedPet(foodType);
      setPet(res.pet);
      if (res.user) setUser(res.user);
      showToast(res.message, 'success');
      setTimeout(() => setPetIsEating(false), 2000);
    } catch (err: any) {
      setPetIsEating(false);
      showToast(err.message || 'Ошибка кормления питомца', 'error');
    }
  }

  async function handlePlayWithPet() {
    try {
      setPetIsHappy(true);
      const res = await api.playPet();
      setPet(res.pet);
      setPetPhrase(res.phrase);
      setTimeout(() => setPetIsHappy(false), 2500);
      setTimeout(() => setPetPhrase(''), 5000);
    } catch {}
  }

  async function handleChoosePet(petType: PetType, name?: string) {
    try {
      const res = await api.choosePet(petType, name);
      setPet(res.pet);
      if (res.user) setUser(res.user);
      setShowPlatformSelectModal(false);
      showToast(res.message || 'Платформа успешно инициализирована!', 'success');
      const pRes = await api.getProducts();
      setProducts(pRes.products || []);
    } catch (err: any) {
      showToast(err.message || 'Ошибка выбора платформы', 'error');
    }
  }

  async function handleEquipPet(
    slot: 'head' | 'body' | 'limbs' | 'hat' | 'outfit' | 'boots' | 'color',
    itemId: string | null
  ) {
    try {
      const res = await api.equipPet(slot, itemId);
      setPet(res.pet);
      showToast(itemId ? 'Модуль экипирован!' : 'Модуль снят', 'info');
    } catch (err: any) {
      showToast(err.message || 'Ошибка экипировки', 'error');
    }
  }

  async function handleRenamePet(name: string) {
    try {
      const res = await api.renamePet(name);
      setPet(res.pet);
      showToast(`Питомец переименован в «${res.pet.name}»!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Ошибка переименования', 'error');
    }
  }

  // --- Shop Purchase Handler ---
  async function handleBuyProduct(productId: number) {
    try {
      const res = await api.buyProduct(productId);
      if (res.user) setUser(res.user);
      if (res.pet) setPet(res.pet);

      const prod = products.find((p) => p.id === productId);
      if (prod?.category === 'style' && prod.colorHex) {
        setAccentColor(prod.colorHex);
        showToast(`Стиль «${prod.name}» разблокирован и активирован!`, 'success');
      } else if (prod?.category === 'pet') {
        showToast(`Модуль «${prod.name}» добавлен в гардероб питомца!`, 'success');
      } else {
        showToast('Заказ оформлен! Заберите мерч у администрации.', 'success');
      }
      setShopSuccessMsg('Покупка успешно совершена!');
      setTimeout(() => setShopSuccessMsg(''), 4000);
      loadPet();
      const pRes = await api.getProducts();
      setProducts(pRes.products || []);
    } catch (err: any) {
      showToast(err.message || 'Ошибка покупки', 'error');
    }
  }

  // --- Admin Shop & Styles Creation Handler ---
  async function handleCreateAdminProduct(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (adminShopCategory === 'style') {
        if (!newStyleName.trim()) return;
        await api.createAdminProduct({
          name: newStyleName.trim(),
          description: newStyleDesc.trim() || 'Эксклюзивный неоновый акцент интерфейса',
          priceCoins: Number(newStylePrice) || 100,
          category: 'style',
          colorHex: newStyleColorHex,
          icon: null,
        });
        showToast(`Стиль «${newStyleName}» добавлен в каталог!`, 'success');
        setNewStyleName('');
        setNewStyleDesc('');
      } else if (adminShopCategory === 'pet') {
        if (!newPetItemName.trim()) return;
        await api.createAdminProduct({
          name: newPetItemName.trim(),
          description: newPetItemDesc.trim() || 'Модуль экипировки платформы',
          priceCoins: Number(newPetItemPrice) || 80,
          category: 'pet',
          slot: newPetItemSlot,
          icon: null,
        });
        showToast(`Модуль питомца «${newPetItemName}» добавлен!`, 'success');
        setNewPetItemName('');
        setNewPetItemDesc('');
      } else {
        if (!newMerchName.trim()) return;
        await api.createAdminProduct({
          name: newMerchName.trim(),
          description: newMerchDesc.trim() || 'Фирменный артефакт колледжа',
          priceCoins: Number(newMerchPrice) || 500,
          category: 'merch',
          mediaData: newMerchMedia || undefined,
        });
        showToast(`Товар мерча «${newMerchName}» добавлен!`, 'success');
        setNewMerchName('');
        setNewMerchDesc('');
        setNewMerchMedia(null);
      }
      const prodRes = await api.getProducts();
      setProducts(prodRes.products || []);
    } catch (err: any) {
      showToast(err.message || 'Ошибка добавления товара/стиля', 'error');
    }
  }

  async function handleDeleteProduct(id: number) {
    const ok = await confirmDialog({
      title: 'УДАЛЕНИЕ ТОВАРА',
      message: 'Удалить этот товар из каталога магазина?',
      confirmText: 'УДАЛИТЬ',
      cancelText: 'ОТМЕНА',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.deleteAdminProduct(id);
      showToast('Товар успешно удален', 'success');
      const prodRes = await api.getProducts();
      setProducts(prodRes.products || []);
    } catch (err: any) {
      showToast(err.message || 'Ошибка удаления товара', 'error');
    }
  }

  async function handleSaveBio() {
    try {
      const res = await api.updateMe({ bio: profileBio });
      setUser(res.user);
      setBioEditing(false);
      showToast('Описание профиля обновлено', 'success');
    } catch (err: any) {
      showToast(err.message || 'Ошибка обновления био', 'error');
    }
  }

  // --- Avatar Handlers ---
  async function handleAvatarFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Пожалуйста, выберите файл изображения (JPG, PNG, WebP, GIF)', 'error');
      return;
    }
    try {
      setAvatarUploading(true);
      const dataUrl = await resizeImageToDataUrl(file, 512, 0.9);
      const res = await api.uploadAvatar(dataUrl);
      if (res.user) setUser(res.user);
      showToast('Аватар профиля успешно обновлён!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Ошибка загрузки аватара', 'error');
    } finally {
      setAvatarUploading(false);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
    }
  }

  async function handleResetAvatar() {
    try {
      setAvatarUploading(true);
      const res = await api.resetAvatar();
      if (res.user) setUser(res.user);
      showToast('Аватар сброшен к системному по умолчанию', 'info');
    } catch (err: any) {
      showToast(err.message || 'Ошибка сброса аватара', 'error');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSetAvatarColor(color: string) {
    try {
      const res = await api.setAvatarColor(color);
      if (res.user) setUser(res.user);
      showToast('Цветовой акцент аватара изменён', 'success');
    } catch (err: any) {
      showToast(err.message || 'Ошибка изменения цвета', 'error');
    }
  }

  // --- Profile Viewing & Wall Handlers ---
  async function openUserProfile(targetUserId: number) {
    if (!user) return;
    if (targetUserId === user.id) {
      setViewingProfileUserId(null);
      setCurrentView('profile');
      await loadMyProfilePosts();
      return;
    }
    setViewingProfileUserId(targetUserId);
    setCurrentView('profile');
    try {
      setViewedProfileLoading(true);
      const res = await api.getUserPosts(targetUserId);
      setViewedProfileUser(res.user);
      setViewedProfilePosts(res.posts || []);
      setViewedProfileFriendship(res.friendshipStatus || 'none');
      setViewedProfileFriendsCount(res.friendsCount || 0);
    } catch (err: any) {
      showToast(err.message || 'Ошибка загрузки профиля', 'error');
    } finally {
      setViewedProfileLoading(false);
    }
  }

  async function loadMyProfilePosts() {
    if (!user) return;
    try {
      const res = await api.getUserPosts(user.id);
      setViewedProfilePosts(res.posts || []);
      setViewedProfileFriendsCount(res.friendsCount || 0);
    } catch {}
  }

  async function handleCreateProfilePost(e: React.FormEvent) {
    e.preventDefault();
    if (!profileNewPostText.trim() && !profileNewPostMedia) return;
    try {
      setProfileNewPostLoading(true);
      const res = await api.createPost(profileNewPostText.trim(), profileNewPostMedia, false);
      setViewedProfilePosts((prev) => [res.post, ...prev]);
      setProfileNewPostText('');
      setProfileNewPostMedia(null);
      showToast('Запись опубликована на вашей странице!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Ошибка публикации', 'error');
    } finally {
      setProfileNewPostLoading(false);
    }
  }

  async function handleDeleteWallPost(postId: number) {
    if (!window.confirm('Удалить эту публикацию со стены?')) return;
    try {
      await api.deletePost(postId);
      setViewedProfilePosts((prev) => prev.filter((p) => p.id !== postId));
      showToast('Публикация удалена', 'info');
    } catch (err: any) {
      showToast(err.message || 'Ошибка удаления публикации', 'error');
    }
  }


  // --- Friends Handlers ---
  async function loadFriends() {
    try {
      setFriendsLoading(true);
      const res = await api.getFriends();
      setFriendsList(res.friends || []);
      setIncomingFriendRequests(res.incoming || []);
      setOutgoingFriendRequests(res.outgoing || []);
    } catch {} finally {
      setFriendsLoading(false);
    }
  }

  async function handleSendFriendRequest(targetUserId: number) {
    try {
      const res = await api.sendFriendRequest(targetUserId);
      showToast(res.message, 'success');
      if (viewingProfileUserId === targetUserId) {
        setViewedProfileFriendship((res.status as FriendshipStatus) || 'outgoing');
      }
      await loadFriends();
    } catch (err: any) {
      showToast(err.message || 'Ошибка отправки заявки', 'error');
    }
  }

  async function handleAcceptFriend(payload: { requestId?: number; userId?: number }) {
    try {
      const res = await api.acceptFriendRequest(payload);
      showToast(res.message, 'success');
      if (viewingProfileUserId && (payload.userId === viewingProfileUserId || payload.requestId)) {
        setViewedProfileFriendship('friends');
        setViewedProfileFriendsCount((prev) => prev + 1);
      }
      await loadFriends();
    } catch (err: any) {
      showToast(err.message || 'Ошибка принятия заявки', 'error');
    }
  }

  async function handleDeclineFriend(payload: { requestId?: number; userId?: number }) {
    try {
      const res = await api.declineFriendRequest(payload);
      showToast(res.message, 'info');
      if (viewingProfileUserId && (payload.userId === viewingProfileUserId || payload.requestId)) {
        setViewedProfileFriendship('none');
      }
      await loadFriends();
    } catch (err: any) {
      showToast(err.message || 'Ошибка отклонения заявки', 'error');
    }
  }

  async function handleRemoveFriend(friendId: number) {
    try {
      const res = await api.removeFriend(friendId);
      showToast(res.message, 'info');
      if (viewingProfileUserId === friendId) {
        setViewedProfileFriendship('none');
        setViewedProfileFriendsCount((prev) => Math.max(0, prev - 1));
      }
      await loadFriends();
    } catch (err: any) {
      showToast(err.message || 'Ошибка удаления из друзей', 'error');
    }
  }

  async function handleStartDirectChatWithUser(u: User) {
    try {
      const res = await api.startDirectChat(u.id);
      await loadChats();
      setActiveChatId(res.chat.id);
      setCurrentView('chats');
      setChatSearch('');
      setChatUserSearchResults([]);
      showToast(`Канал связи с «${u.fullName}» активирован`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Ошибка открытия чата', 'error');
    }
  }

  // Debounced search for chats and friends
  useEffect(() => {
    if (!chatSearch.trim()) {
      setChatUserSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setChatUserSearchLoading(true);
        const res = await api.searchUsers(chatSearch.trim());
        setChatUserSearchResults(res.users || []);
      } catch {} finally {
        setChatUserSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [chatSearch]);

  useEffect(() => {
    if (currentView === 'friends') {
      loadFriends();
    }
    if (currentView === 'profile' && (!viewingProfileUserId || viewingProfileUserId === user?.id)) {
      loadMyProfilePosts();
    }
  }, [currentView, viewingProfileUserId]);

  useEffect(() => {
    if (!friendsSearchQuery.trim()) {
      setFriendsSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setFriendsSearchLoading(true);
        const res = await api.searchUsers(friendsSearchQuery.trim());
        setFriendsSearchResults(res.users || []);
      } catch {} finally {
        setFriendsSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [friendsSearchQuery]);

  // --- Admin User Management Handlers ---
  async function loadAdminUsers() {
    try {
      const res = await api.getAdminUsers();
      setAdminUsers(res.users || []);
    } catch {}
  }

  async function handleChangeUserRole(userId: number, newRole: string, groupId?: number | null) {
    try {
      await api.changeUserRole(userId, newRole, groupId);
      setAdminActionMsg(`Роль пользователя ID#${userId} успешно изменена на [${newRole.toUpperCase()}]`);
      await loadAdminUsers();
      setTimeout(() => setAdminActionMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Ошибка изменения роли');
    }
  }

  async function handleCreateTeacher(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createTeacher(newTeacherUsername, newTeacherPassword, newTeacherFullname);
      setAdminActionMsg(`Преподаватель ${newTeacherFullname} успешно создан!`);
      setNewTeacherUsername('');
      setNewTeacherPassword('');
      setNewTeacherFullname('');
      await loadAdminUsers();
      setTimeout(() => setAdminActionMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Ошибка создания преподавателя');
    }
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      await api.createAdminGroup(newGroupName.trim());
      setAdminActionMsg(`Группа ${newGroupName} успешно создана!`);
      setNewGroupName('');
      const gRes = await api.getGroups();
      setGroups(gRes.groups || []);
      setTimeout(() => setAdminActionMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Ошибка создания группы');
    }
  }

  async function handleDeleteGroup(groupId: number, groupName: string) {
    const ok = await confirmDialog({
      title: 'УДАЛЕНИЕ УЧЕБНОЙ ГРУППЫ',
      message: `Удалить группу "${groupName}"?`,
      subtext: 'Студенты останутся в системе без привязки к группе, а чат группы будет удален.',
      confirmText: 'УДАЛИТЬ ГРУППУ',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.deleteAdminGroup(groupId);
      showToast(`Группа "${groupName}" удалена`, 'success');
      const gRes = await api.getGroups();
      setGroups(gRes.groups || []);
      if (adminUsers.length > 0) {
        const uRes = await api.getAdminUsers();
        setAdminUsers(uRes.users || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Ошибка удаления группы', 'error');
    }
  }

  async function handleDeleteUser(userId: number) {
    const ok = await confirmDialog({
      title: 'УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ',
      message: `Удалить пользователя ID#${userId}?`,
      subtext: 'Учетная запись будет навсегда стёрта из базы данных.',
      confirmText: 'УДАЛИТЬ ПОЛЬЗОВАТЕЛЯ',
      cancelText: 'ОТМЕНА',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.deleteUser(userId);
      setAdminActionMsg(`Пользователь ID#${userId} удален`);
      await loadAdminUsers();
      showToast(`Пользователь ID#${userId} успешно удален`, 'success');
      setTimeout(() => setAdminActionMsg(''), 4000);
    } catch (err: any) {
      showToast(err.message || 'Ошибка удаления пользователя', 'error');
    }
  }

  // --- Backups Management Handlers ---
  async function loadBackups() {
    try {
      const [settingsRes, listRes] = await Promise.all([
        api.getBackupSettings(),
        api.getBackupList(),
      ]);
      setBackupSettings(settingsRes);
      setBackupIntervalInput(settingsRes.intervalDays || 7);
      setBackupList(listRes.backups || []);
    } catch {}
  }

  async function handleSaveBackupInterval() {
    try {
      await api.saveBackupSettings(Number(backupIntervalInput));
      setBackupMsg('Интервал автобэкапа успешно обновлен!');
      await loadBackups();
      setTimeout(() => setBackupMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения интервала');
    }
  }

  async function handleCreateBackupNow() {
    try {
      const res = await api.createBackup();
      setBackupMsg(`Создана резервная копия: ${res.filename}`);
      await loadBackups();
      setTimeout(() => setBackupMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Ошибка создания копии');
    }
  }

  async function handleDownloadCurrentDb() {
    try {
      const token = localStorage.getItem('hermes_token');
      const res = await fetch('/api/admin/backup/download-current', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Ошибка скачивания');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `college-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch (err: any) {
      alert(err.message || 'Не удалось скачать базу данных');
    }
  }

  async function handleDownloadBackupFile(filename: string) {
    try {
      const token = localStorage.getItem('hermes_token');
      const res = await fetch(`/api/admin/backup/download/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Ошибка скачивания файла');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    } catch (err: any) {
      alert(err.message || 'Не удалось скачать файл бэкапа');
    }
  }

  async function handleDeleteBackup(filename: string) {
    const ok = await confirmDialog({
      title: 'УДАЛЕНИЕ БЭКАПА',
      message: `Удалить файл архива ${filename}?`,
      subtext: 'Этот файл снимка базы данных будет физически удален с диска сервера.',
      confirmText: 'УДАЛИТЬ ФАЙЛ',
      cancelText: 'ОТМЕНА',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.deleteBackup(filename);
      await loadBackups();
      showToast(`Файл бэкапа ${filename} удален`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Ошибка удаления бэкапа', 'error');
    }
  }

  async function handleRestoreBackup() {
    if (!backupRestoreFileContent) return;
    const ok = await confirmDialog({
      title: 'КРИТИЧЕСКОЕ ВОССТАНОВЛЕНИЕ',
      message: 'ВНИМАНИЕ: Восстановление перезапишет текущую базу данных!',
      subtext: 'Перед накатом бэкапа сервер автоматически создаст резервную копию before-restore. Продолжить процедуру?',
      confirmText: 'ПЕРЕЗАПИСАТЬ И ВОССТАНОВИТЬ',
      cancelText: 'ОТМЕНА',
      variant: 'warning',
    });
    if (!ok) return;
    try {
      await api.restoreBackup(backupRestoreFileContent);
      setBackupMsg('База данных успешно восстановлена!');
      setBackupRestoreFileContent(null);
      setBackupRestoreFileName('');
      await loadBackups();
      showToast('База восстановлена! Обновляем страницу...', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      showToast(err.message || 'Ошибка восстановления из файла', 'error');
    }
  }

  function handleFileToDataUrl(file: File, setter: (val: string) => void) {
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  }

  // --- XP & Level Formula Helpers ---
  const currentLvl = user?.level || 1;
  const currentXp = user?.xp || 0;
  const xpNeeded = Math.floor(100 * Math.pow(currentLvl, 1.5));
  const xpPercent = Math.min(100, Math.round((currentXp / Math.max(1, xpNeeded)) * 100));

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-paper-soft text-ink flex flex-col items-center justify-center font-mono bg-grid">
        <HermesLogo className="h-16 w-16 animate-pulse" />
        <p className="mt-4 text-accent tracking-[0.2em] text-sm font-bold">
          [ INITIALIZING HERMES ECOSYSTEM PROTOCOL... ]
        </p>
      </div>
    );
  }

  // ================= 1. AUTH SCREEN (IF NOT LOGGED IN) =================
  if (!user) {
    return (
      <div className="min-h-screen bg-paper-soft text-ink flex flex-col items-center justify-center p-4 font-mono bg-grid selection:bg-accent selection:text-black">
        <div className="w-full max-w-md border border-white/15 bg-paper/90 backdrop-blur-md p-6 sm:p-8 shadow-2xl relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />

          {/* Logo & Headline */}
          <div className="flex flex-col items-center text-center">
            <HermesLogo className="h-16 w-16" />
            <h1 className="mt-4 font-bit text-3xl sm:text-4xl text-ink">
              HERMES <span className="text-accent">//</span> SYSTEM
            </h1>
            <p className="mt-1 text-xs tracking-[0.16em] text-ink/60 uppercase">
              Экосистема Колледжа · Цифровой Кампус
            </p>
          </div>

          {/* Telemetry formula */}
          <div className="mt-4 p-3 border border-white/10 bg-white/[0.02] rounded-xl">
            <TerminalFormula>
{`[ PROTOCOL ]: HERMES_AUTH_v2.6
[ NODE ]: CONNECTED_TO_BACKEND
P(VERIFIED)=1.0`}
            </TerminalFormula>
          </div>

          {/* Login / Register Tab switcher */}
          <div className="mt-6 grid grid-cols-2 p-1 border border-white/15 rounded-xl bg-white/[0.03] gap-1">
            <button
              onClick={() => { setAuthTab('login'); setAuthError(''); }}
              className={`py-2 text-xs font-bold tracking-[0.14em] uppercase transition-all rounded-lg ${
                authTab === 'login' ? 'bg-accent text-black shadow' : 'text-ink/60 hover:text-ink'
              }`}
            >
              / 01 Вход
            </button>
            <button
              onClick={() => { setAuthTab('register'); setAuthError(''); }}
              className={`py-2 text-xs font-bold tracking-[0.14em] uppercase transition-all rounded-lg ${
                authTab === 'register' ? 'bg-accent text-black shadow' : 'text-ink/60 hover:text-ink'
              }`}
            >
              / 02 Регистрация
            </button>
          </div>

          {authError && (
            <div className="mt-4 p-3 border border-red-500/50 bg-red-950/40 text-red-400 text-xs tracking-wider rounded-xl">
              [ ERROR ]: {authError}
            </div>
          )}

          {authTab === 'login' && (
            <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold text-ink/60 tracking-wider mb-1">
                  ИДЕНТИФИКАТОР (ЛОГИН)
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                  placeholder="admin"
                  className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-sm text-ink placeholder-ink/30 focus:outline-none focus:border-accent rounded-xl transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink/60 tracking-wider mb-1">
                  ПАРОЛЬ ДОСТУПА
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-sm text-ink placeholder-ink/30 focus:outline-none focus:border-accent rounded-xl transition-colors"
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full bg-accent text-black font-bold py-3 text-xs tracking-[0.16em] uppercase transition-all hover:bg-white rounded-xl shadow-lg"
              >
                АВТОРИЗОВАТЬСЯ В СИСТЕМЕ →
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginUsername('admin');
                  setLoginPassword('admin123');
                }}
                className="text-[11px] text-ink/50 hover:text-accent transition-colors text-center tracking-wider py-1 rounded-lg"
              >
                [ БЫСТРЫЙ ВХОД АДМИН: ADMIN / ADMIN123 ]
              </button>
            </form>
          )}

          {authTab === 'register' && (
            <form onSubmit={handleRegister} className="mt-6 flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-bold text-ink/60 tracking-wider mb-1">
                  ФИО СТУДЕНТА
                </label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                  placeholder="Иванов Иван Иванович"
                  className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-sm text-ink placeholder-ink/30 focus:outline-none focus:border-accent rounded-xl transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink/60 tracking-wider mb-1">
                  ЛОГИН
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                  placeholder="student24"
                  className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-sm text-ink placeholder-ink/30 focus:outline-none focus:border-accent rounded-xl transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink/60 tracking-wider mb-1">
                  ПАРОЛЬ
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-sm text-ink placeholder-ink/30 focus:outline-none focus:border-accent rounded-xl transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink/60 tracking-wider mb-1">
                  УЧЕБНАЯ ГРУППА
                </label>
                <select
                  value={regGroupId}
                  onChange={(e) => setRegGroupId(Number(e.target.value))}
                  required
                  className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-accent rounded-xl transition-colors"
                >
                  <option value="">-- Выберите группу --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="mt-2 w-full bg-accent text-black font-bold py-3 text-xs tracking-[0.16em] uppercase transition-all hover:bg-white rounded-xl shadow-lg"
              >
                ЗАРЕГИСТРИРОВАТЬ СТУДЕНТА →
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ================= 2. ALL NAVIGATION DIRECTORY =================
  const ALL_NAV_ITEMS: {
    id: View;
    label: string;
    sublabel: string;
    icon: any;
    adminOnly?: boolean;
    dockQuick?: boolean;
  }[] = [
    { id: 'feed', label: 'ЛЕНТА', sublabel: 'Кампус и новости', icon: Flame, dockQuick: true },
    { id: 'chats', label: 'ЧАТЫ', sublabel: 'Каналы связи', icon: MessageSquare, dockQuick: true },
    { id: 'friends', label: 'ДРУЗЬЯ', sublabel: 'Союзники и связи', icon: Users, dockQuick: true },
    { id: 'assignments', label: 'ЗАДАНИЯ', sublabel: 'Миссии и практики', icon: CheckSquare, dockQuick: true },
    { id: 'pet', label: 'ПИТОМЕЦ', sublabel: 'Спутник и дейлики', icon: Sparkles, dockQuick: true },
    { id: 'shop', label: 'МАГАЗИН', sublabel: 'Мерч и стили', icon: ShoppingBag },
    { id: 'map', label: 'РАДАР / AR', sublabel: 'Точки интереса', icon: MapPin },
    { id: 'leaderboard', label: 'РЕЙТИНГ', sublabel: 'Топ операторов', icon: Trophy },
    { id: 'profile', label: 'ПРОФИЛЬ', sublabel: 'Оператор и ранг', icon: UserIcon },
    { id: 'settings', label: 'НАСТРОЙКИ', sublabel: 'Конфигурация UI', icon: Settings },
    ...(user.role === 'admin'
      ? [
          { id: 'backups' as View, label: 'БЭКАПЫ', sublabel: 'База и архивы', icon: Database, adminOnly: true },
          { id: 'admin' as View, label: 'АДМИНКА', sublabel: 'Пользователи & Роли', icon: ShieldAlert, adminOnly: true },
        ]
      : []),
  ];

  const DOCK_ITEMS = ALL_NAV_ITEMS.filter((item) => item.dockQuick);

  return (
    <div
      className={`flex min-h-screen flex-col bg-paper-soft text-ink font-mono selection:bg-accent selection:text-black ${
        fontSize === 'sm' ? 'text-xs sm:text-sm' : fontSize === 'lg' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
      }`}
    >
      {/* ================= TOP COMMAND BAR ================= */}
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-white/15 px-3 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between safe-area-pt">
        <div className="flex items-center gap-3 sm:gap-6">
          <div
            onClick={() => setCurrentView('feed')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <HermesLogo className="h-8 w-8 sm:h-9 sm:w-9 group-hover:scale-105 transition-transform" />
            <div>
              <span className="font-bit text-lg sm:text-xl font-bold tracking-wider text-ink flex items-center gap-1.5">
                HERMES <span className="text-accent text-xs">v2.6</span>
              </span>
              <span className="hidden sm:block text-[10px] tracking-[0.18em] text-ink/60">
                COLLEGE PROTOCOL
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 border-l border-white/15 pl-4 text-xs text-ink/60">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SYS_ONLINE: 3000</span>
            <span className="text-ink/30">|</span>
            <span className="text-accent font-bold">P(ACTIVE)=1.0</span>
          </div>
        </div>

        {/* User Stats & Badges */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* Daily Streak Indicator */}
          {dailyStatus?.canClaimToday && (
            <button
              onClick={() => setCurrentView('pet')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-accent bg-accent/15 text-accent text-xs font-bold animate-pulse hover:bg-accent hover:text-black transition-all shadow-sm shadow-accent/20"
              title="Доступна ежедневная награда!"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">ДЕЙЛИК</span>
              <span className="inline sm:hidden font-mono font-bold">!</span>
            </button>
          )}

          {/* Theme Quick Toggle Button */}
          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            title={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            className="p-2 sm:p-2.5 rounded-xl border border-white/15 hover:border-accent text-ink/70 hover:text-accent transition-all"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Coins Badge */}
          <div
            onClick={() => setCurrentView('shop')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs sm:text-sm font-bold cursor-pointer hover:border-amber-500 transition-all shadow-sm"
            title="Баланс монеток колледжа"
          >
            <Coins className="h-3.5 w-3.5 text-amber-500" />
            <span>{user.coins || 0}</span>
          </div>

          {/* Level / XP Badge */}
          <div
            onClick={() => openUserProfile(user.id)}
            className="hidden sm:flex flex-col text-right cursor-pointer group"
          >
            <div className="text-xs font-bold text-ink group-hover:text-accent transition-colors flex items-center justify-end gap-1">
              <span>LVL {currentLvl}</span>
              <span className="text-accent">({currentXp} XP)</span>
            </div>
            <div className="w-24 sm:w-28 h-2 bg-zinc-800 rounded-full overflow-hidden mt-1 border border-white/10">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Settings Shortcut */}
          <button
            onClick={() => setCurrentView('settings')}
            title="Настройки интерфейса"
            className={`p-2 sm:p-2.5 rounded-xl border border-white/15 transition-all ${
              currentView === 'settings'
                ? 'bg-accent text-black font-bold shadow'
                : 'text-ink/70 hover:text-ink hover:border-accent'
            }`}
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* User Name & Role */}
          <div
            onClick={() => openUserProfile(user.id)}
            className="flex items-center gap-2.5 border border-white/15 bg-white/[0.03] px-2.5 sm:px-3 py-1.5 rounded-xl cursor-pointer hover:border-accent transition-colors"
          >
            <UserAvatar
              avatarUrl={user.avatarUrl}
              avatarColor={user.avatarColor}
              name={user.fullName || user.username}
              size="sm"
            />
            <div className="hidden lg:block text-left text-xs leading-none">
              <div className="font-bold text-ink">{user.fullName || user.username}</div>
              <div className="text-[10px] text-accent uppercase font-bold mt-0.5">{user.role}</div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Завершить сессию"
            className="p-2 sm:p-2.5 rounded-xl text-ink/60 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/40"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ================= MAIN WORKSPACE ================= */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto">
        {/* --- DESKTOP SIDEBAR TERMINAL --- */}
        <aside className="hidden md:flex w-72 lg:w-80 flex-col border-r border-white/15 bg-paper p-4 shrink-0 justify-between">
          <div>
            <div className="text-xs font-bold text-ink/50 tracking-[0.2em] uppercase px-3.5 py-2">
              / DIRECTORY
            </div>
            <nav className="flex flex-col gap-1.5 mt-2">
              {ALL_NAV_ITEMS.map((item, idx) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'profile') {
                        openUserProfile(user.id);
                      } else {
                        setCurrentView(item.id);
                      }
                    }}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold tracking-wider transition-all text-left ${
                      isActive
                        ? 'bg-accent text-black font-bold shadow-[0_0_15px_rgba(255,85,0,0.3)]'
                        : 'text-ink/80 hover:bg-white/[0.05] hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] opacity-60 font-mono">0{idx + 1}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Telemetry Card */}
          <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.02] shadow-sm">
            <div className="text-[10px] font-bold text-accent tracking-widest uppercase mb-1">
              [ LEVELING FORMULA ]
            </div>
            <div className="text-[11px] text-ink/60 font-chart leading-tight">
              XP_req = 100 · L^1.5<br />
              NEXT: {xpNeeded} XP<br />
              PROGRESS: {xpPercent}%
            </div>
          </div>
        </aside>

        {/* --- MAIN VIEW CONTENT --- */}
        <main
          className={`flex-1 min-w-0 p-3 sm:p-6 lg:p-8 pb-28 md:pb-8 ${
            density === 'compact' ? 'space-y-4' : 'space-y-6'
          }`}
        >
          {/* ================= [HERMES_MAP: VIEW_01_FEED] ================= */}
          {/* ================= VIEW 1: FEED ================= */}
          {currentView === 'feed' && (
            <div className="max-w-4xl lg:max-w-5xl mx-auto space-y-6">
              <div className="border border-white/15 bg-paper/60 p-5 sm:p-6 rounded-2xl shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="text-xs text-accent font-bold tracking-widest uppercase">
                      / 01 → FEED // АКТИВНОСТЬ
                    </span>
                    <h2 className="font-bit text-2xl sm:text-3xl text-ink mt-1">
                      Добро пожаловать, {user.fullName || user.username}
                    </h2>
                    <p className="text-xs sm:text-sm text-ink/60 mt-1">
                      Оперативные события, академические анонсы и публикации кампуса
                    </p>
                  </div>
                  <div className="p-3 sm:p-4 border border-white/10 bg-white/[0.02] text-right shrink-0 rounded-xl">
                    <span className="text-xs text-ink/60 uppercase tracking-wider font-bold">УРОВЕНЬ ОПЕРАТОРА</span>
                    <div className="text-2xl sm:text-3xl font-bit text-accent mt-0.5">{user.level} LVL</div>
                    <span className="text-[10px] sm:text-xs text-ink/60 font-mono">{user.xp} ОБЩИЙ XP</span>
                  </div>
                </div>
              </div>

              {/* Create Post Composer */}
              <form
                onSubmit={handleCreatePost}
                className="border border-white/15 bg-paper p-4 sm:p-6 rounded-2xl shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs sm:text-sm font-bold text-ink tracking-wider">
                    НОВАЯ ПУБЛИКАЦИЯ В СЕТЬ
                  </span>
                  <span className="text-[10px] text-accent tracking-widest font-bold">[ READY ]</span>
                </div>
                <textarea
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder="Поделитесь новостью, проектом или задачей..."
                  rows={3}
                  className="w-full bg-paper border border-white/15 p-3.5 text-sm sm:text-base text-ink placeholder-ink/40 focus:outline-none focus:border-accent rounded-xl transition-colors"
                />

                {newPostMedia && (
                  <div className="relative mt-2.5 border border-white/20 max-h-56 overflow-hidden rounded-xl">
                    <img src={newPostMedia} alt="Preview" className="w-full h-auto object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewPostMedia(null)}
                      className="absolute top-2 right-2 bg-black/80 text-white p-1.5 text-xs border border-white/30 rounded-lg hover:bg-red-500/80 transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                )}

                <div className="mt-3.5 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-ink/60 hover:text-ink cursor-pointer border border-white/15 px-3.5 py-2 bg-white/[0.02] rounded-xl hover:border-accent transition-all">
                    <Camera className="h-4 w-4 text-accent" />
                    <span className="font-semibold">ФОТО / МЕДИА</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileToDataUrl(file, setNewPostMedia);
                      }}
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={newPostLoading || (!newPostText.trim() && !newPostMedia)}
                    className="bg-accent text-black font-bold text-xs sm:text-sm px-6 py-2.5 uppercase tracking-wider hover:bg-white disabled:opacity-50 transition-all rounded-xl shadow-md"
                  >
                    {newPostLoading ? 'ПУБЛИКАЦИЯ...' : 'ОПУБЛИКОВАТЬ →'}
                  </button>
                </div>
              </form>

              {/* Feed List */}
              <div className="space-y-4 sm:space-y-5">
                {posts.length === 0 ? (
                  <div className="border border-white/10 p-8 text-center text-ink/40 text-sm rounded-2xl">
                    [ ЛЕНТА ПУСТА. СТАНЬТЕ ПЕРВЫМ, КТО ОПУБЛИКУЕТ НОВОСТЬ ]
                  </div>
                ) : (
                  posts.map((post) => {
                    const isLiked = post.likes?.includes(user.id);
                    const isCommentsOpen = !!openComments[post.id];
                    return (
                      <article
                        key={post.id}
                        className="border border-white/15 bg-paper/70 p-5 sm:p-6 hover:border-white/30 transition-all rounded-2xl shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-3.5">
                          <div
                            onClick={() => post.authorId && openUserProfile(post.authorId)}
                            className="flex items-center gap-3 cursor-pointer group"
                          >
                            <UserAvatar
                              avatarUrl={post.authorAvatarUrl}
                              avatarColor={post.authorAvatarColor}
                              name={post.authorName}
                              size="md"
                            />
                            <div>
                              <div className="text-sm sm:text-base font-bold text-ink group-hover:text-accent group-hover:underline transition-colors">
                                {post.authorName}
                              </div>
                              <div className="text-[10px] sm:text-xs text-ink/60 tracking-wider">
                                {new Date(post.createdAt).toLocaleString('ru-RU')}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold tracking-widest text-ink/60 border border-white/10 px-2.5 py-1 rounded-lg">
                            ID#{post.id}
                          </span>
                        </div>

                        <p className="text-sm sm:text-base text-ink whitespace-pre-wrap leading-relaxed">
                          {post.text}
                        </p>

                        {post.mediaUrl && (
                          <div className="mt-3.5 border border-white/10 overflow-hidden rounded-xl">
                            <img
                              src={post.mediaUrl}
                              alt="Post media"
                              className="w-full max-h-96 object-contain bg-black/40"
                            />
                          </div>
                        )}

                        <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center gap-6 text-xs sm:text-sm text-ink/60">
                          <button
                            onClick={() => handleLikePost(post.id)}
                            className={`flex items-center gap-1.5 transition-colors ${
                              isLiked ? 'text-accent font-bold' : 'hover:text-ink'
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${isLiked ? 'fill-accent text-accent' : ''}`} />
                            <span>{post.likes?.length || 0}</span>
                          </button>

                          <button
                            onClick={() =>
                              setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                            }
                            className="flex items-center gap-1.5 hover:text-ink transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.comments?.length || 0} КОММЕНТАРИЕВ</span>
                          </button>
                        </div>

                        {isCommentsOpen && (
                          <div className="mt-3.5 pt-3.5 border-t border-white/10 space-y-3">
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {post.comments?.map((c) => (
                                <div
                                  key={c.id}
                                  className="p-3 bg-paper/90 border border-white/10 text-xs sm:text-sm rounded-xl flex items-start gap-2.5"
                                >
                                  <div
                                    onClick={() => c.authorId && openUserProfile(c.authorId)}
                                    className="cursor-pointer hover:scale-105 transition-transform shrink-0"
                                  >
                                    <UserAvatar
                                      name={c.authorName}
                                      size="xs"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between text-ink/60 mb-1">
                                      <span
                                        onClick={() => c.authorId && openUserProfile(c.authorId)}
                                        className="font-bold text-ink hover:text-accent cursor-pointer transition-colors"
                                      >
                                        {c.authorName}
                                      </span>
                                      <span className="text-[10px]">
                                        {new Date(c.createdAt).toLocaleTimeString('ru-RU')}
                                      </span>
                                    </div>
                                    <div className="text-ink/80">{c.text}</div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={commentInputs[post.id] || ''}
                                onChange={(e) =>
                                  setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddComment(post.id);
                                }}
                                placeholder="Оставить комментарий..."
                                className="flex-1 bg-paper border border-white/15 px-3.5 py-2 text-xs sm:text-sm text-ink placeholder-ink/40 focus:outline-none focus:border-accent rounded-xl transition-colors"
                              />
                              <button
                                onClick={() => handleAddComment(post.id)}
                                className="bg-accent text-black font-bold text-xs sm:text-sm px-4 py-2 hover:bg-white uppercase tracking-wider rounded-xl transition-colors shadow"
                              >
                                ОТВЕТ
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================= [HERMES_MAP: VIEW_02_CHATS] ================= */}
          {/* ================= VIEW 2: CHATS ================= */}
          {currentView === 'chats' && (
            <div className="max-w-5xl lg:max-w-6xl mx-auto h-[calc(100dvh-135px)] md:h-[calc(100vh-140px)] max-h-[860px] flex flex-col md:flex-row border border-white/15 bg-paper/80 overflow-hidden relative rounded-2xl shadow-xl">
              {/* Left Chat List (hidden on mobile if activeChatId is set) */}
              <div
                className={`w-full md:w-80 lg:w-96 border-r border-white/15 flex flex-col shrink-0 bg-paper ${
                  activeChatId ? 'hidden md:flex' : 'flex'
                }`}
              >
                <div className="p-4 border-b border-white/15 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold tracking-widest text-ink uppercase">
                    / 02 → КАНАЛЫ СВЯЗИ
                  </span>
                  <span className="text-xs text-accent font-bold">[ {chats.length} ]</span>
                </div>

                {/* SEARCH IN CHATS */}
                <div className="p-3 border-b border-white/10 bg-paper-soft">
                  <div className="flex items-center gap-2 border border-white/15 bg-paper px-3 py-2 rounded-xl focus-within:border-accent transition-colors">
                    <Search className="h-4 w-4 text-ink/40 shrink-0" />
                    <input
                      type="text"
                      placeholder="ПОИСК ЧАТОВ И КОНТАКТОВ..."
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      className="bg-transparent text-xs sm:text-sm text-ink placeholder:text-ink/40 focus:outline-none w-full"
                    />
                    {chatSearch && (
                      <button
                        onClick={() => setChatSearch('')}
                        className="text-ink/40 hover:text-ink text-xs p-0.5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                  {chats
                    .filter((c) => {
                      if (!chatSearch.trim()) return true;
                      const q = chatSearch.toLowerCase();
                      const matchName = c.name?.toLowerCase().includes(q);
                      const matchMsg = c.lastMessage?.text?.toLowerCase().includes(q);
                      const matchSender = c.lastMessage?.senderName?.toLowerCase().includes(q);
                      return matchName || matchMsg || matchSender;
                    })
                    .sort((a, b) => {
                      const aPin = pinnedChats.includes(a.id) ? 1 : 0;
                      const bPin = pinnedChats.includes(b.id) ? 1 : 0;
                      return bPin - aPin;
                    })
                    .map((c) => {
                      const isActive = c.id === activeChatId;
                      const isPinned = pinnedChats.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => setActiveChatId(c.id)}
                          className={`p-3 cursor-pointer transition-all flex items-center justify-between group rounded-xl gap-2.5 ${
                            isActive
                              ? 'bg-accent/15 border-l-4 border-accent text-ink shadow-sm'
                              : 'hover:bg-white/[0.04] text-ink/80'
                          }`}
                        >
                          <UserAvatar
                            avatarUrl={c.otherUser?.avatarUrl}
                            avatarColor={c.otherUser?.avatarColor}
                            name={c.name}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              {isPinned && <Pin className="h-3 w-3 text-accent shrink-0 fill-accent" />}
                              <span className="text-xs sm:text-sm font-bold tracking-wider truncate">{c.name}</span>
                            </div>
                            <div className="text-[11px] sm:text-xs text-ink/50 truncate mt-1">
                              {c.lastMessage?.text || '[ Нет сообщений ]'}
                            </div>
                          </div>

                          {/* Pin and Hide Chat buttons */}
                          <div className="flex items-center gap-1 ml-2 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={(e) => handlePinChat(c.id, e)}
                              title={isPinned ? 'Открепить' : 'Закрепить вверху'}
                              className="p-1.5 hover:text-accent transition-colors rounded-lg hover:bg-white/5"
                            >
                              <Pin className={`h-3.5 w-3.5 ${isPinned ? 'fill-accent text-accent' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => handleHideChat(c.id, e)}
                              title="Скрыть/удалить чат"
                              className="p-1.5 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {chatSearch.trim() && chatUserSearchResults.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                      <div className="text-[10px] font-mono text-accent uppercase font-bold px-2 py-1 flex items-center justify-between">
                        <span>НАЙДЕННЫЕ ПОЛЬЗОВАТЕЛИ</span>
                        <span>({chatUserSearchResults.length})</span>
                      </div>
                      {chatUserSearchResults.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => handleStartDirectChatWithUser(u)}
                          className="p-2.5 rounded-xl hover:bg-white/10 cursor-pointer flex items-center justify-between transition-all group/user"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <UserAvatar
                              avatarUrl={u.avatarUrl}
                              avatarColor={u.avatarColor}
                              name={u.fullName || u.username}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-ink truncate">{u.fullName || u.username}</div>
                              <div className="text-[10px] text-ink/50 truncate">
                                @{u.username} · УР. {u.level}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openUserProfile(u.id);
                              }}
                              className="p-1.5 hover:text-accent rounded-lg text-ink/50 hover:bg-white/5 transition-colors"
                              title="Открыть профиль"
                            >
                              <UserIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartDirectChatWithUser(u);
                              }}
                              className="p-1.5 hover:text-accent rounded-lg text-ink/50 hover:bg-white/5 transition-colors"
                              title="Написать сообщение"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {chatSearch.trim() &&
                    chats.filter((c) => {
                      const q = chatSearch.toLowerCase();
                      return (
                        c.name?.toLowerCase().includes(q) ||
                        c.lastMessage?.text?.toLowerCase().includes(q) ||
                        c.lastMessage?.senderName?.toLowerCase().includes(q)
                      );
                    }).length === 0 &&
                    chatUserSearchResults.length === 0 && (
                      <div className="p-4 text-center text-xs text-ink/40 font-mono">
                        {chatUserSearchLoading ? '[ ПОИСК ОПЕРАТОРОВ... ]' : '[ ПОЛЬЗОВАТЕЛИ И ЧАТЫ НЕ НАЙДЕНЫ ]'}
                      </div>
                    )}
                </div>
              </div>

              {/* Right Message Window (hidden on mobile if no activeChatId) */}
              <div
                className={`flex-1 flex flex-col h-full bg-paper/95 ${
                  !activeChatId ? 'hidden md:flex' : 'flex'
                }`}
              >
                {/* Chat Top bar with mobile BACK button & in-chat search */}
                <div className="p-3.5 border-b border-white/15 flex items-center justify-between bg-paper">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* MOBILE BACK TO CHATS LIST BUTTON */}
                    <button
                      onClick={() => setActiveChatId(null)}
                      className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 border border-white/20 text-accent font-bold text-xs mr-1 shrink-0 rounded-xl hover:bg-accent/10 transition-colors"
                      title="Назад к списку чатов"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>ЧАТЫ</span>
                    </button>

                    <span className="w-2 h-2 rounded-full bg-accent animate-ping shrink-0" />
                    <span className="text-xs sm:text-sm font-bold tracking-wider text-ink truncate max-w-[180px] sm:max-w-xs">
                      {chats.find((c) => c.id === activeChatId)?.name || 'ВЫБЕРИТЕ ЧАТ'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {activeChatId && (
                      <button
                        onClick={() => {
                          setShowInChatSearch(!showInChatSearch);
                          if (showInChatSearch) setInChatSearch('');
                        }}
                        title="Поиск по сообщениям чата"
                        className={`p-2 border border-white/15 text-xs transition-all rounded-xl flex items-center gap-1.5 ${
                          showInChatSearch ? 'bg-accent text-black border-accent font-bold shadow' : 'text-ink/60 hover:text-ink hover:border-white/30'
                        }`}
                      >
                        <Search className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline text-xs font-bold">ПОИСК</span>
                      </button>
                    )}
                    <span className="hidden sm:inline text-[10px] text-ink/50 font-mono tracking-widest">
                      SYNC: 3S
                    </span>
                  </div>
                </div>

                {/* In-chat search bar */}
                {activeChatId && showInChatSearch && (
                  <div className="p-2.5 border-b border-white/10 bg-paper-soft flex items-center gap-2">
                    <Search className="h-4 w-4 text-accent shrink-0" />
                    <input
                      type="text"
                      placeholder="Поиск сообщений в текущей переписке..."
                      value={inChatSearch}
                      onChange={(e) => setInChatSearch(e.target.value)}
                      className="bg-transparent text-xs sm:text-sm text-ink placeholder:text-ink/40 focus:outline-none flex-1"
                      autoFocus
                    />
                    {inChatSearch && (
                      <button
                        onClick={() => setInChatSearch('')}
                        className="text-xs font-bold text-accent hover:underline uppercase px-2 py-0.5 rounded-lg"
                      >
                        СБРОС
                      </button>
                    )}
                  </div>
                )}

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  {!activeChatId ? (
                    <div className="h-full flex items-center justify-center text-ink/40 text-xs sm:text-sm">
                      [ ВЫБЕРИТЕ КАНАЛ СВЯЗИ ДЛЯ НАЧАЛА ДИАЛОГА ]
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-ink/40 text-xs sm:text-sm">
                      [ СООБЩЕНИЙ В ЭТОМ КАНАЛЕ ПОКА НЕТ ]
                    </div>
                  ) : (
                    messages
                      .filter((m) => {
                        if (!inChatSearch.trim()) return true;
                        return (m.text || '').toLowerCase().includes(inChatSearch.toLowerCase());
                      })
                      .map((m) => {
                        const isMe = (m.userId ?? m.senderId) === user?.id;
                        const isDirectChat = chats.find((c) => c.id === activeChatId)?.type === 'direct';
                        const canDelete = isMe || user?.role === 'admin' || user?.role === 'teacher' || isDirectChat;
                        const author = m.authorName || m.senderName || 'Пользователь';
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-2 mb-1 px-1.5">
                              {!isMe && (
                                <UserAvatar
                                  avatarUrl={m.authorAvatarUrl}
                                  avatarColor={m.authorAvatarColor}
                                  name={author}
                                  size="xs"
                                />
                              )}
                              <span className="text-[10px] sm:text-xs text-ink/50 font-mono">
                                {author} · {new Date(m.createdAt).toLocaleTimeString('ru-RU')}
                              </span>
                              <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setForwardModalMsg(m)}
                                  title="Переслать сообщение"
                                  className="p-1 hover:text-accent transition-colors text-ink/50 rounded"
                                >
                                  <CornerUpRight className="h-3 w-3" />
                                </button>
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteMessage(m.id)}
                                    title="Удалить сообщение"
                                    className="p-1 hover:text-red-400 transition-colors text-ink/50 rounded"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div
                              className={`max-w-[85%] sm:max-w-[75%] p-3.5 text-xs sm:text-sm leading-relaxed relative shadow-md ${
                                isMe
                                  ? 'bg-accent text-black font-medium rounded-2xl rounded-br-sm'
                                  : 'bg-white/10 text-ink border border-white/10 rounded-2xl rounded-bl-sm'
                              }`}
                            >
                              {m.forwardedFrom && (
                                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-accent font-mono mb-1.5 pb-1 border-b border-current/20">
                                  <CornerUpRight className="h-3 w-3 shrink-0" />
                                  <span>ПЕРЕСЛАНО ОТ: {m.forwardedFrom}</span>
                                </div>
                              )}
                              {m.text}
                              {m.mediaUrl && (
                                <img
                                  src={m.mediaUrl}
                                  alt="Attachment"
                                  className="mt-2.5 max-w-full max-h-64 object-contain rounded-xl overflow-hidden"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Box */}
                {activeChatId && (
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 sm:p-3.5 border-t border-white/15 bg-paper flex items-center gap-2.5 shrink-0"
                  >
                    <label className="p-2.5 border border-white/15 text-ink/60 hover:text-accent hover:border-accent transition-all cursor-pointer rounded-xl">
                      <Paperclip className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileToDataUrl(file, setMsgMedia);
                        }}
                      />
                    </label>

                    <input
                      type="text"
                      value={msgInput}
                      onChange={(e) => setMsgInput(e.target.value)}
                      placeholder="Наберите сообщение в терминал..."
                      className="flex-1 bg-paper border border-white/15 px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-ink placeholder-ink/40 focus:outline-none focus:border-accent rounded-xl transition-colors"
                    />

                    <button
                      type="submit"
                      className="bg-accent text-black p-2.5 sm:p-3 font-bold hover:bg-white transition-all rounded-xl shadow-md"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ================= FORWARD MESSAGE MODAL ================= */}
          {forwardModalMsg && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="border border-white/20 bg-paper p-6 max-w-md w-full space-y-4 shadow-2xl rounded-3xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold tracking-widest text-accent uppercase flex items-center gap-1.5">
                    <CornerUpRight className="h-4 w-4" /> [ ПЕРЕСЛАТЬ СООБЩЕНИЕ ]
                  </span>
                  <button
                    onClick={() => {
                      setForwardModalMsg(null);
                      setForwardSearch('');
                    }}
                    className="text-ink/60 hover:text-ink text-sm p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3.5 border border-white/10 bg-paper-soft border-l-2 border-l-accent text-xs rounded-xl">
                  <div className="text-[10px] text-accent font-bold mb-1">
                    {forwardModalMsg.authorName || forwardModalMsg.senderName || 'Пользователь'}:
                  </div>
                  <div className="text-ink/80 italic line-clamp-3">
                    {forwardModalMsg.text || (forwardModalMsg.mediaUrl ? '[Вложенный медиафайл]' : '[Пустое сообщение]')}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-ink/60 uppercase tracking-wider block">
                    ВЫБЕРИТЕ КАНАЛ СВЯЗИ ДЛЯ ОТПРАВКИ:
                  </label>
                  <div className="flex items-center gap-2 border border-white/15 bg-paper px-3 py-2 rounded-xl focus-within:border-accent transition-colors">
                    <Search className="h-3.5 w-3.5 text-ink/40 shrink-0" />
                    <input
                      type="text"
                      placeholder="Поиск по диалогам..."
                      value={forwardSearch}
                      onChange={(e) => setForwardSearch(e.target.value)}
                      className="bg-transparent text-xs sm:text-sm text-ink placeholder:text-ink/40 focus:outline-none w-full"
                    />
                    {forwardSearch && (
                      <button onClick={() => setForwardSearch('')} className="text-ink/40 hover:text-ink">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-white/10 border border-white/10 mt-2 rounded-xl">
                    {chats
                      .filter((c) => !forwardSearch || c.name.toLowerCase().includes(forwardSearch.toLowerCase()))
                      .map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleForwardMessage(c.id)}
                          className="p-3 hover:bg-accent/10 hover:border-l-2 hover:border-l-accent cursor-pointer flex items-center justify-between group transition-colors"
                        >
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-ink group-hover:text-accent">{c.name}</div>
                            <div className="text-[10px] text-ink/40">
                              {c.type === 'direct' ? 'Личный диалог' : 'Группа колледжа'}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-accent opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            ОТПРАВИТЬ <CornerUpRight className="h-3 w-3" />
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= [HERMES_MAP: VIEW_03_ASSIGNMENTS] ================= */}
          {/* ================= VIEW 3: ASSIGNMENTS / MISSIONS ================= */}
          {currentView === 'assignments' && (
            <div className="max-w-4xl lg:max-w-5xl mx-auto space-y-6">
              {selectedDetailAssign ? (
                /* ================= FULL ASSIGNMENT DETAIL VIEW ================= */
                <div className="space-y-6">
                  {/* Top Bar with Prominent Back Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4">
                    <button
                      onClick={() => setSelectedDetailAssign(null)}
                      className="self-start inline-flex items-center gap-2 border border-accent/40 bg-accent/15 hover:bg-accent hover:text-black text-accent px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all rounded-xl shadow-sm"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>← НАЗАД К СПИСКУ ЗАДАНИЙ</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] sm:text-xs font-mono text-ink/50 uppercase tracking-widest">
                        ID МИССИИ #{selectedDetailAssign.id}
                      </span>
                      {(user?.role === 'admin' || user?.role === 'teacher') && (
                        <button
                          onClick={() => handleDeleteAssignment(selectedDetailAssign.id)}
                          className="text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/15 text-xs font-bold px-3.5 py-2 uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-xl"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>УДАЛИТЬ ЗАДАНИЕ</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Assignment Header Card */}
                  <div className="border border-white/15 bg-paper/70 p-6 sm:p-7 space-y-4 rounded-2xl shadow-sm">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[10px] sm:text-xs text-accent font-bold tracking-widest uppercase">
                        / 03 → УЧЕБНОЕ ЗАДАНИЕ #{selectedDetailAssign.id}
                      </span>
                      {selectedDetailAssign.type === 'test' ? (
                        <span className="border border-blue-500/40 bg-blue-500/10 text-blue-400 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg">
                          [ ИНТЕРАКТИВНЫЙ ТЕСТ {selectedDetailAssign.questions?.length ? `(${selectedDetailAssign.questions.length} вопр.)` : ''} ]
                        </span>
                      ) : selectedDetailAssign.type === 'ar' ? (
                        <span className="border border-accent/40 bg-accent/10 text-accent text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg">
                          [ AR POINT // ГЕОКВЕСТ ]
                        </span>
                      ) : (
                        <span className="border border-white/20 bg-white/5 text-ink/70 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg">
                          [ ТЕКСТ / ПРАКТИЧЕСКАЯ РАБОТА ]
                        </span>
                      )}
                      {selectedDetailAssign.groupName && (
                        <span className={`text-[10px] sm:text-xs font-mono px-2.5 py-1 rounded-lg border ${
                          selectedDetailAssign.groupName === 'Все группы'
                            ? 'border-accent/50 bg-accent/15 text-accent font-bold'
                            : 'border-white/10 text-ink/60'
                        }`}>
                          {selectedDetailAssign.groupName === 'Все группы' ? '★ ВСЕ ГРУППЫ (ОБЩЕЕ)' : `Группа: ${selectedDetailAssign.groupName}`}
                        </span>
                      )}
                    </div>

                    <h1 className="font-bit text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight">
                      {selectedDetailAssign.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm font-bold pt-3 border-t border-white/10">
                      <span className="text-accent">
                        +{selectedDetailAssign.xpReward ?? selectedDetailAssign.rewardXp ?? 10} XP
                      </span>
                      {(selectedDetailAssign.coinsReward ?? selectedDetailAssign.rewardCoins ?? 0) > 0 && (
                        <span className="text-amber-500 flex items-center gap-1">
                          <Coins className="h-4 w-4" />+
                          {selectedDetailAssign.coinsReward ?? selectedDetailAssign.rewardCoins} COINS
                        </span>
                      )}
                      {selectedDetailAssign.dueDate && (
                        <span className="text-ink/60 font-mono text-[11px] sm:text-xs">
                          СРОК СДАЧИ: {new Date(selectedDetailAssign.dueDate).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Full Description Box - showing complete text with no clipping */}
                  <div className="border border-white/15 bg-paper p-6 sm:p-7 space-y-3 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <span className="text-xs sm:text-sm font-bold text-accent uppercase tracking-wider">
                        [ ПОЛНОЕ ОПИСАНИЕ И УСЛОВИЯ ЗАДАНИЯ ]
                      </span>
                      <span className="text-[10px] sm:text-xs font-mono text-ink/40">
                        {selectedDetailAssign.description?.length || 0} СИМВ.
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm sm:text-base text-ink/90 leading-relaxed font-sans select-text">
                      {selectedDetailAssign.description || '[ Описание или текст задания не указаны ]'}
                    </div>
                  </div>

                  {/* If AR point details */}
                  {selectedDetailAssign.arLocation && (
                    <div className="p-4 sm:p-5 border border-accent/40 bg-accent/10 space-y-2 rounded-2xl shadow-sm">
                      <div className="font-bold text-accent text-xs uppercase tracking-wider">
                        [ ТОЧКА НАЗНАЧЕНИЯ НА КАРТЕ КАМПУСА ]
                      </div>
                      <div className="text-base font-bold text-ink">{selectedDetailAssign.arLocation.label}</div>
                      <div className="text-xs sm:text-sm font-mono text-ink/70">
                        Координаты: {selectedDetailAssign.arLocation.lat}, {selectedDetailAssign.arLocation.lng} (радиус срабатывания 60м)
                      </div>
                    </div>
                  )}

                  {/* Student Submission Status / Inline Answer Form */}
                  {user?.role === 'student' && (
                    <div className="border border-white/15 bg-paper p-6 sm:p-7 space-y-4 rounded-2xl shadow-sm">
                      {selectedDetailAssign.mySubmission ? (
                        <div className="space-y-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                            <span className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wider">
                              СТАТУС ВАШЕГО РЕШЕНИЯ
                            </span>
                            {selectedDetailAssign.mySubmission.status === 'graded' ? (
                              <span className="text-emerald-500 text-xs sm:text-sm font-bold border border-emerald-500/40 px-3 py-1 bg-emerald-500/10 rounded-lg">
                                ✓ ОЦЕНЕНО: {selectedDetailAssign.mySubmission.grade || 'СДАНО'}
                              </span>
                            ) : (
                              <span className="text-amber-500 text-xs sm:text-sm font-bold border border-amber-500/40 px-3 py-1 bg-amber-500/10 animate-pulse rounded-lg">
                                ⏳ НА ПРОВЕРКЕ ПРЕПОДАВАТЕЛЕМ
                              </span>
                            )}
                          </div>

                          {selectedDetailAssign.mySubmission.text && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] sm:text-xs font-bold text-ink/50 uppercase tracking-wider">
                                ВАШ ОТПРАВЛЕННЫЙ ОТВЕТ:
                              </span>
                              <div className="p-4 bg-paper-soft border border-white/10 text-xs sm:text-sm text-ink/90 whitespace-pre-wrap font-mono rounded-xl">
                                {selectedDetailAssign.mySubmission.text}
                              </div>
                            </div>
                          )}

                          {selectedDetailAssign.mySubmission.status === 'pending' && (
                            <p className="text-xs sm:text-sm text-amber-500/90 italic">
                              Ответ передан на проверку. Преподаватель ознакомится с работой и выставит итоговый балл и награду.
                            </p>
                          )}
                        </div>
                      ) : selectedDetailAssign.type === 'test' ? (
                        <div className="space-y-3.5">
                          <h3 className="font-bit text-xl sm:text-2xl text-ink">Контрольное тестирование</h3>
                          <p className="text-xs sm:text-sm text-ink/60">
                            Тест состоит из {selectedDetailAssign.questions?.length || 0} вопросов с автоматической проверкой.
                          </p>
                          <button
                            onClick={() => {
                              setTestModalAssign(selectedDetailAssign);
                              setTestAnswers({});
                            }}
                            className="bg-accent text-black font-bold text-xs sm:text-sm px-6 py-3 uppercase tracking-wider hover:bg-white transition-all rounded-xl shadow-md"
                          >
                            ПРОЙТИ ТЕСТ ПРЯМО СЕЙЧАС →
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleInlineSubmitDetail} className="space-y-3.5">
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <span className="text-xs sm:text-sm font-bold text-accent uppercase tracking-wider">
                              [ СДАТЬ ВЫПОЛНЕННОЕ РЕШЕНИЕ ]
                            </span>
                            <span className="text-[10px] sm:text-xs text-ink/50 font-mono">
                              ПИСЬМЕННЫЙ ОТВЕТ ИЛИ ССЫЛКА НА РЕПОЗИТОРИЙ
                            </span>
                          </div>
                          <textarea
                            value={detailAnswerText}
                            onChange={(e) => setDetailAnswerText(e.target.value)}
                            placeholder="Напишите текст ответа, решение задач или прикрепите ссылку на GitHub / Google Doc..."
                            rows={5}
                            required
                            className="w-full bg-paper-soft border border-white/15 p-4 text-xs sm:text-sm text-ink placeholder-ink/40 focus:outline-none focus:border-accent rounded-xl transition-colors"
                          />
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={submittingDetail}
                              className="bg-accent text-black font-bold text-xs sm:text-sm px-6 py-3 uppercase tracking-wider hover:bg-white transition-all disabled:opacity-50 rounded-xl shadow-md"
                            >
                              {submittingDetail ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ РЕШЕНИЕ НА ПРОВЕРКУ →'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Teacher / Admin Review Submissions Section */}
                  {(user?.role === 'teacher' || user?.role === 'admin') && (
                    <div className="border border-white/15 bg-paper p-6 sm:p-7 space-y-4 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-accent uppercase tracking-wider">
                            [ ОТВЕТЫ СТУДЕНТОВ ПО ЗАДАНИЮ ]
                          </span>
                          <span className="text-xs sm:text-sm text-ink/60 block mt-0.5">
                            Проверка решений и выставление оценок
                          </span>
                        </div>
                        <button
                          onClick={() => loadDetailSubmissions(selectedDetailAssign.id)}
                          className="text-xs font-bold text-ink/60 hover:text-accent uppercase tracking-wider px-3 py-1.5 border border-white/15 rounded-xl transition-colors"
                        >
                          ↻ Обновить список
                        </button>
                      </div>

                      {loadingDetailSubmissions ? (
                        <div className="text-xs sm:text-sm text-ink/50 py-4 text-center">Загрузка ответов студентов...</div>
                      ) : detailSubmissions.length === 0 ? (
                        <div className="text-xs sm:text-sm text-ink/40 py-6 text-center border border-white/10 p-4 rounded-xl">
                          [ Студенты ещё не сдали решений по этому заданию ]
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {detailSubmissions.map((sub) => (
                            <div key={sub.id} className="border border-white/15 bg-paper-soft p-4 space-y-3 rounded-xl shadow-sm">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                                <div className="font-bold text-ink text-xs sm:text-sm flex items-center gap-2">
                                  <span className="text-accent">●</span>
                                  <span>{sub.studentName || `Студент #${sub.studentId}`}</span>
                                </div>
                                {sub.status === 'graded' ? (
                                  <span className="text-emerald-500 text-xs font-bold border border-emerald-500/30 px-2.5 py-0.5 bg-emerald-500/10 rounded-lg">
                                    ✓ ОЦЕНЕНО: {sub.grade} (+{sub.xpAwarded} XP, +{sub.coinsAwarded} COINS)
                                  </span>
                                ) : (
                                  <span className="text-amber-500 text-xs font-bold border border-amber-500/30 px-2.5 py-0.5 bg-amber-500/10 animate-pulse rounded-lg">
                                    ⏳ ЖДЁТ ПРОВЕРКИ
                                  </span>
                                )}
                              </div>

                              {sub.text && (
                                <div className="text-xs sm:text-sm text-ink/90 whitespace-pre-wrap p-3 bg-paper border border-white/10 font-mono rounded-lg">
                                  {sub.text}
                                </div>
                              )}

                              {/* Inline grading for teacher/admin */}
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const gradeInput = (document.getElementById(`grade_${sub.id}`) as HTMLInputElement)?.value;
                                  const xpInput = Number((document.getElementById(`xp_${sub.id}`) as HTMLInputElement)?.value);
                                  const coinsInput = Number((document.getElementById(`coins_${sub.id}`) as HTMLInputElement)?.value);
                                  handleGradeSubmission(sub.id, gradeInput, xpInput, coinsInput);
                                }}
                                className="flex flex-wrap items-center gap-3 pt-2 text-xs"
                              >
                                <div className="flex items-center gap-1.5">
                                  <label className="text-[10px] text-ink/60 uppercase font-bold">Оценка:</label>
                                  <input
                                    type="text"
                                    placeholder="5"
                                    defaultValue={sub.grade || '5'}
                                    id={`grade_${sub.id}`}
                                    className="w-20 bg-paper border border-white/20 px-2.5 py-1 text-xs text-ink focus:outline-none focus:border-accent rounded-lg"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <label className="text-[10px] text-ink/60 uppercase font-bold">XP:</label>
                                  <input
                                    type="number"
                                    defaultValue={sub.xpAwarded ?? selectedDetailAssign.xpReward ?? 10}
                                    id={`xp_${sub.id}`}
                                    className="w-20 bg-paper border border-white/20 px-2.5 py-1 text-xs text-ink focus:outline-none focus:border-accent rounded-lg"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <label className="text-[10px] text-ink/60 uppercase font-bold">Coins:</label>
                                  <input
                                    type="number"
                                    defaultValue={sub.coinsAwarded ?? selectedDetailAssign.coinsReward ?? 0}
                                    id={`coins_${sub.id}`}
                                    className="w-20 bg-paper border border-white/20 px-2.5 py-1 text-xs text-ink focus:outline-none focus:border-accent rounded-lg"
                                  />
                                </div>
                                <button
                                  type="submit"
                                  className="bg-accent text-black font-bold text-xs px-3.5 py-1.5 uppercase tracking-wider hover:bg-white transition-colors ml-auto rounded-lg shadow-sm"
                                >
                                  {sub.status === 'graded' ? 'ОБНОВИТЬ ОЦЕНКУ' : 'ВЫСТАВИТЬ ОЦЕНКУ →'}
                                </button>
                              </form>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom Back Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => setSelectedDetailAssign(null)}
                      className="w-full py-3.5 border border-white/20 text-ink/70 hover:text-ink hover:border-accent text-xs sm:text-sm font-bold uppercase tracking-wider transition-all text-center rounded-xl hover:bg-white/[0.03]"
                    >
                      ← ВЕРНУТЬСЯ К СПИСКУ ВСЕХ ЗАДАНИЙ
                    </button>
                  </div>
                </div>
              ) : (
                /* ================= ASSIGNMENT LIST REGISTRY ================= */
                <div className="space-y-6">
                  <div className="border border-white/15 bg-paper/60 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl shadow-sm">
                    <div>
                      <span className="text-xs text-accent font-bold tracking-widest uppercase">
                        / 03 → MISSIONS // УЧЕБНЫЕ ЗАДАНИЯ
                      </span>
                      <h2 className="font-bit text-3xl sm:text-4xl text-ink mt-1">Реестр заданий</h2>
                      <p className="text-xs sm:text-sm text-ink/60 mt-1">
                        Практические миссии, контрольные тесты и полевые AR-точки с начислением опыта XP и монет
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {(user?.role === 'teacher' || user?.role === 'admin') && (
                        <button
                          onClick={() => setCreateAssignModalOpen(true)}
                          className="bg-accent text-black font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 uppercase tracking-wider hover:bg-white transition-all flex items-center justify-center gap-1.5 shadow-md rounded-xl"
                        >
                          <Plus className="h-4 w-4" />
                          <span>СОЗДАТЬ ЗАДАНИЕ</span>
                        </button>
                      )}

                      <div className="flex border border-white/20 p-1 rounded-xl bg-paper-soft gap-1">
                        {(['all', 'active', 'completed'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setAssignFilter(tab)}
                            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all rounded-lg ${
                              assignFilter === tab
                                ? 'bg-accent text-black shadow'
                                : 'text-ink/60 hover:text-ink'
                            }`}
                          >
                            {tab === 'all' ? 'Все' : tab === 'active' ? 'Активные' : 'Сданные'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:gap-5">
                    {assignments
                  .filter((item) => {
                    const isGraded = item.mySubmission?.status === 'graded';
                    if (assignFilter === 'active') return !isGraded;
                    if (assignFilter === 'completed') return isGraded;
                    return true;
                  })
                  .length === 0 ? (
                  <div className="border border-white/10 p-8 text-center text-ink/40 text-sm rounded-2xl">
                    [ АКТИВНЫХ ЗАДАНИЙ В СИСТЕМЕ НЕ ОБНАРУЖЕНО ]
                  </div>
                ) : (
                  assignments
                    .filter((item) => {
                      const isGraded = item.mySubmission?.status === 'graded';
                      if (assignFilter === 'active') return !isGraded;
                      if (assignFilter === 'completed') return isGraded;
                      return true;
                    })
                    .map((item) => {
                      const isSubmitted = !!item.mySubmission;
                      const isGraded = item.mySubmission?.status === 'graded';
                      const isPending = isSubmitted && item.mySubmission?.status === 'pending';
                      const canDeleteAssign = user?.role === 'admin' || user?.role === 'teacher';
                      const xp = item.xpReward ?? item.rewardXp ?? 10;
                      const coins = item.coinsReward ?? item.rewardCoins ?? 0;

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedDetailAssign(item)}
                          className="border border-white/15 bg-paper p-5 sm:p-6 hover:border-accent transition-all flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 cursor-pointer group rounded-2xl shadow-sm"
                        >
                          <div className="space-y-2.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bit text-xl sm:text-2xl text-ink group-hover:text-accent transition-colors">
                                {item.title}
                              </span>
                              {item.type === 'test' ? (
                                <span className="border border-blue-500/40 bg-blue-500/10 text-blue-400 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-lg">
                                  [ ТЕСТ {item.questions?.length ? `(${item.questions.length} вопр.)` : ''} ]
                                </span>
                              ) : item.type === 'ar' ? (
                                <span className="border border-accent/40 bg-accent/10 text-accent text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-lg">
                                  [ AR POINT ]
                                </span>
                              ) : (
                                <span className="border border-white/20 bg-white/5 text-ink/70 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-lg">
                                  [ ТЕКСТ / ПРАКТИКА ]
                                </span>
                              )}
                              {item.groupName && (
                                <span className={`text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded-lg border ${
                                  item.groupName === 'Все группы'
                                    ? 'border-accent/50 bg-accent/15 text-accent font-bold'
                                    : 'border-white/10 text-ink/50'
                                }`}>
                                  {item.groupName === 'Все группы' ? '★ ВСЕ ГРУППЫ' : item.groupName}
                                </span>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm text-ink/70 leading-relaxed max-w-2xl line-clamp-3 whitespace-pre-line">
                              {item.description}
                            </p>

                            <div className="text-xs text-accent font-bold group-hover:underline inline-flex items-center gap-1">
                              [ ЧИТАТЬ ПОЛНОСТЬЮ И СДАТЬ → ]
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-bold pt-1">
                              <span className="text-accent">+{xp} XP</span>
                              {coins > 0 && (
                                <span className="text-amber-500 flex items-center gap-1">
                                  <Coins className="h-3.5 w-3.5" />+{coins} COINS
                                </span>
                              )}
                              {item.dueDate && (
                                <span className="text-ink/40 text-[10px] sm:text-xs font-mono">
                                  СРОК: {new Date(item.dueDate).toLocaleDateString('ru-RU')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-3 pt-1">
                            {user?.role === 'student' ? (
                              item.type === 'test' ? (
                                isGraded ? (
                                  <div className="text-emerald-500 text-xs sm:text-sm font-bold border border-emerald-500/40 px-3 py-1.5 bg-emerald-500/10 rounded-xl">
                                    ✓ ТЕСТ ПРОЙДЕН ({item.mySubmission?.grade || item.mySubmission?.autoScore + '%'})
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTestModalAssign(item);
                                      setTestAnswers({});
                                    }}
                                    className="bg-accent text-black font-bold text-xs sm:text-sm px-4 py-2 uppercase tracking-wider hover:bg-white transition-all rounded-xl shadow"
                                  >
                                    ПРОЙТИ ТЕСТ →
                                  </button>
                                )
                              ) : isGraded ? (
                                <div className="text-emerald-500 text-xs sm:text-sm font-bold border border-emerald-500/40 px-3 py-1.5 bg-emerald-500/10 rounded-xl">
                                  ✓ ОЦЕНЕНО ({item.mySubmission?.grade || '5'})
                                </div>
                              ) : isPending ? (
                                <div className="text-amber-500 text-xs sm:text-sm font-bold border border-amber-500/40 px-3 py-1.5 bg-amber-500/10 animate-pulse rounded-xl">
                                  ⏳ НА ПРОВЕРКЕ
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSubmitModalAssignId(item.id);
                                  }}
                                  className="bg-accent text-black font-bold text-xs sm:text-sm px-4 py-2 uppercase tracking-wider hover:bg-white transition-all rounded-xl shadow"
                                >
                                  СДАТЬ РЕШЕНИЕ →
                                </button>
                              )
                            ) : (
                              <div className="text-xs text-ink/50 font-mono">
                                [ ID #{item.id} ]
                              </div>
                            )}

                            {canDeleteAssign && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAssignment(item.id);
                                }}
                                title="Удалить задание"
                                className="p-2 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all rounded-xl"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

              {/* Text Submission Modal */}
              {submitModalAssignId && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="border border-white/20 bg-paper p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl rounded-3xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-xs sm:text-sm font-bold tracking-widest text-accent uppercase">
                        [ СДАЧА РАБОТЫ НА ПРОВЕРКУ ]
                      </span>
                      <button
                        onClick={() => setSubmitModalAssignId(null)}
                        className="text-ink/60 hover:text-ink text-sm p-1"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleSubmitAssignment} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-ink/60 mb-1.5">
                          КОММЕНТАРИЙ К РАБОТЕ
                        </label>
                        <textarea
                          value={submitComment}
                          onChange={(e) => setSubmitComment(e.target.value)}
                          placeholder="Опишите выполненное решение или вставьте ссылку на GitHub/документ..."
                          rows={4}
                          required
                          className="w-full bg-paper border border-white/15 p-3.5 text-xs sm:text-sm text-ink placeholder-ink/40 focus:outline-none focus:border-accent rounded-xl transition-colors"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setSubmitModalAssignId(null)}
                          className="px-4 py-2.5 border border-white/20 text-xs font-bold text-ink/60 hover:text-ink rounded-xl transition-colors"
                        >
                          ОТМЕНА
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-accent text-black font-bold text-xs uppercase tracking-wider hover:bg-white rounded-xl transition-all shadow"
                        >
                          ОТПРАВИТЬ →
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Interactive Test Modal for Students */}
              {testModalAssign && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                  <div className="border border-white/20 bg-paper p-6 sm:p-7 max-w-xl w-full my-8 space-y-5 shadow-2xl rounded-3xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[10px] text-accent font-bold tracking-widest uppercase">
                          [ ТЕСТИРОВАНИЕ // {testModalAssign.title} ]
                        </span>
                        <h3 className="font-bit text-2xl text-ink mt-0.5">Контрольный тест</h3>
                      </div>
                      <button
                        onClick={() => setTestModalAssign(null)}
                        className="text-ink/60 hover:text-ink text-sm p-1"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleSubmitTest} className="space-y-5">
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        {(testModalAssign.questions || []).map((q, qIdx) => (
                          <div key={q.id || qIdx} className="border border-white/15 p-4 sm:p-5 bg-paper-soft space-y-3 rounded-2xl shadow-sm">
                            <div className="text-xs sm:text-sm font-bold text-ink flex items-start gap-2">
                              <span className="text-accent font-mono">0{qIdx + 1}.</span>
                              <span>{q.text}</span>
                            </div>

                            <div className="space-y-2 pl-4">
                              {(q.options || []).map((opt) => {
                                const selected = (testAnswers[q.id || qIdx + 1] || []).includes(opt.id || 0);
                                return (
                                  <label
                                    key={opt.id}
                                    className={`flex items-center gap-2.5 p-2.5 border cursor-pointer transition-all rounded-xl ${
                                      selected
                                        ? 'border-accent bg-accent/15 text-ink shadow-sm'
                                        : 'border-white/10 hover:border-white/30 text-ink/80'
                                    }`}
                                  >
                                    <input
                                      type={q.allowMultiple ? 'checkbox' : 'radio'}
                                      name={`question_${q.id || qIdx + 1}`}
                                      checked={selected}
                                      onChange={(e) => {
                                        const qKey = q.id || qIdx + 1;
                                        const optId = opt.id || 0;
                                        if (q.allowMultiple) {
                                          setTestAnswers((prev) => {
                                            const current = prev[qKey] || [];
                                            const next = e.target.checked
                                              ? [...current, optId]
                                              : current.filter((id) => id !== optId);
                                            return { ...prev, [qKey]: next };
                                          });
                                        } else {
                                          setTestAnswers((prev) => ({
                                            ...prev,
                                            [qKey]: [optId],
                                          }));
                                        }
                                      }}
                                      className="accent-accent"
                                    />
                                    <span className="text-xs sm:text-sm">{opt.text}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => setTestModalAssign(null)}
                          className="px-4 py-2.5 border border-white/20 text-xs font-bold text-ink/60 hover:text-ink uppercase rounded-xl transition-colors"
                        >
                          ОТМЕНА
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-accent text-black font-bold text-xs uppercase tracking-wider hover:bg-white transition-all rounded-xl shadow-md"
                        >
                          ЗАВЕРШИТЬ И ОТПРАВИТЬ →
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Create Assignment Modal for Teachers / Admins */}
              {createAssignModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                  <div className="border border-white/20 bg-paper p-6 sm:p-7 max-w-2xl w-full my-8 space-y-5 shadow-2xl rounded-3xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[10px] text-accent font-bold tracking-widest uppercase">
                          / ТЕРМИНАЛ ПРЕПОДАВАТЕЛЯ // СОЗДАНИЕ ЗАДАНИЯ
                        </span>
                        <h3 className="font-bit text-2xl sm:text-3xl text-ink mt-0.5">Новое учебное задание</h3>
                      </div>
                      <button
                        onClick={() => setCreateAssignModalOpen(false)}
                        className="text-ink/60 hover:text-ink text-sm p-1"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleCreateAssignment} className="space-y-4">
                      {/* Type selection */}
                      <div>
                        <label className="text-[10px] font-bold text-ink/60 uppercase tracking-wider block mb-1.5">
                          ТИП МИССИИ / ФОРМАТ:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'text', label: '01. ТЕКСТОВОЕ', desc: 'Письменный ответ / код' },
                            { id: 'test', label: '02. ТЕСТ', desc: 'Вопросы и варианты' },
                            { id: 'ar', label: '03. AR-ГЕОКВЕСТ', desc: 'Координаты на карте' },
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setNewAssignType(t.id as any)}
                              className={`p-2.5 text-left border transition-all rounded-xl ${
                                newAssignType === t.id
                                  ? 'border-accent bg-accent/15 text-ink shadow-sm'
                                  : 'border-white/10 bg-paper-soft text-ink/60 hover:text-ink'
                              }`}
                            >
                              <div className="text-xs font-bold font-mono">{t.label}</div>
                              <div className="text-[10px] opacity-60 mt-0.5">{t.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Title */}
                      <div>
                        <label className="text-[10px] font-bold text-ink/60 uppercase tracking-wider block mb-1">
                          НАЗВАНИЕ ЗАДАНИЯ *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Например: Лабораторная работа №3 — Стек протоколов TCP/IP"
                          value={newAssignTitle}
                          onChange={(e) => setNewAssignTitle(e.target.value)}
                          className="w-full bg-paper-soft border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink focus:outline-none focus:border-accent rounded-xl transition-colors"
                        />
                      </div>

                      {/* Target Group */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-ink/60 uppercase tracking-wider block mb-1">
                            НАЗНАЧИТЬ ГРУППЕ:
                          </label>
                          <select
                            value={newAssignGroupId}
                            onChange={(e) =>
                              setNewAssignGroupId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                            }
                            className="w-full bg-paper-soft border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink focus:outline-none focus:border-accent rounded-xl transition-colors"
                          >
                            <option value="all">ВСЕ ГРУППЫ (ОБЩЕЕ)</option>
                            {groups.map((g) => (
                              <option key={g.id} value={g.id}>
                                Группа {g.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-ink/60 uppercase tracking-wider block mb-1">
                            СРОК СДАЧИ (ДЕДЛАЙН):
                          </label>
                          <input
                            type="date"
                            value={newAssignDueDate}
                            onChange={(e) => setNewAssignDueDate(e.target.value)}
                            className="w-full bg-paper-soft border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink focus:outline-none focus:border-accent rounded-xl transition-colors"
                          />
                        </div>
                      </div>

                      {/* Rewards */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-ink/60 uppercase tracking-wider block mb-1">
                            НАГРАДА XP (ОПЫТ):
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={1000}
                            value={newAssignXp}
                            onChange={(e) => setNewAssignXp(Number(e.target.value))}
                            className="w-full bg-paper-soft border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink focus:outline-none focus:border-accent rounded-xl transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ink/60 uppercase tracking-wider block mb-1">
                            НАГРАДА МОНЕТЫ:
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={500}
                            value={newAssignCoins}
                            onChange={(e) => setNewAssignCoins(Number(e.target.value))}
                            className="w-full bg-paper-soft border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink focus:outline-none focus:border-accent rounded-xl transition-colors"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-[10px] font-bold text-ink/60 uppercase tracking-wider block mb-1">
                          ОПИСАНИЕ И УСЛОВИЯ ЗАДАНИЯ:
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Подробно опишите требования к работе, критерии оценки или вопросы..."
                          value={newAssignDesc}
                          onChange={(e) => setNewAssignDesc(e.target.value)}
                          className="w-full bg-paper-soft border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink focus:outline-none focus:border-accent resize-none rounded-xl transition-colors"
                        />
                      </div>

                      {/* If type === 'test': Dynamic Questions Builder */}
                      {newAssignType === 'test' && (
                        <div className="border border-white/15 bg-paper-soft p-4 sm:p-5 space-y-4 rounded-2xl shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-accent tracking-widest uppercase">
                              [ ВОПРОСЫ ТЕСТА ({newAssignQuestions.length}) ]
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setNewAssignQuestions((prev) => [
                                  ...prev,
                                  {
                                    text: '',
                                    options: [
                                      { text: '', correct: true },
                                      { text: '', correct: false },
                                    ],
                                  },
                                ])
                              }
                              className="text-[10px] sm:text-xs font-bold bg-accent/20 border border-accent/40 text-accent px-3 py-1.5 hover:bg-accent hover:text-black transition-all rounded-lg"
                            >
                              + ДОБАВИТЬ ВОПРОС
                            </button>
                          </div>

                          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                            {newAssignQuestions.map((q, qIdx) => (
                              <div key={qIdx} className="border border-white/10 p-3.5 sm:p-4 bg-paper space-y-2.5 rounded-xl shadow-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono text-ink/60 font-bold">
                                    ВОПРОС #{qIdx + 1}
                                  </span>
                                  {newAssignQuestions.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setNewAssignQuestions((prev) => prev.filter((_, i) => i !== qIdx))
                                      }
                                      className="text-red-400 hover:text-red-300 text-xs p-1"
                                    >
                                      ✕ Удалить
                                    </button>
                                  )}
                                </div>

                                <input
                                  type="text"
                                  placeholder={`Текст вопроса #${qIdx + 1}...`}
                                  value={q.text}
                                  onChange={(e) => {
                                    const updated = [...newAssignQuestions];
                                    updated[qIdx].text = e.target.value;
                                    setNewAssignQuestions(updated);
                                  }}
                                  className="w-full bg-paper-soft border border-white/15 px-3 py-2 text-xs sm:text-sm text-ink focus:outline-none focus:border-accent rounded-lg transition-colors"
                                />

                                {/* Options */}
                                <div className="space-y-1.5 pl-2">
                                  <div className="text-[9px] text-ink/40 uppercase tracking-widest">
                                    Варианты ответов (отметьте правильные):
                                  </div>
                                  {q.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={opt.correct}
                                        onChange={(e) => {
                                          const updated = [...newAssignQuestions];
                                          updated[qIdx].options[oIdx].correct = e.target.checked;
                                          setNewAssignQuestions(updated);
                                        }}
                                        className="accent-accent cursor-pointer"
                                      />
                                      <input
                                        type="text"
                                        placeholder={`Вариант ${oIdx + 1}...`}
                                        value={opt.text}
                                        onChange={(e) => {
                                          const updated = [...newAssignQuestions];
                                          updated[qIdx].options[oIdx].text = e.target.value;
                                          setNewAssignQuestions(updated);
                                        }}
                                        className="flex-1 bg-paper-soft border border-white/10 px-2.5 py-1 text-xs text-ink focus:outline-none focus:border-accent rounded-lg"
                                      />
                                      {q.options.length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = [...newAssignQuestions];
                                            updated[qIdx].options = updated[qIdx].options.filter((_, i) => i !== oIdx);
                                            setNewAssignQuestions(updated);
                                          }}
                                          className="text-ink/40 hover:text-red-400 text-xs px-1"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  {q.options.length < 5 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...newAssignQuestions];
                                        updated[qIdx].options.push({ text: '', correct: false });
                                        setNewAssignQuestions(updated);
                                      }}
                                      className="text-[10px] text-ink/50 hover:text-accent font-bold mt-1"
                                    >
                                      + Добавить вариант ответа
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* If type === 'ar': AR Coordinates */}
                      {newAssignType === 'ar' && (
                        <div className="border border-white/15 bg-paper-soft p-4 sm:p-5 space-y-3 rounded-2xl shadow-sm">
                          <span className="text-xs font-bold text-accent tracking-widest uppercase block">
                            [ ПАРАМЕТРЫ AR-ТОЧКИ И ГЕОЛОКАЦИИ ]
                          </span>
                          <div>
                            <label className="text-[10px] font-bold text-ink/60 uppercase tracking-wider block mb-1">
                              НАЗВАНИЕ ЛОКАЦИИ / ОРИЕНТИР:
                            </label>
                            <input
                              type="text"
                              placeholder="Главный корпус, 3 этаж, аудитория 312"
                              value={newAssignArLabel}
                              onChange={(e) => setNewAssignArLabel(e.target.value)}
                              className="w-full bg-paper border border-white/15 px-3 py-2 text-xs sm:text-sm text-ink focus:outline-none focus:border-accent rounded-xl"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-ink/60 uppercase tracking-wider block mb-1">
                                ШИРОТА (LAT):
                              </label>
                              <input
                                type="text"
                                value={newAssignArLat}
                                onChange={(e) => setNewAssignArLat(e.target.value)}
                                className="w-full bg-paper border border-white/15 px-3 py-2 text-xs font-mono text-ink focus:outline-none focus:border-accent rounded-xl"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-ink/60 uppercase tracking-wider block mb-1">
                                ДОЛГОТА (LNG):
                              </label>
                              <input
                                type="text"
                                value={newAssignArLng}
                                onChange={(e) => setNewAssignArLng(e.target.value)}
                                className="w-full bg-paper border border-white/15 px-3 py-2 text-xs font-mono text-ink focus:outline-none focus:border-accent rounded-xl"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex justify-end gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => setCreateAssignModalOpen(false)}
                          className="border border-white/20 text-ink/60 hover:text-ink text-xs font-bold px-4 py-2.5 uppercase tracking-wider rounded-xl transition-colors"
                        >
                          ОТМЕНА
                        </button>
                        <button
                          type="submit"
                          className="bg-accent text-black font-bold text-xs uppercase tracking-wider hover:bg-white transition-all px-5 py-2.5 rounded-xl shadow-md"
                        >
                          ОПУБЛИКОВАТЬ ЗАДАНИЕ →
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= [HERMES_MAP: VIEW_04_MAP] ================= */}
          {/* ================= VIEW 4: MAP & RADAR ================= */}
          {currentView === 'map' && (
            <div className="max-w-4xl lg:max-w-5xl mx-auto space-y-6">
              <div className="border border-white/15 bg-paper/60 p-5 sm:p-6 rounded-2xl shadow-sm">
                <span className="text-xs text-accent font-bold tracking-widest uppercase">
                  / 04 → RADAR // КАМПУС И ТОЧКИ ИНТЕРЕСА
                </span>
                <h2 className="font-bit text-3xl sm:text-4xl text-ink mt-1">Интерактивная карта AR</h2>
                <p className="text-xs sm:text-sm text-ink/60 mt-1">
                  Геолокационные маркеры и координаты объектов кампуса
                </p>
              </div>

              <div className="border border-white/20 bg-paper p-6 sm:p-8 relative overflow-hidden min-h-[440px] flex flex-col justify-between rounded-3xl shadow-xl">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <div className="w-[300px] h-[300px] rounded-full border border-accent animate-ping" />
                  <div className="w-[500px] h-[500px] rounded-full border border-current absolute" />
                  <div className="w-[200px] h-[200px] rounded-full border border-current absolute" />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-ink/60 font-bold tracking-widest">
                    [ RADAR SCANNING: 55.751244, 37.618423 ]
                  </span>
                  <span className="text-xs sm:text-sm text-accent font-bold">● ACTIVE LOCATOR</span>
                </div>

                <div className="relative z-10 my-8 grid sm:grid-cols-2 gap-4">
                  {arPoints.length === 0 ? (
                    <div className="col-span-2 text-center text-ink/40 text-xs sm:text-sm py-8">
                      [ AR ТОЧКИ ЗАГРУЖАЮТСЯ ИЗ РЕЕСТРА ]
                    </div>
                  ) : (
                    arPoints.map((pt, i) => (
                      <div
                        key={i}
                        className="p-4 sm:p-5 border border-white/15 bg-paper hover:border-accent transition-all flex items-start gap-3.5 rounded-2xl shadow-sm"
                      >
                        <MapPin className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm sm:text-base font-bold text-ink">{pt.title}</div>
                          <div className="text-xs text-ink/60 mt-0.5">{pt.label}</div>
                          <div className="text-[10px] sm:text-xs text-ink/40 font-chart mt-1">
                            LAT: {pt.lat} | LNG: {pt.lng}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs sm:text-sm text-ink/60">
                  <span>GPS ТОЧНОСТЬ: 1.2M</span>
                  <button
                    onClick={() => alert('Координаты синхронизированы с GPS устройством')}
                    className="border border-accent px-3.5 py-1.5 text-accent font-bold hover:bg-accent hover:text-black transition-all rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>МОЕ ПОЛОЖЕНИЕ</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= [HERMES_MAP: VIEW_05_LEADERBOARD] ================= */}
          {/* ================= VIEW 5: LEADERBOARD ================= */}
          {currentView === 'leaderboard' && (
            <div className="max-w-4xl lg:max-w-5xl mx-auto space-y-6">
              <div className="border border-white/15 bg-paper/60 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl shadow-sm">
                <div>
                  <span className="text-xs text-accent font-bold tracking-widest uppercase">
                    / 05 → LEADERBOARD // РЕЙТИНГ
                  </span>
                  <h2 className="font-bit text-3xl sm:text-4xl text-ink mt-1">Таблица лидеров</h2>
                  <p className="text-xs sm:text-sm text-ink/60 mt-1">
                    Студенты с наивысшими достижениями и максимальным вкладом
                  </p>
                </div>

                <div className="flex border border-white/20 p-1 rounded-xl bg-paper-soft gap-1">
                  <button
                    onClick={() => setLeaderboardTab('level')}
                    className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all rounded-lg ${
                      leaderboardTab === 'level'
                        ? 'bg-accent text-black shadow'
                        : 'text-ink/60 hover:text-ink'
                    }`}
                  >
                    ПО УРОВНЮ
                  </button>
                  <button
                    onClick={() => setLeaderboardTab('assignments')}
                    className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all rounded-lg ${
                      leaderboardTab === 'assignments'
                        ? 'bg-accent text-black shadow'
                        : 'text-ink/60 hover:text-ink'
                    }`}
                  >
                    ПО МИССИЯМ
                  </button>
                </div>
              </div>

              <div className="border border-white/15 bg-paper divide-y divide-white/10 rounded-2xl overflow-hidden shadow-sm">
                {(leaderboardTab === 'level' ? leaderboard.byLevel : leaderboard.byAssignments).map(
                  (entry, idx) => {
                    const isTop3 = idx < 3;
                    return (
                      <div
                        key={entry.id}
                        className={`p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.04] transition-colors ${
                          entry.id === user.id ? 'bg-accent/10 border-l-4 border-accent' : ''
                        }`}
                      >
                        <div
                          onClick={() => openUserProfile(entry.id)}
                          className="flex items-center gap-4 cursor-pointer group"
                        >
                          <span
                            className={`font-bit text-xl sm:text-2xl w-8 text-center ${
                              isTop3 ? 'text-accent font-bold' : 'text-ink/40'
                            }`}
                          >
                            #{entry.rank}
                          </span>
                          <UserAvatar
                            avatarUrl={entry.avatarUrl}
                            avatarColor={entry.avatarColor}
                            name={entry.fullName}
                            size="md"
                          />
                          <div>
                            <div className="text-sm sm:text-base font-bold text-ink group-hover:text-accent group-hover:underline transition-colors">
                              {entry.fullName}
                            </div>
                            {entry.id === user.id && (
                              <span className="text-[10px] sm:text-xs text-accent font-bold rounded px-1.5 py-0.5 bg-accent/20 inline-block mt-0.5">
                                [ ВАШ ПРОФИЛЬ ]
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          {leaderboardTab === 'level' ? (
                            <div>
                              <div className="text-sm sm:text-base font-bold text-accent">{entry.level} LVL</div>
                              <div className="text-[10px] sm:text-xs text-ink/40 font-mono">{entry.xp} XP</div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm sm:text-base font-bold text-emerald-500">
                                {entry.completedCount} СДАНО
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* ================= [HERMES_MAP: VIEW_06_PET] ================= */}
          {/* ================= VIEW: PET (CYBER-COMPANION & MODULAR PLATFORMS) ================= */}
          {currentView === 'pet' && (
            <div className="max-w-5xl lg:max-w-6xl mx-auto space-y-6">
              {/* Platform Selection Deck (if no platform chosen or modal requested) */}
              {(!pet?.petType || showPlatformSelectModal) ? (
                <div className="border border-white/15 bg-paper/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <span className="text-xs font-mono font-bold tracking-widest text-accent uppercase">
                        / PROTOCOL 0x50 // ИНИЦИАЛИЗАЦИЯ БИОМЕХАНИЧЕСКОЙ ПЛАТФОРМЫ
                      </span>
                      <h2 className="font-bit text-3xl sm:text-4xl text-ink mt-1">
                        Выберите Кибер-Платформу
                      </h2>
                      <p className="text-xs sm:text-sm text-ink/60 mt-1 max-w-2xl">
                        Каждый дрон обладает уникальной кинематикой. Все модули (голова, броня корпуса, конечности) 
                        полностью взаимозаменяемы — вы сможете свободно комбинировать лапы, крылья и сенсоры между сетами!
                      </p>
                    </div>

                    {pet?.petType && showPlatformSelectModal && (
                      <button
                        onClick={() => setShowPlatformSelectModal(false)}
                        className="px-4 py-2 rounded-xl border border-white/20 text-ink/60 hover:text-ink hover:border-accent text-xs font-bold uppercase transition-colors shrink-0"
                      >
                        Отмена / Назад
                      </button>
                    )}
                  </div>

                  {/* 4 Interactive Platform Cards */}
                  <div className="grid md:grid-cols-2 gap-5">
                    {(['cat', 'owl', 'snake', 'spider'] as PetType[]).map((type) => {
                      const plat = PET_PLATFORMS[type];
                      const isCurrent = pet?.petType === type;
                      return (
                        <div
                          key={type}
                          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                            isCurrent
                              ? 'border-accent bg-accent/10 shadow-lg shadow-accent/20'
                              : 'border-white/15 bg-paper/60 hover:border-accent/60 hover:bg-paper'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-mono font-bold tracking-wider text-accent uppercase">
                                {plat.codename}
                              </span>
                              <h3 className="font-bit text-2xl text-ink mt-0.5">{plat.name}</h3>
                              <p className="text-xs text-ink/70 mt-1">{plat.desc}</p>
                            </div>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent text-black shrink-0">
                                ТЕКУЩАЯ
                              </span>
                            )}
                          </div>

                          {/* Live Vector SVG Preview */}
                          <div className="py-2 bg-paper-soft/40 border border-white/10 rounded-xl">
                            <CyberPetAvatar
                              petTypeOverride={type}
                              products={products}
                              accent={accentColor}
                              size="normal"
                            />
                          </div>

                          {/* Feature Specifications */}
                          <div className="space-y-1.5 pt-2 border-t border-white/10">
                            <div className="text-[10px] font-mono text-ink/50 uppercase font-bold tracking-wider">
                              ХАРАКТЕРИСТИКИ ПЛАТФОРМЫ:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                              {plat.features.map((feat, i) => (
                                <div
                                  key={i}
                                  className="text-[10px] p-1.5 rounded-lg bg-white/5 border border-white/10 text-ink/80 text-center font-mono"
                                >
                                  {feat}
                                </div>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              const name = prompt(`Имя для платформы ${plat.name}:`, plat.defaultName) || plat.defaultName;
                              handleChoosePet(type, name);
                            }}
                            className="w-full py-2.5 rounded-xl bg-accent text-black hover:bg-white text-xs font-bold uppercase tracking-wider transition-all shadow"
                          >
                            {isCurrent ? 'АКТИВИРОВАТЬ ПОВТОРНО' : `ИНИЦИАЛИЗИРОВАТЬ ${plat.name.toUpperCase()}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  {/* Top Header Card */}
                  <div className="border border-white/15 bg-paper/60 p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-accent font-bold tracking-widest uppercase">
                          / 04 → CYBER-FAMILIAR //
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/20 text-accent font-bold">
                          {PET_PLATFORMS[pet.petType || 'cat']?.codename || 'CYBER-DRONE'}
                        </span>
                      </div>
                      <h2 className="font-bit text-3xl sm:text-4xl text-ink mt-1 flex items-center gap-3">
                        <span>{pet?.name || 'КИБЕР-СПУТНИК'}</span>
                        <button
                          onClick={() => {
                            const newName = prompt('Новое имя питомца:', pet?.name || '');
                            if (newName && newName.trim()) handleRenamePet(newName.trim());
                          }}
                          className="p-1.5 rounded-lg border border-white/15 text-ink/50 hover:text-accent hover:border-accent transition-colors"
                          title="Переименовать питомца"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </h2>
                      <p className="text-xs sm:text-sm text-ink/60 mt-1">
                        {PET_PLATFORMS[pet.petType || 'cat']?.desc ||
                          'Автономный дрон-компаньон. Модульная конструкция позволяет комбинировать детали любых сетов.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowPlatformSelectModal(true)}
                        className="p-3 sm:p-4 rounded-xl border border-white/15 bg-paper hover:border-accent hover:text-accent text-left transition-colors flex items-center gap-3 group"
                        title="Сменить базовую платформу"
                      >
                        <RefreshCw className="h-5 w-5 text-accent group-hover:rotate-180 transition-transform duration-500" />
                        <div>
                          <div className="text-[10px] font-bold text-ink/50 uppercase">ПЛАТФОРМА</div>
                          <div className="text-xs font-bold text-ink group-hover:text-accent">
                            СМЕНИТЬ БАЗУ →
                          </div>
                        </div>
                      </button>

                      <div className="p-3 sm:p-4 border border-accent/30 bg-accent/10 rounded-xl text-right shrink-0">
                        <span className="text-[10px] text-ink/60 uppercase font-bold">РАНГ СПУТНИКА</span>
                        <div className="font-bit text-2xl sm:text-3xl text-accent flex items-center justify-end gap-1">
                          <span>LVL {pet?.level || 1}</span>
                        </div>
                        <span className="text-[10px] font-mono text-ink/50">{pet?.xp || 0} Pet XP</span>
                      </div>
                    </div>
                  </div>

                  {/* Daily Streak Card */}
                  <DailyRewardsCard
                    status={dailyStatus}
                    onClaim={handleClaimDailyReward}
                    claiming={dailyClaiming}
                  />

                  {/* Main Pet Interaction Grid */}
                  <div className="grid lg:grid-cols-12 gap-6">
                    {/* Left: Avatar & Vitals */}
                    <div className="lg:col-span-5 border border-white/15 bg-paper p-6 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between">
                      <div className="relative">
                        <CyberPetAvatar
                          pet={pet}
                          products={products}
                          accent={accentColor}
                          isHappy={petIsHappy}
                          isEating={petIsEating}
                          onClick={handlePlayWithPet}
                          size="large"
                        />

                        {petPhrase && (
                          <div className="mt-3 p-3 rounded-xl border border-accent/40 bg-accent/10 text-center text-xs font-mono text-accent animate-in fade-in">
                            {petPhrase}
                          </div>
                        )}
                      </div>

                      {/* Vitals */}
                      <div className="space-y-3.5 pt-2 border-t border-white/10">
                        <div>
                          <div className="flex items-center justify-between text-xs font-bold mb-1">
                            <span className="flex items-center gap-1.5 text-ink">
                              <Activity className="h-3.5 w-3.5 text-amber-500" />
                              <span>СЫТОСТЬ</span>
                            </span>
                            <span className="font-mono text-accent">{pet?.hunger || 0}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-white/10">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all duration-500"
                              style={{ width: `${pet?.hunger || 0}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs font-bold mb-1">
                            <span className="flex items-center gap-1.5 text-ink">
                              <Heart className="h-3.5 w-3.5 text-rose-500" />
                              <span>НАСТРОЕНИЕ</span>
                            </span>
                            <span className="font-mono text-accent">{pet?.happiness || 0}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-white/10">
                            <div
                              className="h-full bg-rose-500 rounded-full transition-all duration-500"
                              style={{ width: `${pet?.happiness || 0}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs font-bold mb-1">
                            <span className="flex items-center gap-1.5 text-ink">
                              <Zap className="h-3.5 w-3.5 text-emerald-500" />
                              <span>ЭНЕРГИЯ ЯДРА</span>
                            </span>
                            <span className="font-mono text-accent">{pet?.energy || 0}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-white/10">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${pet?.energy || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handlePlayWithPet}
                        className="w-full py-3 rounded-xl border border-accent bg-accent/10 hover:bg-accent hover:text-black text-accent text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>ПОГЛАДИТЬ / СИНХРОНИЗАЦИЯ</span>
                      </button>
                    </div>

                    {/* Right: Feeding & Wardrobe */}
                    <div className="lg:col-span-7 space-y-6">
                      {/* Feeding Section */}
                      <div className="border border-white/15 bg-paper p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold tracking-wider text-ink uppercase">
                            РАЦИОН ПИТАНИЯ // КОРМЛЕНИЕ
                          </span>
                          <span className="text-xs text-amber-500 font-bold flex items-center gap-1">
                            <Coins className="h-3.5 w-3.5" /> {user.coins || 0}
                          </span>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-3">
                          <button
                            onClick={() => handleFeedPet('battery')}
                            className="p-3.5 rounded-xl border border-white/15 bg-paper/60 hover:border-emerald-500 text-left transition-all flex flex-col justify-between space-y-2 group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                <Zap className="h-4 w-4" />
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                                БЕСПЛАТНО
                              </span>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-ink group-hover:text-emerald-400">
                                Нано-Батарея
                              </div>
                              <div className="text-[10px] text-ink/50 mt-0.5 font-mono">
                                +25% Сытости · +15 XP
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => handleFeedPet('crystal')}
                            className="p-3.5 rounded-xl border border-white/15 bg-paper/60 hover:border-accent text-left transition-all flex flex-col justify-between space-y-2 group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                                <Sparkles className="h-4 w-4" />
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono">
                                10 ⟠
                              </span>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-ink group-hover:text-accent">
                                Энерго-Кристалл
                              </div>
                              <div className="text-[10px] text-ink/50 mt-0.5 font-mono">
                                +50% Сытости · +40 XP
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => handleFeedPet('pie')}
                            className="p-3.5 rounded-xl border border-white/15 bg-paper/60 hover:border-rose-500 text-left transition-all flex flex-col justify-between space-y-2 group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                                <Cpu className="h-4 w-4" />
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono">
                                25 ⟠
                              </span>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-ink group-hover:text-rose-400">
                                Квантовое Топливо
                              </div>
                              <div className="text-[10px] text-ink/50 mt-0.5 font-mono">
                                100% Сытость · +100 XP
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Wardrobe Section */}
                      <div className="border border-white/15 bg-paper p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold tracking-wider text-ink uppercase">
                              МОДУЛЬНЫЙ ГАРДЕРОБ
                            </span>
                            <p className="text-xs text-ink/50">
                              Комбинируйте детали любых сетов на вашей активной платформе
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setShopCategory('pet');
                              setCurrentView('shop');
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-accent/40 text-accent font-bold hover:bg-accent hover:text-black transition-colors shrink-0"
                          >
                            + МАГАЗИН МОДУЛЕЙ →
                          </button>
                        </div>

                        {/* Slot Filter Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          {[
                            { id: 'all', label: 'Все слоты' },
                            { id: 'head', label: 'Голова' },
                            { id: 'body', label: 'Корпус' },
                            { id: 'limbs', label: 'Конечности' },
                            { id: 'color', label: 'Неон' },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setPetSlotFilter(tab.id as any)}
                              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors shrink-0 ${
                                petSlotFilter === tab.id
                                  ? 'bg-accent text-black font-bold'
                                  : 'border border-white/10 text-ink/60 hover:text-ink'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Rarity Filter Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          <button
                            onClick={() => setPetRarityFilter('all')}
                            className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition-colors shrink-0 ${
                              petRarityFilter === 'all'
                                ? 'bg-white text-black font-bold'
                                : 'border border-white/10 text-ink/50 hover:text-ink'
                            }`}
                          >
                            Все редкости
                          </button>
                          {(['common', 'rare', 'epic', 'legendary'] as ItemRarity[]).map((r) => {
                            const rInfo = RARITY_INFO[r];
                            return (
                              <button
                                key={r}
                                onClick={() => setPetRarityFilter(r)}
                                className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition-colors shrink-0 ${
                                  petRarityFilter === r
                                    ? `${rInfo.bg} ${rInfo.text} border ${rInfo.border} font-bold`
                                    : 'border border-white/10 text-ink/50 hover:text-ink'
                                }`}
                              >
                                {rInfo.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Wardrobe Items Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1">
                          {(() => {
                            // Modular items from inventory
                            const inventoryCodes = pet?.inventory || [];
                            const modularItems = products
                              .filter(
                                (p) =>
                                  p.category === 'pet' &&
                                  (inventoryCodes.includes(`item_${p.id}`) ||
                                    (p.code && inventoryCodes.includes(p.code)))
                              )
                              .map((p) => ({
                                id: `item_${p.id}`,
                                code: p.code,
                                name: p.name,
                                slot: (p.slot || 'head') as 'head' | 'body' | 'limbs' | 'color',
                                rarity: (p.rarity || 'common') as ItemRarity,
                                petType: p.petType || 'cat',
                                setName: p.setName || 'СЕТ HERMES',
                              }));

                            // Neon style colors
                            const colorItems = (user.unlockedColors || ['#FF4D1C', '#FF5500']).map((hex) => ({
                              id: hex,
                              code: hex,
                              name: `Неон ${hex}`,
                              slot: 'color' as const,
                              rarity: 'rare' as ItemRarity,
                              petType: pet.petType || 'cat',
                              setName: 'НЕОНОВОЕ ЯДРО',
                            }));

                            const allItems = [...modularItems, ...colorItems];
                            const filtered = allItems.filter((i) => {
                              // Slot match (handle alias backwards compat)
                              let slotMatch = true;
                              if (petSlotFilter !== 'all') {
                                if (petSlotFilter === 'head') slotMatch = i.slot === 'head' || (i.slot as any) === 'hat';
                                else if (petSlotFilter === 'body') slotMatch = i.slot === 'body' || (i.slot as any) === 'outfit';
                                else if (petSlotFilter === 'limbs') slotMatch = i.slot === 'limbs' || (i.slot as any) === 'boots';
                                else slotMatch = i.slot === petSlotFilter;
                              }
                              // Rarity match
                              const rarityMatch =
                                petRarityFilter === 'all' || i.rarity === petRarityFilter;
                              return slotMatch && rarityMatch;
                            });

                            if (filtered.length === 0) {
                              return (
                                <div className="col-span-3 text-center py-8 text-xs text-ink/40 font-mono">
                                  [ В этой категории нет экипированных или открытых модулей ]
                                </div>
                              );
                            }

                            return filtered.map((item) => {
                              const isEquipped =
                                item.slot === 'color'
                                  ? pet?.equipped?.color === item.id
                                  : (pet?.equipped?.[item.slot] === item.id ||
                                      (item.code && pet?.equipped?.[item.slot] === item.code) ||
                                      (item.slot === 'head' && (pet?.equipped?.hat === item.id || (item.code && pet?.equipped?.hat === item.code))) ||
                                      (item.slot === 'body' && (pet?.equipped?.outfit === item.id || (item.code && pet?.equipped?.outfit === item.code))) ||
                                      (item.slot === 'limbs' && (pet?.equipped?.boots === item.id || (item.code && pet?.equipped?.boots === item.code))));

                              const rInfo = RARITY_INFO[item.rarity || 'common'];

                              return (
                                <div
                                  key={item.id}
                                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                                    isEquipped
                                      ? 'border-accent bg-accent/15 shadow-sm'
                                      : `${rInfo.border} bg-paper/50 hover:border-white/30`
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <span
                                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${rInfo.bg} ${rInfo.text}`}
                                      >
                                        {rInfo.label}
                                      </span>
                                      {isEquipped && (
                                        <span className="text-[9px] font-bold bg-accent text-black px-1.5 py-0.5 rounded">
                                          НАДЕТО
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 mb-1.5">
                                      <div className="p-1.5 rounded-lg bg-white/5 text-ink/70">
                                        {item.slot === 'head' ? (
                                          <Eye className="h-3.5 w-3.5" />
                                        ) : item.slot === 'body' ? (
                                          <Shield className="h-3.5 w-3.5" />
                                        ) : item.slot === 'limbs' ? (
                                          <Activity className="h-3.5 w-3.5" />
                                        ) : (
                                          <Palette className="h-3.5 w-3.5" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-ink truncate">
                                          {item.name}
                                        </div>
                                        <div className="text-[9px] font-mono text-ink/50 truncate">
                                          {item.setName}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleEquipPet(item.slot, isEquipped ? null : (item.code || item.id))}
                                    className={`mt-2.5 w-full py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                      isEquipped
                                        ? 'border border-red-500/40 text-red-400 hover:bg-red-500/10'
                                        : 'bg-white/10 hover:bg-accent hover:text-black text-ink'
                                    }`}
                                  >
                                    {isEquipped ? 'СНЯТЬ' : 'НАДЕТЬ'}
                                  </button>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================= [HERMES_MAP: VIEW_07_SHOP] ================= */}
          {/* ================= VIEW 6: SHOP (MERCH, STYLES, PET WARDROBE) ================= */}
          {currentView === 'shop' && (
            <div className="max-w-5xl lg:max-w-6xl mx-auto space-y-6">
              {/* Header */}
              <div className="border border-white/15 bg-paper/60 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl shadow-sm">
                <div>
                  <span className="text-xs text-accent font-bold tracking-widest uppercase">
                    / 06 → HERMES EXCHANGE // МАГАЗИН И СТИЛИ
                  </span>
                  <h2 className="font-bit text-3xl sm:text-4xl text-ink mt-1">Торговый терминал</h2>
                  <p className="text-xs sm:text-sm text-ink/60 mt-1">
                    Обменивайте накопленные монеты на мерч, уникальные стили интерфейса и экипировку питомца
                  </p>
                </div>

                <div className="p-3 sm:p-4 border border-amber-500/30 bg-amber-500/10 text-right rounded-xl shadow-sm">
                  <span className="text-[10px] sm:text-xs text-ink/60 uppercase tracking-wider font-bold">
                    ВАШ БАЛАНС
                  </span>
                  <div className="text-2xl sm:text-3xl font-bit text-amber-500 flex items-center justify-end gap-2 mt-0.5">
                    <Coins className="h-5 w-5" />
                    <span>{user.coins || 0}</span>
                  </div>
                </div>
              </div>

              {/* Shop Sub-Tabs */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <button
                  onClick={() => setShopCategory('merch')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                    shopCategory === 'merch'
                      ? 'bg-accent text-black font-bold shadow'
                      : 'border border-white/10 text-ink/60 hover:text-ink'
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>МЕРЧ И СНАРЯЖЕНИЕ</span>
                </button>

                <button
                  onClick={() => setShopCategory('styles')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                    shopCategory === 'styles'
                      ? 'bg-accent text-black font-bold shadow'
                      : 'border border-white/10 text-ink/60 hover:text-ink'
                  }`}
                >
                  <Palette className="h-4 w-4" />
                  <span>НЕОНОВЫЕ СТИЛИ</span>
                </button>

                <button
                  onClick={() => setShopCategory('pet')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                    shopCategory === 'pet'
                      ? 'bg-accent text-black font-bold shadow'
                      : 'border border-white/10 text-ink/60 hover:text-ink'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>ГАРДЕРОБ ПИТОМЦА</span>
                </button>
              </div>

              {shopSuccessMsg && (
                <div className="p-3.5 border border-emerald-500/50 bg-emerald-500/10 text-emerald-500 text-xs sm:text-sm font-bold rounded-xl animate-in fade-in">
                  {shopSuccessMsg}
                </div>
              )}

              {/* Modular Shop Filters for Pet Wardrobe */}
              {shopCategory === 'pet' && (
                <div className="space-y-3 bg-paper/50 border border-white/10 p-4 rounded-2xl">
                  {/* Row 1: Slots */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-[10px] font-mono text-ink/40 uppercase font-bold shrink-0 mr-1">
                      СЛОТ:
                    </span>
                    {[
                      { id: 'all', label: 'Все слоты' },
                      { id: 'head', label: 'Голова' },
                      { id: 'body', label: 'Корпус' },
                      { id: 'limbs', label: 'Конечности' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setShopPetSlotFilter(tab.id as any)}
                        className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors shrink-0 ${
                          shopPetSlotFilter === tab.id
                            ? 'bg-accent text-black font-bold'
                            : 'border border-white/10 text-ink/60 hover:text-ink'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Row 2: Platforms & Rarities */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      <span className="text-[10px] font-mono text-ink/40 uppercase font-bold shrink-0 mr-1">
                        БАЗА:
                      </span>
                      {[
                        { id: 'all', label: 'Все' },
                        { id: 'cat', label: 'Кот' },
                        { id: 'owl', label: 'Сова' },
                        { id: 'snake', label: 'Змейка' },
                        { id: 'spider', label: 'Паук' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setShopPetTypeFilter(tab.id as any)}
                          className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition-colors shrink-0 ${
                            shopPetTypeFilter === tab.id
                              ? 'bg-white text-black font-bold'
                              : 'border border-white/10 text-ink/50 hover:text-ink'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      <span className="text-[10px] font-mono text-ink/40 uppercase font-bold shrink-0 mr-1">
                        РЕДКОСТЬ:
                      </span>
                      <button
                        onClick={() => setShopPetRarityFilter('all')}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition-colors shrink-0 ${
                          shopPetRarityFilter === 'all'
                            ? 'bg-white text-black font-bold'
                            : 'border border-white/10 text-ink/50 hover:text-ink'
                        }`}
                      >
                        Все
                      </button>
                      {(['common', 'rare', 'epic', 'legendary'] as ItemRarity[]).map((r) => {
                        const rInfo = RARITY_INFO[r];
                        return (
                          <button
                            key={r}
                            onClick={() => setShopPetRarityFilter(r)}
                            className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition-colors shrink-0 ${
                              shopPetRarityFilter === r
                                ? `${rInfo.bg} ${rInfo.text} border ${rInfo.border} font-bold`
                                : 'border border-white/10 text-ink/50 hover:text-ink'
                            }`}
                          >
                            {rInfo.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Grid Content */}
              {(() => {
                const filteredProducts = products.filter((p) => {
                  if (shopCategory === 'styles') return p.category === 'style';
                  if (shopCategory === 'pet') {
                    if (p.category !== 'pet') return false;
                    // Slot filter
                    if (shopPetSlotFilter !== 'all') {
                      if (shopPetSlotFilter === 'head' && !(p.slot === 'head' || p.slot === 'hat')) return false;
                      if (shopPetSlotFilter === 'body' && !(p.slot === 'body' || p.slot === 'outfit')) return false;
                      if (shopPetSlotFilter === 'limbs' && !(p.slot === 'limbs' || p.slot === 'boots')) return false;
                    }
                    // Platform filter
                    if (shopPetTypeFilter !== 'all' && p.petType !== shopPetTypeFilter) return false;
                    // Rarity filter
                    if (shopPetRarityFilter !== 'all' && p.rarity !== shopPetRarityFilter) return false;
                    return true;
                  }
                  return p.category !== 'style' && p.category !== 'pet';
                });

                if (filteredProducts.length === 0) {
                  return (
                    <div className="border border-white/10 p-10 text-center text-ink/40 text-sm rounded-2xl font-mono">
                      [ В ЭТОЙ КАТЕГОРИИ ПОКА НЕТ ДОСТУПНЫХ ТОВАРОВ ]
                    </div>
                  );
                }

                return (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                    {filteredProducts.map((p) => {
                      const canAfford = (user.coins || 0) >= p.priceCoins;

                      // For Style products
                      if (p.category === 'style') {
                        const isUnlocked =
                          (user.unlockedColors || []).includes(p.colorHex || '') ||
                          p.colorHex?.toLowerCase() === '#ff5500' ||
                          p.colorHex?.toLowerCase() === '#ff4d1c';
                        const isActive = accentColor.toLowerCase() === (p.colorHex || '').toLowerCase();

                        return (
                          <div
                            key={p.id}
                            className={`border bg-paper p-5 flex flex-col justify-between transition-all rounded-2xl shadow-sm ${
                              isActive
                                ? 'border-accent shadow-lg shadow-accent/20'
                                : isUnlocked
                                ? 'border-white/20'
                                : 'border-white/15 hover:border-white/30'
                            }`}
                          >
                            <div>
                              {/* Color preview disk */}
                              <div className="w-full h-36 bg-paper-soft border border-white/10 mb-3.5 flex flex-col items-center justify-center rounded-xl relative overflow-hidden">
                                <div
                                  className="w-16 h-16 rounded-full shadow-2xl border-2 border-white/40 transition-transform hover:scale-110"
                                  style={{
                                    backgroundColor: p.colorHex || '#FF5500',
                                    boxShadow: `0 0 24px ${p.colorHex || '#FF5500'}`,
                                  }}
                                />
                                <span className="font-mono text-xs text-ink/60 mt-3 font-bold">
                                  {p.colorHex}
                                </span>
                              </div>

                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-sm sm:text-base text-ink">{p.name}</h3>
                                {isUnlocked && (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                    РАЗБЛОКИРОВАНО
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-ink/60 line-clamp-2">{p.description}</p>
                            </div>

                            <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between">
                              <span className="font-bit text-xl text-amber-500 flex items-center gap-1.5 font-bold">
                                <Coins className="h-4 w-4" />
                                {p.priceCoins}
                              </span>

                              {isUnlocked ? (
                                <button
                                  onClick={() => {
                                    if (p.colorHex) {
                                      setAccentColor(p.colorHex);
                                      showToast(`Стиль «${p.name}» активирован!`, 'success');
                                    }
                                  }}
                                  disabled={isActive}
                                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-xl ${
                                    isActive
                                      ? 'bg-emerald-500 text-black cursor-default font-bold'
                                      : 'bg-white/10 text-ink hover:bg-accent hover:text-black'
                                  }`}
                                >
                                  {isActive ? 'АКТИВЕН' : 'ПРИМЕНИТЬ'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleBuyProduct(p.id)}
                                  disabled={!canAfford}
                                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-xl ${
                                    canAfford
                                      ? 'bg-accent text-black hover:bg-white shadow'
                                      : 'border border-white/10 text-ink/30 cursor-not-allowed'
                                  }`}
                                >
                                  КУПИТЬ
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // For Modular Pet products
                      if (p.category === 'pet') {
                        const isOwned =
                          (pet?.inventory || []).includes(`item_${p.id}`) ||
                          (p.code && (pet?.inventory || []).includes(p.code));
                        const isEquipped =
                          (p.slot && pet?.equipped?.[p.slot] === `item_${p.id}`) ||
                          (p.code && p.slot && pet?.equipped?.[p.slot] === p.code) ||
                          (p.slot === 'head' &&
                            (pet?.equipped?.hat === `item_${p.id}` ||
                              (p.code && pet?.equipped?.hat === p.code))) ||
                          (p.slot === 'body' &&
                            (pet?.equipped?.outfit === `item_${p.id}` ||
                              (p.code && pet?.equipped?.outfit === p.code))) ||
                          (p.slot === 'limbs' &&
                            (pet?.equipped?.boots === `item_${p.id}` ||
                              (p.code && pet?.equipped?.boots === p.code)));

                        const rInfo = RARITY_INFO[p.rarity || 'common'];
                        const plat = p.petType ? PET_PLATFORMS[p.petType] : null;

                        return (
                          <div
                            key={p.id}
                            className={`border bg-paper p-5 flex flex-col justify-between transition-all rounded-2xl shadow-sm ${
                              isEquipped
                                ? 'border-accent shadow-lg shadow-accent/20'
                                : `${rInfo.border} hover:border-white/30`
                            }`}
                          >
                            <div>
                              {/* Modular Preview Box */}
                              <div className="w-full h-32 bg-paper-soft border border-white/10 mb-3.5 flex flex-col items-center justify-center rounded-xl relative overflow-hidden">
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-accent mb-1.5">
                                  {p.slot === 'head' || p.slot === 'hat' ? (
                                    <Eye className="h-7 w-7" />
                                  ) : p.slot === 'body' || p.slot === 'outfit' ? (
                                    <Shield className="h-7 w-7" />
                                  ) : (
                                    <Activity className="h-7 w-7" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${rInfo.bg} ${rInfo.text}`}
                                  >
                                    {rInfo.label}
                                  </span>
                                  {plat && (
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-ink/70">
                                      {plat.codename.split('//')[0]}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-sm sm:text-base text-ink truncate">{p.name}</h3>
                                {isOwned && (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                                    В ГАРДЕРОБЕ
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-accent mb-1">
                                {p.setName || 'СЕТ HERMES'}
                              </div>
                              <p className="text-xs text-ink/60 line-clamp-2">{p.description}</p>
                            </div>

                            <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between">
                              <span className="font-bit text-xl text-amber-500 flex items-center gap-1.5 font-bold">
                                <Coins className="h-4 w-4" />
                                {p.priceCoins}
                              </span>

                              {isOwned ? (
                                <button
                                  onClick={() => {
                                    const slotToEquip = (p.slot || 'head') as any;
                                    handleEquipPet(slotToEquip, isEquipped ? null : (p.code || `item_${p.id}`));
                                  }}
                                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-xl ${
                                    isEquipped
                                      ? 'border border-red-500/40 text-red-400 hover:bg-red-500/10'
                                      : 'bg-white/10 text-ink hover:bg-accent hover:text-black'
                                  }`}
                                >
                                  {isEquipped ? 'СНЯТЬ' : 'НАДЕТЬ'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleBuyProduct(p.id)}
                                  disabled={!canAfford}
                                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-xl ${
                                    canAfford
                                      ? 'bg-accent text-black hover:bg-white shadow font-bold'
                                      : 'border border-white/10 text-ink/30 cursor-not-allowed'
                                  }`}
                                >
                                  КУПИТЬ
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // Standard physical Merch products
                      return (
                        <div
                          key={p.id}
                          className="border border-white/15 bg-paper p-5 flex flex-col justify-between hover:border-accent transition-all rounded-2xl shadow-sm"
                        >
                          <div>
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-full h-40 object-cover border border-white/10 mb-3.5 rounded-xl"
                              />
                            ) : (
                              <div className="w-full h-40 bg-paper-soft border border-white/10 mb-3.5 flex items-center justify-center text-ink/40 rounded-xl">
                                <ShoppingBag className="h-12 w-12 text-accent/50" />
                              </div>
                            )}
                            <h3 className="font-bold text-sm sm:text-base text-ink">{p.name}</h3>
                            <p className="text-xs sm:text-sm text-ink/60 mt-1 line-clamp-2">{p.description}</p>
                          </div>

                          <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between">
                            <span className="font-bit text-xl text-amber-500 flex items-center gap-1.5 font-bold">
                              <Coins className="h-4 w-4" />
                              {p.priceCoins}
                            </span>
                            <button
                              onClick={() => handleBuyProduct(p.id)}
                              disabled={!canAfford}
                              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-xl ${
                                canAfford
                                  ? 'bg-accent text-black hover:bg-white shadow'
                                  : 'border border-white/10 text-ink/30 cursor-not-allowed'
                              }`}
                            >
                              КУПИТЬ
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ================= [HERMES_MAP: VIEW_08_PROFILE] ================= */}
          {/* ================= VIEW: PROFILE (MY PROFILE OR VISITED OPERATOR) ================= */}
          {currentView === 'profile' && (
            <div className="max-w-4xl lg:max-w-5xl mx-auto space-y-6 animate-in fade-in">
              {viewingProfileUserId && viewingProfileUserId !== user.id ? (
                /* ------------------- VISITED OPERATOR PROFILE ------------------- */
                <div className="space-y-6">
                  {/* Top Bar / Return */}
                  <div className="flex items-center justify-between border border-white/15 bg-paper/60 p-4 rounded-2xl shadow-sm">
                    <button
                      onClick={() => {
                        setViewingProfileUserId(null);
                        loadMyProfilePosts();
                      }}
                      className="flex items-center gap-2 text-xs sm:text-sm font-bold text-accent hover:text-white transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>ВЕРНУТЬСЯ В МОЙ ПРОФИЛЬ</span>
                    </button>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-ink/40 uppercase">
                      / HERMES NETWORK // DOSSIER #{viewingProfileUserId}
                    </span>
                  </div>

                  {viewedProfileLoading ? (
                    <div className="border border-white/15 bg-paper/80 p-12 text-center rounded-3xl space-y-3">
                      <Activity className="h-8 w-8 text-accent animate-spin mx-auto" />
                      <div className="text-xs font-mono font-bold uppercase tracking-wider text-ink/70">
                        СКАНИРОВАНИЕ ДОСЬЕ ОПЕРАТОРА #{viewingProfileUserId}...
                      </div>
                    </div>
                  ) : viewedProfileUser ? (
                    <div className="space-y-6">
                      {/* Operator Card */}
                      <div className="border border-white/15 bg-paper/70 p-6 sm:p-8 space-y-6 rounded-3xl shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                          <div className="relative shrink-0">
                            <UserAvatar
                              avatarUrl={viewedProfileUser.avatarUrl}
                              avatarColor={viewedProfileUser.avatarColor}
                              name={viewedProfileUser.fullName || viewedProfileUser.username}
                              size="2xl"
                            />
                          </div>

                          <div className="space-y-2 flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-xs text-accent font-bold tracking-widest uppercase">
                                / ОПЕРАТОР HERMES // ID#{viewedProfileUser.id}
                              </span>
                              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-white/15 text-ink/60 uppercase">
                                {viewedProfileUser.groupName || 'ГРУППА НЕ УКАЗАНА'}
                              </span>
                            </div>

                            <h2 className="font-bit text-3xl sm:text-4xl text-ink">
                              {viewedProfileUser.fullName || viewedProfileUser.username}
                            </h2>

                            <div className="text-xs sm:text-sm text-ink/60 flex items-center gap-3">
                              <span>ЛОГИН: @{viewedProfileUser.username}</span>
                              <span>·</span>
                              <span className="text-accent uppercase font-bold">РОЛЬ: {viewedProfileUser.role}</span>
                            </div>

                            {/* Actions: Friendship & Direct Chat */}
                            <div className="flex flex-wrap items-center gap-2.5 pt-3">
                              {/* Direct Chat Button */}
                              <button
                                onClick={() => handleStartDirectChatWithUser(viewedProfileUser)}
                                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-ink font-bold text-xs transition-colors flex items-center gap-2 border border-white/15 shadow-sm"
                              >
                                <MessageSquare className="h-4 w-4 text-accent" />
                                <span>ОТКРЫТЬ ЧАТ</span>
                              </button>

                              {/* Friendship Action Button */}
                              {viewedProfileFriendship === 'friends' && (
                                <div className="flex items-center gap-1.5">
                                  <span className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                                    <Check className="h-4 w-4" />
                                    <span>В ДРУЗЬЯХ</span>
                                  </span>
                                  <button
                                    onClick={() => handleRemoveFriend(viewedProfileUser.id)}
                                    className="px-3 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-xs transition-colors flex items-center gap-1.5"
                                    title="Удалить из списка друзей"
                                  >
                                    <UserMinus className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">УДАЛИТЬ</span>
                                  </button>
                                </div>
                              )}

                              {viewedProfileFriendship === 'incoming' && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleAcceptFriend({ userId: viewedProfileUser.id })}
                                    className="px-4 py-2 rounded-xl bg-accent text-black font-bold text-xs hover:bg-white transition-colors flex items-center gap-1.5 shadow"
                                  >
                                    <UserPlus className="h-4 w-4" />
                                    <span>ПРИНЯТЬ ЗАЯВКУ</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeclineFriend({ userId: viewedProfileUser.id })}
                                    className="px-3 py-2 rounded-xl border border-white/20 text-ink/60 hover:text-ink font-bold text-xs transition-colors"
                                  >
                                    ОТКЛОНИТЬ
                                  </button>
                                </div>
                              )}

                              {viewedProfileFriendship === 'outgoing' && (
                                <button
                                  onClick={() => handleDeclineFriend({ userId: viewedProfileUser.id })}
                                  className="px-4 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-bold text-xs transition-colors flex items-center gap-2"
                                >
                                  <Clock className="h-4 w-4" />
                                  <span>ЗАЯВКА ОТПРАВЛЕНА (ОТМЕНИТЬ)</span>
                                </button>
                              )}

                              {viewedProfileFriendship === 'none' && (
                                <button
                                  onClick={() => handleSendFriendRequest(viewedProfileUser.id)}
                                  className="px-4 py-2 rounded-xl bg-accent text-black font-bold text-xs hover:bg-white transition-colors flex items-center gap-2 shadow"
                                >
                                  <UserPlus className="h-4 w-4" />
                                  <span>ДОБАВИТЬ В ДРУЗЬЯ</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bio & Friends Counter Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                          <div className="sm:col-span-2 border border-white/10 p-4 bg-paper rounded-2xl">
                            <div className="text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-1">
                              СТАТУС / О СЕБЕ
                            </div>
                            <p className="text-xs sm:text-sm text-ink/80 leading-relaxed">
                              {viewedProfileUser.bio || '[ Пользователь не указал информацию о себе ]'}
                            </p>
                          </div>

                          <div className="border border-white/10 p-4 bg-paper rounded-2xl flex flex-col justify-center items-center text-center">
                            <div className="text-[10px] font-bold text-ink/50 uppercase tracking-wider">
                              СОЮЗНИКИ
                            </div>
                            <div className="font-bit text-2xl sm:text-3xl text-accent mt-0.5">
                              {viewedProfileFriendsCount}
                            </div>
                            <div className="text-[10px] text-ink/40 uppercase">друзей в сети</div>
                          </div>
                        </div>
                      </div>

                      {/* Operator Wall */}
                      <div className="border border-white/15 bg-paper/70 p-5 sm:p-7 space-y-5 rounded-3xl shadow-sm">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                          <div className="flex items-center gap-2.5">
                            <MessageSquare className="h-5 w-5 text-accent" />
                            <h3 className="font-bit text-xl sm:text-2xl text-ink">
                              СТЕНА ОПЕРАТОРА
                            </h3>
                          </div>
                          <span className="text-xs font-mono text-ink/50 uppercase">
                            {viewedProfilePosts.length} ЗАПИСЕЙ
                          </span>
                        </div>

                        {viewedProfilePosts.length === 0 ? (
                          <div className="text-center py-10 border border-dashed border-white/15 rounded-2xl">
                            <p className="text-xs sm:text-sm text-ink/50">
                              На стене этого оператора пока нет публикаций.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {viewedProfilePosts.map((post) => {
                              const isLiked = post.likes?.includes(user.id);
                              const isCommentsOpen = !!openComments[post.id];
                              return (
                                <article
                                  key={post.id}
                                  className="border border-white/15 bg-paper p-4 sm:p-5 hover:border-white/30 transition-all rounded-2xl shadow-sm space-y-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <UserAvatar
                                        avatarUrl={post.authorAvatarUrl}
                                        avatarColor={post.authorAvatarColor}
                                        name={post.authorName}
                                        size="sm"
                                      />
                                      <div>
                                        <div className="text-xs sm:text-sm font-bold text-ink">{post.authorName}</div>
                                        <div className="text-[10px] text-ink/50">
                                          {new Date(post.createdAt).toLocaleString('ru-RU')}
                                        </div>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-ink/40 border border-white/10 px-2 py-0.5 rounded">
                                      #{post.id}
                                    </span>
                                  </div>

                                  <p className="text-xs sm:text-sm text-ink whitespace-pre-wrap leading-relaxed">
                                    {post.text}
                                  </p>

                                  {post.mediaUrl && (
                                    <div className="border border-white/10 overflow-hidden rounded-xl">
                                      <img
                                        src={post.mediaUrl}
                                        alt="Media"
                                        className="w-full max-h-80 object-contain bg-black/40"
                                      />
                                    </div>
                                  )}

                                  <div className="pt-2 border-t border-white/10 flex items-center gap-5 text-xs text-ink/60">
                                    <button
                                      onClick={() => handleLikePost(post.id)}
                                      className={`flex items-center gap-1.5 transition-colors ${
                                        isLiked ? 'text-accent font-bold' : 'hover:text-ink'
                                      }`}
                                    >
                                      <Heart className={`h-4 w-4 ${isLiked ? 'fill-accent text-accent' : ''}`} />
                                      <span>{post.likes?.length || 0}</span>
                                    </button>

                                    <button
                                      onClick={() =>
                                        setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                                      }
                                      className="flex items-center gap-1.5 hover:text-ink transition-colors"
                                    >
                                      <MessageCircle className="h-4 w-4" />
                                      <span>{post.comments?.length || 0}</span>
                                    </button>
                                  </div>

                                  {/* Comments Section */}
                                  {isCommentsOpen && (
                                    <div className="pt-3 border-t border-white/10 space-y-2.5">
                                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {post.comments?.map((c) => (
                                          <div
                                            key={c.id}
                                            className="p-2.5 bg-paper-soft border border-white/10 text-xs rounded-xl flex items-start gap-2"
                                          >
                                            <UserAvatar name={c.authorName} size="xs" />
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center justify-between text-ink/60 mb-0.5">
                                                <span className="font-bold text-ink">{c.authorName}</span>
                                                <span className="text-[10px]">
                                                  {new Date(c.createdAt).toLocaleTimeString('ru-RU')}
                                                </span>
                                              </div>
                                              <p className="text-ink/80">{c.text}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={commentInputs[post.id] || ''}
                                          onChange={(e) =>
                                            setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                                          }
                                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                          placeholder="Оставить комментарий..."
                                          className="flex-1 bg-paper border border-white/15 px-3 py-1.5 text-xs text-ink placeholder-ink/40 focus:outline-none focus:border-accent rounded-xl"
                                        />
                                        <button
                                          onClick={() => handleAddComment(post.id)}
                                          className="px-3 py-1.5 bg-accent text-black font-bold text-xs rounded-xl hover:bg-white transition-colors"
                                        >
                                          <Send className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </article>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-white/15 bg-paper/80 p-8 text-center rounded-3xl space-y-2">
                      <p className="text-sm font-bold text-red-400">Пользователь не найден или профиль недоступен.</p>
                    </div>
                  )}
                </div>
              ) : (
                /* ------------------- MY OWN OPERATOR PROFILE ------------------- */
                <div className="space-y-6">
                  <div className="border border-white/15 bg-paper/60 p-6 sm:p-8 space-y-6 rounded-3xl shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                      {/* Interactive Avatar with upload overlay */}
                      <div className="relative group shrink-0">
                        <input
                          type="file"
                          ref={avatarFileInputRef}
                          onChange={handleAvatarFileSelect}
                          accept="image/*"
                          className="hidden"
                        />
                        <div
                          onClick={() => avatarFileInputRef.current?.click()}
                          className="cursor-pointer relative overflow-hidden rounded-2xl sm:rounded-3xl transition-transform hover:scale-105 active:scale-95 shadow-lg group-hover:ring-2 group-hover:ring-accent"
                          title="Нажмите, чтобы сменить фото аватара"
                        >
                          <UserAvatar
                            avatarUrl={user.avatarUrl}
                            avatarColor={user.avatarColor}
                            name={user.fullName || user.username}
                            size="2xl"
                          />
                          {/* Hover Camera Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity gap-1">
                            <Camera className="h-6 w-6 text-accent" />
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-accent">
                              {avatarUploading ? 'ЗАГРУЗКА...' : 'ИЗМЕНИТЬ'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 flex-1">
                        <span className="text-xs text-accent font-bold tracking-widest uppercase">
                          / 07 → OPERATOR PROFILE // ВАШЕ ДОСЬЕ
                        </span>
                        <h2 className="font-bit text-3xl sm:text-4xl text-ink">{user.fullName || user.username}</h2>
                        <div className="text-xs sm:text-sm text-ink/60 flex items-center gap-3">
                          <span>ЛОГИН: @{user.username}</span>
                          <span>·</span>
                          <span className="text-accent uppercase font-bold">РОЛЬ: {user.role}</span>
                        </div>

                        {/* Avatar Actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-1.5">
                          <button
                            onClick={() => avatarFileInputRef.current?.click()}
                            disabled={avatarUploading}
                            className="px-3.5 py-1.5 rounded-xl bg-accent text-black font-bold text-xs hover:bg-white transition-colors flex items-center gap-1.5 shadow"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span>{avatarUploading ? 'ЗАГРУЗКА...' : 'СМЕНИТЬ АВАТАР'}</span>
                          </button>
                          {user.avatarUrl && (
                            <button
                              onClick={handleResetAvatar}
                              disabled={avatarUploading}
                              className="px-3 py-1.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 font-bold text-xs transition-colors flex items-center gap-1.5"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>СБРОСИТЬ</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Avatar Color Tint Switcher (Cyber Aura) */}
                    <div className="border border-white/10 bg-paper p-4 sm:p-5 space-y-2.5 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink/60 tracking-wider uppercase">
                          ЦВЕТОВОЙ АКЦЕНТ АВАТАРА (АУРА)
                        </span>
                        <span className="text-[10px] font-mono text-accent uppercase">
                          {user.avatarColor || 'orange'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {[
                          { id: 'orange', name: 'Оранжевый', hex: '#FF5500' },
                          { id: 'blue', name: 'Неоновый Синий', hex: '#00E5FF' },
                          { id: 'purple', name: 'Кибер Пурпур', hex: '#D946EF' },
                          { id: 'green', name: 'Изумруд', hex: '#10B981' },
                          { id: 'pink', name: 'Розовый Неон', hex: '#EC4899' },
                          { id: 'teal', name: 'Бирюза', hex: '#14B8A6' },
                        ].map((col) => {
                          const isSelected = (user.avatarColor || 'orange') === col.id;
                          return (
                            <button
                              key={col.id}
                              onClick={() => handleSetAvatarColor(col.id)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                                isSelected
                                  ? 'border-accent bg-accent/20 text-ink shadow-sm'
                                  : 'border-white/10 text-ink/60 hover:text-ink hover:border-white/30'
                              }`}
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-black/40 shrink-0"
                                style={{ backgroundColor: col.hex }}
                              />
                              <span>{col.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Level & XP */}
                    <div className="border border-white/10 bg-paper p-4 sm:p-5 space-y-2 rounded-2xl shadow-sm">
                      <div className="flex justify-between text-xs sm:text-sm font-bold">
                        <span className="text-ink">УРОВЕНЬ {currentLvl}</span>
                        <span className="text-accent">
                          {currentXp} / {xpNeeded} XP ({xpPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-zinc-800 overflow-hidden border border-white/15 rounded-full">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-500"
                          style={{ width: `${xpPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Bio Section */}
                    <div className="border border-white/10 p-4 sm:p-5 bg-paper space-y-2 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink/60 tracking-wider uppercase">
                          О СЕБЕ / СТАТУС
                        </span>
                        {!bioEditing && (
                          <button
                            onClick={() => setBioEditing(true)}
                            className="text-xs text-accent hover:underline font-bold"
                          >
                            [ РЕДАКТИРОВАТЬ ]
                          </button>
                        )}
                      </div>
                      {bioEditing ? (
                        <div className="space-y-2.5">
                          <textarea
                            value={profileBio}
                            onChange={(e) => setProfileBio(e.target.value)}
                            rows={3}
                            className="w-full bg-paper border border-white/15 p-3 text-xs sm:text-sm text-ink placeholder-ink/40 focus:outline-none focus:border-accent rounded-xl"
                          />
                          <div className="flex justify-end gap-2.5">
                            <button
                              onClick={() => setBioEditing(false)}
                              className="px-3.5 py-1.5 text-xs border border-white/20 text-ink/60 rounded-xl hover:text-ink"
                            >
                              ОТМЕНА
                            </button>
                            <button
                              onClick={handleSaveBio}
                              className="px-4 py-1.5 bg-accent text-black font-bold text-xs rounded-xl hover:bg-white transition-colors"
                            >
                              СОХРАНИТЬ
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-ink/80 leading-relaxed">
                          {user.bio || '[ Описание профиля пока не заполнено ]'}
                        </p>
                      )}
                    </div>

                    {/* Friends Quick Link Block */}
                    <div
                      onClick={() => setCurrentView('friends')}
                      className="border border-accent/30 bg-accent/10 hover:bg-accent/15 p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-accent/20 text-accent group-hover:scale-105 transition-transform">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-ink group-hover:text-accent transition-colors">
                            СОЮЗНИКИ И СВЯЗИ
                          </div>
                          <div className="text-[10px] sm:text-xs text-ink/60">
                            У вас в друзьях: <span className="font-bold text-accent">{friendsList.length || viewedProfileFriendsCount}</span> операторов
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-ink/40 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>

                  {/* Personal Wall Section */}
                  <div className="space-y-6">
                    {/* Create Wall Post Form */}
                    <form
                      onSubmit={handleCreateProfilePost}
                      className="border border-white/15 bg-paper/70 p-5 sm:p-6 rounded-3xl shadow-sm space-y-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink/80 tracking-wider uppercase flex items-center gap-2">
                          <Edit2 className="h-4 w-4 text-accent" />
                          ОПУБЛИКОВАТЬ НА ЛИЧНОЙ СТЕНЕ
                        </span>
                        <span className="text-[10px] font-mono text-accent uppercase px-2 py-0.5 rounded border border-accent/20 bg-accent/10">
                          ПЕРСОНАЛЬНАЯ СТЕНА
                        </span>
                      </div>

                      <textarea
                        value={profileNewPostText}
                        onChange={(e) => setProfileNewPostText(e.target.value)}
                        rows={3}
                        placeholder="О чем вы думаете? Запишите мысли, учебную заметку или поделитесь полезным материалом..."
                        className="w-full bg-paper border border-white/15 p-3.5 text-xs sm:text-sm text-ink placeholder-ink/40 focus:outline-none focus:border-accent rounded-2xl"
                      />

                      {profileNewPostMedia && (
                        <div className="relative border border-white/20 max-h-56 overflow-hidden rounded-xl">
                          <img src={profileNewPostMedia} alt="Preview" className="w-full h-auto object-cover" />
                          <button
                            type="button"
                            onClick={() => setProfileNewPostMedia(null)}
                            className="absolute top-2 right-2 bg-black/80 text-white p-1.5 text-xs border border-white/30 rounded-lg hover:bg-red-500/80 transition-colors"
                          >
                            УДАЛИТЬ ФОТО
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <label className="cursor-pointer px-3.5 py-2 rounded-xl border border-white/15 text-xs text-ink/70 hover:text-ink hover:border-accent flex items-center gap-2 transition-colors">
                          <ImageIcon className="h-4 w-4 text-accent" />
                          <span>ФОТО</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileToDataUrl(file, setProfileNewPostMedia);
                            }}
                          />
                        </label>

                        <button
                          type="submit"
                          disabled={profileNewPostLoading || (!profileNewPostText.trim() && !profileNewPostMedia)}
                          className="bg-accent text-black font-bold text-xs sm:text-sm px-6 py-2 uppercase tracking-wider hover:bg-white disabled:opacity-50 transition-all rounded-xl shadow"
                        >
                          {profileNewPostLoading ? 'ПУБЛИКАЦИЯ...' : 'ОПУБЛИКОВАТЬ НА СТЕНЕ'}
                        </button>
                      </div>
                    </form>

                    {/* List of personal wall posts */}
                    <div className="border border-white/15 bg-paper/70 p-5 sm:p-7 space-y-5 rounded-3xl shadow-sm">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-2.5">
                          <MessageSquare className="h-5 w-5 text-accent" />
                          <h3 className="font-bit text-xl sm:text-2xl text-ink">
                            МОЯ СТЕНА
                          </h3>
                        </div>
                        <span className="text-xs font-mono text-ink/50 uppercase">
                          {viewedProfilePosts.length} ЗАПИСЕЙ
                        </span>
                      </div>

                      {viewedProfilePosts.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-white/15 rounded-2xl">
                          <p className="text-xs sm:text-sm text-ink/50">
                            У вас пока нет публикаций на личной странице. Напишите первую запись выше!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {viewedProfilePosts.map((post) => {
                            const isLiked = post.likes?.includes(user.id);
                            const isCommentsOpen = !!openComments[post.id];
                            return (
                              <article
                                key={post.id}
                                className="border border-white/15 bg-paper p-4 sm:p-5 hover:border-white/30 transition-all rounded-2xl shadow-sm space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <UserAvatar
                                      avatarUrl={post.authorAvatarUrl}
                                      avatarColor={post.authorAvatarColor}
                                      name={post.authorName}
                                      size="sm"
                                    />
                                    <div>
                                      <div className="text-xs sm:text-sm font-bold text-ink">{post.authorName}</div>
                                      <div className="text-[10px] text-ink/50">
                                        {new Date(post.createdAt).toLocaleString('ru-RU')}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-ink/40 border border-white/10 px-2 py-0.5 rounded">
                                      #{post.id}
                                    </span>
                                    <button
                                      onClick={() => handleDeleteWallPost(post.id)}
                                      className="p-1.5 text-ink/40 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                                      title="Удалить запись со стены"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>

                                <p className="text-xs sm:text-sm text-ink whitespace-pre-wrap leading-relaxed">
                                  {post.text}
                                </p>

                                {post.mediaUrl && (
                                  <div className="border border-white/10 overflow-hidden rounded-xl">
                                    <img
                                      src={post.mediaUrl}
                                      alt="Media"
                                      className="w-full max-h-80 object-contain bg-black/40"
                                    />
                                  </div>
                                )}

                                <div className="pt-2 border-t border-white/10 flex items-center gap-5 text-xs text-ink/60">
                                  <button
                                    onClick={() => handleLikePost(post.id)}
                                    className={`flex items-center gap-1.5 transition-colors ${
                                      isLiked ? 'text-accent font-bold' : 'hover:text-ink'
                                    }`}
                                  >
                                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-accent text-accent' : ''}`} />
                                    <span>{post.likes?.length || 0}</span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                                    }
                                    className="flex items-center gap-1.5 hover:text-ink transition-colors"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                    <span>{post.comments?.length || 0}</span>
                                  </button>
                                </div>

                                {/* Comments Section */}
                                {isCommentsOpen && (
                                  <div className="pt-3 border-t border-white/10 space-y-2.5">
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                      {post.comments?.map((c) => (
                                        <div
                                          key={c.id}
                                          className="p-2.5 bg-paper-soft border border-white/10 text-xs rounded-xl flex items-start gap-2"
                                        >
                                          <UserAvatar name={c.authorName} size="xs" />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between text-ink/60 mb-0.5">
                                              <span className="font-bold text-ink">{c.authorName}</span>
                                              <span className="text-[10px]">
                                                {new Date(c.createdAt).toLocaleTimeString('ru-RU')}
                                              </span>
                                            </div>
                                            <p className="text-ink/80">{c.text}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={commentInputs[post.id] || ''}
                                        onChange={(e) =>
                                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                                        }
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                        placeholder="Оставить комментарий..."
                                        className="flex-1 bg-paper border border-white/15 px-3 py-1.5 text-xs text-ink placeholder-ink/40 focus:outline-none focus:border-accent rounded-xl"
                                      />
                                      <button
                                        onClick={() => handleAddComment(post.id)}
                                        className="px-3 py-1.5 bg-accent text-black font-bold text-xs rounded-xl hover:bg-white transition-colors"
                                      >
                                        <Send className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= [HERMES_MAP: VIEW_FRIENDS] ================= */}
          {/* ================= VIEW: FRIENDS (ALLIED OPERATORS) ================= */}
          {currentView === 'friends' && (
            <div className="max-w-4xl lg:max-w-5xl mx-auto space-y-6 animate-in fade-in">
              {/* Header */}
              <div className="border border-white/15 bg-paper/60 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl shadow-sm">
                <div>
                  <span className="text-xs text-accent font-bold tracking-widest uppercase">
                    / 03 → PROTOCOL // ALLIED OPERATORS
                  </span>
                  <h2 className="font-bit text-3xl sm:text-4xl text-ink mt-1">Друзья и связи</h2>
                  <p className="text-xs sm:text-sm text-ink/60 mt-1">
                    Связи между операторами кампуса, поиск соратников и совместные миссии
                  </p>
                </div>

                {/* Sub-tabs */}
                <div className="flex border border-white/20 p-1 rounded-2xl bg-paper-soft gap-1 self-start sm:self-auto">
                  <button
                    onClick={() => setFriendsTab('all')}
                    className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-xl flex items-center gap-2 ${
                      friendsTab === 'all'
                        ? 'bg-accent text-black shadow'
                        : 'text-ink/60 hover:text-ink'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>ДРУЗЬЯ ({friendsList.length})</span>
                  </button>

                  <button
                    onClick={() => setFriendsTab('requests')}
                    className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-xl flex items-center gap-2 relative ${
                      friendsTab === 'requests'
                        ? 'bg-accent text-black shadow'
                        : 'text-ink/60 hover:text-ink'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>ЗАЯВКИ</span>
                    {incomingFriendRequests.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    )}
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/10">
                      {incomingFriendRequests.length + outgoingFriendRequests.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setFriendsTab('search')}
                    className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-xl flex items-center gap-2 ${
                      friendsTab === 'search'
                        ? 'bg-accent text-black shadow'
                        : 'text-ink/60 hover:text-ink'
                    }`}
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>ПОИСК</span>
                  </button>
                </div>
              </div>

              {/* Subtab 1: ALL FRIENDS */}
              {friendsTab === 'all' && (
                <div className="space-y-4">
                  {friendsLoading ? (
                    <div className="border border-white/15 bg-paper/60 p-10 text-center rounded-3xl">
                      <Activity className="h-7 w-7 text-accent animate-spin mx-auto mb-2" />
                      <div className="text-xs font-mono text-ink/60 uppercase">СИНХРОНИЗАЦИЯ СПИСКА СОЮЗНИКОВ...</div>
                    </div>
                  ) : friendsList.length === 0 ? (
                    <div className="border border-white/15 bg-paper/60 p-10 text-center rounded-3xl space-y-3">
                      <Users className="h-10 w-10 text-ink/30 mx-auto" />
                      <div className="font-bit text-xl text-ink">У вас пока нет друзей в сети</div>
                      <p className="text-xs text-ink/60 max-w-md mx-auto">
                        Найдите одногруппников и преподавателей через поиск или открывайте профили авторов из новостной ленты!
                      </p>
                      <button
                        onClick={() => setFriendsTab('search')}
                        className="px-4 py-2 bg-accent text-black font-bold text-xs rounded-xl hover:bg-white transition-colors uppercase tracking-wider"
                      >
                        НАЙТИ ОДНОГРУППНИКОВ
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {friendsList.map((f) => (
                        <div
                          key={f.id}
                          className="border border-white/15 bg-paper/80 p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-4 hover:border-white/30 transition-all shadow-sm"
                        >
                          <div
                            onClick={() => openUserProfile(f.id)}
                            className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                          >
                            <UserAvatar
                              avatarUrl={f.avatarUrl}
                              avatarColor={f.avatarColor}
                              name={f.fullName || f.username}
                              size="md"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-sm text-ink group-hover:text-accent transition-colors truncate">
                                {f.fullName || f.username}
                              </div>
                              <div className="text-[10px] text-ink/50 truncate flex items-center gap-1.5 mt-0.5">
                                <span>@{f.username}</span>
                                <span>·</span>
                                <span className="text-accent uppercase font-bold">{f.groupName || f.role}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleStartDirectChatWithUser(f)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-accent hover:text-black text-ink/80 transition-colors border border-white/10"
                              title="Написать сообщение"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openUserProfile(f.id)}
                              className="px-2.5 py-1.5 rounded-xl border border-white/15 hover:border-accent text-[11px] font-bold text-ink/80 hover:text-ink transition-colors"
                              title="Открыть досье"
                            >
                              ПРОФИЛЬ
                            </button>
                            <button
                              onClick={() => handleRemoveFriend(f.id)}
                              className="p-2 rounded-xl text-ink/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Удалить из друзей"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Subtab 2: REQUESTS */}
              {friendsTab === 'requests' && (
                <div className="space-y-6">
                  {/* Incoming */}
                  <div className="border border-white/15 bg-paper/60 p-5 sm:p-6 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-accent" />
                        <span className="text-xs font-bold text-ink tracking-wider uppercase">
                          ВХОДЯЩИЕ ЗАЯВКИ ({incomingFriendRequests.length})
                        </span>
                      </div>
                      <span className="text-[10px] text-ink/50 uppercase">ТРЕБУЮТ ПОДТВЕРЖДЕНИЯ</span>
                    </div>

                    {incomingFriendRequests.length === 0 ? (
                      <div className="text-xs text-ink/50 py-4 text-center">
                        Нет входящих заявок в друзья
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {incomingFriendRequests.map((req) => (
                          <div
                            key={req.id}
                            className="border border-white/10 bg-paper p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                          >
                            <div
                              onClick={() => req.sender && openUserProfile(req.sender.id)}
                              className="flex items-center gap-3 cursor-pointer group"
                            >
                              <UserAvatar
                                avatarUrl={req.sender?.avatarUrl}
                                avatarColor={req.sender?.avatarColor}
                                name={req.sender?.fullName || 'Оператор'}
                                size="md"
                              />
                              <div>
                                <div className="font-bold text-sm text-ink group-hover:text-accent transition-colors">
                                  {req.sender?.fullName || 'Оператор'}
                                </div>
                                <div className="text-[10px] text-ink/50 flex items-center gap-1.5 mt-0.5">
                                  <span>@{req.sender?.username}</span>
                                  <span>·</span>
                                  <span className="text-accent uppercase font-bold">{req.sender?.groupName || req.sender?.role}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                onClick={() => handleAcceptFriend({ requestId: req.id })}
                                className="px-3.5 py-1.5 rounded-xl bg-accent text-black font-bold text-xs hover:bg-white transition-colors flex items-center gap-1.5 shadow"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>ПРИНЯТЬ</span>
                              </button>
                              <button
                                onClick={() => handleDeclineFriend({ requestId: req.id })}
                                className="px-3 py-1.5 rounded-xl border border-white/20 text-ink/60 hover:text-ink font-bold text-xs transition-colors"
                              >
                                ОТКЛОНИТЬ
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Outgoing */}
                  <div className="border border-white/15 bg-paper/60 p-5 sm:p-6 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-ink/60" />
                        <span className="text-xs font-bold text-ink tracking-wider uppercase">
                          ИСХОДЯЩИЕ ЗАЯВКИ ({outgoingFriendRequests.length})
                        </span>
                      </div>
                      <span className="text-[10px] text-ink/50 uppercase">ОЖИДАЮТ ОТВЕТА</span>
                    </div>

                    {outgoingFriendRequests.length === 0 ? (
                      <div className="text-xs text-ink/50 py-4 text-center">
                        Нет активных исходящих заявок
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {outgoingFriendRequests.map((req) => (
                          <div
                            key={req.id}
                            className="border border-white/10 bg-paper p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                          >
                            <div
                              onClick={() => req.recipient && openUserProfile(req.recipient.id)}
                              className="flex items-center gap-3 cursor-pointer group"
                            >
                              <UserAvatar
                                avatarUrl={req.recipient?.avatarUrl}
                                avatarColor={req.recipient?.avatarColor}
                                name={req.recipient?.fullName || 'Оператор'}
                                size="md"
                              />
                              <div>
                                <div className="font-bold text-sm text-ink group-hover:text-accent transition-colors">
                                  {req.recipient?.fullName || 'Оператор'}
                                </div>
                                <div className="text-[10px] text-ink/50 flex items-center gap-1.5 mt-0.5">
                                  <span>@{req.recipient?.username}</span>
                                  <span>·</span>
                                  <span className="text-accent uppercase font-bold">{req.recipient?.groupName || req.recipient?.role}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                                ОЖИДАНИЕ...
                              </span>
                              <button
                                onClick={() => handleDeclineFriend({ requestId: req.id })}
                                className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-xs transition-colors"
                              >
                                ОТМЕНИТЬ
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Subtab 3: GLOBAL SEARCH */}
              {friendsTab === 'search' && (
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="border border-white/15 bg-paper/80 p-4 sm:p-5 rounded-3xl shadow-sm space-y-3">
                    <div className="relative">
                      <Search className="h-4 w-4 text-ink/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={friendsSearchQuery}
                        onChange={(e) => setFriendsSearchQuery(e.target.value)}
                        placeholder="Поиск по имени, фамилии, логину @username или группе..."
                        className="w-full bg-paper-soft border border-white/15 pl-10 pr-10 py-3 text-xs sm:text-sm text-ink placeholder-ink/40 focus:outline-none focus:border-accent rounded-2xl"
                      />
                      {friendsSearchQuery && (
                        <button
                          onClick={() => setFriendsSearchQuery('')}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-ink/40 hover:text-ink"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-ink/40 flex items-center justify-between px-1">
                      <span>ГЛОБАЛЬНЫЙ СКАНЕР ПОЛЬЗОВАТЕЛЕЙ HERMES</span>
                      {friendsSearchLoading && <span className="text-accent animate-pulse">ПОИСК В БАЗЕ...</span>}
                    </div>
                  </div>

                  {/* Results */}
                  {friendsSearchLoading ? (
                    <div className="border border-white/15 bg-paper/60 p-10 text-center rounded-3xl">
                      <Activity className="h-7 w-7 text-accent animate-spin mx-auto mb-2" />
                      <div className="text-xs font-mono text-ink/60 uppercase">СКАНИРОВАНИЕ РЕЕСТРА ОПЕРАТОРОВ...</div>
                    </div>
                  ) : friendsSearchQuery.trim() && friendsSearchResults.length === 0 ? (
                    <div className="border border-white/15 bg-paper/60 p-10 text-center rounded-3xl">
                      <p className="text-xs sm:text-sm text-ink/60">
                        По запросу «{friendsSearchQuery}» операторов не найдено.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {friendsSearchResults.map((u) => {
                        const isSelf = u.id === user.id;
                        const isAlreadyFriend = friendsList.some((f) => f.id === u.id);
                        const isOutgoing = outgoingFriendRequests.some((r) => r.recipient?.id === u.id);
                        const isIncoming = incomingFriendRequests.some((r) => r.sender?.id === u.id);

                        return (
                          <div
                            key={u.id}
                            className="border border-white/15 bg-paper/80 p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-4 hover:border-white/30 transition-all shadow-sm"
                          >
                            <div
                              onClick={() => openUserProfile(u.id)}
                              className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                            >
                              <UserAvatar
                                avatarUrl={u.avatarUrl}
                                avatarColor={u.avatarColor}
                                name={u.fullName || u.username}
                                size="md"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-sm text-ink group-hover:text-accent transition-colors truncate">
                                  {u.fullName || u.username}
                                </div>
                                <div className="text-[10px] text-ink/50 truncate flex items-center gap-1.5 mt-0.5">
                                  <span>@{u.username}</span>
                                  <span>·</span>
                                  <span className="text-accent uppercase font-bold">{u.groupName || u.role}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {!isSelf && (
                                <button
                                  onClick={() => handleStartDirectChatWithUser(u)}
                                  className="p-2 rounded-xl bg-white/5 hover:bg-accent hover:text-black text-ink/80 transition-colors border border-white/10"
                                  title="Написать сообщение"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </button>
                              )}

                              <button
                                onClick={() => openUserProfile(u.id)}
                                className="px-2.5 py-1.5 rounded-xl border border-white/15 hover:border-accent text-[11px] font-bold text-ink/80 hover:text-ink transition-colors"
                              >
                                ПРОФИЛЬ
                              </button>

                              {!isSelf && (
                                isAlreadyFriend ? (
                                  <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    <span>ДРУГ</span>
                                  </span>
                                ) : isIncoming ? (
                                  <button
                                    onClick={() => handleAcceptFriend({ userId: u.id })}
                                    className="px-2.5 py-1.5 rounded-xl bg-accent text-black text-[10px] font-bold hover:bg-white transition-colors"
                                  >
                                    ПРИНЯТЬ
                                  </button>
                                ) : isOutgoing ? (
                                  <span className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                                    ОЖИДАНИЕ
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleSendFriendRequest(u.id)}
                                    className="px-2.5 py-1.5 rounded-xl bg-accent text-black text-[10px] font-bold hover:bg-white transition-colors flex items-center gap-1"
                                    title="Добавить в друзья"
                                  >
                                    <UserPlus className="h-3 w-3" />
                                    <span>ДОБАВИТЬ</span>
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {/* ================= [HERMES_MAP: VIEW_09_SETTINGS] ================= */}
          {/* ================= VIEW 8: SETTINGS ================= */}
          {currentView === 'settings' && (
            <div className="max-w-3xl lg:max-w-4xl mx-auto space-y-6">
              <div className="border border-white/15 bg-paper/60 p-5 sm:p-6 rounded-2xl shadow-sm">
                <span className="text-xs text-accent font-bold tracking-widest uppercase">
                  / 08 → CONFIGURATION // НАСТРОЙКИ
                </span>
                <h2 className="font-bit text-3xl sm:text-4xl text-ink mt-1">Параметры терминала</h2>
                <p className="text-xs sm:text-sm text-ink/60 mt-1">
                  Персонализация внешнего вида, светлая/тёмная тема и цветовые спектры
                </p>
              </div>

              {/* Avatar Settings */}
              <div className="border border-white/15 bg-paper p-5 sm:p-6 space-y-4 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm font-bold text-ink tracking-wider">
                    АВАТАР ОПЕРАТОРА
                  </div>
                  {user.avatarUrl && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      АКТИВЕН
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <UserAvatar
                    avatarUrl={user.avatarUrl}
                    avatarColor={user.avatarColor}
                    name={user.fullName || user.username}
                    size="xl"
                  />
                  <div className="space-y-2 flex-1">
                    <p className="text-xs text-ink/60">
                      Загрузите личное фото или используйте стилизованный неоновый бейдж с вашими инициалами.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => avatarFileInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="px-3.5 py-1.5 rounded-xl bg-accent text-black font-bold text-xs hover:bg-white transition-colors flex items-center gap-1.5 shadow"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>{avatarUploading ? 'ЗАГРУЗКА...' : 'ЗАГРУЗИТЬ ФОТО'}</span>
                      </button>
                      {user.avatarUrl && (
                        <button
                          onClick={handleResetAvatar}
                          disabled={avatarUploading}
                          className="px-3 py-1.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 font-bold text-xs transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>СБРОСИТЬ</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Toggle (Light / Dark) */}
              <div className="border border-white/15 bg-paper p-5 sm:p-6 space-y-3.5 rounded-2xl shadow-sm">
                <div className="text-xs sm:text-sm font-bold text-ink tracking-wider">
                  ТЕМА ОФОРМЛЕНИЯ
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`py-3 px-4 border text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all rounded-xl ${
                      theme === 'dark'
                        ? 'border-accent bg-accent text-black font-bold shadow'
                        : 'border-white/15 text-ink/60 hover:text-ink hover:border-white/30'
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    <span>ТЁМНАЯ ТЕМА</span>
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`py-3 px-4 border text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all rounded-xl ${
                      theme === 'light'
                        ? 'border-accent bg-accent text-black font-bold shadow'
                        : 'border-white/15 text-ink/60 hover:text-ink hover:border-white/30'
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    <span>СВЕТЛАЯ ТЕМА</span>
                  </button>
                </div>
              </div>

              {/* Accent Color Palette */}
              <div className="border border-white/15 bg-paper p-5 sm:p-6 space-y-3.5 rounded-2xl shadow-sm">
                <div className="text-xs sm:text-sm font-bold text-ink tracking-wider">
                  ЦВЕТОВОЙ АКЦЕНТ ИНТЕРФЕЙСА
                </div>
                <p className="text-xs sm:text-sm text-ink/60">
                  Выбранный цвет моментально применяется ко всем бейджам, кнопкам и графикам.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {(() => {
                    const defaultHexes = new Set(ACCENT_COLORS.map((c) => c.hex.toLowerCase()));
                    const customColors = (user.unlockedColors || [])
                      .filter((hex) => !defaultHexes.has(hex.toLowerCase()))
                      .map((hex, idx) => {
                        const prod = products.find((p) => p.colorHex?.toLowerCase() === hex.toLowerCase());
                        return {
                          id: `unlocked_${idx}`,
                          name: prod?.name || `Неон ${hex}`,
                          hex,
                        };
                      });
                    const allColors = [...ACCENT_COLORS, ...customColors];

                    return allColors.map((col) => {
                      const isSelected = accentColor.toLowerCase() === col.hex.toLowerCase();
                      return (
                        <button
                          key={col.id}
                          onClick={() => setAccentColor(col.hex)}
                          className={`p-3 sm:p-3.5 border text-left flex items-center gap-3 transition-all rounded-xl ${
                            isSelected
                              ? 'border-accent bg-accent/15 shadow-[0_0_12px_rgba(255,85,0,0.3)]'
                              : 'border-white/15 hover:border-white/40'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/40 shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-ink truncate">{col.name}</div>
                            <div className="text-[10px] text-ink/50 font-mono">{col.hex}</div>
                          </div>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Font Size & Scaling */}
              <div className="border border-white/15 bg-paper p-5 sm:p-6 space-y-3.5 rounded-2xl shadow-sm">
                <div className="text-xs sm:text-sm font-bold text-ink tracking-wider">
                  МАСШТАБ ТЕКСТА ТЕРМИНАЛА
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(['sm', 'md', 'lg'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFontSize(s)}
                      className={`py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border rounded-xl ${
                        fontSize === s
                          ? 'bg-accent text-black border-accent shadow'
                          : 'border-white/15 text-ink/60 hover:text-ink'
                      }`}
                    >
                      {s === 'sm' ? 'Компактный' : s === 'md' ? 'Стандартный' : 'Крупный'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Density Mode */}
              <div className="border border-white/15 bg-paper p-5 sm:p-6 space-y-3.5 rounded-2xl shadow-sm">
                <div className="text-xs sm:text-sm font-bold text-ink tracking-wider">
                  ПЛОТНОСТЬ ИНТЕРФЕЙСА
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(['comfortable', 'compact'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDensity(d)}
                      className={`py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border rounded-xl ${
                        density === d
                          ? 'bg-accent text-black border-accent shadow'
                          : 'border-white/15 text-ink/60 hover:text-ink'
                      }`}
                    >
                      {d === 'comfortable' ? 'Свободно' : 'Компактно'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accessibility & Reduce Motion */}
              <div className="border border-white/15 bg-paper p-5 sm:p-6 space-y-4 rounded-2xl shadow-sm">
                <div className="text-xs sm:text-sm font-bold text-ink tracking-wider">
                  ДОПОЛНИТЕЛЬНЫЕ ЭФФЕКТЫ
                </div>
                <label className="flex items-center justify-between text-xs sm:text-sm text-ink cursor-pointer">
                  <div>
                    <div className="font-bold">Уменьшение анимаций (Reduce Motion)</div>
                    <div className="text-ink/60 text-[11px] sm:text-xs">
                      Отключает бегущие строки и высокочастотные переходы
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={reduceMotion}
                    onChange={(e) => setReduceMotion(e.target.checked)}
                    className="accent-accent h-4 w-4 rounded"
                  />
                </label>
              </div>

              {/* Reset to Defaults */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setTheme('dark');
                    setAccentColor('#FF5500');
                    setFontSize('md');
                    setDensity('comfortable');
                    setReduceMotion(false);
                    alert('Настройки сброшены к значениям по умолчанию');
                  }}
                  className="px-5 py-2.5 border border-white/20 text-xs sm:text-sm text-ink/60 hover:text-ink hover:border-current transition-all rounded-xl"
                >
                  СБРОСИТЬ К ЗНАЧЕНИЯМ ПО УМОЛЧАНИЮ
                </button>
              </div>
            </div>
          )}

          {/* ================= [HERMES_MAP: VIEW_10_BACKUPS] ================= */}
          {/* ================= VIEW 9: BACKUPS (ADMIN ONLY) ================= */}
          {currentView === 'backups' && user.role === 'admin' && (
            <div className="max-w-4xl lg:max-w-5xl mx-auto space-y-6">
              <div className="border border-white/15 bg-paper/60 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl shadow-sm">
                <div>
                  <span className="text-xs text-accent font-bold tracking-widest uppercase">
                    / 09 → BACKUPS // РЕЗЕРВНОЕ КОПИРОВАНИЕ
                  </span>
                  <h2 className="font-bit text-3xl sm:text-4xl text-ink mt-1">Управление архивами БД</h2>
                  <p className="text-xs sm:text-sm text-ink/60 mt-1">
                    Снимки базы данных, автоматическое расписание и аварийное восстановление
                  </p>
                </div>
                <button
                  onClick={loadBackups}
                  className="px-4 py-2 border border-white/20 text-xs font-bold text-ink hover:text-accent flex items-center gap-2 rounded-xl transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>ОБНОВИТЬ СПИСОК</span>
                </button>
              </div>

              {backupMsg && (
                <div className="p-3.5 border border-accent/40 bg-accent/10 text-accent text-xs sm:text-sm font-bold rounded-xl">
                  {backupMsg}
                </div>
              )}

              {/* Schedule Settings & Manual Snapshot */}
              <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
                {/* Auto Backup Schedule */}
                <div className="border border-white/15 bg-paper p-5 sm:p-6 space-y-3.5 rounded-2xl shadow-sm">
                  <div className="text-xs sm:text-sm font-bold text-ink tracking-wider">
                    РАСПИСАНИЕ АВТО-БЭКАПА
                  </div>
                  <p className="text-xs sm:text-sm text-ink/60">
                    Периодичность автоматического создания резервной копии сервера.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={backupIntervalInput}
                      onChange={(e) => setBackupIntervalInput(Number(e.target.value))}
                      className="w-24 bg-paper border border-white/15 px-3 py-2 text-xs sm:text-sm text-ink focus:outline-none focus:border-accent rounded-xl"
                    />
                    <span className="text-xs sm:text-sm text-ink/60">дней</span>
                    <button
                      onClick={handleSaveBackupInterval}
                      className="px-4 py-2 bg-accent text-black font-bold text-xs uppercase hover:bg-white transition-all rounded-xl shadow"
                    >
                      СОХРАНИТЬ
                    </button>
                  </div>
                  <div className="text-[11px] sm:text-xs text-ink/50 pt-2 space-y-1">
                    <div>
                      Последний бэкап:{' '}
                      {backupSettings.lastBackupAt
                        ? new Date(backupSettings.lastBackupAt).toLocaleString('ru-RU')
                        : '[ Ещё не выполнялся ]'}
                    </div>
                    {backupSettings.nextBackupAt && (
                      <div>
                        Следующий запланирован:{' '}
                        {new Date(backupSettings.nextBackupAt).toLocaleString('ru-RU')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="border border-white/15 bg-paper p-5 sm:p-6 space-y-3.5 flex flex-col justify-between rounded-2xl shadow-sm">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-ink tracking-wider">
                      РУЧНЫЕ ОПЕРАЦИИ
                    </div>
                    <p className="text-xs sm:text-sm text-ink/60 mt-1">
                      Создать моментальный снимок базы или скачать текущую базу JSON.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-3">
                    <button
                      onClick={handleCreateBackupNow}
                      className="flex-1 py-2.5 px-3 bg-accent text-black font-bold text-xs uppercase tracking-wider hover:bg-white transition-all flex items-center justify-center gap-2 rounded-xl shadow"
                    >
                      <HardDrive className="h-4 w-4" />
                      <span>СОЗДАТЬ СНИМОК</span>
                    </button>
                    <button
                      onClick={handleDownloadCurrentDb}
                      className="flex-1 py-2.5 px-3 border border-white/20 text-ink text-xs font-bold uppercase tracking-wider hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2 rounded-xl"
                    >
                      <Download className="h-4 w-4" />
                      <span>СКАЧАТЬ DB.JSON</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Restore from File */}
              <div className="border border-white/15 bg-paper p-5 sm:p-6 space-y-3.5 rounded-2xl shadow-sm">
                <div className="text-xs sm:text-sm font-bold text-ink tracking-wider">
                  ВОССТАНОВЛЕНИЕ ИЗ ФАЙЛА
                </div>
                <p className="text-xs sm:text-sm text-ink/60">
                  ⚠️ Восстановление перезапишет все текущие данные в JSON базе. Перед этим сервер
                  автоматически создаст резервную копию <code className="text-accent font-bold">before-restore</code>.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                  <label className="w-full sm:w-auto px-4 py-2.5 border border-white/20 text-xs font-bold text-ink hover:border-accent cursor-pointer bg-white/[0.02] flex items-center justify-center gap-2 rounded-xl transition-all">
                    <Upload className="h-4 w-4 text-accent" />
                    <span>ВЫБРАТЬ ФАЙЛ БЭКАПА (.JSON)</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setBackupRestoreFileName(file.name);
                          const reader = new FileReader();
                          reader.onload = () => setBackupRestoreFileContent(reader.result as string);
                          reader.readAsText(file);
                        }
                      }}
                    />
                  </label>

                  {backupRestoreFileName && (
                    <span className="text-xs text-accent font-bold truncate max-w-xs">
                      [ ВЫБРАН: {backupRestoreFileName} ]
                    </span>
                  )}

                  <button
                    onClick={handleRestoreBackup}
                    disabled={!backupRestoreFileContent}
                    className="w-full sm:w-auto ml-auto px-5 py-2.5 bg-red-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-red-600 transition-all rounded-xl shadow"
                  >
                    ВОССТАНОВИТЬ СЕЙЧАС →
                  </button>
                </div>
              </div>

              {/* Backups List Table */}
              <div className="border border-white/15 bg-paper rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 sm:p-5 border-b border-white/15 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold tracking-widest text-ink uppercase">
                    РЕЕСТР СОХРАНЁННЫХ КОПИЙ
                  </span>
                  <span className="text-xs text-accent font-bold">ВСЕГО: {backupList.length}</span>
                </div>

                <div className="divide-y divide-white/10">
                  {backupList.length === 0 ? (
                    <div className="p-8 text-center text-ink/40 text-xs sm:text-sm">
                      [ НЕТ СОХРАНЁННЫХ КОПИЙ В ПАПКЕ BACKUPS ]
                    </div>
                  ) : (
                    backupList.map((item) => (
                      <div
                        key={item.filename}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-white/[0.04] transition-colors"
                      >
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-ink font-mono">
                            {item.filename}
                          </div>
                          <div className="text-[10px] sm:text-xs text-ink/50 mt-0.5">
                            Размер: {(item.size / 1024).toFixed(1)} КБ · Создан:{' '}
                            {new Date(item.createdAt).toLocaleString('ru-RU')}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleDownloadBackupFile(item.filename)}
                            className="px-3.5 py-1.5 border border-white/20 text-xs text-ink hover:text-accent hover:border-accent transition-colors flex items-center gap-1.5 rounded-lg"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Скачать</span>
                          </button>

                          <button
                            onClick={() => handleDeleteBackup(item.filename)}
                            className="p-1.5 border border-transparent hover:border-red-500/40 text-ink/40 hover:text-red-400 transition-colors rounded-lg"
                            title="Удалить файл"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= [HERMES_MAP: VIEW_11_ADMIN] ================= */}
          {/* ================= VIEW 10: ADMIN PANEL (USERS, ROLES, STATS) ================= */}
          {currentView === 'admin' && user.role === 'admin' && (
            <div className="max-w-5xl lg:max-w-6xl mx-auto space-y-6">
              <div className="border border-white/15 bg-paper/60 p-5 sm:p-6 rounded-2xl shadow-sm">
                <span className="text-xs text-accent font-bold tracking-widest uppercase">
                  / 10 → ADMIN TERMINAL // ПРАВА И УПРАВЛЕНИЕ
                </span>
                <h2 className="font-bit text-3xl sm:text-4xl text-ink mt-1">Центр администрирования</h2>
                <p className="text-xs sm:text-sm text-ink/60 mt-1">
                  Управление учетными записями, назначение прав администратора и телеметрия
                </p>
              </div>

              {adminActionMsg && (
                <div className="p-3.5 border border-accent/40 bg-accent/10 text-accent text-xs sm:text-sm font-bold rounded-xl">
                  {adminActionMsg}
                </div>
              )}

              {/* Stats tiles */}
              {adminStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="border border-white/15 bg-paper p-4 sm:p-5 rounded-2xl shadow-sm">
                    <span className="text-[10px] sm:text-xs text-ink/50 uppercase tracking-widest font-bold">
                      СТУДЕНТОВ
                    </span>
                    <div className="font-bit text-3xl sm:text-4xl text-ink mt-1">
                      {adminStats.totalStudents}
                    </div>
                  </div>
                  <div className="border border-white/15 bg-paper p-4 sm:p-5 rounded-2xl shadow-sm">
                    <span className="text-[10px] sm:text-xs text-ink/50 uppercase tracking-widest font-bold">
                      ОНЛАЙН СЕЙЧАС
                    </span>
                    <div className="font-bit text-3xl sm:text-4xl text-emerald-500 mt-1">
                      {adminStats.onlineTotal}
                    </div>
                  </div>
                  <div className="border border-white/15 bg-paper p-4 sm:p-5 rounded-2xl shadow-sm">
                    <span className="text-[10px] sm:text-xs text-ink/50 uppercase tracking-widest font-bold">
                      ПОСЕЩЕНИЙ СЕГОДНЯ
                    </span>
                    <div className="font-bit text-3xl sm:text-4xl text-accent mt-1">
                      {adminStats.visitsToday}
                    </div>
                  </div>
                  <div className="border border-white/15 bg-paper p-4 sm:p-5 rounded-2xl shadow-sm">
                    <span className="text-[10px] sm:text-xs text-ink/50 uppercase tracking-widest font-bold">
                      ПУБЛИКАЦИЙ
                    </span>
                    <div className="font-bit text-3xl sm:text-4xl text-ink mt-1">
                      {adminStats.totalPosts}
                    </div>
                  </div>
                </div>
              )}

              {/* Add Teacher & Add Group Grid */}
              <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
                {/* Add Teacher */}
                <form
                  onSubmit={handleCreateTeacher}
                  className="border border-white/15 bg-paper p-5 sm:p-6 space-y-3.5 rounded-2xl shadow-sm"
                >
                  <div className="text-xs sm:text-sm font-bold text-ink tracking-wider">
                    ДОБАВИТЬ ПРЕПОДАВАТЕЛЯ
                  </div>
                  <input
                    type="text"
                    value={newTeacherFullname}
                    onChange={(e) => setNewTeacherFullname(e.target.value)}
                    required
                    placeholder="ФИО преподавателя"
                    className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink placeholder-ink/40 focus:outline-none focus:border-accent rounded-xl transition-colors"
                  />
                  <input
                    type="text"
                    value={newTeacherUsername}
                    onChange={(e) => setNewTeacherUsername(e.target.value)}
                    required
                    placeholder="Логин"
                    className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink placeholder-ink/40 focus:outline-none focus:border-accent rounded-xl transition-colors"
                  />
                  <input
                    type="password"
                    value={newTeacherPassword}
                    onChange={(e) => setNewTeacherPassword(e.target.value)}
                    required
                    placeholder="Пароль"
                    className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink placeholder-ink/40 focus:outline-none focus:border-accent rounded-xl transition-colors"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-accent text-black font-bold text-xs uppercase tracking-wider hover:bg-white transition-all rounded-xl shadow"
                  >
                    СОЗДАТЬ ПРЕПОДАВАТЕЛЯ →
                  </button>
                </form>

                {/* Add Group */}
                <form
                  onSubmit={handleCreateGroup}
                  className="border border-white/15 bg-paper p-5 sm:p-6 space-y-3.5 flex flex-col justify-between rounded-2xl shadow-sm"
                >
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-ink tracking-wider">
                      СОЗДАТЬ УЧЕБНУЮ ГРУППУ
                    </div>
                    <p className="text-xs sm:text-sm text-ink/60 mt-1">
                      Автоматически создаст учебную группу и привязанный к ней групповой чат.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      required
                      placeholder="Название учебной группы"
                      className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink placeholder-ink/40 focus:outline-none focus:border-accent rounded-xl transition-colors"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 border border-accent text-accent font-bold text-xs uppercase tracking-wider hover:bg-accent hover:text-black transition-all rounded-xl shadow-sm"
                    >
                      СОЗДАТЬ ГРУППУ →
                    </button>

                    {groups.length > 0 && (
                      <div className="pt-2 border-t border-white/10 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-ink/50 font-bold">
                          ТЕКУЩИЕ ГРУППЫ ({groups.length}):
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                          {groups.map((g) => {
                            const studentCount = adminUsers.filter((u) => u.groupId === g.id).length;
                            return (
                              <div
                                key={g.id}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/15 bg-paper-soft text-xs text-ink"
                              >
                                <span className="font-bold">{g.name}</span>
                                <span className="text-[10px] text-ink/50 font-mono">({studentCount} студ.)</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGroup(g.id, g.name)}
                                  className="ml-1 text-red-400 hover:text-red-300 p-0.5 rounded transition-colors"
                                  title={`Удалить группу ${g.name}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              {/* Users & Roles Management Table */}
              <div className="border border-white/15 bg-paper rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 sm:p-5 border-b border-white/15 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold tracking-widest text-ink uppercase">
                    РЕЕСТР ПОЛЬЗОВАТЕЛЕЙ И НАЗНАЧЕНИЕ ПРАВ
                  </span>
                  <span className="text-xs text-accent font-bold">ПОЛЬЗОВАТЕЛЕЙ: {adminUsers.length}</span>
                </div>

                <div className="divide-y divide-white/10 overflow-x-auto">
                  {adminUsers.map((u) => {
                    const isCurrentUser = u.id === user.id;
                    const groupName = groups.find((g) => g.id === u.groupId)?.name || '—';
                    return (
                      <div
                        key={u.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-white/[0.04] transition-colors"
                      >
                        <div
                          onClick={() => openUserProfile(u.id)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <UserAvatar
                            avatarUrl={u.avatarUrl}
                            avatarColor={u.avatarColor}
                            name={u.fullName || u.username}
                            size="md"
                          />
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-ink group-hover:text-accent group-hover:underline transition-colors flex items-center gap-2">
                              <span>{u.fullName || u.username}</span>
                              <span className="text-[10px] sm:text-xs text-ink/40 font-mono">(@{u.username})</span>
                              {isCurrentUser && (
                                <span className="text-[9px] bg-accent/20 text-accent px-2 py-0.5 font-bold rounded">
                                  ВЫ
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] sm:text-xs text-ink/60 mt-0.5">
                              Группа: {groupName} · Уровень: {u.level} · Монеты: ⟠ {u.coins || 0}
                            </div>
                          </div>
                        </div>

                        {/* Role Select & Actions */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <span className="text-ink/50 text-xs font-bold">РОЛЬ:</span>
                            <select
                              value={u.role}
                              disabled={isCurrentUser}
                              onChange={(e) =>
                                handleChangeUserRole(
                                  u.id,
                                  e.target.value,
                                  e.target.value === 'student' ? u.groupId || groups[0]?.id : null
                                )
                              }
                              className={`bg-paper border text-xs sm:text-sm px-3 py-1.5 rounded-xl focus:outline-none transition-colors ${
                                u.role === 'admin'
                                  ? 'border-accent text-accent font-bold'
                                  : u.role === 'teacher'
                                  ? 'border-emerald-500 text-emerald-500 font-bold'
                                  : 'border-white/20 text-ink'
                              }`}
                            >
                              <option value="student">Студент</option>
                              <option value="teacher">Преподаватель</option>
                              <option value="admin">Администратор</option>
                            </select>
                          </div>

                          {!isCurrentUser && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-2 text-ink/40 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                              title="Удалить пользователя"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ================= ADMIN STORE & STYLES MANAGEMENT ================= */}
              <div className="border border-white/15 bg-paper rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs text-accent font-bold tracking-widest uppercase">
                      / STORE PROTOCOL // УПРАВЛЕНИЕ МАГАЗИНОМ И СТИЛЯМИ
                    </span>
                    <h3 className="font-bit text-xl sm:text-2xl text-ink mt-0.5">
                      Добавление товаров, стилей и экипировки
                    </h3>
                  </div>

                  {/* Sub Tabs */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAdminShopCategory('style')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1.5 ${
                        adminShopCategory === 'style'
                          ? 'bg-accent text-black font-bold'
                          : 'border border-white/15 text-ink/60 hover:text-ink'
                      }`}
                    >
                      <Palette className="h-3.5 w-3.5" />
                      <span>НЕОНОВЫЙ СТИЛЬ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminShopCategory('pet')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1.5 ${
                        adminShopCategory === 'pet'
                          ? 'bg-accent text-black font-bold'
                          : 'border border-white/15 text-ink/60 hover:text-ink'
                      }`}
                    >
                      <Bot className="h-3.5 w-3.5" />
                      <span>МОДУЛЬ ПИТОМЦА</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminShopCategory('merch')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1.5 ${
                        adminShopCategory === 'merch'
                          ? 'bg-accent text-black font-bold'
                          : 'border border-white/15 text-ink/60 hover:text-ink'
                      }`}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>МЕРЧ</span>
                    </button>
                  </div>
                </div>

                {/* Form based on selected adminShopCategory */}
                <form onSubmit={handleCreateAdminProduct} className="space-y-4">
                  {adminShopCategory === 'style' && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-ink">НАЗВАНИЕ СТИЛЯ</label>
                        <input
                          type="text"
                          value={newStyleName}
                          onChange={(e) => setNewStyleName(e.target.value)}
                          required
                          placeholder="Например: Toxic Cyberpunk"
                          className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink rounded-xl focus:outline-none focus:border-accent"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-ink">ЦВЕТ НЕОНА (HEX)</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={newStyleColorHex}
                            onChange={(e) => setNewStyleColorHex(e.target.value)}
                            className="w-10 h-10 rounded-xl bg-transparent border border-white/15 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={newStyleColorHex}
                            onChange={(e) => setNewStyleColorHex(e.target.value)}
                            required
                            placeholder="#10B981"
                            className="flex-1 bg-paper border border-white/15 px-3.5 py-2 text-xs sm:text-sm font-mono text-ink rounded-xl focus:outline-none focus:border-accent"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-ink">ЦЕНА В МОНЕТАХ HERMES</label>
                        <input
                          type="number"
                          value={newStylePrice}
                          onChange={(e) => setNewStylePrice(Number(e.target.value))}
                          required
                          min={1}
                          className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink rounded-xl focus:outline-none focus:border-accent"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-ink">ОПИСАНИЕ СТИЛЯ</label>
                        <input
                          type="text"
                          value={newStyleDesc}
                          onChange={(e) => setNewStyleDesc(e.target.value)}
                          placeholder="Изумрудный био-неон лабораторий"
                          className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink rounded-xl focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                  )}

                  {adminShopCategory === 'pet' && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-ink">НАЗВАНИЕ МОДУЛЯ</label>
                        <input
                          type="text"
                          value={newPetItemName}
                          onChange={(e) => setNewPetItemName(e.target.value)}
                          required
                          placeholder="Например: Квантовый Визор Bastet"
                          className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink rounded-xl focus:outline-none focus:border-accent"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-ink">СЛОТ МОДУЛЯ</label>
                        <select
                          value={newPetItemSlot}
                          onChange={(e) => setNewPetItemSlot(e.target.value as any)}
                          className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink rounded-xl focus:outline-none focus:border-accent"
                        >
                          <option value="head">Голова / Визор / Сенсорный купол</option>
                          <option value="body">Корпус / Броня / Панцирь</option>
                          <option value="limbs">Конечности / Крылья / Опоры / Кольца</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-ink">БАЗОВАЯ ПЛАТФОРМА</label>
                        <select
                          value={newPetItemType}
                          onChange={(e) => setNewPetItemType(e.target.value as any)}
                          className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink rounded-xl focus:outline-none focus:border-accent"
                        >
                          <option value="cat">Кот (Cyber-Feline: Bastet)</option>
                          <option value="owl">Сова (Cyber-Owl: Noctua)</option>
                          <option value="snake">Змейка (Cyber-Serpent: Ouroboros)</option>
                          <option value="spider">Паук (Cyber-Arachnid: Arachne)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-ink">РЕДКОСТЬ МОДУЛЯ</label>
                        <select
                          value={newPetItemRarity}
                          onChange={(e) => setNewPetItemRarity(e.target.value as any)}
                          className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink rounded-xl focus:outline-none focus:border-accent"
                        >
                          <option value="common">Обычный (Common - #94A3B8)</option>
                          <option value="rare">Редкий (Rare - #38BDF8)</option>
                          <option value="epic">Эпический (Epic - #A855F7)</option>
                          <option value="legendary">Легендарный (Legendary - #F59E0B)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-ink">ЦЕНА В МОНЕТАХ</label>
                        <input
                          type="number"
                          value={newPetItemPrice}
                          onChange={(e) => setNewPetItemPrice(Number(e.target.value))}
                          required
                          min={1}
                          className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink rounded-xl focus:outline-none focus:border-accent"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-ink">ОПИСАНИЕ МОДУЛЯ</label>
                        <input
                          type="text"
                          value={newPetItemDesc}
                          onChange={(e) => setNewPetItemDesc(e.target.value)}
                          placeholder="Тактический модуль с прямым нейро-подключением"
                          className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink rounded-xl focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                  )}

                  {adminShopCategory === 'merch' && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-ink">НАЗВАНИЕ МЕРЧА</label>
                        <input
                          type="text"
                          value={newMerchName}
                          onChange={(e) => setNewMerchName(e.target.value)}
                          required
                          placeholder="Худи Hermes Oversize"
                          className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink rounded-xl focus:outline-none focus:border-accent"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-ink">ЦЕНА В МОНЕТАХ</label>
                        <input
                          type="number"
                          value={newMerchPrice}
                          onChange={(e) => setNewMerchPrice(Number(e.target.value))}
                          required
                          min={1}
                          className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink rounded-xl focus:outline-none focus:border-accent"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-2">
                        <label className="block text-xs font-bold text-ink">ОПИСАНИЕ МЕРЧА</label>
                        <input
                          type="text"
                          value={newMerchDesc}
                          onChange={(e) => setNewMerchDesc(e.target.value)}
                          placeholder="Размеры S, M, L, XL · Плотный хлопок"
                          className="w-full bg-paper border border-white/15 px-3.5 py-2.5 text-xs sm:text-sm text-ink rounded-xl focus:outline-none focus:border-accent"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-2">
                        <label className="block text-xs font-bold text-ink">ФОТО ТОВАРА</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileToDataUrl(file, setNewMerchMedia);
                          }}
                          className="text-xs text-ink/60"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-accent text-black font-bit text-sm uppercase tracking-wider hover:bg-white transition-all rounded-xl shadow-lg mt-2"
                  >
                    ДОБАВИТЬ В МАГАЗИН →
                  </button>
                </form>

                {/* Current Store Catalog List with Delete Option */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="text-xs font-bold text-ink tracking-wider uppercase">
                    ТЕКУЩИЕ ТОВАРЫ И СТИЛИ В БАЗЕ ({products.length})
                  </div>
                  <div className="divide-y divide-white/10 max-h-72 overflow-y-auto">
                    {products.map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          {p.category === 'style' ? (
                            <span
                              className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                              style={{ backgroundColor: p.colorHex || '#FF5500' }}
                            />
                          ) : p.category === 'pet' ? (
                            p.slot === 'head' || p.slot === 'hat' ? (
                              <Eye className="h-4 w-4 text-accent shrink-0" />
                            ) : p.slot === 'body' || p.slot === 'outfit' ? (
                              <Shield className="h-4 w-4 text-accent shrink-0" />
                            ) : (
                              <Activity className="h-4 w-4 text-accent shrink-0" />
                            )
                          ) : (
                            <ShoppingBag className="h-4 w-4 text-accent shrink-0" />
                          )}
                          <div>
                            <div className="font-bold text-ink">{p.name}</div>
                            <div className="text-[10px] text-ink/50 font-mono">
                              {p.category === 'style'
                                ? `Стиль (${p.colorHex})`
                                : p.category === 'pet'
                                ? `Модуль [${p.slot || 'head'}] · ${p.rarity || 'common'}`
                                : 'Мерч'} · {p.priceCoins} ⟠
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 text-ink/40 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                          title="Удалить товар"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= [HERMES_MAP: MOBILE_BOTTOM_DOCK] ================= */}
      {/* ================= MOBILE BOTTOM DOCK ================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper/95 backdrop-blur-md border-t border-white/15 safe-area-pb px-2 pt-2 pb-1.5 flex items-center justify-between rounded-t-2xl shadow-2xl">
        {DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'profile') {
                  openUserProfile(user.id);
                } else {
                  setCurrentView(item.id);
                }
                setMobileDrawerOpen(false);
              }}
              className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-1 px-1 rounded-xl transition-colors relative ${
                isActive ? 'text-accent font-bold bg-white/5' : 'text-ink/50 hover:text-ink'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[9px] uppercase tracking-wider truncate max-w-full font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute -top-2 w-6 h-1 bg-accent rounded-full shadow-sm shadow-accent/50" />
              )}
            </button>
          );
        })}

        {/* 5-th button: MORE / MENU DRAWER */}
        <button
          onClick={() => setMobileDrawerOpen((prev) => !prev)}
          className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-1 px-1 rounded-xl transition-colors relative ${
            mobileDrawerOpen ? 'text-accent font-bold bg-white/5' : 'text-ink/50 hover:text-ink'
          }`}
        >
          <Grid className="h-5 w-5 shrink-0" />
          <span className="text-[9px] uppercase tracking-wider truncate max-w-full font-medium">МЕНЮ</span>
          {mobileDrawerOpen && (
            <span className="absolute -top-2 w-6 h-1 bg-accent rounded-full shadow-sm shadow-accent/50" />
          )}
        </button>
      </nav>

      {/* ================= [HERMES_MAP: MOBILE_SLIDING_DRAWER] ================= */}
      {/* ================= MOBILE SLIDING DRAWER MENU ================= */}
      {/* Backdrop */}
      <div
        onClick={() => setMobileDrawerOpen(false)}
        className={`md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
          mobileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide-Up Bottom Sheet */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-50 bg-paper border-t-2 border-accent/60 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] max-h-[85vh] flex flex-col safe-area-pb ${
          mobileDrawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drawer Pull Handle & Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <HermesLogo className="h-6 w-6" />
            <span className="font-bit text-base font-bold text-ink tracking-wider">
              HERMES // DIRECTORY
            </span>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1.5 text-ink/60 hover:text-ink rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Navigation Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2.5">
          {ALL_NAV_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'profile') {
                    openUserProfile(user.id);
                  } else {
                    setCurrentView(item.id);
                  }
                  setMobileDrawerOpen(false);
                }}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  isActive
                    ? 'border-accent bg-accent/15 text-ink font-bold shadow-lg shadow-accent/10'
                    : 'border-white/10 bg-paper/50 text-ink/80 hover:border-white/30 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2.5">
                  <div className={`p-2 rounded-xl ${isActive ? 'bg-accent/20 text-accent' : 'bg-white/5 text-ink/60'}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-[10px] text-ink/40 font-mono">0{idx + 1}</span>
                </div>
                <div>
                  <div className="text-xs font-bold tracking-wider">{item.label}</div>
                  <div className="text-[10px] text-ink/50 truncate mt-0.5">
                    {item.sublabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Drawer Footer User Info & Logout */}
        <div className="p-4 border-t border-white/10 bg-paper/90 flex items-center justify-between shrink-0">
          <div
            onClick={() => {
              setCurrentView('profile');
              setMobileDrawerOpen(false);
            }}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <UserAvatar
              avatarUrl={user.avatarUrl}
              avatarColor={user.avatarColor}
              name={user.fullName || user.username}
              size="sm"
            />
            <div className="text-xs leading-none">
              <div className="font-bold text-ink">{user.fullName || user.username}</div>
              <div className="text-[10px] text-accent uppercase font-bold mt-1">{user.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl border border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-950/40 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>ВЫХОД</span>
          </button>
        </div>
      </div>

      {/* ================= [HERMES_MAP: MODAL_CYBER_CONFIRM] ================= */}
      {/* ================= CYBER CONFIRMATION MODAL ================= */}
      {confirmModal && confirmModal.isOpen && (
        <div
          onClick={confirmModal.onCancel}
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`border ${
              confirmModal.variant === 'warning'
                ? 'border-amber-500/50 shadow-amber-500/10'
                : confirmModal.variant === 'info'
                ? 'border-accent/50 shadow-accent/10'
                : 'border-red-500/50 shadow-red-500/10'
            } bg-paper p-6 sm:p-7 max-w-md w-full space-y-5 rounded-3xl shadow-2xl relative overflow-hidden`}
          >
            {/* Top Hazard Glowing Line */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${
                confirmModal.variant === 'warning'
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500'
                  : confirmModal.variant === 'info'
                  ? 'bg-gradient-to-r from-accent via-white to-accent'
                  : 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600'
              } animate-pulse`}
            />

            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div className="space-y-1 pr-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-accent uppercase">
                  / PROTOCOL 0x7E // СИСТЕМНОЕ ПОДТВЕРЖДЕНИЕ
                </span>
                <h3 className="font-bit text-xl text-ink leading-tight">
                  {confirmModal.title || 'ПОДТВЕРЖДЕНИЕ ДЕЙСТВИЯ'}
                </h3>
              </div>
              <button
                onClick={confirmModal.onCancel}
                className="text-ink/40 hover:text-ink text-sm p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex items-start gap-3.5 py-1">
              <div
                className={`p-3 rounded-2xl border shrink-0 ${
                  confirmModal.variant === 'warning'
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                    : confirmModal.variant === 'info'
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-red-500/40 bg-red-500/10 text-red-400'
                }`}
              >
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <p className="text-ink text-sm font-mono leading-snug">
                  {confirmModal.message}
                </p>
                {confirmModal.subtext && (
                  <p className="text-ink/60 text-xs leading-relaxed font-sans">
                    {confirmModal.subtext}
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={confirmModal.onCancel}
                className="px-4 py-2.5 rounded-xl border border-white/20 hover:border-white/40 text-xs font-bold text-ink/70 hover:text-ink uppercase tracking-wider transition-colors"
              >
                {confirmModal.cancelText || 'ОТМЕНА'}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                autoFocus
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg ${
                  confirmModal.variant === 'warning'
                    ? 'bg-amber-500 text-black hover:bg-white'
                    : confirmModal.variant === 'info'
                    ? 'bg-accent text-black hover:bg-white'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50'
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{confirmModal.confirmText || 'ПОДТВЕРДИТЬ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= [HERMES_MAP: TOAST_NOTIFICATIONS] ================= */}
      {/* ================= CYBER TOAST NOTIFICATIONS ================= */}
      {toasts.length > 0 && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-[110] flex flex-col gap-2.5 max-w-sm w-auto pointer-events-none p-1 sm:p-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl border p-3.5 bg-paper/95 backdrop-blur-md shadow-2xl space-y-1.5 transition-all ${
                toast.type === 'error'
                  ? 'border-red-500/60 text-red-300 shadow-red-950/30'
                  : toast.type === 'success'
                  ? 'border-emerald-500/60 text-emerald-300 shadow-emerald-950/30'
                  : 'border-accent/60 text-ink shadow-accent/20'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono tracking-widest font-bold">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      toast.type === 'error'
                        ? 'bg-red-500'
                        : toast.type === 'success'
                        ? 'bg-emerald-500'
                        : 'bg-accent'
                    } animate-pulse`}
                  />
                  {toast.type === 'error'
                    ? '[ SYSTEM // ОШИБКА ]'
                    : toast.type === 'success'
                    ? '[ SYSTEM // УСПЕШНО ]'
                    : '[ SYSTEM // СООБЩЕНИЕ ]'}
                </span>
                <button
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-ink/40 hover:text-ink text-xs p-1 rounded-md hover:bg-white/5 transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs font-mono leading-relaxed select-text">{toast.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

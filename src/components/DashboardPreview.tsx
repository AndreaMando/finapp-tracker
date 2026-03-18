import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ── Stat card ──────────────────────────────────────────────
function PreviewStatCard({
  label,
  value,
  sub,
  valueColor,
  icon,
  iconBg,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className={`text-xl font-bold tabular-nums tracking-tight ${valueColor}`}>{value}</p>
        {sub && <p className="text-[10px] text-gray-300 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Bar row ──────────────────────────────────────────────
function BarRow({ label, pct, color, amount }: { label: string; pct: number; color: string; amount: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-gray-500">{label}</span>
        <span className="text-[11px] text-gray-400 tabular-nums">{amount} <span className="text-gray-300">({pct}%)</span></span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Main preview component ──────────────────────────────────
export function DashboardPreview() {
  const stats = [
    {
      label: "Entrate",
      value: "€1,812",
      valueColor: "text-emerald-600",
      icon: <TrendingUp size={14} className="text-emerald-600" />,
      iconBg: "bg-emerald-50",
    },
    {
      label: "Spese Totali",
      value: "€397",
      sub: "Ricorrenti: €397.67",
      valueColor: "text-red-500",
      icon: <TrendingDown size={14} className="text-red-500" />,
      iconBg: "bg-red-50",
    },
    {
      label: "Obiettivi",
      value: "€0",
      valueColor: "text-indigo-500",
      icon: <Target size={14} className="text-indigo-500" />,
      iconBg: "bg-indigo-50",
    },
    {
      label: "Risparmi Netti",
      value: "€1,414",
      valueColor: "text-emerald-600",
      icon: <PiggyBank size={14} className="text-emerald-600" />,
      iconBg: "bg-emerald-50",
    },
  ];

  const breakdown = [
    { label: "Spese Ricorrenti", pct: 22, color: "bg-orange-400", amount: "€397.67" },
    { label: "Spese Una Tantum", pct: 0, color: "bg-red-400", amount: "€0.06" },
    { label: "Contributi Obiettivi", pct: 0, color: "bg-indigo-400", amount: "€0.00" },
    { label: "Risparmi", pct: 78, color: "bg-emerald-500", amount: "€1,414.27" },
  ];

  const actions = [
    { label: "Imposta entrate per questo mese", desc: "Registra i tuoi guadagni" },
    { label: "Gestisci le spese ricorrenti", desc: "Bollette, abbonamenti, assicurazioni" },
    { label: "Aggiungi una spesa", desc: "Cene, acquisti, ecc." },
    { label: "Contribuisci a un obiettivo", desc: "Monitora i tuoi obiettivi di risparmio" },
  ];

  return (
    <div className="p-5 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight">Cruscotto</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Panoramica finanziaria mensile</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
          <ChevronLeft size={12} className="text-gray-400" />
          <span className="text-[11px] font-semibold text-gray-600 mx-1">Marzo 2026</span>
          <ChevronRight size={12} className="text-gray-400" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {stats.map((s) => (
          <PreviewStatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Breakdown */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs font-semibold text-gray-700 mb-3">Suddivisione delle Spese</p>
          <div className="space-y-2.5">
            {breakdown.map((b) => (
              <BarRow key={b.label} {...b} />
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs font-semibold text-gray-700 mb-3">Azioni Rapide</p>
          <div className="divide-y divide-gray-50">
            {actions.map(({ label, desc }) => (
              <div key={label} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <div>
                  <p className="text-[11px] font-medium text-gray-700">{label}</p>
                  <p className="text-[10px] text-gray-400">{desc}</p>
                </div>
                <ArrowRight size={11} className="text-gray-300 shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-700">Obiettivi di Risparmio</p>
          <span className="text-[11px] text-indigo-500 font-medium">Vedi tutti →</span>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs font-semibold text-gray-700">Anticipo mutuo</span>
            </div>
            <span className="text-[10px] text-gray-400">289g rimanenti</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full mb-2">
            <div className="h-full w-0 rounded-full bg-amber-400" />
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] text-gray-400">€0.00 salvato</span>
            <span className="text-[10px] font-semibold text-amber-500">0%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
import { TrendingUp, TrendingDown, PiggyBank, Target, ArrowRight } from "lucide-react";

export function DashboardPreview() {
  const stats = [
    { label: "Entrate", value: "€1,812.00", color: "text-emerald-600", bg: "bg-emerald-50", icon: <TrendingUp size={18} className="text-emerald-600" /> },
    { label: "Spese Totali", value: "€397.73", color: "text-red-500", bg: "bg-red-50", icon: <TrendingDown size={18} className="text-red-500" />, sub: "Ricorrenti: €397.67" },
    { label: "Obiettivi", value: "€0.00", color: "text-indigo-600", bg: "bg-indigo-50", icon: <Target size={18} className="text-indigo-600" /> },
    { label: "Risparmi Netti", value: "€1,414.27", color: "text-emerald-600", bg: "bg-emerald-50", icon: <PiggyBank size={18} className="text-emerald-600" /> },
  ];

  const breakdown = [
    { label: "Spese Ricorrenti", pct: 22, color: "bg-orange-400" },
    { label: "Spese Una Tantum", pct: 0, color: "bg-red-400" },
    { label: "Contributi Obiettivi", pct: 0, color: "bg-indigo-400" },
    { label: "Risparmi", pct: 78, color: "bg-emerald-400" },
  ];

  const actions = [
    { label: "Imposta entrate per questo mese", desc: "Registra i tuoi guadagni" },
    { label: "Gestisci le spese ricorrenti", desc: "Bollette, abbonamenti, assicurazioni" },
    { label: "Aggiungi una spesa", desc: "Cene, acquisti, ecc." },
    { label: "Contribuisci a un obiettivo", desc: "Monitora i tuoi obiettivi di risparmio" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cruscotto</h1>
          <p className="text-gray-400 text-xs mt-0.5">Panoramica finanziaria mensile</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-600">
          ‹ Marzo 2026 ›
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, color, bg, icon, sub }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
                {sub && <p className="text-xs text-gray-300 mt-0.5">{sub}</p>}
              </div>
              <div className={`p-2 rounded-lg ${bg}`}>{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Breakdown */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">Suddivisione delle Spese</p>
          <div className="space-y-2.5">
            {breakdown.map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-400">{pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">Azioni Rapide</p>
          <div className="space-y-1">
            {actions.map(({ label, desc }) => (
              <div key={label} className="flex items-center justify-between p-2 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <ArrowRight size={12} className="text-gray-300 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goal */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Obiettivi di Risparmio</p>
        <div className="bg-white rounded-xl p-4 border border-gray-100 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-xs font-semibold text-gray-700">Anticipo mutuo</span>
            <span className="text-xs text-gray-400 ml-auto">289g rimanenti</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
            <div className="h-1.5 rounded-full bg-amber-400" style={{ width: "0%" }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>€0.00 salvato</span>
            <span className="text-amber-500 font-medium">0%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default DashboardPreview;
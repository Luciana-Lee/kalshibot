import type { BetAnalysis } from "@/lib/model";
import { TrendingUp, Activity, Target, Zap } from "lucide-react";

interface StatsBarProps {
  totalMarketsAnalyzed: number;
  positiveEVCount: number;
  avgEdge: number;
  bestBet: BetAnalysis | null;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

function StatCard({ icon, label, value, sub, highlight }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 flex items-center gap-3 ${
        highlight
          ? "bg-emerald-500/10 border-emerald-500/30"
          : "bg-card/60 border-border/60"
      }`}
    >
      <div
        className={`p-2 rounded-lg ${
          highlight ? "bg-emerald-500/20 text-emerald-400" : "bg-muted/50 text-muted-foreground"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
        <p className={`text-xl font-bold ${highlight ? "text-emerald-400" : "text-foreground"}`}>
          {value}
        </p>
        {sub && <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function StatsBar({ totalMarketsAnalyzed, positiveEVCount, avgEdge, bestBet }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={<Activity className="w-4 h-4" />}
        label="Markets Analyzed"
        value={totalMarketsAnalyzed.toLocaleString()}
      />
      <StatCard
        icon={<TrendingUp className="w-4 h-4" />}
        label="+EV Opportunities"
        value={String(positiveEVCount)}
        highlight={positiveEVCount > 0}
      />
      <StatCard
        icon={<Target className="w-4 h-4" />}
        label="Avg Edge"
        value={`${(avgEdge * 100).toFixed(1)}%`}
      />
      <StatCard
        icon={<Zap className="w-4 h-4" />}
        label="Best EV Bet"
        value={
          bestBet
            ? `+${(bestBet.expectedValue * 100).toFixed(2)}¢`
            : "—"
        }
        sub={bestBet?.title}
        highlight={!!bestBet}
      />
    </div>
  );
}

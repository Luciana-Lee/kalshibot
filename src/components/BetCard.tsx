import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { BetAnalysis } from "@/lib/model";
import { TrendingUp, TrendingDown, Clock, BarChart2 } from "lucide-react";

interface BetCardProps {
  bet: BetAnalysis;
}

const CONFIDENCE_STYLES: Record<BetAnalysis["confidence"], { badge: string; dot: string; label: string }> = {
  HIGH: {
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400",
    label: "HIGH",
  },
  MEDIUM: {
    badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    dot: "bg-yellow-400",
    label: "MEDIUM",
  },
  LOW: {
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    dot: "bg-orange-400",
    label: "LOW",
  },
};

function formatPercent(val: number): string {
  return `${(val * 100).toFixed(1)}%`;
}

function formatEV(ev: number): string {
  const sign = ev >= 0 ? "+" : "";
  return `${sign}${(ev * 100).toFixed(2)}¢`;
}

export function BetCard({ bet }: BetCardProps) {
  const conf = CONFIDENCE_STYLES[bet.confidence];
  const isPositiveEdge = bet.edge > 0;
  const closesIn = (() => {
    try {
      return formatDistanceToNow(new Date(bet.closeTime), { addSuffix: true });
    } catch {
      return "unknown";
    }
  })();

  const borderColor = Math.abs(bet.edge) > 0.2
    ? "border-emerald-500/40"
    : Math.abs(bet.edge) > 0.1
    ? "border-yellow-500/30"
    : "border-border/50";

  return (
    <Card
      className={`bg-card/80 backdrop-blur border ${borderColor} transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-widest">
              {bet.ticker}
            </p>
            <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
              {bet.title}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge
              className={`text-[10px] font-semibold uppercase tracking-wide border px-2 py-0 ${
                bet.betDirection === "YES"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-red-500/15 text-red-400 border-red-500/30"
              }`}
            >
              {bet.betDirection === "YES" ? (
                <TrendingUp className="w-3 h-3 mr-1 inline" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 inline" />
              )}
              BET {bet.betDirection}
            </Badge>
            <Badge
              className={`text-[10px] font-semibold uppercase tracking-wide border px-2 py-0 ${conf.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${conf.dot} mr-1.5 inline-block`} />
              {conf.label}
            </Badge>
          </div>
        </div>

        <Badge variant="outline" className="w-fit text-[10px] font-medium capitalize mt-1 text-muted-foreground">
          {bet.category}
        </Badge>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 bg-muted/30 rounded-lg p-3 mb-3">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide">Kalshi</p>
            <p className="text-sm font-bold text-foreground">
              {formatPercent(bet.kalshiImpliedProb)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide">Model</p>
            <p className="text-sm font-bold text-foreground">{formatPercent(bet.modelProb)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide">Edge</p>
            <p
              className={`text-sm font-bold ${
                isPositiveEdge ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isPositiveEdge ? "+" : ""}
              {formatPercent(bet.edge)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide">EV</p>
            <p
              className={`text-sm font-bold ${
                bet.expectedValue > 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {formatEV(bet.expectedValue)}
            </p>
          </div>
        </div>

        {/* Reasoning */}
        <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-3">
          {bet.reasoning}
        </p>

        <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-mono">
          Source: {bet.dataSource}
        </p>
      </CardContent>

      <CardFooter className="pt-0 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 mt-1 pb-3">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Closes {closesIn}</span>
        </div>
        <div className="flex items-center gap-1">
          <BarChart2 className="w-3 h-3" />
          <span>{bet.volume.toLocaleString()} vol</span>
        </div>
      </CardFooter>
    </Card>
  );
}

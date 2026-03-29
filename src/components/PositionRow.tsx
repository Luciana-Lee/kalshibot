import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { toast } from "sonner";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMarket } from "@/lib/kalshi";
import { useClosePosition } from "@/hooks/use-positions";
import type { KalshiPosition } from "@/hooks/use-positions";

interface PositionRowProps {
  position: KalshiPosition;
}

type ExitSignal = "EXIT_NOW" | "TAKE_PROFIT" | "HOLD";

function computeSignal(roi: number, hoursToClose: number): ExitSignal {
  if (roi > 150 || (roi > 50 && hoursToClose < 2)) return "EXIT_NOW";
  if (roi > 80 && hoursToClose < 24) return "TAKE_PROFIT";
  return "HOLD";
}

function SignalBadge({ signal }: { signal: ExitSignal; roi: number }) {
  if (signal === "EXIT_NOW") {
    return (
      <Badge className="bg-red-500/15 text-red-400 border border-red-500/40 text-[10px] font-semibold uppercase tracking-wide animate-pulse">
        EXIT NOW
      </Badge>
    );
  }
  if (signal === "TAKE_PROFIT") {
    return (
      <Badge className="bg-yellow-500/15 text-yellow-400 border border-yellow-500/40 text-[10px] font-semibold uppercase tracking-wide">
        TAKE PROFIT
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wide">
      HOLD
    </Badge>
  );
}

export function PositionRow({ position }: PositionRowProps) {
  const [closing, setClosing] = useState(false);
  const closePosition = useClosePosition();

  const { data: market, isLoading: marketLoading } = useQuery({
    queryKey: ["kalshi_market", position.ticker],
    queryFn: () => getMarket(position.ticker),
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 1,
  });

  // Determine current price in cents based on direction
  const currentPriceCents: number | null = market
    ? position.direction === "YES"
      ? (market.yes_bid ?? market.last_price ?? null)
      : (market.no_bid ?? null)
    : null;

  const roi =
    currentPriceCents !== null
      ? ((currentPriceCents - position.entry_price) / position.entry_price) * 100
      : null;

  const hoursToClose = differenceInHours(new Date(position.close_time), new Date());
  const signal = roi !== null ? computeSignal(roi, hoursToClose) : "HOLD";

  const closesIn = (() => {
    try {
      return formatDistanceToNow(new Date(position.close_time), { addSuffix: true });
    } catch {
      return "—";
    }
  })();

  async function handleClose() {
    if (currentPriceCents === null) {
      toast.error("Cannot close position: current price unavailable.");
      return;
    }
    setClosing(true);
    try {
      const pnl = ((currentPriceCents - position.entry_price) / position.entry_price) * 100;
      await closePosition.mutateAsync({
        id: position.id,
        exit_price: currentPriceCents,
        pnl_percent: Math.round(pnl * 100) / 100,
      });
      toast.success("Position closed.");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to close position.");
    } finally {
      setClosing(false);
    }
  }

  return (
    <TableRow className="hover:bg-muted/20">
      {/* Market */}
      <TableCell className="max-w-[200px]">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider truncate">
          {position.ticker}
        </p>
        <p className="text-sm font-medium text-foreground truncate leading-snug mt-0.5">
          {position.title}
        </p>
      </TableCell>

      {/* Direction */}
      <TableCell>
        <Badge
          className={`text-[10px] font-semibold uppercase border ${
            position.direction === "YES"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "bg-red-500/15 text-red-400 border-red-500/30"
          }`}
        >
          {position.direction}
        </Badge>
      </TableCell>

      {/* Entry */}
      <TableCell className="text-sm font-mono text-foreground">
        {position.entry_price}¢
      </TableCell>

      {/* Current */}
      <TableCell className="text-sm font-mono">
        {marketLoading ? (
          <Skeleton className="h-4 w-10" />
        ) : currentPriceCents !== null ? (
          <span className="text-foreground">{currentPriceCents}¢</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* P&L */}
      <TableCell className="text-sm font-mono font-semibold">
        {roi !== null ? (
          <span className={roi >= 0 ? "text-emerald-400" : "text-red-400"}>
            {roi >= 0 ? "+" : ""}
            {roi.toFixed(1)}%
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Closes */}
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {closesIn}
      </TableCell>

      {/* Signal */}
      <TableCell>
        <SignalBadge signal={signal} roi={roi ?? 0} />
      </TableCell>

      {/* Action */}
      <TableCell>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs border-border/60 hover:border-red-400/60 hover:text-red-400"
          onClick={handleClose}
          disabled={closing || closePosition.isPending}
        >
          {closing ? "Closing…" : "Close"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

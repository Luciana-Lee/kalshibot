import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useKalshibotData } from "@/hooks/use-kalshibot";
import { BetCard } from "@/components/BetCard";
import { StatsBar } from "@/components/StatsBar";
import { FilterBar } from "@/components/FilterBar";
import { PositionsTable } from "@/components/PositionsTable";
import { LiveAlertBanner } from "@/components/LiveAlertBanner";
import type { FilterState } from "@/components/FilterBar";
import type { BetAnalysis } from "@/lib/model";
import {
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Bot,
  SearchX,
} from "lucide-react";

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-3">
      <div className="flex justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-4 gap-2 bg-muted/20 rounded-lg p-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1.5 text-center">
            <Skeleton className="h-2.5 w-10 mx-auto" />
            <Skeleton className="h-4 w-12 mx-auto" />
          </div>
        ))}
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError, error, refetch, isFetching } = useKalshibotData();

  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    minEdge: 5,
    confidence: "all",
    sortBy: "ev",
  });

  const filteredBets = useMemo(() => {
    if (!data) return [];

    let bets: BetAnalysis[] = [...data.positiveEVBets];

    if (filters.category !== "all") {
      bets = bets.filter((b) => {
        const cat = b.category.toLowerCase();
        if (filters.category === "weather") return cat.includes("weather") || cat.includes("climate");
        if (filters.category === "economics")
          return (
            cat.includes("econom") ||
            cat.includes("finance") ||
            cat.includes("indicator")
          );
        return true;
      });
    }

    if (filters.confidence !== "all") {
      if (filters.confidence === "HIGH") {
        bets = bets.filter((b) => b.confidence === "HIGH");
      } else if (filters.confidence === "MEDIUM") {
        bets = bets.filter((b) => b.confidence === "HIGH" || b.confidence === "MEDIUM");
      }
    }

    const minEdgeFrac = filters.minEdge / 100;
    bets = bets.filter((b) => Math.abs(b.edge) >= minEdgeFrac);

    if (filters.sortBy === "ev") {
      bets.sort((a, b) => b.expectedValue - a.expectedValue);
    } else if (filters.sortBy === "edge") {
      bets.sort((a, b) => Math.abs(b.edge) - Math.abs(a.edge));
    } else if (filters.sortBy === "closes") {
      bets.sort(
        (a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime()
      );
    }

    return bets;
  }, [data, filters]);

  return (
    <div className="min-h-screen bg-background">
      <LiveAlertBanner />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30">
              <Bot className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                Kalshibot
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full px-2.5 py-0.5">
                  <TrendingUp className="w-3 h-3" />
                  LIVE
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Data-backed Kalshi bet suggestions powered by NOAA + FRED models
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5 border-border/60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
            {data && (
              <p className="text-[11px] text-muted-foreground">
                Updated {formatDistanceToNow(data.lastUpdated, { addSuffix: true })}
              </p>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : data ? (
          <StatsBar
            totalMarketsAnalyzed={data.totalMarketsAnalyzed}
            positiveEVCount={data.positiveEVBets.length}
            avgEdge={data.avgEdge}
            bestBet={data.bestBet}
          />
        ) : null}

        {/* Positions Table — my open bets with live exit signals */}
        <PositionsTable />

        <Separator className="border-border/40" />

        {/* Filter Bar */}
        <FilterBar filters={filters} onChange={setFilters} />

        {/* Error state */}
        {isError && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div>
              <p className="font-semibold">Failed to load market data</p>
              <p className="text-xs text-destructive/80 mt-0.5">
                {(error as Error)?.message ?? "Unknown error. Check your API keys and network."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading grid */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Results */}
        {!isLoading && data && (
          <>
            {filteredBets.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-semibold text-foreground">{filteredBets.length}</span>{" "}
                    positive-EV{" "}
                    {filteredBets.length === 1 ? "opportunity" : "opportunities"}
                    {data.totalMarketsAnalyzed > 0 && (
                      <> from {data.totalMarketsAnalyzed} markets analyzed</>
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredBets.map((bet) => (
                    <BetCard key={bet.ticker} bet={bet} />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="p-4 rounded-full bg-muted/30">
                  <SearchX className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">No positive-EV bets found</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Try lowering the minimum edge filter, or check back after the next refresh when
                    new markets may be available.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setFilters((f) => ({ ...f, minEdge: 0 }))}>
                  Clear edge filter
                </Button>
              </div>
            )}
          </>
        )}

        {/* Disclaimer */}
        <p className="text-[11px] text-muted-foreground/50 text-center pt-4 border-t border-border/30">
          For informational purposes only. Kalshibot uses statistical models and third-party data
          sources which may be inaccurate or delayed. Past model accuracy does not guarantee future
          results. Bet responsibly.
        </p>
      </div>
    </div>
  );
}

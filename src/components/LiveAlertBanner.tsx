import { useState, useEffect, useCallback, useRef } from "react";
import { differenceInHours } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { X, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMarket } from "@/lib/kalshi";
import { usePositions } from "@/hooks/use-positions";
import type { KalshiPosition } from "@/hooks/use-positions";

interface AlertInfo {
  level: "EXIT_NOW" | "TAKE_PROFIT";
  title: string;
  roi: number;
}

function computeAlert(
  position: KalshiPosition,
  currentPrice: number | null
): AlertInfo | null {
  if (currentPrice === null) return null;

  const roi = ((currentPrice - position.entry_price) / position.entry_price) * 100;
  const hoursToClose = differenceInHours(new Date(position.close_time), new Date());

  if (roi > 150 || (roi > 50 && hoursToClose < 2)) {
    return { level: "EXIT_NOW", title: position.title, roi };
  }
  if (roi > 80 && hoursToClose < 24) {
    return { level: "TAKE_PROFIT", title: position.title, roi };
  }
  return null;
}

function useNotificationPermission() {
  const requestedRef = useRef(false);

  const requestPermission = useCallback(() => {
    if (requestedRef.current) return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      requestedRef.current = true;
      Notification.requestPermission();
    }
  }, []);

  return requestPermission;
}

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio not supported — silently skip
  }
}

interface PositionPriceProps {
  position: KalshiPosition;
  onAlert: (alert: AlertInfo | null) => void;
}

function PositionPriceWatcher({ position, onAlert }: PositionPriceProps) {
  const { data: market } = useQuery({
    queryKey: ["kalshi_market", position.ticker],
    queryFn: () => getMarket(position.ticker),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    if (!market) return;
    const currentPrice =
      position.direction === "YES"
        ? (market.yes_bid ?? market.last_price ?? null)
        : (market.no_bid ?? null);
    const alert = computeAlert(position, currentPrice);
    onAlert(alert);
  }, [market, position, onAlert]);

  return null;
}

export function LiveAlertBanner() {
  const { data: positions } = usePositions();
  const [dismissed, setDismissed] = useState(false);
  const [alerts, setAlerts] = useState<Record<string, AlertInfo | null>>({});
  const requestPermission = useNotificationPermission();
  const soundPlayedRef = useRef(false);

  // Request notification permission once on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const handleAlert = useCallback((id: string) => (alert: AlertInfo | null) => {
    setAlerts((prev) => ({ ...prev, [id]: alert }));
  }, []);

  // Find the most urgent alert to display
  const urgentAlert = (() => {
    const all = Object.values(alerts).filter((a): a is AlertInfo => a !== null);
    const exitNow = all.find((a) => a.level === "EXIT_NOW");
    if (exitNow) return exitNow;
    const takeProfit = all.find((a) => a.level === "TAKE_PROFIT");
    return takeProfit ?? null;
  })();

  // Play sound when a new EXIT_NOW alert fires
  useEffect(() => {
    if (urgentAlert?.level === "EXIT_NOW" && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      playAlertSound();
      setDismissed(false);
    }
    if (!urgentAlert) {
      soundPlayedRef.current = false;
    }
  }, [urgentAlert]);

  // Re-show banner when a new alert appears after dismissal
  useEffect(() => {
    if (urgentAlert) setDismissed(false);
  }, [urgentAlert?.title, urgentAlert?.level]); // eslint-disable-line react-hooks/exhaustive-deps

  const isExitNow = urgentAlert?.level === "EXIT_NOW";

  return (
    <>
      {/* Invisible watchers — one per open position */}
      {(positions ?? []).map((p) => (
        <PositionPriceWatcher key={p.id} position={p} onAlert={handleAlert(p.id)} />
      ))}

      {/* Banner */}
      {urgentAlert && !dismissed && (
        <div
          className={`sticky top-0 z-50 flex items-center gap-3 px-5 py-3 text-sm font-medium ${
            isExitNow
              ? "bg-red-500/20 border-b border-red-500/40 text-red-300"
              : "bg-yellow-500/15 border-b border-yellow-500/30 text-yellow-300"
          }`}
        >
          <span
            className={`shrink-0 ${isExitNow ? "animate-pulse" : ""}`}
          >
            {isExitNow ? (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            ) : (
              <TrendingUp className="w-4 h-4 text-yellow-400" />
            )}
          </span>

          <span className="flex-1">
            {isExitNow ? (
              <>
                <span className="font-bold text-red-300">EXIT NOW:</span>{" "}
                <span className="font-semibold">{urgentAlert.title}</span>{" "}
                is up{" "}
                <span className="font-bold">{urgentAlert.roi.toFixed(1)}%</span>
                {" "}— sell before close!
              </>
            ) : (
              <>
                <span className="font-bold text-yellow-300">Consider taking profit</span>{" "}
                on{" "}
                <span className="font-semibold">{urgentAlert.title}</span>{" "}
                — up{" "}
                <span className="font-bold">{urgentAlert.roi.toFixed(1)}%</span>
              </>
            )}
          </span>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0 opacity-70 hover:opacity-100"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss alert"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </>
  );
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KalshiPosition {
  id: string;
  ticker: string;
  title: string;
  direction: "YES" | "NO";
  entry_price: number;
  contracts: number;
  close_time: string;
  notes: string | null;
  status: "open" | "closed";
  exit_price: number | null;
  pnl_percent: number | null;
  created_at: string;
}

export interface AddPositionInput {
  ticker: string;
  title: string;
  direction: "YES" | "NO";
  entry_price: number;
  contracts: number;
  close_time: string;
  notes?: string;
}

export interface ClosePositionInput {
  id: string;
  exit_price: number;
  pnl_percent: number;
}

const POSITIONS_QUERY_KEY = ["kalshibot_positions"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const positionsTable = () => (supabase as any).from("kalshibot_positions");

export function usePositions() {
  return useQuery<KalshiPosition[], Error>({
    queryKey: POSITIONS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await positionsTable()
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as KalshiPosition[];
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useAddPosition() {
  const queryClient = useQueryClient();

  return useMutation<KalshiPosition, Error, AddPositionInput>({
    mutationFn: async (input) => {
      const { data, error } = await positionsTable()
        .insert({
          ticker: input.ticker,
          title: input.title,
          direction: input.direction,
          entry_price: input.entry_price,
          contracts: input.contracts,
          close_time: input.close_time,
          notes: input.notes ?? null,
          status: "open",
          exit_price: null,
          pnl_percent: null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as KalshiPosition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSITIONS_QUERY_KEY });
    },
  });
}

export function useClosePosition() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ClosePositionInput>({
    mutationFn: async ({ id, exit_price, pnl_percent }) => {
      const { error } = await positionsTable()
        .update({ status: "closed", exit_price, pnl_percent })
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSITIONS_QUERY_KEY });
    },
  });
}

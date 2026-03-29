import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Layers } from "lucide-react";
import { usePositions } from "@/hooks/use-positions";
import { AddPositionModal } from "@/components/AddPositionModal";
import { PositionRow } from "@/components/PositionRow";

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="p-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </TableRow>
  );
}

export function PositionsTable() {
  const { data: positions, isLoading } = usePositions();

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30">
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">My Positions</h2>
          {positions && positions.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({positions.length} open)
            </span>
          )}
        </div>
        <AddPositionModal />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/40">
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Market
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Direction
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Entry
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Current
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                P&amp;L
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Closes
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Signal
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
            ) : positions && positions.length > 0 ? (
              positions.map((position) => (
                <PositionRow key={position.id} position={position} />
              ))
            ) : (
              <TableRow>
                <td
                  colSpan={8}
                  className="text-center py-12 text-sm text-muted-foreground"
                >
                  No open positions. Add your first bet above.
                </td>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";

export type CategoryFilter = "all" | "weather" | "economics";
export type ConfidenceFilter = "all" | "HIGH" | "MEDIUM";
export type SortBy = "ev" | "edge" | "closes";

export interface FilterState {
  category: CategoryFilter;
  minEdge: number;
  confidence: ConfidenceFilter;
  sortBy: SortBy;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  function update<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 bg-card/60 border border-border/60 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <SlidersHorizontal className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wider">Filters</span>
      </div>

      <div className="w-px h-5 bg-border/60 hidden sm:block" />

      {/* Category */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">Category</span>
        <Select
          value={filters.category}
          onValueChange={(v) => update("category", v as CategoryFilter)}
        >
          <SelectTrigger className="h-7 text-xs w-[110px] border-border/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All</SelectItem>
            <SelectItem value="weather" className="text-xs">Weather</SelectItem>
            <SelectItem value="economics" className="text-xs">Economics</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Confidence */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">Confidence</span>
        <Select
          value={filters.confidence}
          onValueChange={(v) => update("confidence", v as ConfidenceFilter)}
        >
          <SelectTrigger className="h-7 text-xs w-[100px] border-border/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All</SelectItem>
            <SelectItem value="HIGH" className="text-xs">High only</SelectItem>
            <SelectItem value="MEDIUM" className="text-xs">Med+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Min Edge slider */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
          Min Edge: <span className="text-foreground font-semibold">{filters.minEdge}%</span>
        </span>
        <div className="w-28">
          <Slider
            min={0}
            max={30}
            step={1}
            value={[filters.minEdge]}
            onValueChange={([v]) => update("minEdge", v)}
            className="cursor-pointer"
          />
        </div>
      </div>

      <div className="w-px h-5 bg-border/60 hidden sm:block" />

      {/* Sort by */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">Sort</span>
        <div className="flex gap-1">
          {(["ev", "edge", "closes"] as SortBy[]).map((s) => (
            <Button
              key={s}
              variant={filters.sortBy === s ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-[11px] px-2.5 capitalize"
              onClick={() => update("sortBy", s)}
            >
              {s === "ev" ? "EV" : s === "edge" ? "Edge" : "Closes"}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

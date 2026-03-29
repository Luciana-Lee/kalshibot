import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddPosition } from "@/hooks/use-positions";

export function AddPositionModal() {
  const [open, setOpen] = useState(false);
  const addPosition = useAddPosition();

  const [ticker, setTicker] = useState("");
  const [title, setTitle] = useState("");
  const [direction, setDirection] = useState<"YES" | "NO">("YES");
  const [entryPrice, setEntryPrice] = useState("");
  const [contracts, setContracts] = useState("1");
  const [closeTime, setCloseTime] = useState("");
  const [notes, setNotes] = useState("");

  function resetForm() {
    setTicker("");
    setTitle("");
    setDirection("YES");
    setEntryPrice("");
    setContracts("1");
    setCloseTime("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const ep = parseInt(entryPrice, 10);
    const ct = parseInt(contracts, 10);

    if (!ticker.trim() || !title.trim() || !closeTime) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (isNaN(ep) || ep < 1 || ep > 99) {
      toast.error("Entry price must be between 1 and 99 cents.");
      return;
    }
    if (isNaN(ct) || ct < 1) {
      toast.error("Number of contracts must be at least 1.");
      return;
    }

    try {
      await addPosition.mutateAsync({
        ticker: ticker.trim().toUpperCase(),
        title: title.trim(),
        direction,
        entry_price: ep,
        contracts: ct,
        close_time: new Date(closeTime).toISOString(),
        notes: notes.trim() || undefined,
      });
      toast.success("Position added!");
      resetForm();
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to add position.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white">
          <Plus className="w-3.5 h-3.5" />
          Add Position
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log New Position</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Ticker */}
          <div className="space-y-1.5">
            <Label htmlFor="ticker" className="text-xs font-medium">
              Market Ticker <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ticker"
              placeholder="e.g. WEATHER-NYC-2026-03-30-RAIN"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="font-mono text-xs uppercase"
              required
            />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium">
              Market Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Will it rain in NYC on Mar 30?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Direction + Entry Price row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Direction <span className="text-destructive">*</span>
              </Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as "YES" | "NO")}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YES">YES</SelectItem>
                  <SelectItem value="NO">NO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="entry-price" className="text-xs font-medium">
                Entry Price (¢) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="entry-price"
                type="number"
                min={1}
                max={99}
                placeholder="32"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Contracts + Close Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contracts" className="text-xs font-medium">
                Contracts
              </Label>
              <Input
                id="contracts"
                type="number"
                min={1}
                placeholder="1"
                value={contracts}
                onChange={(e) => setContracts(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="close-time" className="text-xs font-medium">
                Close Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="close-time"
                type="datetime-local"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-medium">
              Notes <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Why are you making this bet?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              disabled={addPosition.isPending}
            >
              {addPosition.isPending ? "Saving..." : "Save Position"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

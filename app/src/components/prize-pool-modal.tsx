import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { lamportsShortString } from "@/lib/utils";

interface PrizePoolModalProps {
  open: boolean;
  onClose: () => void;
  prizePool: number;
}

export function PrizePoolModal({ open, onClose, prizePool }: PrizePoolModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">PRIZE POOL</DialogTitle>
          <DialogDescription>The ultimate reward for the boldest Runners</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 border-2 border-black rounded-md bg-[#f8f8f8]">
            <div className="flex justify-between items-center">
              <span className="font-bold">Current Pool:</span>
              <span className="font-mono text-xl">{lamportsShortString(prizePool)}</span>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg">How It Works</h3>
            <p className="text-sm mt-1">
              Every cipher purchase from every player contributes to this growing prize pool. The
              bigger it gets, the more challenging - and rewarding - the run becomes.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg">Win It All</h3>
            <p className="text-sm mt-1">
              The first Runner to reach the end of the path claims the entire prize pool. When
              someone wins, a new run begins with a fresh pool.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg">Risk & Reward</h3>
            <p className="text-sm mt-1">
              As the prize pool grows, so does the path length. More steps to victory means higher
              risk, but the potential reward grows with each cipher purchased in the network.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CostInfoModalProps {
  open: boolean
  onClose: () => void
  baseCost: number
  selectedCardsCount: number
}

export function CostInfoModal({ open, onClose, baseCost, selectedCardsCount }: CostInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">MOVE COST</DialogTitle>
          <DialogDescription>How cipher costs are calculated for each move</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 border-2 border-black rounded-md bg-[#f8f8f8]">
            <div className="flex justify-between items-center">
              <span className="font-bold">Base Cost:</span>
              <span className="font-mono text-lg">{baseCost}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-bold">Selected Cards:</span>
              <span className="font-mono text-lg">+{selectedCardsCount}</span>
            </div>
            <div className="border-t-2 border-black mt-2 pt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold">Total Cost:</span>
                <span className="font-mono text-xl">{baseCost + selectedCardsCount}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg">How It Works</h3>
            <p className="text-sm mt-1">
              Each move has a base cost of {baseCost} cipher. When you select cards to use with your move, each card
              adds +1 to the total cost.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg">Card Effects</h3>
            <p className="text-sm mt-1">
              Some cards like "Swift" can reduce the cost of your next move, while using multiple cards will increase
              the cost but provide more powerful effects.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


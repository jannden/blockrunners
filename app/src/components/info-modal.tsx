import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, Shield, Copy, Zap, Rewind } from "lucide-react"

interface InfoModalProps {
  open: boolean
  onClose: () => void
}

export function InfoModal({ open, onClose }: InfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tighter">BLOCKRUNNERS</DialogTitle>
          <DialogDescription>A rogue-lite blockchain game in cyberpunk style</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-lg">How to Play</h3>
            <p className="text-sm mt-1">
              Navigate through the neon-lit streets of the cyberpunk city by choosing your path. Each move costs
              ciphers, which are the game's currency.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg">Ability Cards</h3>
            <p className="text-sm mt-1">
              Collect ability cards to gain advantages in your journey. There are 5 types of cards:
            </p>
            <ul className="text-sm mt-2 space-y-3 pl-2">
              <li className="flex items-center">
                <div className="bg-[#9c27b0] text-white p-1 rounded-md mr-2">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold">Oracle</span> - Reveals the correct path for the next step.
                </div>
              </li>
              <li className="flex items-center">
                <div className="bg-[#2196f3] text-white p-1 rounded-md mr-2">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold">Shield</span> - Prevents a reset if the next step is incorrect.
                </div>
              </li>
              <li className="flex items-center">
                <div className="bg-[#ff9800] text-white p-1 rounded-md mr-2">
                  <Copy className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold">Doubler</span> - The next correct step awards two random cards instead of
                  one.
                </div>
              </li>
              <li className="flex items-center">
                <div className="bg-[#4caf50] text-white p-1 rounded-md mr-2">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold">Swift</span> - The next step costs one less cipher.
                </div>
              </li>
              <li className="flex items-center">
                <div className="bg-[#f44336] text-white p-1 rounded-md mr-2">
                  <Rewind className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold">Dejavu</span> - Teleports the player three steps back.
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg">Using Cards</h3>
            <p className="text-sm mt-1">
              Select cards before making a move to activate their effects. Each selected card increases the cost of your
              next move by 1 cipher. You can select multiple cards for a single move.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


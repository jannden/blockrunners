"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

interface BuyCiphersModalProps {
  open: boolean
  onClose: () => void
  onBuy: (amount: number) => void
}

export function BuyCiphersModal({ open, onClose, onBuy }: BuyCiphersModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)

  const cipherPackages = [
    { amount: 5, price: "0.001 ETH", discount: false },
    { amount: 15, price: "0.0025 ETH", discount: true },
    { amount: 50, price: "0.007 ETH", discount: true },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">BUY CIPHERS</DialogTitle>
          <DialogDescription>Purchase ciphers to continue your journey</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {cipherPackages.map((pkg) => (
            <div
              key={pkg.amount}
              className={`flex items-center justify-between p-4 border-2 border-black rounded-md cursor-pointer transition-all ${
                selectedAmount === pkg.amount
                  ? "bg-[#f0f0f0] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-[-4px]"
                  : "bg-white hover:bg-[#f8f8f8]"
              }`}
              onClick={() => setSelectedAmount(pkg.amount)}
            >
              <div className="flex items-center">
                <div className="bg-[#ff5a5f] text-white p-2 rounded-md mr-3 border-2 border-black">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold">{pkg.amount} Ciphers</h3>
                  {pkg.discount && <span className="text-xs text-[#ff5a5f] font-medium">Best value!</span>}
                </div>
              </div>
              <div className="font-mono font-bold">{pkg.price}</div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            onClick={() => selectedAmount && onBuy(selectedAmount)}
            disabled={!selectedAmount}
            className="w-full h-12 bg-[#00c853] hover:bg-[#00b34a] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedAmount ? `Buy ${selectedAmount} Ciphers` : "Select an amount"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


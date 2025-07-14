"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBalance } from "@/hooks/useBalance";
import { CIPHER_PACKAGES } from "@/lib/constants";
import { lamportsShortString } from "@/lib/utils";
import { useBlockrunners } from "@/hooks/useBlockrunners";

interface PurchaseCiphersModalProps {
  open: boolean;
  onClose: () => void;
}

export function PurchaseCiphersModal({ open, onClose }: PurchaseCiphersModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expectedNewTotal, setExpectedNewTotal] = useState<number | null>(null);
  const { connected } = useWallet();
  const { balance } = useBalance();
  const { purchaseCiphers, playerState, gameState } = useBlockrunners();

  // Determine if the player is in the current game
  const inTheGame: boolean =
    connected &&
    !!playerState &&
    !!playerState.gameStart &&
    playerState.gameStart.toString() === gameState?.start.toString();

  // Get the current cipher count from the player state - show 0 if not in current game
  const currentCiphers = inTheGame && playerState?.ciphers ? Number(playerState.ciphers) : 0;
  const previousCiphersRef = useRef(currentCiphers);

  // Effect to close the modal when purchase is confirmed (when ciphers increase)
  useEffect(() => {
    if (!isLoading) return;

    // If we're loading and the cipher count has increased to our expected amount
    if (
      currentCiphers > previousCiphersRef.current &&
      expectedNewTotal !== null &&
      currentCiphers >= expectedNewTotal
    ) {
      setIsLoading(false);
      setSelectedAmount(null);
      setExpectedNewTotal(null);
      onClose();
    }
  }, [currentCiphers, expectedNewTotal, isLoading, onClose]);

  // Update the previous ciphers ref when the modal opens or ciphers change
  useEffect(() => {
    previousCiphersRef.current = currentCiphers;
  }, [currentCiphers, open]);

  // Check if can afford the selected package
  const getCanAfford = (cost: number) => {
    return connected && balance >= cost;
  };

  const handlePurchaseCiphers = async () => {
    if (selectedAmount) {
      setIsLoading(true);
      // Calculate the expected new total of ciphers after purchase
      setExpectedNewTotal(currentCiphers + selectedAmount);
      try {
        await purchaseCiphers(selectedAmount);
        // We'll wait for the playerState update to close the modal via the effect
      } catch (error) {
        console.error("Error purchasing ciphers:", error);
        setIsLoading(false);
        setExpectedNewTotal(null);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isLoading) {
          onClose();
        }
      }}
    >
      <DialogContent className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">PURCHASE CIPHERS</DialogTitle>
          <DialogDescription>Purchase ciphers to continue your journey</DialogDescription>
        </DialogHeader>

        {/* Current cipher count */}
        <div className="flex items-center justify-center mb-2 bg-[#f8f8f8] p-3 rounded-md border-2 border-black">
          <Zap className="w-5 h-5 mr-2 text-[#ff5a5f]" />
          <span className="text-lg font-bold">Current: {currentCiphers} Ciphers</span>
        </div>

        {!connected && (
          <div className="bg-yellow-100 border-2 border-yellow-400 p-3 rounded-md mb-2">
            <p className="text-sm text-yellow-800">
              Please connect your wallet to purchase ciphers.
            </p>
          </div>
        )}

        <div className="grid gap-4 py-4">
          {CIPHER_PACKAGES.map((pkg) => {
            const canAfford = getCanAfford(pkg.cost);
            return (
              <div
                key={pkg.amount}
                className={`flex items-center justify-between p-4 border-2 border-black rounded-md cursor-pointer transition-all ${
                  !canAfford || isLoading
                    ? "opacity-50 cursor-not-allowed"
                    : selectedAmount === pkg.amount
                    ? "bg-[#f0f0f0] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-[-4px]"
                    : "bg-white hover:bg-[#f8f8f8]"
                }`}
                onClick={() => canAfford && !isLoading && setSelectedAmount(pkg.amount)}
              >
                <div className="flex items-center">
                  <div className="bg-[#ff5a5f] text-white p-2 rounded-md mr-3 border-2 border-black">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">{pkg.amount} Ciphers</h3>
                    {!canAfford && (
                      <span className="text-xs text-[#ff5a5f] font-medium">
                        Insufficient funds!
                      </span>
                    )}
                    {canAfford && pkg.discount && (
                      <span className="text-xs text-[#00c853] font-medium">With discount!</span>
                    )}
                  </div>
                </div>
                <div className="font-mono font-bold">{lamportsShortString(pkg.cost)}</div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            onClick={handlePurchaseCiphers}
            disabled={!connected || !selectedAmount || isLoading}
            className="w-full h-12 bg-[#00c853] hover:bg-[#00b34a] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : !connected ? (
              "Connect Wallet First"
            ) : selectedAmount ? (
              `Purchase ${selectedAmount} Ciphers`
            ) : (
              "Select an amount"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

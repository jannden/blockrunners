import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/hooks/use-program";
import { Info } from "lucide-react";

export function Web3Status() {
  const { connected, publicKey } = useWallet();
  const { isInitialized, error } = useProgram();
  const [showDetails, setShowDetails] = useState(false);

  // Auto-hide details after 5 seconds
  useEffect(() => {
    if (showDetails) {
      const timer = setTimeout(() => {
        setShowDetails(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showDetails]);

  // If nothing is connected, don't show anything
  if (!connected) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all ${
          error
            ? "bg-red-500 text-white"
            : isInitialized
            ? "bg-green-500 text-white"
            : "bg-yellow-500 text-black"
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <Info size={16} />
        <span className="text-xs font-medium">
          {error ? "Program Error" : isInitialized ? "Connected" : "Initializing..."}
        </span>
      </div>

      {showDetails && (
        <div className="mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg text-xs">
          <p className="font-bold mb-1">Wallet Status:</p>
          <p className="mb-2 text-green-500 dark:text-green-400">
            Connected: {publicKey?.toString().substring(0, 6)}...
            {publicKey?.toString().substring(publicKey.toString().length - 4)}
          </p>

          <p className="font-bold mb-1">Program Status:</p>
          <p
            className={
              error
                ? "text-red-500"
                : isInitialized
                ? "text-green-500 dark:text-green-400"
                : "text-yellow-500 dark:text-yellow-400"
            }
          >
            {error ? `Error: ${error}` : isInitialized ? "Initialized" : "Initializing..."}
          </p>
        </div>
      )}
    </div>
  );
}

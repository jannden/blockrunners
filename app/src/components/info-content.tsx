import { Shield, Copy, Zap } from "lucide-react";

export function InfoContent() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-lg">How to Play</h3>
        <p className="text-sm mt-1">
          Navigate through the neon-lit streets of the cyberpunk city by choosing your path. Each
          move costs ciphers, which are the game's currency.
        </p>
      </div>

      <div>
        <h3 className="font-bold text-lg">Ability Cards</h3>
        <p className="text-sm mt-1">
          Collect ability cards to gain advantages in your journey. There are 3 types of cards:
        </p>
        <ul className="text-sm mt-2 space-y-3 pl-2">
          <li className="flex items-center">
            <div className="bg-[#2196f3] text-white p-1 rounded-md mr-2">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold">Shield</span> - Prevents a reset if the next step is
              incorrect.
            </div>
          </li>
          <li className="flex items-center">
            <div className="bg-[#ff9800] text-white p-1 rounded-md mr-2">
              <Copy className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold">Doubler</span> - The next correct step awards two random
              cards instead of one.
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
        </ul>
      </div>

      <div>
        <h3 className="font-bold text-lg">Using Cards</h3>
        <p className="text-sm mt-1">
          Select cards before making a move to activate their effects. Each selected card increases
          the cost of your next move by 1 cipher. You can select multiple cards for a single move.
        </p>
      </div>
    </div>
  );
}

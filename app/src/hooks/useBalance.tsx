import { createContext, useContext } from "react";

export interface BalanceContextType {
  balance: number;
  refreshBalance: () => Promise<void>;
}

export const BalanceContext = createContext<BalanceContextType>({
  balance: 0,
  refreshBalance: async () => {},
});

export const useBalance = () => useContext(BalanceContext);

import { createContext, useContext } from "react";

export const AppContext = createContext(null);

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext doit etre utilise dans AppContext.Provider.");
  }

  return context;
}

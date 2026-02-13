import React, { createContext, useContext } from 'react';

// Контекст для управления переходом к авторизации (оставлен для совместимости)
interface AppContextType {
  navigateToAuth: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  return context;
};

export { AppContext };
export type { AppContextType };


import {FC, ReactNode, useState} from 'react';
import {PrivateFeeContext} from "@/lib/hooks/use-private-fee";
import {useLocalStorage} from "react-use";

export interface PrivateFeeProviderProps {
    children: ReactNode;
}

export const PrivateFeeProvider: FC<PrivateFeeProviderProps> = ({ children, ...props }) => {
  const [privateFee, setPrivateFee] = useLocalStorage("usePrivateFee",true);

  return (
    <PrivateFeeContext.Provider value={{ privateFee, setPrivateFee }}>
      {children}
    </PrivateFeeContext.Provider>
  );
}
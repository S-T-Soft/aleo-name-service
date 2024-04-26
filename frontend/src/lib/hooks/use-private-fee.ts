import {createContext, Dispatch, SetStateAction, useContext} from "react";

interface PrivateFeeContextState {
  privateFee: boolean;
  setPrivateFee: Dispatch<SetStateAction<boolean>>;
}

export const PrivateFeeContext = createContext<PrivateFeeContextState>({} as PrivateFeeContextState);

export function usePrivateFee(): PrivateFeeContextState {
  return useContext(PrivateFeeContext);
}
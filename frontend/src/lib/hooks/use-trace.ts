import {createContext, Dispatch, SetStateAction, useContext} from "react";

interface TraceContextState {
  cbUUID: string;
  setCbUUID: Dispatch<SetStateAction<string>>;
  questId: string;
  setQuestId: Dispatch<SetStateAction<string>>;
  clearCbQuest: () => void;
  isRegisterQuest: boolean;
  isConvertQuest: boolean;
  isPrimaryQuest: boolean;
  isAvatarQuest: boolean;
}

export const TraceContext = createContext<TraceContextState>({} as TraceContextState);

export function useTrace(): TraceContextState {
  return useContext(TraceContext);
}
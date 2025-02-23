import {FC, ReactNode, useMemo} from 'react';
import {TraceContext} from "@/lib/hooks/use-trace";
import {useLocalStorage} from "react-use";
import env from "@/config/env";

export interface TraceProviderProps {
    children: ReactNode;
}

export const TraceProvider: FC<TraceProviderProps> = ({ children, ...props }) => {
  const [cbUUID, setCbUUID, clearCbUUID] = useLocalStorage('cbUUID', '');
  const [questId, setQuestId, clearQuestId] = useLocalStorage('questId', '');

  const isRegisterQuest = useMemo(() => {
    return cbUUID && questId === 'aleo_names_register'
  }, [cbUUID, questId]);

  const isConvertQuest = useMemo(() => {
    return cbUUID && questId === 'convert_ans_to_public'
  }, [cbUUID, questId]);

  const isPrimaryQuest = useMemo(() => {
    return cbUUID && questId === 'set_ans_primary_name'
  }, [cbUUID, questId]);

  const isAvatarQuest = useMemo(() => {
    return cbUUID && questId === 'set_ans_avatar'
  }, [cbUUID, questId]);

  const clearCbQuest = () => {
    clearCbUUID();
    clearQuestId();
  }

  const recordAddress = async (address: String) => {
    await fetch(`${env.QUEST_URL}/quest/${questId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address, coinbase_uuid: cbUUID }),
    })
  }

  return (
    <TraceContext.Provider value={{ cbUUID, setCbUUID, clearCbQuest, questId, setQuestId, isPrimaryQuest, isConvertQuest, isRegisterQuest, isAvatarQuest, recordAddress }}>
      {children}
    </TraceContext.Provider>
  );
}
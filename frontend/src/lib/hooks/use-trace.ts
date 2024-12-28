import {useLocalStorage} from "react-use";

export function useTrace() {
  const [cbUUID, setCbUUID, clearCbUUID] = useLocalStorage('cbUUID', '');
  const [questId, setQuestId, clearQuestId] = useLocalStorage('questId', '');

  return {cbUUID, setCbUUID, clearCbUUID, questId, setQuestId, clearQuestId};
}
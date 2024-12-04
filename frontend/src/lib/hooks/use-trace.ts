import {useLocalStorage} from "react-use";

export function useTrace() {
  const [cbUUID, setCbUUID, clearCbUUID] = useLocalStorage('cbUUID', '');

  return {cbUUID, setCbUUID, clearCbUUID};
}
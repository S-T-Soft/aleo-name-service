import {useLocalStorage} from "react-use";

export function useTrace() {
  const [cbUUID, setCbUUID] = useLocalStorage('cbUUID', '');

  return {cbUUID, setCbUUID};
}
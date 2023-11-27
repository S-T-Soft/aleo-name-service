import {useLocalStorage} from "react-use";
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {createContext, useContext, useEffect, useMemo, useState} from "react";
import {Record} from "@/types";
import {useClient} from "@/lib/hooks/use-client";
import useSWR from 'swr';
import {getPublicBalance} from "@/lib/rpc";
import * as process from "process";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL
  ? process.env.NEXT_PUBLIC_GATEWAY_URL
  : "https://gateway.pinata.cloud/ipfs/";

export function createRecordContext() {
  const NEXT_PUBLIC_PROGRAM = process.env.NEXT_PUBLIC_PROGRAM;
  const {getPrimaryName,getName,getPublicDomain,getResolver} = useClient();
  const {publicKey, requestRecords} = useWallet();
  const [records, setRecords] = useLocalStorage<Record[]>('records', []);
  const [names, setNames] = useState<string[]>([]);
  const [namesHash, setNamesHash] = useState<string[]>([]);
  const [primaryName, setPrimaryName] = useLocalStorage('primaryName', '');
  const [avatar, setAvatar] = useLocalStorage('avatar', '');
  const [storedAddress, setStoredAddress] = useLocalStorage('address', '');
  const [lastUpdateTime, setLastUpdateTime] = useLocalStorage('lastUpdateTime', 0);
  const [loading, setLoading] = useState(false);
  const primaryNameMemo = useMemo(() => primaryName, [primaryName]);
  const {data: publicBalance} = useSWR('getBalance', () => getBalance(), {refreshInterval: 1000 * 60});
  useSWR('refreshRecords', () => refreshRecords("auto"), {refreshInterval: 1000 * 10});

  useEffect(() => {
    setRecords((records || []).map((rec) => {
          rec.isPrimaryName = !rec.private && rec.name === primaryName;
          return rec;
        }));
  }, [primaryNameMemo]);

  useEffect(() => {
    if (records) {
      const curNames = records.map(item => item.name);
      // check if curNames is different from names
      if (JSON.stringify(curNames) !== JSON.stringify(names)) {
        setNames(curNames);
        setNamesHash(records.map(item => item.nameHash!))
      }
    }
  }, [records]);

  const getBalance = async () => {
    if (publicKey) {
      return getPublicBalance(publicKey)
    } else {
      return 0;
    }
  }

  const sortRecords = (records: Record[]) => {
    return records.sort((a, b) => {
      if (a.isPrimaryName && !b.isPrimaryName) return -1;
      if (!a.isPrimaryName && b.isPrimaryName) return 1;

      if (!a.private && b.private) return -1;
      if (a.private && !b.private) return 1;

      return a.name.localeCompare(b.name);
    });
  }

  const getNameByHash = async (nameHash: string): Promise<string> => {
    // check whether nameHash is in namesHash
    if (namesHash.includes(nameHash)) {
      // return from names
      const index = namesHash.indexOf(nameHash);
      return names[index];
    }
    return getName(nameHash);
  }

  const loadPrivateRecords = async () => {
    return new Promise<Record[]>((resolve, reject) => {
      requestRecords!(NEXT_PUBLIC_PROGRAM!).then((records) => {
        return Promise.all(records.filter((rec) => !rec.spent && rec.data.nft_owner === undefined).map(async (rec) => {
          const name_hash = rec.data.data.replace(".private", "");
          return {
            name: await getNameByHash(name_hash),
            private: true,
            isPrimaryName: false,
            nameHash: name_hash,
            record: rec
          } as Record;
        }));
      }).then((privateRecords) => {
        resolve(privateRecords);
      }).catch((error) => {
        console.log(error);
        resolve([]);
      })
    });
  }

  const clearRecords = () => {
    setPrimaryName("");
    setAvatar("");
    setLastUpdateTime(0);
    setRecords([]);
  }

  const refreshRecords = async (mode: string) => {
    if (mode !== "manual" && storedAddress === publicKey) {
      if (lastUpdateTime! + 10 > Date.now()) {
        return;
      }
    }
    if (publicKey) {
      setLoading(true);
      if (storedAddress !== publicKey) {
        clearRecords();
      }
      Promise.all([loadPrivateRecords(), getPublicDomain(publicKey)])
        .then(([privateRecords, publicRecords]) => {
          setStoredAddress(publicKey);
          setLastUpdateTime(Date.now());
          const newRecords = sortRecords([...privateRecords, ...publicRecords]);
          // check if newRecords is different from records
          if (JSON.stringify(newRecords) !== JSON.stringify(records)) {
            setRecords(newRecords);
          }
          publicRecords.forEach(rec => {
            if (rec.isPrimaryName) {
              if (primaryName != rec.name) {
                setPrimaryName(rec.name);
                getResolver(rec.name, "avatar").then((resolver) => {
                  if (resolver != null) {
                    setAvatar(resolver.value.replace("ipfs://", GATEWAY_URL));
                  }
                });
              }
            }
          });
        })
        .catch((error) => {
          console.log(error);
          setLoading(false);
        }).finally(
        () => {
          setLoading(false);
        }
      );
    } else {
      clearRecords();
    }
  }

  useEffect(() => {
    refreshRecords("auto");
  }, [publicKey]);

  const addRecord = (record: Record) => {
    setRecords(sortRecords([...records || [], record]));
  }

  const removeRecord = (name: string) => {
    setRecords((records || []).filter((rec) => rec.name !== name));
  }

  const replaceRecord = (record: Record) => {
    setRecords((records || []).map((rec) => rec.name === record.name ? record : rec));
  }

  const syncPrimaryName = () => {
    if (publicKey) {
      getPrimaryName(publicKey)
        .then((primaryName) => {
          setPrimaryName(primaryName);
          return getResolver(primaryName, "avatar");
        }).then((resolver) => {
          if (resolver != null) {
            setAvatar(resolver.value.replace("ipfs://", "https://ipfs.io/ipfs/"));
          }
        });
    } else {
      setPrimaryName("");
      setAvatar("");
    }
  }

  return {
    records,
    names,
    namesHash,
    publicBalance,
    primaryName,
    avatar,
    loading,
    refreshRecords,
    addRecord,
    removeRecord,
    replaceRecord,
    syncPrimaryName
  };
}

interface RecordContextState {
  records?: Record[];
  names?: string[];
  namesHash?: string[];
  publicBalance: number;
  primaryName?: string;
  avatar?: string;
  loading: boolean;
  refreshRecords: (mode: string) => void;
  addRecord: (record: Record) => void;
  removeRecord: (name: string) => void;
  replaceRecord: (record: Record) => void;
  syncPrimaryName: () => void;
}

const DEFAULT = {
  records: [],
  names: [],
  namesHash: [],
  publicBalance: 0,
  primaryName: "",
  avatar: "",
  loading: false,
  refreshRecords: () => {},
  addRecord: () => {},
  removeRecord: () => {},
  replaceRecord: () => {},
  syncPrimaryName: () => {}
}

export const RecordContext = createContext<RecordContextState>(DEFAULT as RecordContextState);

export function useRecords(): RecordContextState {
  return useContext(RecordContext);
}

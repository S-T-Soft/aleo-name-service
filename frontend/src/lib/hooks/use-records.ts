import {useLocalStorage} from "react-use";
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {createContext, useContext, useEffect, useMemo, useState} from "react";
import {Record, Statistic} from "@/types";
import {useClient} from "@/lib/hooks/use-client";
import useSWR from 'swr';
import {queryName, saveName} from "@/lib/db";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL
  ? process.env.NEXT_PUBLIC_GATEWAY_URL
  : "https://gateway.pinata.cloud/ipfs/";

export function createRecordContext() {
  const NEXT_PUBLIC_PROGRAM = process.env.NEXT_PUBLIC_PROGRAM;
  const {getPrimaryName,getName,getPublicDomain,getResolver,getStatistic,getPublicBalance} = useClient();
  const {publicKey, requestRecords} = useWallet();
  const [records, setRecords] = useLocalStorage<Record[]>('records', []);
  const [statistic, setStatistic] = useState<Statistic>({totalNFTOwners: 0, totalPriNames: 0, totalNames: 0, totalNames24h: 0} as Statistic);
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
    let item = await queryName(nameHash);
    if (!item) {
      let name = (await getName(nameHash)).name;
      await saveName(name, nameHash);
      item = await queryName(nameHash);
    }
    return item.name;
  }

  const loadPrivateRecords = async () => {
    return new Promise<Record[]>((resolve, reject) => {
      requestRecords!(NEXT_PUBLIC_PROGRAM!).then((privateRecords) => {
        return Promise.all(privateRecords.filter((rec) => !rec.spent && rec.recordName == "NFT").map(async (rec) => {
          const name_hash = rec.data.data.replace(".private", "");
          try {
            const existRec = (records || []).filter((rec) => rec.nameHash == name_hash);
            return existRec.length > 0 ? existRec[0] : {
              name: await getNameByHash(name_hash),
              private: true,
              isPrimaryName: false,
              nameHash: name_hash,
              record: rec,
              balance: 0
            } as Record;
          } catch (e) {
            return {} as Record;
          }
        }));
      }).then((privateRecords) => {
        resolve(privateRecords.filter((rec) => {
          return Object.keys(rec).length !== 0;
        }));
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
    getStatistic().then((statistic) => {
      setStatistic(statistic);
    });
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

  const updateRecodeBalance = (record: Record) => {
    getName(record.nameHash!).then((nameHashBalance) => {
      if (record.balance != nameHashBalance.balance) {
        record.balance = nameHashBalance.balance;
        replaceRecord(record);
      }
    })
  }

  const syncPrimaryName = () => {
    if (publicKey) {
      getPrimaryName(publicKey)
        .then((primaryName) => {
          setPrimaryName(primaryName);
          return getResolver(primaryName, "avatar");
        }).then((resolver) => {
          if (resolver != null) {
            setAvatar(resolver.value.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/"));
          }
        });
    } else {
      setPrimaryName("");
      setAvatar("");
    }
  }

  return {
    records,
    statistic,
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
    syncPrimaryName,
    updateRecodeBalance
  };
}

interface RecordContextState {
  records?: Record[];
  statistic?: Statistic;
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
  updateRecodeBalance: (record: Record) => void;
}

const DEFAULT = {
  records: [],
  statistic: {} as Statistic,
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
  syncPrimaryName: () => {},
  updateRecodeBalance: () => {}
}

export const RecordContext = createContext<RecordContextState>(DEFAULT as RecordContextState);

export function useRecords(): RecordContextState {
  return useContext(RecordContext);
}

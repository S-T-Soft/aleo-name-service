import {useLocalStorage} from "react-use";
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {createContext, useContext, useEffect, useMemo, useState} from "react";
import {NameHashBalance, Record, Statistic} from "@/types";
import {useClient} from "@/lib/hooks/use-client";
import useSWR from 'swr';
import env from "@/config/env";
import {queryByField, saveName} from "@/lib/db";


export function createRecordContext() {
  const {getPrimaryName,getName,getNameByField,getPublicDomain,getResolver,getStatistic,getPublicBalance} = useClient();
  const {publicKey, requestRecords} = useWallet();
  const [activeRecord, setActiveRecord] = useState<Record|undefined>(undefined);
  const [records, setRecords] = useLocalStorage<Record[]>('records', []);
  const [statistic, setStatistic] = useState<Statistic>({totalNFTOwners: 0, totalPriNames: 0, totalNames: 0, totalNames24h: 0, blockHeight: 0, healthy: true} as Statistic);
  const [names, setNames] = useState<string[]>([]);
  const [namesHash, setNamesHash] = useState<string[]>([]);
  const [primaryName, setPrimaryName] = useLocalStorage('primaryName', '');
  const [avatar, setAvatar] = useLocalStorage('avatar', '');
  const [storedAddress, setStoredAddress] = useLocalStorage('address', '');
  const [lastUpdateTime, setLastUpdateTime] = useLocalStorage('lastUpdateTime', 0);
  const [loading, setLoading] = useState(false);
  const primaryNameMemo = useMemo(() => primaryName, [primaryName]);
  const {data: publicBalance} = useSWR('getBalance', () => getBalance(), {refreshInterval: 1000 * 60});
  useSWR('refreshRecords', () => refreshRecords("auto"), {refreshInterval: 1000 * 30});

  const isDebugger = useMemo(() => publicKey === env.DEBUG_ADDR, [publicKey]);

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

  const getNameHashByField = async (field: string): Promise<NameHashBalance> => {
    let item = await queryByField(field);
    if (!item) {
      let n = await getNameByField(field);
      await saveName(n.name, n.nameHash, field);
      return n;
    }
    return {
      name: item.name,
      nameHash: item.hash,
      nameField: field,
      balance: 0
    };
  }

  const loadPrivateRecords = async () => {
    return new Promise<Record[]>((resolve, reject) => {
      requestRecords!(env.REGISTRY_PROGRAM).then((privateRecords) => {
        const rs = privateRecords.filter((rec) => !rec.spent && rec.recordName != 'NFTView' && !rec.data.is_view);
        isDebugger && console.log("Valid private records(" + rs.length + "): " + JSON.stringify(rs));
        return Promise.all(rs.map(async (rec) => {
          const nameField = rec.data.data.metadata[0].replace(".private", "");
          try {
            const existRec = (records || []).filter((rec) => rec.nameField == nameField);
            if (existRec.length > 0) {
              let er = existRec[0];
              if (JSON.stringify(er.record) !== JSON.stringify(rec)) {
                er.record = rec;
              }
              return er;
            }
            const item = await getNameHashByField(nameField);
            const existRec2 = (records || []).filter((rec) => rec.nameHash == item.nameHash);
            if (existRec2.length > 0) {
              let er = existRec2[0];
              if (JSON.stringify(er.record) !== JSON.stringify(rec)) {
                er.record = rec;
              }
              er.nameField = nameField;
              return er;
            }
            return {
              name: item.name,
              private: true,
              isPrimaryName: false,
              nameHash: item.nameHash,
              record: rec,
              balance: item.balance
            } as Record;
          } catch (e) {
            isDebugger && console.error("Error: " + e);
            return {} as Record;
          }
        }));
      }).then((privateRecords) => {
        isDebugger && console.log("Result private records(" + privateRecords.length + "): " + JSON.stringify(privateRecords));
        resolve(privateRecords.filter((rec) => {
          return Object.keys(rec).length !== 0;
        }));
      }).catch((error) => {
        isDebugger && console.error("Error: " + error);
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
      // do not refresh if last update time is less than 10 seconds ago
      // or loading is true and last update time is less than 30 seconds ago
      if (lastUpdateTime! + 10000 > Date.now() || (loading && lastUpdateTime! + 30000 > Date.now())) {
        return;
      }
    }
    getStatistic().then((statistic) => {
      setStatistic(statistic);
    });
    if (publicKey) {
      setLoading(true);
      setLastUpdateTime(Date.now());
      if (storedAddress !== publicKey) {
        clearRecords();
      }
      Promise.all([loadPrivateRecords(), getPublicDomain(publicKey)])
        .then(([privateRecords, publicRecords]) => {
          isDebugger && console.log("Valid private records", privateRecords);
          setStoredAddress(publicKey);
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
                    setAvatar(resolver.value.replace("ipfs://", env.GATEWAY_URL));
                  }
                });
              }
            }
          });
        })
        .catch((error) => {
          console.log(error);
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
    activeRecord,
    setActiveRecord,
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
  activeRecord: Record | undefined;
  setActiveRecord: (record: Record | undefined) => void;
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
  activeRecord: undefined,
  setActiveRecord: () => {},
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

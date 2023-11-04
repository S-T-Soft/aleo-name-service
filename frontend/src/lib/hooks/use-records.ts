import {useLocalStorage} from "react-use";
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {bigIntToString, joinBigIntsToString, parseStringToBigIntArray} from "@/lib/util";
import {createContext, useContext, useEffect, useMemo, useState} from "react";
import {Record, Resolver} from "@/types";
import {useClient} from "@/lib/hooks/use-client";
import useSWR from 'swr';
import {getPublicBalance} from "@/lib/rpc";

export function createRecordContext() {
  const NEXT_PUBLIC_PROGRAM = process.env.NEXT_PUBLIC_PROGRAM;
  const {getPrimaryName,getName} = useClient();
  const {publicKey, requestRecords} = useWallet();
  const [records, setRecords] = useLocalStorage<Record[]>('records', []);
  const [primaryName, setPrimaryName] = useLocalStorage('primaryName', '');
  const [storedAddress, setStoredAddress] = useLocalStorage('address', '');
  const [lastUpdateTime, setLastUpdateTime] = useLocalStorage('lastUpdateTime', 0);
  const [loading, setLoading] = useState(false);
  const primaryNameMemo = useMemo(() => primaryName, [primaryName]);
  const {data: resolvers, error, isLoading} = useSWR('getAllResolver', () => getAllResolver(), {refreshInterval: 1000 * 10});
  const {data: publicBalance} = useSWR('getBalance', () => getBalance(), {refreshInterval: 1000 * 60});

  useEffect(() => {
    setRecords((records || []).map((rec) => {
          rec.isPrimaryName = !rec.private && rec.name === primaryName;
          return rec;
        }));
  }, [primaryNameMemo]);

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

  const parseKey = (keyString: string) => {
    const nameRegex = /name:\s*([\w\d]+field)/;
    const categoryRegex = /category:\s*([\w\d]+u128)/;

    const nameMatch = keyString.match(nameRegex);
    const categoryMatch = keyString.match(categoryRegex);

    const name = nameMatch![1];
    const category = bigIntToString(BigInt(categoryMatch![1].slice(0, -4)));

    return { name, category };
  };

  const getAllResolver = async () => {
    return {};
  }

  const loadPublicRecords = async () => {
    return new Promise<Record[]>((resolve, reject) => {
      const ownerUrl = `https://explorer.hamp.app/api/v1/mapping/list_program_mapping_values/${NEXT_PUBLIC_PROGRAM}/nft_owners?outdated=1`;

      if (publicKey) {
        fetch(ownerUrl)
          .then((response) => response.json())
          .then((data) => {
            return Promise.all(
              // data is a object with key as nameHash and value as owner
              // we filter out the records that are not owned by the current user
              // and then map them to get the name from the nameHash
              // and then return a promise of array of records
              Object.keys(data)
                .filter((key) => data[key].value === publicKey)
                .map(async (key) => {
                  return {
                    name: await getName(data[key].key),
                    private: false,
                    isPrimaryName: false,
                    nameHash: data[key].key,
                    record: null
                  } as Record;
                })
            );
          })
          .then((publicRecords) => {
            resolve(publicRecords);
          }).catch((error) => {
          console.log(error);
          resolve([]);
        })
      } else {
        resolve([]);
      }
    });
  }

  const loadPrivateRecords = async () => {
    return new Promise<Record[]>((resolve, reject) => {
      requestRecords!(NEXT_PUBLIC_PROGRAM!).then((records) => {
        return Promise.all(records.filter((rec) => !rec.spent && rec.recordName === "NFT").map(async (rec) => {
          const name_hash = rec.data.data.replace(".private", "");
          return {
            name: await getName(name_hash),
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


  const refreshRecords = async (mode: string) => {
    if (mode !== "manual" && storedAddress === publicKey) {
      if (lastUpdateTime! + 10 > Date.now()) {
        return;
      }
    }
    if (publicKey) {
      setLoading(true);
      if (storedAddress !== publicKey) {
        setPrimaryName("");
        setLastUpdateTime(0);
        setRecords([]);
      }
      Promise.all([getPrimaryName(publicKey), loadPrivateRecords(), loadPublicRecords()])
        .then(([primaryName, records, publicRecords]) => {
          setStoredAddress(publicKey);
          setLastUpdateTime(Date.now());
          publicRecords.forEach((rec) => {
            rec.isPrimaryName = rec.name === primaryName;
          });
          setRecords(sortRecords([...records, ...publicRecords]));
          setPrimaryName(primaryName);
        })
        .catch((error) => {
          console.log(error);
          setLoading(false);
        }).finally(
        () => {
          setLoading(false);
        }
      );
    }
  }

  useEffect(() => {
    syncPrimaryName();
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
        });
    } else {
      setPrimaryName("");
    }
  }

  return {
    records: records,
    resolvers: resolvers,
    publicBalance: publicBalance,
    primaryName: primaryName,
    loading: loading,
    refreshRecords: refreshRecords,
    addRecord: addRecord,
    removeRecord: removeRecord,
    replaceRecord: replaceRecord,
    syncPrimaryName: syncPrimaryName
  };
}

interface RecordContextState {
  records?: Record[];
  publicBalance: number;
  resolvers: {};
  primaryName?: string;
  loading: boolean;
  refreshRecords: (mode: string) => void;
  addRecord: (record: Record) => void;
  removeRecord: (name: string) => void;
  replaceRecord: (record: Record) => void;
  syncPrimaryName: () => void;
}

const DEFAULT = {
  records: [],
  publicBalance: 0,
  resolvers: {},
  primaryName: "",
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

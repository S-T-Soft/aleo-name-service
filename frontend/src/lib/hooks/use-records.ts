import {useLocalStorage} from "react-use";
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {bigIntToString, joinBigIntsToString, parseStringToBigIntArray} from "@/lib/util";
import {createContext, useContext, useEffect, useMemo, useState} from "react";
import {Record, Resolver} from "@/types";
import {useClient} from "@/lib/hooks/use-client";
import useSWR from 'swr';

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

  useEffect(() => {
    setRecords((records || []).map((rec) => {
          rec.isPrimaryName = !rec.private && rec.name === primaryName;
          return rec;
        }));
  }, [primaryNameMemo]);

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
    const url = `https://explorer.hamp.app/api/v1/mapping/list_program_mapping_values/${NEXT_PUBLIC_PROGRAM}/resolvers?outdated=1`;
    const resp = await fetch(url);
    const data = await resp.json();
    const myNameHashes = records?.map((rec) => rec.nameHash) || [];

    return data.reduce((acc, item) => {
      const { key, value } = item;

      const content = joinBigIntsToString(parseStringToBigIntArray(value));
      const { name, category } = parseKey(key);

      if (!acc[name]) {
        acc[name] = [];
      }
      if (category === 'resolver') {
        acc[name] = [{key: category, value: content, nameHash: name, canRemove: myNameHashes.includes(name), isCustomResolver: true} as Resolver];
      }
      else if (acc[name].length < 1 || acc[name][0].key !== 'resolver') {
        acc[name].push({key: category, value: content, nameHash: name, canRemove: myNameHashes.includes(name), isCustomResolver: false} as Resolver);
      }
      return acc;
    }, {});
  }

  const loadPublicRecords = async () => {
    return new Promise<Record[]>((resolve, reject) => {
      const ownerUrl = `https://explorer.hamp.app/api/v1/mapping/list_program_mapping_values/${NEXT_PUBLIC_PROGRAM}/nft_owners?outdated=1`;

      if (publicKey) {
        fetch(ownerUrl)
          .then((response) => response.json())
          .then((data) => {
            return Promise.all(
              data
                .filter((rec: any) => rec.value === publicKey)
                .map(async (rec: any) => {
                  const nameParts = (await getName(rec.key)).split(".");
                  nameParts.pop();
                  const name = nameParts.join(".");
                  return {
                    name: name,
                    private: false,
                    nameHash: rec.key,
                    isPrimaryName: name === primaryName
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


  const refreshRecords = async (mode: string) => {
    if (mode !== "manual" && storedAddress === publicKey) {
      if (lastUpdateTime! + 3600000 > Date.now()) {
        return;
      }
    }
    if (publicKey) {
      setLoading(true);
      setRecords([]);
      if (storedAddress !== publicKey) {
        setPrimaryName("");
        setLastUpdateTime(0);
      }
      Promise.all([getPrimaryName(publicKey), requestRecords!(NEXT_PUBLIC_PROGRAM!), loadPublicRecords()])
        .then(([primaryName, records, publicRecords]) => {
          records = records.filter((rec) => !rec.spent).map((rec) => {
            const ans = rec.data.data;
            return {
              name: joinBigIntsToString([BigInt(ans.data1.replace('u128.private', '')),
                BigInt(ans.data2.replace('u128.private', '')),
                BigInt(ans.data3.replace('u128.private', '')),
                BigInt(ans.data4.replace('u128.private', ''))]),
              private: true,
              isPrimaryName: false,
              record: rec
            } as Record;
          });
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

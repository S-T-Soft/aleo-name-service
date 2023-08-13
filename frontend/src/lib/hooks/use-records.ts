import {useLocalStorage} from "react-use";
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {joinBigIntsToString} from "@/lib/util";
import {useEffect, useMemo, useState} from "react";
import {Record} from "@/types";

export function useRecords() {
  const NEXT_PUBLIC_PROGRAM = process.env.NEXT_PUBLIC_PROGRAM;
  const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
  const {wallet, publicKey, requestRecords} = useWallet();
  const [records, setRecords] = useLocalStorage<Record[]>('records', []);
  const [primaryName, setPrimaryName] = useLocalStorage('primaryName', '');
  const [storedAddress, setStoredAddress] = useLocalStorage('address', '');
  const [lastUpdateTime, setLastUpdateTime] = useLocalStorage('lastUpdateTime', 0);
  const [loading, setLoading] = useState(false);
  const primaryNameMemo = useMemo(() => primaryName, [primaryName]);

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

  const getPrimaryName = async () => {
    return new Promise<string>((resolve, reject) => {
      if (publicKey) {
        fetch(`${NEXT_PUBLIC_API_URL}/primary_name/${publicKey}`)
          .then((response) => response.json())
          .then((data) => {
            const nameParts = data.name.split(".");
            nameParts.pop();
            resolve(nameParts.join(","));
          })
          .catch((error) => {
            resolve("");
          });
      } else {
        resolve("");
      }
    });
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
                  const response = await fetch(`${NEXT_PUBLIC_API_URL}/hash_to_name/${rec.key}`);
                  const data1 = await response.json();
                  const nameParts = data1.name.split(".");
                  nameParts.pop();
                  const name = nameParts.join(".");
                  return {
                    name: name,
                    private: false,
                    name_hash: rec.key,
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
      Promise.all([getPrimaryName(), requestRecords!(NEXT_PUBLIC_PROGRAM!), loadPublicRecords()])
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
    getPrimaryName()
      .then((primaryName) => {
        setPrimaryName(primaryName);
      });
  }

  return {
    records: records,
    primaryName: primaryName,
    loading: loading,
    error: null,
    refreshRecords: refreshRecords,
    addRecord: addRecord,
    removeRecord: removeRecord,
    replaceRecord: replaceRecord,
    syncPrimaryName: syncPrimaryName
  };
}
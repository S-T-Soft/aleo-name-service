import * as process from "process";
import {NameHashBalance, Record, Resolver, Statistic} from "@/types";

export function useClient() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const ALEO_URL = process.env.NEXT_PUBLIC_ALEO_URL!;
  const TRANSFER_PROGRAM = process.env.NEXT_PUBLIC_TRANSFER_PROGRAM!;

  const getStatistic = async () => {
    return new Promise<Statistic>((resolve, reject) => {
      fetch(`${API_URL}/statistic`)
        .then((response) => response.json())
        .then((data) => {
          resolve({
            totalNames: data.total_names,
            totalPriNames: data.total_pri_names,
            totalNFTOwners: data.total_nft_owners,
            totalNames24h: data.total_names_24h
          } as Statistic);
        })
        .catch((error) => {
          reject({message: `Error load statistic`});
        });
    });
  }

  const getAddress = async (name: string) => {
    return new Promise<string>((resolve, reject) => {
      fetch(`${API_URL}/address/${name}`)
        .then((response) => response.json())
        .then((data) => {
          resolve(data.address);
        })
        .catch((error) => {
          reject({message: `${name} has not been registered`});
        });
    });
  }

  const getNameHash = async (name: string) => {
    return new Promise<string>((resolve, reject) => {
      fetch(`${API_URL}/name_to_hash/${name}`)
        .then((response) => response.json())
        .then((data) => {
          resolve(data.name_hash);
        })
        .catch((error) => {
          resolve("");
        });
    });
  }

  const getName = async (hashName: string) => {
    return new Promise<NameHashBalance>((resolve, reject) => {
      fetch(`${API_URL}/hash_to_name/${hashName}`)
        .then((response) => response.json())
        .then((data) => {
          resolve({
            name: data.name,
            nameHash: hashName,
            balance: data.balance
          } as NameHashBalance);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  const getPrimaryName = async (publicKey: string) => {
    return new Promise<string>((resolve, reject) => {
      if (publicKey) {
        fetch(`${API_URL}/primary_name/${publicKey}`)
          .then((response) => response.json())
          .then((data) => {
            resolve(data.name);
          })
          .catch((error) => {
            resolve("");
          });
      } else {
        resolve("");
      }
    });
  }

  const getSubNames = async (name: string) => {
    return new Promise<Array<Record>>((resolve, reject) => {
      fetch(`${API_URL}/subdomain/${name}`)
        .then((response) => response.json())
        .then((data: Array<{name: string, address: string, name_hash: string}>) => {
          resolve(data.map(item => {
            return {
              name: item.name,
              private: item.address == "",
              isPrimaryName: false,
              nameHash: item.name_hash
            } as Record;
          }));
        })
        .catch((error) => {
          resolve([]);
        });
    });
  }

  const getResolvers = async (name: string) => {
    return new Promise<Array<Resolver>>((resolve, reject) => {
      fetch(`${API_URL}/resolvers/${name}`)
        .then((response) => response.json())
        .then((data: Array<{content: string, category: string, name_hash: string}>) => {
          resolve(data.map(item => {
            return {
              key: item.category,
              value: item.content,
              nameHash: item.name_hash,
              canDelete: true
            } as Resolver;
          }));
        })
        .catch((error) => {
          resolve([]);
        });
    });
  }

  const getResolver = async (name: string, category: string) => {
    return new Promise<Resolver | null>((resolve, reject) => {
      fetch(`${API_URL}/resolver?name=${name}&category=${category}`)
        .then((response) => response.json())
        .then((data: {content: string, category: string, name_hash: string}) => {
          resolve({
              key: data.category,
              value: data.content,
              nameHash: data.name_hash,
              canDelete: false
            } as Resolver
          );
        })
        .catch((error) => {
          resolve(null);
        });
    });
  }

  const getPublicDomain = async (publicKey: string) => {
    return new Promise<Array<Record>>((resolve, reject) => {
      fetch(`${API_URL}/public_ans/${publicKey}`)
        .then((response) => response.json())
        .then((data: Array<{name: string, address: string, name_hash: string, is_primary_name: boolean, balance: number}>) => {
          resolve(data.map(item => {
            return {
              name: item.name,
              private: false,
              isPrimaryName: item.is_primary_name,
              nameHash: item.name_hash,
              balance: item.balance
            } as Record;
          }));
        })
        .catch((error) => {
          resolve([]);
        });
    });
  }

  const getPublicBalance = async (address: string): Promise<number> => {
    return new Promise<number>((resolve, reject) => {
      fetch(`${ALEO_URL}program/credits.aleo/mapping/account/${address}`)
        .then((response) => response.text())
        .then((balance) => {
          resolve(parseInt(balance.replaceAll('"', '')) || 0);
        })
        .catch((error) => {
          resolve(0);
        });
    });
  }

  return {getAddress, getNameHash, getPrimaryName, getName, getSubNames, getPublicDomain, getResolvers, getResolver,
    getStatistic, getPublicBalance};
}
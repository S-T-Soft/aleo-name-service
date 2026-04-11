import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';
import env from "@/config/env";
import {NameHashBalance, Record, Resolver, Statistic} from "@/types";

type ClientApi = {
  getAddress: (name: string) => Promise<string>;
  getNameHash: (name: string) => Promise<string>;
  getPrimaryName: (publicKey: string) => Promise<string>;
  getName: (hashName: string) => Promise<NameHashBalance>;
  getSubNames: (name: string) => Promise<Array<Record>>;
  getPublicDomain: (publicKey: string) => Promise<Array<Record>>;
  getResolvers: (name: string) => Promise<Array<Resolver>>;
  getResolver: (name: string, category: string) => Promise<Resolver | null>;
  getStatistic: () => Promise<Statistic>;
  getPublicBalance: (address: string) => Promise<number>;
  getNameByField: (field: string) => Promise<NameHashBalance>;
  getLatestHeight: () => Promise<number>;
  getLatestAleoPrice: () => Promise<{price: number, timestamp: number}>;
};

let clientApi: ClientApi | null = null;

function createClient(): ClientApi {
  const getStatistic = pMemoize(async () => {
    return new Promise<Statistic>((resolve, reject) => {
      fetch(`${env.API_URL}/statistic`)
        .then((response) => response.json())
        .then((data) => {
          resolve({
            totalNames: data.total_names,
            totalPriNames: data.total_pri_names,
            totalNFTOwners: data.total_nft_owners,
            totalNames24h: data.total_names_24h,
            blockHeight: data.block_height,
            healthy: data.healthy
          } as Statistic);
        })
        .catch((error) => {
          reject({message: `Error load statistic`});
        });
    });
  }, {cache: new ExpiryMap(2000)})

  const getAddress = pMemoize(async (name: string) => {
    return new Promise<string>((resolve, reject) => {
      fetch(`${env.API_URL}/address/${name}`)
        .then((response) => response.json())
        .then((data) => {
          resolve(data.address);
        })
        .catch((error) => {
          reject({message: `${name} has not been registered`});
        });
    });
  }, {cache: new ExpiryMap(5000)})

  const getNameHash = pMemoize(async (name: string) => {
    return new Promise<string>((resolve, reject) => {
      fetch(`${env.API_URL}/name_to_hash/${name}`)
        .then((response) => response.json())
        .then((data) => {
          resolve(data.name_hash);
        })
        .catch((error) => {
          resolve("");
        });
    });
  })

  const getName = pMemoize(async (hashName: string) => {
    return new Promise<NameHashBalance>((resolve, reject) => {
      fetch(`${env.API_URL}/hash_to_name/${hashName}`)
        .then((response) => response.json())
        .then((data) => {
          resolve({
            name: data.name,
            nameHash: hashName,
            nameField: data.name_field,
            balance: data.balance
          } as NameHashBalance);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }, {cache: new ExpiryMap(10000)})

  const getNameByField = pMemoize(async (field: string) => {
    return new Promise<NameHashBalance>((resolve, reject) => {
      fetch(`${env.API_URL}/field_to_name/${field}`)
        .then((response) => response.json())
        .then((data) => {
          resolve({
            name: data.name,
            nameHash: data.name_hash,
            nameField: field,
            balance: data.balance
          } as NameHashBalance);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }, {cache: new ExpiryMap(10000)})

  const getPrimaryName = pMemoize(async (publicKey: string) => {
    return new Promise<string>((resolve, reject) => {
      if (publicKey) {
        fetch(`${env.API_URL}/primary_name/${publicKey}`)
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
  }, {cache: new ExpiryMap(5000)})

  const getSubNames = pMemoize(async (name: string) => {
    return new Promise<Array<Record>>((resolve, reject) => {
      fetch(`${env.API_URL}/subdomain/${name}`)
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
  }, {cache: new ExpiryMap(5000)})

  const getResolvers = pMemoize(async (name: string) => {
    return new Promise<Array<Resolver>>((resolve, reject) => {
      fetch(`${env.API_URL}/resolvers/${name}`)
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
  }, {cache: new ExpiryMap(5000)})

  const getResolver = pMemoize(async (name: string, category: string) => {
    return new Promise<Resolver | null>((resolve, reject) => {
      fetch(`${env.API_URL}/resolver?name=${name}&category=${category}`)
        .then((response) => {
          if (response.status === 404) {
            return null;
          }
          if (!response.ok) {
            throw new Error(`Failed to load resolver: ${response.status}`);
          }
          return response.json();
        })
        .then((data: {content: string, category: string, name_hash: string}) => {
          if (data == null) {
            resolve(null);
            return;
          }
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
  }, {cache: new ExpiryMap(5000)})

  const getPublicDomain = pMemoize(async (publicKey: string) => {
    return new Promise<Array<Record>>((resolve, reject) => {
      fetch(`${env.API_URL}/public_ans/${publicKey}`)
        .then((response) => response.json())
        .then((data: Array<{name: string, address: string, name_hash: string, name_field: string, is_primary_name: boolean, balance: number}>) => {
          resolve(data.map(item => {
            return {
              name: item.name,
              private: false,
              isPrimaryName: item.is_primary_name,
              nameHash: item.name_hash,
              nameField: item.name_field,
              balance: item.balance
            } as Record;
          }));
        })
        .catch((error) => {
          resolve([]);
        });
    });
  }, {cache: new ExpiryMap(5000)})

  const getPublicBalance = pMemoize(async (address: string): Promise<number> => {
    return new Promise<number>((resolve, reject) => {
      fetch(env.RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getMappingValue',
          params: {
            "program_id": "credits.aleo",
            "mapping_name": "account",
            "key": address
          }
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          resolve(parseInt(data.result) || 0);
        })
        .catch((error) => {
          resolve(0);
        });
    });
  }, {cache: new ExpiryMap(5000)})

  const getLatestAleoPrice = pMemoize(async () => {
    // Fetch the latest price of Aleo from Office Oracle Mapping
    return fetch(env.RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getMappingValue',
        params: {
          "program_id": env.REGISTER_PROGRAM,
          "mapping_name": "price_data",
          "key": "0u64"
        }
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.result == null) {
          return {
            price: 1,
            timestamp: 0
          };
        }
        // 使用正则表达式提取数值
        const dataMatch = data.result.match(/price:\s*(\d+)u64/);
        const timestampMatch = data.result.match(/timestamp:\s*(\d+)u64/);

        return {
          price: dataMatch ? parseInt(dataMatch[1]) : 1,
          timestamp: timestampMatch ? parseInt(timestampMatch[1]) : 0
        };
      })
  }, {cache: new ExpiryMap(10000)})

  const getLatestHeight = pMemoize(async () => {
    return new Promise<number>((resolve, reject) => {
      fetch(env.RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'latest/block',
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          resolve(parseInt(data.result.height));
        })
        .catch((error) => {
          reject({message: `Error load latest height`});
        });
    });
  }, {cache: new ExpiryMap(3000)})

  return {getAddress, getNameHash, getPrimaryName, getName, getSubNames, getPublicDomain, getResolvers, getResolver,
    getStatistic, getPublicBalance, getNameByField, getLatestHeight, getLatestAleoPrice};
}

export function useClient(): ClientApi {
  if (!clientApi) {
    clientApi = createClient();
  }
  return clientApi;
}

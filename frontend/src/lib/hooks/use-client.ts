import * as process from "process";

export function useClient() {
  const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

  const getAddress = async (name: string) => {
    if (!name.endsWith(".ans")) {
      name = `${name}.ans`;
    }
    return new Promise<string>((resolve, reject) => {
      fetch(`${NEXT_PUBLIC_API_URL}/address/${name}`)
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
      fetch(`${NEXT_PUBLIC_API_URL}/name_to_hash/${name}.ans`)
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
    return new Promise<string>((resolve, reject) => {
      fetch(`${NEXT_PUBLIC_API_URL}/hash_to_name/${hashName}`)
        .then((response) => response.json())
        .then((data) => {
          resolve(data.name);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  const getPrimaryName = async (publicKey: string) => {
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

  return {getAddress, getNameHash, getPrimaryName, getName};
}
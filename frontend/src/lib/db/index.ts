import Dexie from 'dexie';

const db = new Dexie('ANSDB');

db.version(1).stores({
  names: '++id, name, hash'
});

export async function queryName(query: string) {
  try {
    const itemByName = await db.table("names").where('name').equals(query).first();
    const itemByHash = await db.table("names").where('hash').equals(query).first();
    return itemByName || itemByHash || null;
  } catch (error) {
    return null;
  }
}

export async function saveName(name: string, hash: string) {
  const existingByName = await db.table("names").where('name').equals(name).first();
  const existingByHash = await db.table("names").where('hash').equals(hash).first();

  if (existingByName || existingByHash) {
    return;
  }

  await db.table("names").add({name, hash});
}

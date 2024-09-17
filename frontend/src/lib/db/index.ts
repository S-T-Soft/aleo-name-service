import Dexie from 'dexie';

const db = new Dexie('ANSDB');

db.version(2).stores({
  names: '++id, name, hash, field'
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

export async function queryByField(field: string) {
  return db.table("names").where('field').equals(field).first();
}

export async function saveName(name: string, hash: string, field?: string) {
  const existingByName = await db.table("names").where('name').equals(name).first();
  const existingByHash = await db.table("names").where('hash').equals(hash).first();
  const item = existingByHash || existingByName;

  if (item) {
    if (field && item.field !== field) {
      await db.table("names").update(item.id, {field});
    }
    return;
  }

  await db.table("names").add({name, hash});
}

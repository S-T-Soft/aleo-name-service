import Dexie from 'dexie';

const db = new Dexie('ANSDB');
const tableName = "names_v2"

db.version(1).stores({
  [tableName]: '++id, name, hash, field'
});

export async function queryName(query: string) {
  try {
    const itemByName = await db.table(tableName).where('name').equals(query).first();
    const itemByHash = await db.table(tableName).where('hash').equals(query).first();
    return itemByName || itemByHash || null;
  } catch (error) {
    return null;
  }
}

export async function queryByField(field: string) {
  return db.table(tableName).where('field').equals(field).first();
}

export async function saveName(name: string, hash: string, field?: string) {
  const existingByName = await db.table(tableName).where('name').equals(name).first();
  const existingByHash = await db.table(tableName).where('hash').equals(hash).first();
  const item = existingByHash || existingByName;

  if (item) {
    if (field && item.field !== field) {
      await db.table(tableName).update(item.id, {field});
    }
    return;
  }

  await db.table(tableName).add({name, hash});
}

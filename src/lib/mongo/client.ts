import { MongoClient, type Db } from "mongodb";

// Server-only. Never import from a "use client" file.
// Cached on `global` so Next.js's dev-mode hot reload doesn't open a new connection per edit,
// and so serverless invocations in the same warm Lambda reuse the connection.

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set.");
  const client = new MongoClient(uri);
  return client.connect();
}

const clientPromise: Promise<MongoClient> = global._mongoClientPromise ?? (global._mongoClientPromise = connect());

/** The database named in the connection string (falls back to "ilumo"). */
export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || undefined) ?? client.db("ilumo");
}

let indexesEnsured = false;

/** Create indexes once per server instance. Safe to call repeatedly; idempotent server-side. */
export async function ensureIndexes() {
  if (indexesEnsured) return;
  indexesEnsured = true;
  const db = await getDb();
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("lessons").createIndex({ ownerId: 1, createdAt: -1 }),
    db.collection("lessonProgress").createIndex({ ownerId: 1, lessonId: 1 }, { unique: true }),
    db.collection("contactMessages").createIndex({ receivedAt: -1 }),
  ]).catch((e) => {
    indexesEnsured = false; // let the next call retry
    throw e;
  });
}

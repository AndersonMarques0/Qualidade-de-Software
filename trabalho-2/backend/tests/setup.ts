import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";

// Estas variáveis são definidas antes dos módulos da aplicação serem importados.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "chave-de-testes-com-mais-de-trinta-e-dois-caracteres";
process.env.JWT_EXPIRES_IN = "1d";
process.env.ORDER_JOB_INTERVAL_MS = "60000";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/bookstore-test";

let replicaSet: MongoMemoryReplSet | undefined;

beforeAll(async () => {
  replicaSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
    },
  });

  await mongoose.connect(replicaSet.getUri(), {
    dbName: "bookstore-test",
  });
}, 120_000);

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await replicaSet?.stop();
}, 120_000);

import { MongoMemoryServer } from 'mongodb-memory-server';

declare global {
  // eslint-disable-next-line no-var
  var __MONGOD__: MongoMemoryServer;
}

export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  global.__MONGOD__ = mongod;
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test_jwt_secret_32chars_minimum__';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32chars_min__';
  process.env.NODE_ENV = 'test';
}

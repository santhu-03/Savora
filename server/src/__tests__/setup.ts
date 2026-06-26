import mongoose from 'mongoose';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI!);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map(c => c.deleteMany({})));
});

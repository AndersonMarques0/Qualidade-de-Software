process.env.NODE_ENV ??= "test";
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/bookstore_test";
process.env.JWT_SECRET ??= "test-secret-key-with-at-least-32-characters";
process.env.JWT_EXPIRES_IN ??= "1d";

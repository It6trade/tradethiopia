const mongoose = require('mongoose');
const dns = require('dns');
const Package = require('../models/Package');

// Use public DNS resolvers so MongoDB SRV lookups succeed on local networks
try { dns.setServers(['8.8.8.8', '1.1.1.1', '9.9.9.9']); } catch (_) {}

let isConnected = false;

const connectionOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
  maxPoolSize: 10
};

const dropLegacyPackageIndex = async () => {
  if (!mongoose.connection.readyState) return;

  try {
    const collection = mongoose.connection.collection('packages');
    const exists = await collection.indexExists('packageNumber_1');
    if (exists) {
      await collection.dropIndex('packageNumber_1');
      console.log('Dropped legacy packages packageNumber_1 index');
    }
  } catch (error) {
    if (error.codeName && error.codeName !== 'IndexNotFound') {
      console.error('Failed to drop legacy package index:', error);
    }
  }
};

const ensurePackageIndexSetup = async () => {
  try {
    await dropLegacyPackageIndex();
    await Package.init();
  } catch (error) {
    console.error('Package index setup error:', error);
  }
};

const connect = async (uri, options = connectionOptions) => {
  const connection = await mongoose.connect(uri, options);
  isConnected = true;
  await ensurePackageIndexSetup();
  return connection;
};

const SRV_DNS_ERROR_CODES = new Set(['ECONNREFUSED', 'ETIMEOUT', 'ENOTFOUND', 'EAI_AGAIN']);
const isSrvDnsFailure = (error) =>
  SRV_DNS_ERROR_CODES.has(error?.code) &&
  String(error?.message || '').includes('querySrv');

const buildAtlasSeedListUri = (srvUri) => {
  const seedList = process.env.MONGO_ATLAS_SEED_LIST?.trim();
  const replicaSet = process.env.MONGO_ATLAS_REPLICA_SET?.trim();

  if (!srvUri.startsWith('mongodb+srv://') || !seedList || !replicaSet) {
    return null;
  }

  const uriWithoutScheme = srvUri.slice('mongodb+srv://'.length);
  const credentialsEnd = uriWithoutScheme.lastIndexOf('@');
  if (credentialsEnd < 0) return null;

  const credentials = uriWithoutScheme.slice(0, credentialsEnd);
  const hostAndPath = uriWithoutScheme.slice(credentialsEnd + 1);
  const pathStart = hostAndPath.indexOf('/');
  const pathAndQuery = pathStart >= 0 ? hostAndPath.slice(pathStart) : '/';
  const separator = pathAndQuery.includes('?') ? '&' : '?';

  return `mongodb://${credentials}@${seedList}${pathAndQuery}${separator}` +
    `tls=true&authSource=admin&replicaSet=${encodeURIComponent(replicaSet)}`;
};

const connectDB = async () => {
  console.log('Attempting to connect to database...');
  console.log('Environment:', {
    vercel: Boolean(process.env.VERCEL),
    nodeEnv: process.env.NODE_ENV || 'development',
    hasMongoUri: Boolean(process.env.MONGO_URI)
  });

  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('Using existing database connection');
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  try {
    console.log('Connecting to MongoDB...');
    const connection = await connect(mongoUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error(`Database failed to connect: ${error.message}`);

    const atlasSeedListUri = isSrvDnsFailure(error)
      ? buildAtlasSeedListUri(mongoUri)
      : null;

    if (!atlasSeedListUri) {
      throw error;
    }

    console.warn('SRV DNS lookup failed; retrying the same Atlas cluster with its configured seed list...');

    try {
      await mongoose.disconnect();
      const connection = await connect(atlasSeedListUri);
      console.log(`MongoDB Atlas connected through seed list: ${connection.connection.host}`);
      return connection;
    } catch (seedListError) {
      console.error(`MongoDB Atlas seed-list connection failed: ${seedListError.message}`);
      throw seedListError;
    }
  }
};

const disconnectDB = async () => {
  if (isConnected || mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
  }
};

module.exports = { connectDB, disconnectDB };

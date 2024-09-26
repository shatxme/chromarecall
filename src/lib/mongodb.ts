import { MongoClient, MongoClientOptions } from 'mongodb'

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const uri = process.env.MONGODB_URI
const options: MongoClientOptions = {}

let clientPromise: Promise<MongoClient>

const mockClient = {
  db: () => ({
    collection: () => ({
      findOne: async () => ({}),
      insertOne: async () => ({}),
      updateOne: async () => ({}),
      deleteOne: async () => ({}),
    }),
  }),
} as unknown as MongoClient

if (!uri) {
  console.warn('MONGODB_URI not found. Using mock client.')
  clientPromise = Promise.resolve(mockClient)
} else {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options)
      global._mongoClientPromise = client.connect()
    }
    clientPromise = global._mongoClientPromise
  } else {
    const client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }
}

export default clientPromise
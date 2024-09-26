import { MongoClient, MongoClientOptions } from 'mongodb'

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const uri = process.env.MONGODB_URI
const options: MongoClientOptions = {}

let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'production') {
  if (!uri) {
    throw new Error('Please add your Mongo URI to .env.local')
  }
  const client = new MongoClient(uri, options)
  clientPromise = client.connect()
} else {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
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
    global._mongoClientPromise = Promise.resolve(mockClient)
  }
  clientPromise = global._mongoClientPromise
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise
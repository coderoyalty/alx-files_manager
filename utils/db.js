import mongodb from 'mongodb';
import Collection from 'mongodb/lib/collection';


class DBClient {
  constructor() {
    // MongoDB connection details from environment variables or defaults
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    // Create a MongoDB connection URI
    const uri = `mongodb://${host}:${port}/${database}`;

    // Create MongoDB client instance
    this.client = new mongodb.MongoClient(uri, { useUnifiedTopology: true });

    // Connect to MongoDB
    this.client.connect((err) => {
      if (err) {
        console.error(`Error connecting to MongoDB: ${err}`);
      } else {
        console.log('Connected to MongoDB');
      }
    });
  }

  // Check if the MongoDB connection is alive
  isAlive() {
    return this.client.isConnected();
  }

  // Get the number of documents in the 'users' collection
  async nbUsers() {
    const usersCollection = this.client.db().collection('users');
    const count = await usersCollection.countDocuments();
    return count;
  }

  // Get the number of documents in the 'files' collection
  async nbFiles() {
    const filesCollection = this.client.db().collection('files');
    const count = await filesCollection.countDocuments();
    return count;
  }
}

// Create an instance of DBClient
export const dbClient = new DBClient();

// Export the DBClient instance
export default  dbClient;

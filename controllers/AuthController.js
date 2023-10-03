import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import sha1 from 'sha1';
import dbClient from '../utils/db';

export default class AuthController {
  // Handle user authentication and token generation
  static async getConnect(req, res) {
    const authorizationHeader = req.header('Authorization');

    // Check if the Authorization header is present and formatted correctly
    if (!authorizationHeader || !authorizationHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract and decode email and password from the Authorization header
    const base64Credentials = authorizationHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    try {
      const usersCollection = await dbClient.usersCollection();
      // Check if user with provided email and hashed password exists in the database
      const user = await usersCollection.findOne({ email, password: sha1(password) });

      // If user not found, return unauthorized error
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Generate a new token and store it in Redis with a 24-hour expiration time
      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 86400); // 24 hours expiration time

      // Return the generated token
      return res.status(200).json({ token });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // Handle user logout by deleting the token from Redis
  static async getDisconnect(req, res) {
    const { token } = req;

    try {
      // Retrieve user ID associated with the token from Redis
      const userId = await redisClient.get(`auth_${token}`);

      // If user ID not found, return unauthorized error
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Delete the token from Redis to log out the user
      await redisClient.del(`auth_${token}`);

      // Return success response with no content (status code 204)
      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

import sha1 from 'sha1';
import dbClient from '../utils/db';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';

export default class UsersController {
  static async postNew(req, res) {
    // Check if email and password are provided
    if (!req.body.email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!req.body.password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      // Check if the email already exists in the database
      const { email, password } = req.body;

      const usersCollection = await dbClient.usersCollection();
      const existingUser = await usersCollection.findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password using SHA1
      const hashedPassword = sha1(password);

      // Create a new user and store it in the database
      const insertionInfo = await usersCollection.insertOne({
        email,
        password: hashedPassword,
      });
      const userId = insertionInfo.insertedId.toString();

      // Return the new user data (only email and id) with status code 201
      return res.status(201).json({ email, id: userId });
    } catch (error) {
      // Handle any server errors
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /** Handle user logout by deleting the token from Redis
   * @param {import('express').Request} req - The Express.js Request object.
   * @param {import('express').Response} res - The Express.js Response object.
   */
  static async getMe(req, res) {
    const token = req.headers['x-token'];

    const userId = await redisClient.get(`auth_${token}`);

    // If user ID not found, return unauthorized error
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const usersCollection = await dbClient.usersCollection();
    const user = await usersCollection.findOne({ _id: ObjectId(userId) });

    if (!user) {
      return res.sendStatus(404);
    }

    res.status(200).json({ email: user.email, id: user._id });
  }
}

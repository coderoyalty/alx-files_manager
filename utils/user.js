import dbClient from './db';
import redisClient from './redis';
import { ObjectId } from 'mongodb';

export default class UserUtils {
  /**
   * @param {import('express').Request} request
   * @returns
   */
  static async getAuthData(request) {
    const token = request.headers['x-token'];

    const userId = await redisClient.get(`auth_${token}`);

    return { token, userId };
  }

  /**
   *
   * @param {*} id
   * @returns
   */

  /**
   *
   * @param {object} query
   * @returns
   */

  static async getUser(query) {
    const usersCollection = await dbClient.usersCollection();
    const user = await usersCollection.findOne(query);

    return user;
  }
}

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
    const tokenKey = `auth_${token}`;
    const userId = await redisClient.get(tokenKey);

    return { token, userId };
  }

  /**
   *
   * @param {*} id
   * @returns
   */

  static validId(id) {
    try {
      const _ = ObjectId(id);
    } catch (err) {
      return false;
    }
    return true;
  }

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

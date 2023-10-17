import redisClient from '../utils/redis';
import db from '../utils/db';

export default class AppController {
  static getStatus(req, res) {
    res.status(200).json({
      redis: redisClient.isAlive(),
      db: db.isAlive(),
    });
  }

  static getStats(req, res) {
    Promise.all([db.nbUsers(), db.nbFiles()]).then(
      ([usersCount, filesCount]) => {
        res.status(200).json({ users: usersCount, files: filesCount });
      },
    );
  }
}

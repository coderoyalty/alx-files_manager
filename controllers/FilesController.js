import UserUtils from '../utils/user';
import FileUtils from '../utils/file';
import { ObjectId } from 'mongodb';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

export default class FilesController {
  /**
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  static async postUpload(req, res) {
    const { userId } = await UserUtils.getAuthData(req);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const user = UserUtils.getUser({
      _id: ObjectId(userId),
    });

    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const { error, fileParams } = await FileUtils.validateBody(req);
    if (error) {
      return res.status(400).json({ error });
    }

    const data = await FileUtils.writeToFileAndStoreMetadata(
      userId,
      fileParams,
      FOLDER_PATH
    );

    if (data.error) {
      return res.status(data.status).send(data.error);
    }

    if (data.newFile) {
      delete data.newFile._id;
      delete data.newFile.data;
    }

    return res.status(201).json({ ...data.newFile });
  }
}

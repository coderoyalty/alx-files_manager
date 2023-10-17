import { ObjectId } from 'mongodb';
import UserUtils from '../utils/user';
import FileUtils from '../utils/file';
import db from '../utils/db';

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
      FOLDER_PATH,
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

  /**
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  static async getShow(req, res) {
    const { userId } = await UserUtils.getAuthData(req);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    if (!id) return res.status(404).send({ error: 'Not found' });

    let query = null;

    // ObjectId throws an error when its parameter is invalid
    try {
      query = {
        _id: ObjectId(id),
        userId: ObjectId(userId),
      };
    } catch (err) {
      return res.status(404).send({ error: 'Not found' });
    }

    const file = await FileUtils.getFile(query);

    if (!file) return res.status(404).send({ error: 'Not found' });

    file.id = file.__id;
    delete file.__id;

    return res.json({ ...file });
  }

  /**
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  static async getIndex(req, res) {
    const { userId } = await UserUtils.getAuthData(req);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    let parentId = req.query.parentId || '0';

    // test the query field `page` with regex, replace it with 0 if not valid
    let page = Number(req.query.page) || 0;
    if (Number.isNaN(page)) {
      page = 0;
    }

    const perPage = 20;
    const skip = page * perPage;

    // filter criteria
    const filter = {
      userId: ObjectId(userId),
    };

    if (parentId === '0') parentId = 0;
    try {
      if (parentId !== 0 && ObjectId(parentId)) {
        filter.parentId = ObjectId(parentId);
      }
    } catch (err) {
      res.status(401).send({ error: 'Unauthorized' });
    }

    const fileCollection = await db.filesCollection();
    const data = await (
      await fileCollection.aggregate([
        { $match: filter }, // filter based on a criteria
        { $sort: { _id: -1 } }, // sort in descending order
        { $skip: skip }, // skip a specified no. of docs from the result
        { $limit: perPage }, // limit number of docs passed to the next stage
        // the project stage
        {
          $project: {
            // reshape the document
            _id: 0, // exclude `_id` field from the output
            id: '$_id', // rename `_id` field to `id`
            userId: '$userId', // copies the `userId` field
            name: '$name', // copies the `name` field
            type: '$type', // copies the `type`
            isPublic: '$isPublic',
            parentId: {
              $cond: {
                // use a condition to set `parentId` field
                if: { $eq: ['$parentId', '0'] }, // if `parentId` == 0
                then: '0', // then exclude `parentId`
                else: '$parentId', // rather copy it
              },
            },
          },
        },
      ])
    ).toArray(); // convert to array here!

    return res.json(data);
  }

  /**
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  static async putPublish(req, res) {
    const { userId } = await UserUtils.getAuthData(req);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const { id } = req.params;

    let query = null;

    try {
      // ObjectId throws an error if it's not valid
      // a try...catch block is the best way to discover
      // that the query is invalid
      query = {
        userId: ObjectId(userId),
        _id: ObjectId(id),
      };
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }

    const data = await FileUtils.getFile(query);

    if (!data) {
      return res.status(404).json({ error: 'Not found' });
    }
    data.isPublic = true;
    const file = await FileUtils.updateFile(data);
    return res.send(file);
  }

  /**
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  static async putUnpublish(req, res) {
    const { userId } = await UserUtils.getAuthData(req);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const { id } = req.params;

    let query = null;

    try {
      query = {
        userId: ObjectId(userId),
        _id: ObjectId(id),
      };
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }

    const data = await FileUtils.getFile(query);

    if (!data) {
      return res.status(404).json({ error: 'Not found' });
    }
    data.isPublic = false;
    const file = await FileUtils.updateFile(data);
    return res.send(file);
  }
}

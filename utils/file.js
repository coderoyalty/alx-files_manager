import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import dbClient from './db';
import UserUtils from './user';

export default class FileUtils {
  /**
   *
   * @coderoyalty
   * @param {string} userId
   * @param {{data, name: string, type: string, parentId?, isPublic: boolean}} fileParams
   * @param {string} folderPath
   * @returns
   */
  static async writeToFileAndStoreMetadata(userId, fileParams, folderPath) {
    const { data, name, isPublic, type } = fileParams;
    let { parentId } = fileParams;
    if (parentId !== 0) parentId = ObjectId(parentId);

    // write the data provided if type is not folder
    if (type !== 'folder') {
      const filenameUUID = uuidv4();
      const fileData = Buffer.from(data, 'base64');
      const path = `${folderPath}/${filenameUUID}`;

      try {
        await fsPromises.mkdir(folderPath, { recursive: true });
        await fsPromises.writeFile(path, fileData);
      } catch (err) {
        return { error: err.message, status: 400 };
      }
    }

    // write the metadata to a database
    // the metadata can be a folder etc.

    const query = {
      name,
      type,
      data,
      isPublic,
      parentId,
      localPath: path,
      userId: ObjectId(userId),
    };

    const filesCollection = await dbClient.filesCollection();
    const result = await filesCollection.insertOne(query);

    const file = { ...query };
    delete file.localPath;
    file.id = result.insertedId;

    return { error: null, newFile: file };
  }

  /**
   *
   * @param {import('express').Request} req
   * @returns
   */
  static async validateBody(req) {
    const allowedTypes = ['image', 'file', 'folder'];
    const { name, type, data, isPublic = false } = req.body;

    let { parentId = 0 } = req.body;
    let error = null;

    if (parentId === '0') parentId = 0;
    if (!name) {
      error = 'Missing name';
    } else if (!type && !allowedTypes.includes('folder')) {
      error = 'Missing type';
    } else if (!data && type !== 'folder') {
      error = 'Missing data';
    } else if (parentId && parentId !== '0') {
      let file = null;

      if (UserUtils.validId(parentId)) {
        file = await this.getFile({
          _id: ObjectId(parentId),
        });
      }

      if (!file) {
        error = 'Parent not found';
      } else if (file.type !== 'folder') {
        error = 'Parent is not a folder';
      }
    }
    return {
      error,
      fileParams: {
        name,
        type,
        parentId,
        isPublic,
        data,
      },
    };
  }

  /**
   *
   * @param {object} query
   * @returns
   */

  static async getFile(query) {
    const file = dbClient.filesCollection.findOne(query);

    return file;
  }
}

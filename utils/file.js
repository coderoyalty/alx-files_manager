import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import db from './db';

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
    const {
      data, name, isPublic, type,
    } = fileParams;
    let { parentId } = fileParams;
    if (parentId !== 0) parentId = ObjectId(parentId);
    const filenameUUID = uuidv4();
    const path = `${folderPath}/${filenameUUID}`;

    // write the data provided if type is not folder
    if (type !== 'folder') {
      const fileData = Buffer.from(data, 'base64');

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

    const filesCollection = await db.filesCollection();
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
    const {
      name, type, data, isPublic = false,
    } = req.body;

    let { parentId = 0 } = req.body;
    let error = null;

    if (parentId === '0') parentId = 0;
    if (!name) {
      error = 'Missing name';
    } else if (!type || !allowedTypes.includes(type)) {
      error = 'Missing type';
    } else if (!data && type !== 'folder') {
      error = 'Missing data';
    } else if (parentId && parentId !== '0') {
      let file = null;

      // contain the possibility of having an invalid parentId
      try {
        file = await this.getFile({
          _id: ObjectId(parentId),
        });
      } catch (err) {
        file = null;
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
    const file = await (await db.filesCollection()).findOne(query);
    return file;
  }

  static async updateFile(file) {
    await (
      await db.filesCollection()
    ).updateOne(
      {
        _id: file._id,
      },
      {
        $set: file,
      },
    );
    const data = await this.getFile({
      _id: file._id,
    });
    return data;
  }
}

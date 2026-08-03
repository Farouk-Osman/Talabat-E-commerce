/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable new-cap */

const asyncHandler = require('express-async-handler');
const sharp = require('sharp');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const apiError = require('../utils/apiError');
const apiFeatures = require('../utils/apiFeatures');
const getImageUrl = require('../utils/getImageUrl');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const processImage = async (file, destPath, size = 800) => {
  ensureDir(path.dirname(destPath));
  if (file.buffer) {
    await sharp(file.buffer)
      .resize(size, size)
      .toFormat('jpeg')
      .jpeg({ quality: 95 })
      .toFile(destPath);
  } else if (file.path) {
    await sharp(file.path)
      .resize(size, size)
      .toFormat('jpeg')
      .jpeg({ quality: 95 })
      .toFile(destPath);
  } else {
    throw new Error('Invalid file object');
  }
};

const mapDocImages = (doc, req, imageFields = []) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  imageFields.forEach((field) => {
    if (obj[field]) {
      if (Array.isArray(obj[field])) {
        obj[field] = obj[field].map((p) => getImageUrl(req, p));
      } else {
        obj[field] = getImageUrl(req, obj[field]);
      }
    }
  });
  return obj;
};

const safeUnlink = (filePath) => {
  try {
    if (!filePath || typeof filePath !== 'string') return;
    // only delete local uploads and avoid default images
    if (!filePath.startsWith('uploads/') || filePath.includes('default-'))
      return;
    const abs = path.resolve(filePath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (err) {
    // swallow errors to avoid crashing on file removal
    // optionally log here
  }
};

const deleteOne = (Model, options = {}) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    // find doc first so we can remove files if needed
    const doc = await Model.findById(id);
    if (!doc) {
      return next(new apiError('No document found with that ID', 404));
    }

    // remove files for singleImageField
    if (options.singleImageField && doc[options.singleImageField]) {
      const p = doc[options.singleImageField];
      safeUnlink(p);
    }

    // remove files for imageFields
    if (options.imageFields && Array.isArray(options.imageFields)) {
      for (const field of options.imageFields) {
        const val = doc[field];
        if (Array.isArray(val)) {
          val.forEach((p) => safeUnlink(p));
        } else {
          safeUnlink(val);
        }
      }
    }

    await Model.findByIdAndDelete(id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

// options: { singleImageField, imageFields: [field1, field2], folderByField: { field: 'uploads/..' }, sizes: { field: size } }
const updateOne = (Model, options = {}) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    // load existing document to know previous file paths
    const existing = await Model.findById(id);
    if (!existing)
      return next(new apiError('No document found with that ID', 404));

    // Process single file (req.file) for singleImageField
    if (options.singleImageField && req.file) {
      const folder =
        (options.folderByField &&
          options.folderByField[options.singleImageField]) ||
        `uploads/${String(Model.modelName).toLowerCase()}s`;
      ensureDir(folder);
      const filename = `${String(Model.modelName).toLowerCase()}-${randomUUID()}-${Date.now()}.jpeg`;
      const dest = `${folder}/${filename}`;
      await processImage(
        req.file,
        dest,
        (options.sizes && options.sizes[options.singleImageField]) || 400
      );
      req.body[options.singleImageField] = dest;
      // remove previous file if it exists
      if (existing[options.singleImageField])
        safeUnlink(existing[options.singleImageField]);
    }

    // Process multiple fields from req.files
    if (options.imageFields && req.files) {
      for (const field of options.imageFields) {
        if (req.files[field]) {
          const files = req.files[field];
          const folder =
            (options.folderByField && options.folderByField[field]) ||
            `uploads/${String(Model.modelName).toLowerCase()}s`;
          ensureDir(folder);
          if (Array.isArray(files)) {
            const paths = [];
            await Promise.all(
              files.map(async (file, idx) => {
                const filename = `${String(Model.modelName).toLowerCase()}-${randomUUID()}-${Date.now()}-${idx + 1}.jpeg`;
                const dest = `${folder}/${filename}`;
                await processImage(
                  file,
                  dest,
                  (options.sizes && options.sizes[field]) || 800
                );
                paths.push(dest);
              })
            );
            // delete previous images array if existed
            if (existing[field]) {
              const prev = existing[field];
              if (Array.isArray(prev)) prev.forEach((p) => safeUnlink(p));
              else safeUnlink(prev);
            }
            req.body[field] = paths;
          } else {
            const filename = `${String(Model.modelName).toLowerCase()}-${randomUUID()}-${Date.now()}.jpeg`;
            const dest = `${folder}/${filename}`;
            await processImage(
              files,
              dest,
              (options.sizes && options.sizes[field]) || 400
            );
            // delete previous single file
            if (existing[field]) safeUnlink(existing[field]);
            req.body[field] = dest;
          }
        }
      }
    }

    const doc = await Model.findByIdAndUpdate(id, req.body, { new: true });
    if (!doc) {
      return next(new apiError('No document found with that ID', 404));
    }

    const result = options.returnImageFields
      ? mapDocImages(doc, req, options.returnImageFields)
      : doc;
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

const createOne = (Model, options = {}) =>
  asyncHandler(async (req, res) => {
    // Process single file
    if (options.singleImageField && req.file) {
      const folder =
        (options.folderByField &&
          options.folderByField[options.singleImageField]) ||
        `uploads/${String(Model.modelName).toLowerCase()}s`;
      ensureDir(folder);
      const filename = `${String(Model.modelName).toLowerCase()}-${randomUUID()}-${Date.now()}.jpeg`;
      const dest = `${folder}/${filename}`;
      await processImage(
        req.file,
        dest,
        (options.sizes && options.sizes[options.singleImageField]) || 400
      );
      req.body[options.singleImageField] = dest;
    }

    // Process multiple fields
    if (options.imageFields && req.files) {
      for (const field of options.imageFields) {
        if (req.files[field]) {
          const files = req.files[field];
          const folder =
            (options.folderByField && options.folderByField[field]) ||
            `uploads/${String(Model.modelName).toLowerCase()}s`;
          ensureDir(folder);
          if (Array.isArray(files)) {
            const paths = [];
            await Promise.all(
              files.map(async (file, idx) => {
                const filename = `${String(Model.modelName).toLowerCase()}-${randomUUID()}-${Date.now()}-${idx + 1}.jpeg`;
                const dest = `${folder}/${filename}`;
                await processImage(
                  file,
                  dest,
                  (options.sizes && options.sizes[field]) || 800
                );
                paths.push(dest);
              })
            );
            req.body[field] = paths;
          } else {
            const filename = `${String(Model.modelName).toLowerCase()}-${randomUUID()}-${Date.now()}.jpeg`;
            const dest = `${folder}/${filename}`;
            await processImage(
              files,
              dest,
              (options.sizes && options.sizes[field]) || 400
            );
            req.body[field] = dest;
          }
        }
      }
    }

    const doc = await Model.create(req.body);
    const result = options.returnImageFields
      ? mapDocImages(doc, req, options.returnImageFields)
      : doc;
    res.status(201).json({
      status: 'success',
      data: result,
    });
  });

const getOne = (Model, popOptions, options = {}) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    let query = Model.findById(id);
    if (popOptions) {
      query = query.populate(popOptions);
    }
    const doc = await query;
    if (!doc) {
      return next(new apiError('No document found with that ID', 404));
    }
    const result = options.returnImageFields
      ? mapDocImages(doc, req, options.returnImageFields)
      : doc;
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

const getAll = (Model, options = {}) =>
  asyncHandler(async (req, res) => {
    // Build filter+search first so the count reflects exactly what will be
    // returned, then apply pagination against that count.
    const counter = new apiFeatures(Model.find(), req.query)
      .filter()
      .search(options.searchFields);
    const documentsCount = await Model.countDocuments(
      counter.mongooseQuery.getFilter()
    );

    const apiFeature = new apiFeatures(Model.find(), req.query)
      .filter()
      .search(options.searchFields)
      .sort()
      .limitFields()
      .paginate(documentsCount);
    const { mongooseQuery, paginationResult } = apiFeature;
    const docs = await mongooseQuery;
    let results = docs;
    if (options.returnImageFields && Array.isArray(options.returnImageFields)) {
      results = docs.map((d) =>
        mapDocImages(d, req, options.returnImageFields)
      );
    }
    res.status(200).json({
      status: 'success',
      results: results.length,
      pagination: paginationResult,
      data: {
        docs: results,
      },
    });
  });

module.exports = {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
  processImage,
  mapDocImages,
  ensureDir,
};

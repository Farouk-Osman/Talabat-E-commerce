const mongoose = require('mongoose');
const slugify = require('slugify');

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'SubCategory name is required'],
      unique: [true, 'SubCategory name must be unique'],
      minlength: [3, 'SubCategory name must be at least 3 characters long'],
      maxlength: [50, 'SubCategory name must be at most 50 characters long'],
    },
    slug: {
      type: String,
      lowercase: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'SubCategory must belong to a Category'],
    },
  },
  { timestamps: true }
);

subCategorySchema.pre('save', function setSlug(next) {
  if (this.isModified('name')) this.slug = slugify(this.name);
  next();
});

subCategorySchema.pre('findOneAndUpdate', function setSlugOnUpdate(next) {
  const update = this.getUpdate();
  if (update && update.name) update.slug = slugify(update.name);
  next();
});

const SubCategory = mongoose.model('SubCategory', subCategorySchema);

module.exports = SubCategory;

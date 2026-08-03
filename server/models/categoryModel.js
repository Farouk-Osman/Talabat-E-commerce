const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Category name is required'],
      unique: [true, 'Category name must be unique'],
      minlength: [3, 'Category name must be at least 3 characters long'],
      maxlength: [50, 'Category name must be at most 50 characters long'],
    },
    slug: {
      type: String,
      lowercase: true,
      index: true,
    },
    image: String,
  },
  { timestamps: true }
);

// Keep slug in sync with name on create/save
categorySchema.pre('save', function setSlug(next) {
  if (this.isModified('name')) this.slug = slugify(this.name);
  next();
});

// Keep slug in sync on findOneAndUpdate / findByIdAndUpdate
categorySchema.pre('findOneAndUpdate', function setSlugOnUpdate(next) {
  const update = this.getUpdate();
  if (update && update.name) update.slug = slugify(update.name);
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;

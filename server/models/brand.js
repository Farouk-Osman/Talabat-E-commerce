const mongoose = require('mongoose');
const slugify = require('slugify');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Brand name is required'],
      minlength: [3, 'Brand name must be at least 3 characters long'],
      maxlength: [50, 'Brand name must be at most 50 characters long'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

brandSchema.pre('save', function setSlug(next) {
  if (this.isModified('name')) this.slug = slugify(this.name);
  next();
});

brandSchema.pre('findOneAndUpdate', function setSlugOnUpdate(next) {
  const update = this.getUpdate();
  if (update && update.name) update.slug = slugify(update.name);
  next();
});

const brandModel = mongoose.model('Brand', brandSchema);

module.exports = brandModel;

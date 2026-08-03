const mongoose = require('mongoose');
const slugify = require('slugify');




const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, 'Product title should not be less than 3 characters'],
        maxlength: [100, 'Product title should not be more than 100 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Product description should not be more than 500 characters']
    },
    price: {
        type: Number,
        required: true,
        trim: true,
        min: [0, 'Product price should not be negative']
    },
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: true
    },
    subcategories: [{
        type: mongoose.Schema.ObjectId,
        ref: 'SubCategory'
    }],
    brand: {
        type: mongoose.Schema.ObjectId,
        ref: 'Brand',
        required: true
    },
    
    imageCover: {
        type: String,
        required: true
    },
    images: [String],
    quantity: {
        type: Number,
        required: true,
        min: [0, 'Product quantity should not be negative']
    },
    sold: {
        type: Number,
        default: 0,
        min: [0, 'Sold count should not be negative']
    },
    priceAfterDiscount: {
        type: Number,
        min: [0, 'Discounted price should not be negative'],
        validate: {
            validator: function (value) {
                // `this` points to the current document
                return value < this.price;
            },
            message: 'Discounted price ({VALUE}) should be less than the original price'
        }
    },
    colors: [String],
    ratingsAverage: {
        type: Number,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    }

},   { timestamps: true }
);

productSchema.pre('save', function setSlug(next) {
  if (this.isModified('title')) this.slug = slugify(this.title);
  next();
});

productSchema.pre('findOneAndUpdate', function setSlugOnUpdate(next) {
  const update = this.getUpdate();
  if (update && update.title) update.slug = slugify(update.title);
  next();
});

productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'category',
    select: 'name',
  });
  next();
});

productSchema.pre(/^findOne/, function (next) {
  this.populate({
    path: 'category',
    select: 'name',
  });
  next();
});

module.exports = mongoose.model('Product', productSchema);
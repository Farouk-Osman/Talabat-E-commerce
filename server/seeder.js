/* eslint-disable no-console */
/**
 * Database seeder.
 *
 *   node seeder.js            # import sample data (clears collections first)
 *   node seeder.js --fresh    # same as default: wipe then import
 *   node seeder.js --destroy  # wipe all seeded collections and exit
 *
 * Images are stored as absolute https:// URLs. utils/getImageUrl passes absolute
 * URLs through untouched, so they render on the site directly with no uploads.
 * Product/category photos come from LoremFlickr keyword search (so the image
 * actually depicts the item); a `lock` id pins one stable photo per slot. Brand
 * "logos" are clean initial badges from ui-avatars in the Talabat orange.
 *
 * The admin account password comes from SEED_ADMIN_PASSWORD (falls back to a
 * dev-only default). Change it immediately outside local development.
 */
const mongoose = require('mongoose');
const config = require('./config/env');

const Category = require('./models/categoryModel');
const SubCategory = require('./models/subCategory');
const Brand = require('./models/brand');
const Product = require('./models/productModel');
const User = require('./models/userModel');

// Topical images (absolute URLs -> render as-is).
// photo(): a keyword-matched photo from LoremFlickr. `lock` pins one stable
//   image per (keywords, lock) pair so the same product always shows the same
//   picture across re-seeds. Commas in keywords => "match ALL these tags".
const photo = (keywords, lock) =>
  `https://loremflickr.com/600/600/${encodeURIComponent(keywords)}?lock=${lock}`;
// logo(): a clean initial badge for the (fictional) brand names, Talabat orange.
const logo = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&size=256&background=ff5a00&color=ffffff&bold=true&format=png`;

// ---------------------------------------------------------------------------
// Static reference data. Products are generated further down so titles/slugs
// stay unique and priceAfterDiscount is always strictly below price.
// ---------------------------------------------------------------------------
const categories = [
  { key: 'electronics', name: 'Electronics', image: photo('electronics,gadget', 101) },
  { key: 'groceries', name: 'Groceries', image: photo('groceries,supermarket', 102) },
  { key: 'fashion', name: 'Fashion', image: photo('fashion,clothing', 103) },
  { key: 'home', name: 'Home & Kitchen', image: photo('kitchen,home', 104) },
  { key: 'beauty', name: 'Beauty & Health', image: photo('cosmetics,beauty', 105) },
];

const subCategories = [
  { name: 'Smartphones', cat: 'electronics' },
  { name: 'Laptops', cat: 'electronics' },
  { name: 'Headphones', cat: 'electronics' },
  { name: 'Fresh Produce', cat: 'groceries' },
  { name: 'Snacks & Sweets', cat: 'groceries' },
  { name: 'Beverages', cat: 'groceries' },
  { name: "Men's Clothing", cat: 'fashion' },
  { name: "Women's Clothing", cat: 'fashion' },
  { name: 'Cookware', cat: 'home' },
  { name: 'Home Decor', cat: 'home' },
  { name: 'Skincare', cat: 'beauty' },
  { name: 'Vitamins', cat: 'beauty' },
];

const brands = [
  { name: 'Aurora', image: logo('Aurora') },
  { name: 'NimbusTech', image: logo('NimbusTech') },
  { name: 'GreenLeaf', image: logo('GreenLeaf') },
  { name: 'Vantage', image: logo('Vantage') },
  { name: 'Lumina', image: logo('Lumina') },
  { name: 'Everest', image: logo('Everest') },
];

// Product blueprints:
//   [title, catKey, subName, brandName, price, discountPct, imgKeywords]
// imgKeywords is a comma-joined tag list handed to LoremFlickr so the photo
// actually depicts the product.
const productBlueprints = [
  ['Aurora Pulse 5G Smartphone', 'electronics', 'Smartphones', 'Aurora', 699, 15, 'smartphone,phone'],
  ['NimbusTech Nova Flagship Phone', 'electronics', 'Smartphones', 'NimbusTech', 899, 10, 'smartphone,mobile'],
  ['Vantage Lite Budget Smartphone', 'electronics', 'Smartphones', 'Vantage', 249, 0, 'smartphone,android'],
  ['NimbusTech UltraBook 14 Laptop', 'electronics', 'Laptops', 'NimbusTech', 1199, 12, 'laptop,computer'],
  ['Aurora ProBook 16 Creator Laptop', 'electronics', 'Laptops', 'Aurora', 1499, 8, 'laptop,notebook'],
  ['Lumina AirPods Wireless Earbuds', 'electronics', 'Headphones', 'Lumina', 149, 20, 'earbuds,earphones'],
  ['Everest Boom Over-Ear Headphones', 'electronics', 'Headphones', 'Everest', 199, 25, 'headphones,audio'],

  ['GreenLeaf Organic Avocados (4 pack)', 'groceries', 'Fresh Produce', 'GreenLeaf', 6, 0, 'avocado,fruit'],
  ['GreenLeaf Fresh Strawberries 500g', 'groceries', 'Fresh Produce', 'GreenLeaf', 5, 10, 'strawberry,fruit'],
  ['Everest Dark Chocolate Bar Box', 'groceries', 'Snacks & Sweets', 'Everest', 12, 15, 'chocolate,candy'],
  ['Lumina Sea Salt Potato Chips', 'groceries', 'Snacks & Sweets', 'Lumina', 4, 0, 'chips,snack'],
  ['Vantage Sparkling Water 12-Pack', 'groceries', 'Beverages', 'Vantage', 9, 10, 'water,bottle'],
  ['Aurora Cold Brew Coffee 1L', 'groceries', 'Beverages', 'Aurora', 7, 0, 'coffee,drink'],

  ['Vantage Classic Oxford Shirt', 'fashion', "Men's Clothing", 'Vantage', 45, 20, 'shirt,menswear'],
  ['Everest Slim-Fit Denim Jeans', 'fashion', "Men's Clothing", 'Everest', 65, 15, 'jeans,denim'],
  ['Lumina Flowy Summer Dress', 'fashion', "Women's Clothing", 'Lumina', 55, 25, 'dress,fashion'],
  ['Aurora Knit Cardigan Sweater', 'fashion', "Women's Clothing", 'Aurora', 49, 0, 'sweater,knitwear'],

  ['Everest Nonstick Cookware Set', 'home', 'Cookware', 'Everest', 129, 18, 'cookware,pots'],
  ['GreenLeaf Cast Iron Skillet 12"', 'home', 'Cookware', 'GreenLeaf', 39, 10, 'skillet,pan'],
  ['Lumina Ceramic Vase Trio', 'home', 'Home Decor', 'Lumina', 34, 0, 'vase,decor'],
  ['Aurora Woven Throw Blanket', 'home', 'Home Decor', 'Aurora', 42, 15, 'blanket,throw'],

  ['Lumina Hydrating Face Serum', 'beauty', 'Skincare', 'Lumina', 28, 20, 'serum,skincare'],
  ['GreenLeaf Vitamin C Day Cream', 'beauty', 'Skincare', 'GreenLeaf', 24, 0, 'cream,cosmetics'],
  ['Everest Daily Multivitamin 90ct', 'beauty', 'Vitamins', 'Everest', 19, 10, 'vitamins,supplement'],
  ['Vantage Omega-3 Fish Oil Softgels', 'beauty', 'Vitamins', 'Vantage', 22, 15, 'supplement,pills'],
];

const colorPool = ['#232323', '#ff5a00', '#ffffff', '#2b6cb0', '#38a169', '#d69e2e'];

// Emails owned by the seeder — only these users get removed on wipe, so any
// real accounts you created by hand are left untouched.
const seededUserEmails = [
  'admin@talabat.local',
  'sara@example.com',
  'omar@example.com',
];

async function destroy() {
  await Promise.all([
    Product.deleteMany(),
    SubCategory.deleteMany(),
    Brand.deleteMany(),
    Category.deleteMany(),
    User.deleteMany({ email: { $in: seededUserEmails } }),
  ]);
  console.log('🗑️  Seeded collections cleared.');
}

async function importData() {
  await destroy();

  // 1) Categories
  const catDocs = await Category.create(
    categories.map((c) => ({ name: c.name, image: c.image }))
  );
  const catByKey = {};
  categories.forEach((c, i) => {
    catByKey[c.key] = catDocs[i];
  });
  console.log(`✅ ${catDocs.length} categories`);

  // 2) SubCategories
  const subDocs = await SubCategory.create(
    subCategories.map((s) => ({ name: s.name, category: catByKey[s.cat]._id }))
  );
  const subByName = {};
  subDocs.forEach((d) => {
    subByName[d.name] = d;
  });
  console.log(`✅ ${subDocs.length} subcategories`);

  // 3) Brands
  const brandDocs = await Brand.create(
    brands.map((b) => ({ name: b.name, image: b.image }))
  );
  const brandByName = {};
  brandDocs.forEach((d) => {
    brandByName[d.name] = d;
  });
  console.log(`✅ ${brandDocs.length} brands`);

  // 4) Products (created one-by-one so save hooks + validators run)
  let count = 0;
  for (let i = 0; i < productBlueprints.length; i += 1) {
    const [title, catKey, subName, brandName, price, discountPct, keywords] =
      productBlueprints[i];

    const doc = {
      title,
      description: `${title} — quality you can trust, delivered fast. A dependable pick from ${brandName}.`,
      price,
      category: catByKey[catKey]._id,
      subcategories: [subByName[subName]._id],
      brand: brandByName[brandName]._id,
      imageCover: photo(keywords, 1000 + i),
      images: [
        photo(keywords, 2000 + i),
        photo(keywords, 3000 + i),
        photo(keywords, 4000 + i),
      ],
      quantity: 10 + ((i * 7) % 90),
      sold: (i * 13) % 200,
      colors: [colorPool[i % colorPool.length], colorPool[(i + 2) % colorPool.length]],
      ratingsAverage: Math.round((3.6 + ((i % 14) / 10)) * 10) / 10,
      ratingsQuantity: 5 + ((i * 11) % 300),
    };
    if (discountPct > 0) {
      // strictly below price, rounded to 2 decimals
      doc.priceAfterDiscount =
        Math.round(price * (1 - discountPct / 100) * 100) / 100;
    }
    // .create runs pre('save') (slug) and the priceAfterDiscount validator
    // eslint-disable-next-line no-await-in-loop
    await Product.create(doc);
    count += 1;
  }
  console.log(`✅ ${count} products`);

  // 5) Users (password hashed by pre-save hook)
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD || 'ChangeMe_admin123';
  await User.create([
    {
      name: 'Site Admin',
      email: 'admin@talabat.local',
      role: 'admin',
      phone: '+201000000000',
      password: adminPassword,
    },
    {
      name: 'Sara Ahmed',
      email: 'sara@example.com',
      phone: '+201111111111',
      password: 'user_password123',
    },
    {
      name: 'Omar Hassan',
      email: 'omar@example.com',
      phone: '+201222222222',
      password: 'user_password123',
    },
  ]);
  console.log('✅ 3 users (1 admin, 2 customers)');
  console.log('   admin login: admin@talabat.local');
  console.log(
    '   admin password: set via SEED_ADMIN_PASSWORD env var' +
      (process.env.SEED_ADMIN_PASSWORD ? '' : ' (using dev default — change it!)')
  );
}

(async () => {
  try {
    await mongoose.connect(config.dbUri);
    console.log('🔌 MongoDB connected');

    if (process.argv.includes('--destroy')) {
      await destroy();
    } else {
      await importData();
      console.log('🌱 Seeding complete.');
    }
  } catch (err) {
    console.error('❌ Seeder error:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
})();

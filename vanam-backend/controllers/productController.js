// backend/controllers/productController.js
import Product from "../models/Product.js";
import mongoose from "mongoose";
import sharp from "sharp";
import shortid from 'shortid';
import brand from "../config/brand.js";
import { escapeRegex } from "../utils/security.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Fields an admin is allowed to set on a Product. Prevents mass assignment of
// protected fields such as `rating`, `_id`, `images`, timestamps, etc.
const WRITABLE_PRODUCT_FIELDS = [
  "name", "slug", "category", "subCategory", "childCategory", "color",
  "price", "stock", "weight", "details", "discount",
  "bedSize", "primaryMaterial", "storageIncluded", "seatingCapacity", "sofaType",
  "wardrobeType", "numberOfDoors", "tableShape", "chairType", "adjustableHeight",
  "wheelBase", "materialType", "dishwasherSafe", "ovenSafe", "numberOfPieces",
  "lightType", "powerSource", "frameType", "threadCount", "fabricType", "pattern", "brand",
];

// Coerce the numeric fields that arrive as multipart/form-data strings.
const NUMERIC_PRODUCT_FIELDS = new Set(["price", "stock", "weight", "discount"]);

const pickProductFields = (body) => {
  const out = {};
  for (const key of WRITABLE_PRODUCT_FIELDS) {
    if (body[key] === undefined) continue;
    out[key] = NUMERIC_PRODUCT_FIELDS.has(key) ? Number(body[key]) : body[key];
  }
  return out;
};

// ------------------------------------------------------------
// IMAGE COMPRESSION HELPER
// ------------------------------------------------------------
const compressImage = async (buffer, originalMimetype) => {
  try {
    const startSize = buffer.length;
    
    // Compress and resize image using sharp
    const compressedBuffer = await sharp(buffer)
      .resize(800, 800, { 
        fit: 'inside', // Maintain aspect ratio
        withoutEnlargement: true // Don't upscale small images
      })
      .jpeg({ 
        quality: 80, // 80% quality for good balance
        progressive: true // Progressive JPEG for better loading
      })
      .toBuffer();
    
    const endSize = compressedBuffer.length;
    const reduction = ((1 - endSize / startSize) * 100).toFixed(1);
    
    return {
      data: compressedBuffer,
      contentType: 'image/jpeg' // Always convert to JPEG for consistency
    };
  } catch (err) {

    // Fallback to original if compression fails
    return {
      data: buffer,
      contentType: originalMimetype
    };
  }
};

// ------------------------------------------------------------
// GET ALL PRODUCTS (Optimized for Search & Speed)
// ------------------------------------------------------------
export const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      subCategory,
      subCategories,
      childCategory,
      colors,
      priceRange,
      sort,
      search,
      // Dynamic filter fields
      bedSize,
      primaryMaterial,
      storageIncluded,
      seatingCapacity,
      sofaType,
      wardrobeType,
      numberOfDoors,
      tableShape,
      chairType,
      adjustableHeight,
      wheelBase,
      materialType,
      dishwasherSafe,
      ovenSafe,
      numberOfPieces,
      lightType,
      powerSource,
      frameType,
      threadCount,
      fabricType,
      pattern,
      brand,
    } = req.query;

    const filter = {};

    // 1. Basic Filters
    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (subCategories) filter.subCategory = { $in: subCategories.split(",") };
    if (childCategory) filter.childCategory = childCategory;
    if (colors) filter.color = { $in: colors.split(",") };

    // 1.5. Dynamic Filters (for furniture-specific attributes)
    const dynamicFilterFields = {
      bedSize, primaryMaterial, storageIncluded, seatingCapacity, sofaType,
      wardrobeType, numberOfDoors, tableShape, chairType, adjustableHeight,
      wheelBase, materialType, dishwasherSafe, ovenSafe, numberOfPieces,
      lightType, powerSource, frameType, threadCount, fabricType, pattern, brand
    };

    Object.entries(dynamicFilterFields).forEach(([key, value]) => {
      if (value) {
        // Handle both array and string formats
        let values;
        if (Array.isArray(value)) {
          values = value;
        } else if (typeof value === 'string' && value.includes(',')) {
          values = value.split(',');
        } else {
          values = [value];
        }
        
        // Remove empty values
        values = values.filter(v => v && v.trim() !== '');
        
        if (values.length > 0) {
          filter[key] = values.length > 1 ? { $in: values } : values[0];
        }
      }
    });

    // 2. Search Logic (regex input escaped + length-capped to prevent ReDoS)
    if (search) {
      const term = escapeRegex(String(search).trim().slice(0, 80));
      if (term) filter.name = { $regex: term, $options: "i" };
    }

    // 3. Price Filter (Calculates Price after Discount)
    if (priceRange) {
      filter.$expr = {
        $lte: [
          {
            $subtract: [
              "$price",
              { $multiply: ["$price", { $divide: ["$discount", 100] }] },
            ],
          },
          Number(priceRange),
        ],
      };
    }

    // 4. Sorting
    const sortOptions = {};
    switch (sort) {
      case "price-asc":
        sortOptions.price = 1;
        break;
      case "price-desc":
        sortOptions.price = -1;
        break;
      case "name-asc":
        sortOptions.name = 1;
        break;
      case "name-desc":
        sortOptions.name = -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    // 5. Fetch Products (Exclude heavy images for speed)
    const products = await Product.find(filter)
      .select('name price discount stock images.image1') // Select only necessary fields including stock
      .sort(sortOptions)
      .lean(); // Use lean() for better performance

    const formatted = products.map((p) => {
      const productObj = p;
      const images = {};

      // OPTIMIZATION: Only send the MAIN image (image1) for the list view
      if (productObj.images?.image1?.data) {
        images.image1 = {
          contentType: productObj.images.image1.contentType,
          data: productObj.images.image1.data.toString("base64"),
        };
      }

      return { ...productObj, images };
    });

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// ------------------------------------------------------------
// GET SINGLE PRODUCT (Full Details + All Images)
// ------------------------------------------------------------
export const getProductById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    // Select all fields needed for product details and editing
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ message: "Not found" });

    // Convert any stored Buffer images to base64 strings for the API consumer
    if (product.images) {
      for (const key of Object.keys(product.images)) {
        const img = product.images[key];
        if (img && img.data) {
          product.images[key] = {
            contentType: img.contentType,
            data: img.data.toString('base64')
          };
        }
      }
    }

    res.json(product);
  } catch {
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// ------------------------------------------------------------
export const addProduct = async (req, res) => {
  try {
    // Compress all uploaded images
    const compressedImages = {};
    if (req.files) {
      for (const [key, fileArray] of Object.entries(req.files)) {
        const file = fileArray[0];
        const compressed = await compressImage(file.buffer, file.mimetype);
        compressedImages[key] = compressed;
      }
    }

    // Allow-listed fields only (prevents mass assignment).
    const data = pickProductFields(req.body);

    // Ensure slug exists
    if (!data.slug && data.name) {
      data.slug = await ensureUniqueSlug(data.name);
    }

    const product = new Product({
      ...data,
      images: compressedImages
    });

    await product.save();
    if (req.io) req.io.emit("products:update");

    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error("addProduct error:", err.message);
    res.status(500).json({ message: "Failed to add product" });
  }
};

// ------------------------------------------------------------
export const updateProduct = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid ID" });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });

    // Allow-listed fields only (prevents mass assignment).
    const data = pickProductFields(req.body);

    // If name changed and no slug provided, regenerate slug
    if (data.name && !data.slug) {
      data.slug = await ensureUniqueSlug(data.name);
    }

    Object.assign(product, data);

    // Compress uploaded images before saving
    if (req.files) {
      for (const [key, fileArray] of Object.entries(req.files)) {
        const file = fileArray[0];
        const compressed = await compressImage(file.buffer, file.mimetype);
        product.images[key] = compressed;
      }
    }

    await product.save();
    if (req.io) req.io.emit("products:update");

    res.json({ success: true, product });
  } catch (err) {
    console.error("updateProduct error:", err.message);
    res.status(500).json({ message: "Failed to update product" });
  }
};

// ------------------------------------------------------------
export const deleteProduct = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid ID" });

    await Product.findByIdAndDelete(req.params.id);
    if (req.io) req.io.emit("products:update");

    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to delete product" });
  }
};

// ------------------------------------------------------------
// SITEMAP GENERATOR
// Returns a dynamic sitemap.xml generated from product URLs
// ------------------------------------------------------------
export const generateSitemap = async (req, res) => {
  try {
    // Use FRONTEND_URL when available, else the brand's configured store URL.
    const baseUrl = process.env.FRONTEND_URL || brand.urls.store;

    // Fetch minimal product info for sitemap
    const products = await Product.find({})
      .select('_id updatedAt createdAt')
      .lean();

    // helper: escape xml
    const escapeXml = (unsafe) => {
      if (!unsafe) return '';
      return unsafe.replace(/[<>&'\"]/g, function (c) {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case "'": return '&apos;';
          case '"': return '&quot;';
        }
      });
    };

    // helper: simple slugify fallback
    const slugify = (text) => {
      if (!text) return '';
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    };

    // Build XML with image namespace
    const urls = products.map((p) => {
      const identifier = p.slug || slugify(p.name) || p._id;
      const loc = `${baseUrl.replace(/\/$/, '')}/products/${identifier}`;
      const lastmod = (p.updatedAt || p.createdAt || new Date()).toISOString();

      // image URL if image stored in DB (served via media route)
      let imageTag = '';
      if (p.images && p.images.image1 && p.images.image1.data) {
        const imgUrl = `${baseUrl.replace(/\/$/, '')}/images/products/${p._id}/image1`;
        imageTag = `\n    <image:image>\n      <image:loc>${escapeXml(imgUrl)}</image:loc>\n      <image:caption>${escapeXml(p.name || '')}</image:caption>\n    </image:image>`;
      }

      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>${imageTag}\n  </url>`;
    }).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>`;

    res.header('Content-Type', 'application/xml');
    // Cache sitemap for a short period to reduce DB load (adjust as needed)
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(sitemap);
  } catch (err) {
    res.status(500).send('Sitemap generation failed');
  }
};

// Generate SEO-friendly slug, ensure uniqueness by appending shortid if needed
const slugifyText = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const ensureUniqueSlug = async (base) => {
  let slug = slugifyText(base);
  const exists = await Product.findOne({ slug }).lean();
  if (!exists) return slug;
  return `${slug}-${shortid.generate()}`;
};
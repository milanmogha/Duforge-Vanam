/**
 * SEO Configuration and Utilities for Backend
 * Provides schema markup generation and SEO helpers for API responses
 */

import brand from '../config/brand.js';

const DEFAULT_BASE_URL = brand.urls.store;

/**
 * Generate product schema for API responses
 * @param {object} product - Product object
 * @param {string} baseUrl - Base URL for the website
 * @returns {object} - JSON-LD product schema
 */
export const generateProductSchemaAPI = (product, baseUrl = DEFAULT_BASE_URL) => {
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.details || `${product.name} — ${brand.name}`,
    url: `${baseUrl}/products/${product.slug || product._id}`,
    image: product.images && product.images.image1
      ? `${baseUrl}/api/product-image/${product._id}/1`
      : `${baseUrl}/images/logoMain.png`,
    brand: {
      '@type': 'Brand',
      name: brand.name,
    },
    manufacturer: {
      '@type': 'Organization',
      name: brand.name,
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/products/${product.slug || product._id}`,
      priceCurrency: 'INR',
      price: (product.price * (1 - (product.discount || 0) / 100)).toFixed(2),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: brand.name,
      },
    },
    ...(product.rating && product.rating.average > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating.average.toFixed(1),
        ratingCount: product.rating.count,
      },
    }),
  };
};

/**
 * Generate organization schema
 * @param {string} baseUrl - Base URL
 * @returns {object} - Organization schema
 */
export const generateOrganizationSchemaAPI = (baseUrl = DEFAULT_BASE_URL) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.name,
    url: baseUrl,
    logo: `${baseUrl}/images/logoMain.png`,
    description: 'Premium furniture and architectural surfaces.',
    // Only include social profiles that actually exist (no fabricated handles).
    sameAs: [brand.social.instagram, brand.social.pinterest].filter(Boolean),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: 'en',
      ...(brand.support.email ? { email: brand.support.email } : {}),
    },
  };
};

/**
 * Generate LocalBusiness schema for SEO
 * @param {string} baseUrl - Base URL
 * @returns {object} - LocalBusiness schema
 */
export const generateLocalBusinessSchemaAPI = (baseUrl = DEFAULT_BASE_URL) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: brand.name,
    url: baseUrl,
    logo: `${baseUrl}/images/logoMain.png`,
    description: 'Premium furniture and architectural surfaces.',
    image: `${baseUrl}/images/logoMain.png`,
    // Contact fields only when real values are configured (no placeholders).
    ...(brand.support.phone ? { telephone: brand.support.phone } : {}),
    ...(brand.support.email ? { email: brand.support.email } : {}),
    priceRange: '₹₹₹',
    type: ['FurnitureStore', 'HomeAndGardenBusiness'],
  };
};

/**
 * Add search keywords metadata to product
 * Useful for frontend SEO
 * @param {object} product - Product object
 * @returns {array} - Array of relevant keywords
 */
export const generateProductKeywords = (product) => {
  const keywords = [
    product.name,
    product.category,
    product.subCategory,
    product.childCategory,
    'furniture',
    'wood products',
    'premium quality',
  ];

  // Add descriptive keywords based on category
  if (product.category?.toLowerCase().includes('furniture')) {
    keywords.push('furniture', 'wooden furniture', 'buy furniture online');
  }
  if (product.category?.toLowerCase().includes('wood')) {
    keywords.push('wood', 'wood products', 'solid wood', 'premium wood');
  }
  if (product.subCategory?.toLowerCase().includes('sofa')) {
    keywords.push('sofa', 'couch', 'seating furniture', 'comfortable seating');
  }
  if (product.subCategory?.toLowerCase().includes('table')) {
    keywords.push('table', 'dining table', 'coffee table', 'wooden table');
  }

  // Remove duplicates and filter empty values
  return [...new Set(keywords)].filter(Boolean);
};

/**
 * Generate meta description for product
 * @param {object} product - Product object
 * @param {number} maxLength - Max length for description (default: 160)
 * @returns {string} - Meta description
 */
export const generateProductMetaDescription = (product, maxLength = 160) => {
  let description = product.details
    ? product.details.substring(0, maxLength)
    : `${product.name} - Premium ${product.category} from ${brand.name}`;

  // Ensure it includes the product name
  if (!description.toLowerCase().includes(product.name.toLowerCase())) {
    description = `${product.name} - ${description}`;
  }

  // Add call-to-action if room
  if (description.length < maxLength - 20) {
    description += '. Buy online now.';
  }

  // Trim to max length
  if (description.length > maxLength) {
    description = description.substring(0, maxLength - 3) + '...';
  }

  return description;
};

/**
 * Escape XML special characters
 * @param {string} unsafe - Unsafe string
 * @returns {string} - Escaped string
 */
export const escapeXml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

/**
 * Simple slugify function
 * @param {string} text - Text to slugify
 * @returns {string} - Slugified text
 */
export const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

/**
 * Generate structured data for collection/category pages
 * @param {string} categoryName - Category name
 * @param {array} products - Array of products
 * @param {string} baseUrl - Base URL
 * @returns {object} - Collection page schema
 */
export const generateCollectionSchemaAPI = (categoryName, products, baseUrl = DEFAULT_BASE_URL) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryName,
    url: `${baseUrl}/products?category=${slugify(categoryName)}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 10).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: product.name,
        url: `${baseUrl}/products/${product.slug || product._id}`,
        image: product.images?.image1 ? `${baseUrl}/api/product-image/${product._id}/1` : '',
        price: (product.price * (1 - (product.discount || 0) / 100)).toFixed(2),
      })),
    },
  };
};

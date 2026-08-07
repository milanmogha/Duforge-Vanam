/**
 * SEO Helper Utility
 * Provides consistent meta tag management, structured data generation, and SEO best practices
 */

/**
 * Update meta tags and open graph tags for better SEO
 * @param {string} title - Page title
 * @param {string} description - Meta description
 * @param {string} url - Canonical URL
 * @param {object} options - Additional options like og:image, og:type, etc.
 */
export const updateMetaTags = (title, description, url, options = {}) => {
  const {
    image = 'https://vanam.example/images/logoMain.png',
    type = 'website',
    twitterCard = 'summary_large_image',
    keywords = 'wood, furniture, products, vanam',
    author = 'Vanam',
  } = options;

  // Update page title
  const prevTitle = document.title;
  document.title = title;

  const upsertMeta = (id, attrs) => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('meta');
      el.id = id;
      document.head.appendChild(el);
    }
    Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
    return el;
  };

  const upsertLink = (id, attrs) => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('link');
      el.id = id;
      document.head.appendChild(el);
    }
    Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
    return el;
  };

  // Standard meta tags
  upsertMeta('meta-description', { name: 'description', content: description });
  upsertMeta('meta-keywords', { name: 'keywords', content: keywords });
  upsertMeta('meta-author', { name: 'author', content: author });

  // Open Graph tags
  upsertMeta('meta-og-type', { property: 'og:type', content: type });
  upsertMeta('meta-og-title', { property: 'og:title', content: title });
  upsertMeta('meta-og-description', { property: 'og:description', content: description });
  upsertMeta('meta-og-url', { property: 'og:url', content: url });
  upsertMeta('meta-og-image', { property: 'og:image', content: image });
  upsertMeta('meta-og-site-name', { property: 'og:site_name', content: 'Vanam' });

  // Twitter Card tags
  upsertMeta('meta-twitter-card', { name: 'twitter:card', content: twitterCard });
  upsertMeta('meta-twitter-title', { name: 'twitter:title', content: title });
  upsertMeta('meta-twitter-description', { name: 'twitter:description', content: description });
  upsertMeta('meta-twitter-image', { name: 'twitter:image', content: image });

  // Canonical link
  upsertLink('link-canonical', { rel: 'canonical', href: url });

  return () => {
    document.title = prevTitle;
  };
};

/**
 * Generate JSON-LD structured data for products
 * @param {object} product - Product object
 * @param {string} baseUrl - Base URL for the website
 * @returns {object} - JSON-LD structured data
 */
export const generateProductSchema = (product, baseUrl = 'https://vanam.example') => {
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.details || `${product.name} - Premium wood furniture`,
    url: `${baseUrl}/products/${product._id}`,
    image: product.images && product.images.image1
      ? `${baseUrl}/api/product-image/${product._id}/1`
      : `${baseUrl}/images/logoMain.png`,
    brand: {
      '@type': 'Brand',
      name: 'Vanam',
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Vanam',
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/products/${product._id}`,
      priceCurrency: 'INR',
      price: (product.price * (1 - product.discount / 100)).toFixed(2),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Vanam',
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
 * Generate JSON-LD breadcrumb schema
 * @param {array} breadcrumbs - Array of {label, url} objects
 * @returns {object} - JSON-LD breadcrumb schema
 */
export const generateBreadcrumbSchema = (breadcrumbs) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: crumb.url,
    })),
  };
};

/**
 * Generate JSON-LD organization schema
 * @returns {object} - JSON-LD organization schema
 */
export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Vanam',
    url: 'https://vanam.example',
    logo: 'https://vanam.example/images/logoMain.png',
    description: 'Premium quality wood products, furniture, and building materials',
    sameAs: [
      
      
      
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: 'en',
    },
  };
};

/**
 * Generate JSON-LD for collection/category page
 * @param {string} categoryTitle - Category title
 * @param {string} categoryDescription - Category description
 * @param {array} products - Array of products in the category
 * @param {string} url - Page URL
 * @returns {object} - JSON-LD collection schema
 */
export const generateCollectionSchema = (categoryTitle, categoryDescription, products, url) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryTitle,
    description: categoryDescription,
    url: url,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 10).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: product.name,
        url: `https://vanam.example/products/${product._id}`,
        image: product.images?.image1 ? `https://vanam.example/api/product-image/${product._id}/1` : '',
      })),
    },
  };
};

/**
 * Add JSON-LD schema to document head
 * @param {object} schema - JSON-LD schema object
 * @param {string} id - Unique ID for the script tag
 */
export const addSchemaToHead = (schema, id = 'json-ld-schema') => {
  // Remove existing schema if any
  const existingScript = document.getElementById(id);
  if (existingScript) {
    existingScript.remove();
  }

  // Add new schema
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);

  return () => script.remove();
};

/**
 * Get canonical URL based on current location and params
 * @param {string} baseUrl - Base URL
 * @param {object} params - URL parameters
 * @returns {string} - Canonical URL
 */
export const getCanonicalUrl = (baseUrl, params = {}) => {
  const url = new URL(baseUrl);
  Object.keys(params).forEach(key => {
    if (params[key]) {
      url.searchParams.set(key, params[key]);
    }
  });
  return url.toString();
};

/**
 * Format meta description with keyword inclusion
 * @param {string} baseDescription - Base description
 * @param {string} keyword - Primary keyword
 * @param {string} secondaryKeyword - Secondary keyword
 * @returns {string} - Optimized description
 */
export const optimizeDescription = (baseDescription, keyword, secondaryKeyword = '') => {
  // Ensure description is within 150-160 characters for optimal display
  let description = baseDescription;
  
  if (!description.toLowerCase().includes(keyword.toLowerCase())) {
    description = `${keyword} - ${description}`;
  }
  
  if (secondaryKeyword && !description.toLowerCase().includes(secondaryKeyword.toLowerCase())) {
    description = `${description}. ${secondaryKeyword} available.`;
  }

  // Trim to 160 characters
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }

  return description;
};

/**
 * Remove all dynamically added SEO elements
 */
export const cleanupSEOElements = () => {
  const elementsToRemove = [
    'meta-description',
    'meta-keywords',
    'meta-author',
    'meta-og-type',
    'meta-og-title',
    'meta-og-description',
    'meta-og-url',
    'meta-og-image',
    'meta-og-site-name',
    'meta-twitter-card',
    'meta-twitter-title',
    'meta-twitter-description',
    'meta-twitter-image',
    'link-canonical',
    'json-ld-schema',
  ];

  elementsToRemove.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.parentNode?.removeChild(el);
    }
  });
};

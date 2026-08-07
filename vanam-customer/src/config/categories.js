// src/config/categories.js
// Single source of truth for all category data

export const CATEGORIES = [
      {
        title: 'Living Room',
        slug: 'living-room',
        children: [
          { title: 'Sofas', slug: 'sofas' },
          { title: 'Coffee Tables', slug: 'coffee-tables' },
          { title: 'Accent Chairs', slug: 'accent-chairs' },
          { title: 'Recliners', slug: 'recliners' },
          { title: 'TV Units', slug: 'tv-units' }
        ]
      },
      {
        title: 'Bedroom',
        slug: 'bedroom',
        children: [
          { title: 'Beds', slug: 'beds' },
          { title: 'Wardrobes', slug: 'wardrobes' },
          { title: 'Nightstands', slug: 'nightstands' }
        ]
      },
      {
        title: 'Dining Room',
        slug: 'dining-room',
        children: [
          { title: 'Dining Tables', slug: 'dining-tables' },
          { title: 'Dining Chairs', slug: 'dining-chairs' }
        ]
      },
      {
        title: 'Office',
        slug: 'office',
        children: [
          { title: 'Office Chairs', slug: 'office-chairs' },
          { title: 'Work Desks', slug: 'work-desks' },
          { title: 'Bookshelves', slug: 'bookshelves' }
        ]
      },
  {
    title: 'Kitchen',
    slug: 'kitchen',
    children: [
      { title: 'Cookware', slug: 'cookware' },
      { title: 'Storage & Containers', slug: 'storage-containers' },
      { title: 'Kitchenware', slug: 'kitchenware' },
      { title: 'Kitchen Linen', slug: 'kitchen-linen' }
    ]
  },
  {
    title: 'Tableware',
    slug: 'tableware',
    children: [
      { title: 'Dinner Sets', slug: 'dinner-sets' },
      { title: 'Serveware', slug: 'serveware' },
      { title: 'Crockery', slug: 'crockery' },
      { title: 'Cutlery', slug: 'cutlery' },
      { title: 'Table Linen', slug: 'table-linen' }
    ]
  },
  {
    title: 'Decor',
    slug: 'decor',
    children: [
      { title: 'Wall Decor', slug: 'wall-decor' },
      { title: 'Lighting', slug: 'lighting' },
      { title: 'Home Accessories', slug: 'home-accessories' },
      { title: 'Fragrances', slug: 'fragrances' },
      { title: 'Garden Decor', slug: 'garden-decor' }
    ]
  },
  {
    title: 'Furnishing',
    slug: 'furnishing',
    children: [
      { title: 'Bedding', slug: 'bedding' },
      { title: 'Curtains', slug: 'curtains' },
      { title: 'Cushions', slug: 'cushions' },
      { title: 'Floor Coverings', slug: 'floor-coverings' },
      { title: 'Accessories', slug: 'accessories' }
    ]
  }
];

/**
 * Flattens the category tree into a single-level array
 * Useful for searching and lookups
 */
export const flattenCategories = (categories = CATEGORIES, result = []) => {
  categories.forEach(category => {
    result.push(category);
    if (category.children) {
      flattenCategories(category.children, result);
    }
  });
  return result;
};

/**
 * Find a category by its slug
 * @param {string} slug - The category slug to search for
 * @returns {Object|null} The category object or null if not found
 */
export const getCategoryBySlug = (slug) => {
  if (!slug) return null;
  const allCategories = flattenCategories();
  return allCategories.find(cat => cat.slug === slug) || null;
};

/**
 * Get all child categories for a given category slug
 * @param {string} slug - The parent category slug
 * @returns {Array} Array of child categories
 */
export const getChildCategories = (slug) => {
  const category = getCategoryBySlug(slug);
  return category?.children || [];
};

/**
 * Get the display title for a category slug
 * @param {string} slug - The category slug
 * @returns {string} The display title or the slug if not found
 */
export const getCategoryTitle = (slug) => {
  const category = getCategoryBySlug(slug);
  return category?.title || slug;
};

/**
 * Get the parent category for a given slug
 * @param {string} slug - The child category slug
 * @returns {Object|null} The parent category or null
 */
export const getParentCategory = (slug) => {
  const findParent = (categories, targetSlug, parent = null) => {
    for (const category of categories) {
      if (category.slug === targetSlug) {
        return parent;
      }
      if (category.children) {
        const found = findParent(category.children, targetSlug, category);
        if (found !== null) return found;
      }
    }
    return null;
  };
  return findParent(CATEGORIES, slug);
};

/**
 * Get breadcrumb trail for a category
 * @param {string} slug - The category slug
 * @returns {Array} Array of category objects from root to current
 */
export const getCategoryBreadcrumb = (slug) => {
  const breadcrumb = [];
  let current = getCategoryBySlug(slug);
  
  while (current) {
    breadcrumb.unshift(current);
    current = getParentCategory(current.slug);
  }
  
  return breadcrumb;
};

/**
 * Get all level 1 (root) categories
 * @returns {Array} Top-level categories
 */
export const getRootCategories = () => {
  return CATEGORIES;
};

/**
 * Check if a category has children
 * @param {string} slug - The category slug
 * @returns {boolean}
 */
export const hasChildren = (slug) => {
  const category = getCategoryBySlug(slug);
  return !!(category?.children && category.children.length > 0);
};

/**
 * Get all leaf categories (categories without children)
 * @returns {Array} Leaf categories
 */
export const getLeafCategories = () => {
  const allCategories = flattenCategories();
  return allCategories.filter(cat => !cat.children || cat.children.length === 0);
};

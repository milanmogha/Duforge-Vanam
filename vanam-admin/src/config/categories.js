// src/config/categories.js
// ✅ FINAL structure as provided by you – single source of truth

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

/* ======================================================
   ✅ UTILITIES – ADAPTED TO YOUR FINAL STRUCTURE
====================================================== */

/**
 * Flatten all categories into a single list
 */
export const flattenCategories = (categories = CATEGORIES, result = []) => {
  categories.forEach(category => {
    result.push(category);
    if (category.children?.length) {
      flattenCategories(category.children, result);
    }
  });
  return result;
};

/**
 * Find a category by its slug
 */
export const getCategoryBySlug = (slug) => {
  if (!slug) return null;
  return flattenCategories().find(cat => cat.slug === slug) || null;
};

/**
 * Get direct children of a category
 */
export const getChildCategories = (slug) => {
  const category = getCategoryBySlug(slug);
  return category?.children || [];
};

/**
 * Get display title from slug
 */
export const getCategoryTitle = (slug) => {
  const category = getCategoryBySlug(slug);
  return category?.title || slug;
};

/**
 * Get parent category (null for root categories)
 */
export const getParentCategory = (slug) => {
  const findParent = (nodes, target) => {
    for (const node of nodes) {
      if (node.children?.some(child => child.slug === target)) {
        return node;
      }
      if (node.children) {
        const found = findParent(node.children, target);
        if (found) return found;
      }
    }
    return null;
  };

  return findParent(CATEGORIES, slug);
};

/**
 * Breadcrumb trail from root → current
 * NOTE: Root categories are Living Room, Kitchen, etc.
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
 * Root categories (as per YOUR structure)
 */
export const getRootCategories = () => CATEGORIES;

/**
 * Check if category has children
 */
export const hasChildren = (slug) => {
  const category = getCategoryBySlug(slug);
  return Boolean(category?.children?.length);
};

/**
 * All leaf categories (final product types)
 */
export const getLeafCategories = () => {
  return flattenCategories().filter(
    cat => !cat.children || cat.children.length === 0
  );
};

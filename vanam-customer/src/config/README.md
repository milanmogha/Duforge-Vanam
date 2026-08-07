# Category Management System

## Overview

This is a clean, scalable, frontend-only category management system for the UltraCoreWood e-commerce platform. All category logic is centralized in a single configuration file with reusable utility functions.

## Architecture Principles

1. **Single Source of Truth**: All categories defined in `categories.js`
2. **Slug-based Routing**: URLs use slugs (`sofas`, `coffee-tables`) for clean URLs
3. **Title-based Display**: UI shows human-readable titles ("Sofas", "Coffee Tables")
4. **Maximum 3 Levels**: Root → Mid-level → Leaf categories
5. **Separation of Concerns**: Categories ≠ Filters (price, color are separate)

## File Structure

```
src/config/
├── categories.js          # Category data + utility functions
└── README.md             # This file
```

## Category Hierarchy

### Level 1 (Navigation)
- Furniture
- Kitchen
- Tableware
- Decor
- Furnishing

### Level 2 & 3 (Subcategories)

**Furniture**
- Living Room → Sofas, Coffee Tables, Accent Chairs, Recliners, TV Units
- Bedroom → Beds, Wardrobes, Nightstands
- Dining Room → Dining Tables, Dining Chairs
- Office → Office Chairs, Work Desks, Bookshelves

**Kitchen**
- Cookware, Storage & Containers, Kitchenware, Kitchen Linen

**Tableware**
- Dinner Sets, Serveware, Crockery, Cutlery, Table Linen

**Decor**
- Wall Decor, Lighting, Home Accessories, Fragrances, Garden Decor

**Furnishing**
- Bedding, Curtains, Cushions, Floor Coverings, Accessories

## Usage Examples

### 1. Navbar - Dynamic Menu

```jsx
import { getRootCategories } from '../config/categories';

function Navbar() {
  return (
    <nav>
      {getRootCategories().map((category) => (
        <Link 
          key={category.slug}
          to={`/products?category=${category.slug}`}
        >
          {category.title.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
```

### 2. ProductPage - Dynamic Subcategories

```jsx
import { 
  getCategoryBySlug, 
  getChildCategories,
  getCategoryTitle 
} from '../config/categories';

function ProductPage() {
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get('category');
  
  // Get category data
  const currentCategory = getCategoryBySlug(categorySlug);
  const childCategories = getChildCategories(categorySlug);
  const subcategoryTitles = childCategories.map(cat => cat.title);
  
  return (
    <div>
      <h1>{currentCategory?.title || 'All Products'}</h1>
      <FilterSidebar subCategories={subcategoryTitles} />
    </div>
  );
}
```

### 3. HomePage Essentials - Link to Categories

```jsx
import { useNavigate } from 'react-router-dom';

const essentials = [
  { title: "SOFAS", image: "/images/sofa.jpg", slug: "sofas" },
  { title: "COFFEE TABLES", image: "/images/table.jpg", slug: "coffee-tables" },
  // ...
];

function HomePage() {
  const navigate = useNavigate();
  
  const handleClick = (slug) => {
    navigate(`/products?category=${slug}`);
  };
  
  return (
    <div>
      {essentials.map(item => (
        <div 
          key={item.slug}
          onClick={() => handleClick(item.slug)}
        >
          {item.title}
        </div>
      ))}
    </div>
  );
}
```

## Utility Functions Reference

### Core Functions

#### `getRootCategories()`
Returns all level 1 categories.
```js
const topLevel = getRootCategories();
// Returns: [{ title: 'Furniture', slug: 'furniture', children: [...] }, ...]
```

#### `getCategoryBySlug(slug)`
Find a category anywhere in the tree by its slug.
```js
const category = getCategoryBySlug('sofas');
// Returns: { title: 'Sofas', slug: 'sofas' }
```

#### `getChildCategories(slug)`
Get all direct children of a category.
```js
const children = getChildCategories('living-room');
// Returns: [
//   { title: 'Sofas', slug: 'sofas' },
//   { title: 'Coffee Tables', slug: 'coffee-tables' },
//   ...
// ]
```

#### `getCategoryTitle(slug)`
Convert a slug to its display title.
```js
const title = getCategoryTitle('coffee-tables');
// Returns: "Coffee Tables"
```

### Advanced Functions

#### `getParentCategory(slug)`
Find the parent of a given category.
```js
const parent = getParentCategory('sofas');
// Returns: { title: 'Living Room', slug: 'living-room', ... }
```

#### `getCategoryBreadcrumb(slug)`
Get full path from root to category.
```js
const breadcrumb = getCategoryBreadcrumb('sofas');
// Returns: [
//   { title: 'Furniture', slug: 'furniture' },
//   { title: 'Living Room', slug: 'living-room' },
//   { title: 'Sofas', slug: 'sofas' }
// ]
```

#### `hasChildren(slug)`
Check if a category has subcategories.
```js
const isParent = hasChildren('living-room');
// Returns: true
```

#### `getLeafCategories()`
Get all categories without children.
```js
const leafs = getLeafCategories();
// Returns all end-level categories like 'sofas', 'beds', etc.
```

## Best Practices

### ✅ DO
- Use slugs for routing and logic
- Use titles for display
- Reference categories through utility functions
- Keep category data in `categories.js` only

### ❌ DON'T
- Hardcode category names in components
- Use uppercase comparisons for logic
- Mix categories with filters (price, color, etc.)
- Create category maps in multiple files

## Extending the System

### Adding a New Category

1. Open `src/config/categories.js`
2. Add to the appropriate level:

```js
{
  title: 'Garden',
  slug: 'garden',
  children: [
    { title: 'Outdoor Furniture', slug: 'outdoor-furniture' },
    { title: 'Planters', slug: 'planters' }
  ]
}
```

3. No other code changes needed - navbar and filters update automatically

### Removing a Category

1. Remove from `categories.js`
2. System automatically adapts

## Migration Notes

### Before (Hardcoded)
```jsx
const SUBCATEGORY_MAP = {
  'BEDROOM': ['Beds', 'Wardrobes'],
  'LIVING ROOM': ['Sofas', 'Tables'],
  // ... scattered across files
};
```

### After (Centralized)
```jsx
import { getChildCategories } from '../config/categories';

const subcategories = getChildCategories('bedroom');
```

## Support

For questions or issues with the category system, consult this README or review the implementation in:
- `src/config/categories.js` - Data & utilities
- `src/components/Navbar.jsx` - Navigation implementation
- `src/pages/ProductPage.jsx` - Filtering implementation
- `src/pages/HomePage.jsx` - Essentials implementation

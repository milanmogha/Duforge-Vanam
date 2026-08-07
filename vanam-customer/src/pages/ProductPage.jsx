// src/pages/ProductPage.js

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getAllProducts } from '../api/productApi';
import ProductCard from './ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import '../css/ProductPage.css';
import { getCategoryBySlug, getChildCategories, getCategoryTitle, getRootCategories } from '../config/categories';
import { getFiltersForCategory } from '../config/filterConfig';
import { updateMetaTags, addSchemaToHead, generateCollectionSchema, generateBreadcrumbSchema, getCanonicalUrl, optimizeDescription } from '../utils/seoHelper';

const COLOR_OPTIONS = [
  { name: 'Brown', hex: '#6b3e26' },
  { name: 'Beige', hex: '#d3a268' },
  { name: 'Black', hex: '#1e1e1e' },
  { name: 'White', hex: '#ffffff' },
];

const ProductPage = ({ openCart }) => {
  // --- STATE MANAGEMENT ---
  // 1. allProducts: Used ONLY to calculate the Max Price for the slider
  const [allProducts, setAllProducts] = useState([]);
  // 2. displayProducts: The actual filtered list shown in the grid
  const [displayProducts, setDisplayProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedDynamicFilters, setSelectedDynamicFilters] = useState({});
  const [sortOrder, setSortOrder] = useState('default');
  const [priceRange, setPriceRange] = useState(0);
  // debouncedPrice is used to trigger the API call only when user stops sliding
  const [debouncedPrice, setDebouncedPrice] = useState(0);

  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get('category');
  const searchTerm = searchParams.get('search');
  const materialParam = searchParams.get('primaryMaterial'); // from /materials links

  // Get category data from config
  const currentCategory = getCategoryBySlug(categorySlug);
  const childCategories = getChildCategories(categorySlug);
  // Pass objects with both title and slug to FilterSidebar
  const sidebarFilterOptions = childCategories.map(cat => ({ title: cat.title, slug: cat.slug }));

  // Get dynamic filters based on selected subcategories OR current subcategories in view
  const dynamicFilters = useMemo(() => {
    // If subcategories are selected, use those
    if (selectedSubCategories.length > 0) {
      const allFilters = selectedSubCategories.flatMap(subCat => getFiltersForCategory(subCat));
      const uniqueFilters = [];
      const seen = new Set();
      allFilters.forEach(filter => {
        if (!seen.has(filter.id)) {
          seen.add(filter.id);
          uniqueFilters.push(filter);
        }
      });
      return uniqueFilters;
    }
    
    // Otherwise, if we have child categories, show filters for all of them
    if (childCategories.length > 0) {
      const allFilters = childCategories.flatMap(cat => getFiltersForCategory(cat.slug));
      const uniqueFilters = [];
      const seen = new Set();
      allFilters.forEach(filter => {
        if (!seen.has(filter.id)) {
          seen.add(filter.id);
          uniqueFilters.push(filter);
        }
      });
      return uniqueFilters;
    }
    
    return [];
  }, [selectedSubCategories, childCategories]);

  // Mobile Detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Scroll to top when component mounts or category changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categorySlug, searchTerm]);

  // SEO: Add meta tags, canonical link, and schema markup for product listing pages
  useEffect(() => {
    const frontendBase = (process.env.REACT_APP_FRONTEND_URL || window.location.origin).replace(/\/$/, '');
    
    // Optimized titles and descriptions with better keyword targeting
    let pageTitle, description, keywords;
    
    if (searchTerm) {
      pageTitle = `${searchTerm} | Buy Premium Furniture & Wood Products | Vanam`;
      keywords = `${searchTerm}, furniture, wood products, ${searchTerm} furniture, buy ${searchTerm}`;
      description = optimizeDescription(
        `Find quality ${searchTerm} at Vanam. Browse our collection of premium wood ${searchTerm} and furniture. Fast delivery, best prices.`,
        searchTerm,
        'premium quality'
      );
    } else if (currentCategory) {
      pageTitle = `${currentCategory.title} | Premium Wood ${currentCategory.title} | Vanam`;
      keywords = `${currentCategory.title.toLowerCase()}, wood ${currentCategory.title.toLowerCase()}, furniture, premium ${currentCategory.title.toLowerCase()}`;
      description = optimizeDescription(
        `Shop our premium ${currentCategory.title.toLowerCase()} collection at Vanam. High-quality wood ${currentCategory.title.toLowerCase()}, custom options, fast delivery. Best prices on ${currentCategory.title.toLowerCase()}.`,
        currentCategory.title,
        'premium wood'
      );
    } else {
      pageTitle = 'Premium Wood Furniture & Products | Vanam - Buy Online';
      keywords = 'wood furniture, wood products, furniture online, premium wood, solid wood furniture, plywood, wood veneer';
      description = 'Shop premium wood furniture and products at Vanam. Quality solid wood, plywood, veneers, custom woodworking. Fast delivery, best prices on furniture.';
    }

    const canonicalUrl = searchTerm
      ? `${frontendBase}/products?search=${encodeURIComponent(searchTerm)}`
      : categorySlug
        ? `${frontendBase}/products?category=${categorySlug}`
        : `${frontendBase}/products`;

    // Update all meta tags
    updateMetaTags(pageTitle, description, canonicalUrl, {
      keywords,
      image: 'https://vanam.example/images/logoMain.png',
      type: 'website',
    });

    // Generate and add schema markup for collection/category pages
    const breadcrumbs = [
      { label: 'Home', url: `${frontendBase}/` },
      { label: 'Products', url: `${frontendBase}/products` },
    ];

    if (currentCategory) {
      breadcrumbs.push({ label: currentCategory.title, url: canonicalUrl });
    }

    if (searchTerm) {
      breadcrumbs.push({ label: `Search: ${searchTerm}`, url: canonicalUrl });
    }

    // Add breadcrumb schema
    addSchemaToHead(generateBreadcrumbSchema(breadcrumbs), 'breadcrumb-schema');

    // Add collection schema if we have products
    if (displayProducts.length > 0) {
      const categoryTitle = searchTerm
        ? `Search Results: ${searchTerm}`
        : currentCategory?.title || 'All Products';
      
      addSchemaToHead(
        generateCollectionSchema(
          categoryTitle,
          description,
          displayProducts,
          canonicalUrl
        ),
        'collection-schema'
      );
    }

    return () => {
      const schemaScript = document.getElementById('breadcrumb-schema');
      if (schemaScript) schemaScript.remove();
      const collectionScript = document.getElementById('collection-schema');
      if (collectionScript) collectionScript.remove();
    };
  }, [categorySlug, searchTerm, currentCategory, displayProducts]);

  // --- 1. INITIAL LOAD (Get Max Price) ---
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        // Fetch EVERYTHING once just to find the highest price item
        const data = await getAllProducts({});
        setAllProducts(data);

        // Set initial price range to max
        if (data.length > 0) {
          const max = Math.max(...data.map(p => p.price));
          setPriceRange(max);
          setDebouncedPrice(max);
        }
      } catch (error) {
        console.error("Failed to fetch initial products:", error);
      }
    };
    loadInitialData();
  }, []); // Run once on mount

  // --- 2. DEBOUNCE PRICE SLIDER ---
  // When user moves slider, update UI immediately (priceRange), 
  // but wait 500ms to update 'debouncedPrice' which triggers the API.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPrice(priceRange);
    }, 500);

    return () => clearTimeout(timer);
  }, [priceRange]);


  // --- 3. SERVER-SIDE FILTERING TRIGGER ---
  // Whenever any filter changes, ask the BACKEND for the new list.
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      try {
        setLoading(true);

        const filters = {
          category: categorySlug,
          search: searchTerm,
          subCategories: selectedSubCategories,
          colors: selectedColors,
          priceRange: debouncedPrice,
          sort: sortOrder,
          ...(materialParam ? { primaryMaterial: materialParam } : {}),
          ...selectedDynamicFilters // Add dynamic filters to API call
        };

        const data = await getAllProducts(filters);
        setDisplayProducts(data);

      } catch (error) {
        console.error("Filter fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };

    if (debouncedPrice > 0 || allProducts.length === 0 || materialParam || categorySlug || searchTerm) {
      fetchFilteredProducts();
    }

  }, [
    categorySlug,
    searchTerm,
    materialParam,
    selectedSubCategories,
    selectedColors,
    sortOrder,
    selectedDynamicFilters,
    debouncedPrice
  ]);

  // --- 4. RESET FILTERS ON CATEGORY CHANGE ---
  useEffect(() => {
    setSelectedSubCategories([]);
    setSelectedColors([]);
    setSelectedDynamicFilters({});
    const resetPrice = async () => {
      const data = await getAllProducts({ category: categorySlug });
      if (data.length > 0) {
        const max = Math.max(...data.map(p => p.price));
        setPriceRange(max);
        setDebouncedPrice(max);
      }
    };
    if (categorySlug) {
      resetPrice();
    }
  }, [categorySlug, searchTerm]);

  const getHeading = () => {
    if (searchTerm) return `Search Results for: "${searchTerm}"`;
    if (currentCategory) return currentCategory.title;
    return "All Products";
  };

  const maxPrice = useMemo(() => {
    if (allProducts.length === 0) return 100000;
    return Math.max(...allProducts.map(p => p.price));
  }, [allProducts]);

  // Window Resize Handler
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll lock when filter dropdown is open
  useEffect(() => {
    if (showFilterDropdown) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showFilterDropdown]);

  return (
    <div className="product-page">
      {/*  - visualizing Sidebar vs Grid */}
      {/* Sidebar for desktop only */}
      {!isMobile && (
        <FilterSidebar
          categoryTitle={currentCategory?.title || 'Products'}
          subCategoryOptions={sidebarFilterOptions}
          selectedSubCategories={selectedSubCategories}
          onSubCategoryChange={setSelectedSubCategories}
          colorOptions={COLOR_OPTIONS}
          selectedColors={selectedColors}
          onColorChange={setSelectedColors}
          priceRange={priceRange}
          onPriceChange={(e) => setPriceRange(Number(e.target.value))}
          maxPrice={allProducts.length > 0 ? Math.max(...allProducts.map(p => p.price)) : 100000}
          dynamicFilters={dynamicFilters}
          selectedDynamicFilters={selectedDynamicFilters}
          onDynamicFilterChange={(filterId, values) => {
            setSelectedDynamicFilters(prev => ({
              ...prev,
              [filterId]: values
            }));
          }}
        />
      )}

      <main className="main-content">
        <div className="shop-intro">
          <span className="tech-label">Material library</span>
          <div className="page-header">
            <h2 className="category-heading">{getHeading()}</h2>
            <span className="shop-count tech" aria-live="polite">
              {loading ? 'loading…' : `${displayProducts.length} piece${displayProducts.length === 1 ? '' : 's'}`}
            </span>
          </div>
          <nav className="shop-cats" aria-label="Categories">
            <Link to="/products" className={!categorySlug ? 'is-active' : ''}>All</Link>
            {getRootCategories().map((c) => (
              <Link
                key={c.slug}
                to={`/products?category=${c.slug}`}
                className={categorySlug === c.slug ? 'is-active' : ''}
              >
                {c.title}
              </Link>
            ))}
          </nav>
          <div className="filter-sort-wrapper">
            {isMobile && (
              <button
                className="filter-dropdown-btn"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                Filters
              </button>
            )}
            <div className="sort-container">
              <label htmlFor="sort">Sort by:</label>
              <select id="sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="sort-dropdown">
                <option value="default">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile filter overlay */}
        {isMobile && showFilterDropdown && (
          <div className="filter-dropdown-overlay" onClick={() => setShowFilterDropdown(false)}>
            <div className="filter-dropdown-content" onClick={(e) => e.stopPropagation()}>
              <div className="filter-overlay-header">
                <h3>Filter Products</h3>
                <button
                  className="close-filter-btn"
                  onClick={() => setShowFilterDropdown(false)}
                  aria-label="Close filters"
                >
                  ✕
                </button>
              </div>
              <FilterSidebar
                categoryTitle={currentCategory?.title || 'Products'}
                subCategoryOptions={sidebarFilterOptions}
                selectedSubCategories={selectedSubCategories}
                onSubCategoryChange={setSelectedSubCategories}
                colorOptions={COLOR_OPTIONS}
                selectedColors={selectedColors}
                onColorChange={setSelectedColors}
                priceRange={priceRange}
                onPriceChange={(e) => setPriceRange(Number(e.target.value))}
                maxPrice={maxPrice}
                dynamicFilters={dynamicFilters}
                selectedDynamicFilters={selectedDynamicFilters}
                onDynamicFilterChange={(filterId, values) => {
                  setSelectedDynamicFilters(prev => ({
                    ...prev,
                    [filterId]: values
                  }));
                }}
              />
            </div>
          </div>
        )} 
        <div className="product-grid">
          {displayProducts.length > 0 ? (
            displayProducts.map((product) => (
              <ProductCard key={product._id} product={product} openCart={openCart} />
            ))
          ) : (
            <div className="no-products-found">
              <h3>{getHeading()}</h3>
              <p>No products match your filters.</p>
              <button
                className="btn-outline btn-outline--sm"
                onClick={() => {
                  setSelectedSubCategories([]);
                  setSelectedColors([]);
                  setSelectedDynamicFilters({});
                  setPriceRange(maxPrice);
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
        
      </main>
    </div>
  );
};

export default ProductPage;

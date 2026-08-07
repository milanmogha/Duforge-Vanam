// src/api/ProductApi.js
import axios from 'axios';

const BASE_URL = `${(import.meta.env.VITE_API_URL || 'http://localhost:8000')}/api/products`;

// ============================================================
// CUSTOMER FUNCTIONS (Filtering & Display)
// ============================================================

// Used by: ProductPage.js, HomePage.js
export const getAllProducts = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.category) params.append('category', filters.category);
  if (filters.subCategories?.length > 0) params.append('subCategories', filters.subCategories.join(','));
  if (filters.colors?.length > 0) params.append('colors', filters.colors.join(','));
  if (filters.priceRange) params.append('priceRange', filters.priceRange);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.search) params.append('search', filters.search);

  const { data } = await axios.get(BASE_URL, { params });
  return data;
};

// Used by: ProductDetails.js
export const fetchProductById = async (id) => {
  const { data } = await axios.get(`${BASE_URL}/${id}`);
  return data;
};
// Alias for compatibility
export const getProductById = fetchProductById; 

export const getProductsByCategory = async (category) => {
  return getAllProducts({ category });
};


// ============================================================
// ADMIN FUNCTIONS (Management)
// ============================================================

// Used by: Admin Product Page (Listing)
export const fetchAllProducts = async () => {
  // Reuses the customer getter but with no filters to get everything
  return getAllProducts({});
};

// Used by: AddProductPage.js
export const createProduct = async (productData, token) => {
  const formData = new FormData();

  // 1) Append text fields - Basic product info
  ['name', 'category', 'subCategory', 'color', 'price', 'stock', 'weight', 'discount', 'details']
    .forEach(key => {
      const val = productData[key];
      if (val != null) formData.append(key, val);
    });

  // 2) Append dynamic filter fields if they exist
  ['bedSize', 'primaryMaterial', 'storageIncluded', 'seatingCapacity', 'sofaType', 
   'wardrobeType', 'numberOfDoors', 'tableShape', 'chairType', 'adjustableHeight',
   'wheelBase', 'materialType', 'dishwasherSafe', 'ovenSafe', 'numberOfPieces',
   'lightType', 'powerSource', 'frameType', 'threadCount', 'fabricType', 'pattern', 'brand']
    .forEach(key => {
      const val = productData[key];
      if (val != null && val !== '') formData.append(key, val);
    });

  // 3) Append file fields
  ['image1', 'image2', 'image3', 'image4', 'image5']
    .forEach(key => {
      if (productData[key]) {
        formData.append(key, productData[key]);
      }
    });

  const { data } = await axios.post(BASE_URL, formData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

// Used by: EditProductPage.js
export const updateProduct = async (productId, productData, token) => {
  const formData = new FormData();

  // 1) Append text fields - Basic product info
  ['name', 'category', 'subCategory', 'color', 'price', 'stock', 'weight', 'discount', 'details']
    .forEach(key => {
      const val = productData[key];
      if (val != null) formData.append(key, val);
    });

  // 2) Append dynamic filter fields if they exist
  ['bedSize', 'primaryMaterial', 'storageIncluded', 'seatingCapacity', 'sofaType', 
   'wardrobeType', 'numberOfDoors', 'tableShape', 'chairType', 'adjustableHeight',
   'wheelBase', 'materialType', 'dishwasherSafe', 'ovenSafe', 'numberOfPieces',
   'lightType', 'powerSource', 'frameType', 'threadCount', 'fabricType', 'pattern', 'brand']
    .forEach(key => {
      const val = productData[key];
      if (val != null && val !== '') formData.append(key, val);
    });

  // 3) Append file fields
  ['image1', 'image2', 'image3', 'image4', 'image5']
    .forEach(key => {
      if (productData[key]) {
        formData.append(key, productData[key]);
      }
    });

  const { data } = await axios.put(`${BASE_URL}/${productId}`, formData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

// Used by: Admin Product Page (Delete)
export const deleteProduct = async (id, token) => {
  const { data } = await axios.delete(`${BASE_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};
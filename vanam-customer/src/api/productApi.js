import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BASE_URL = `${API_URL}/api/products`;

// ============================================================
// CUSTOMER FUNCTIONS
// ============================================================

export const getAllProducts = async (filters = {}) => {
  const params = new URLSearchParams();
  
  // Basic filters
  if (filters.category) params.append('category', filters.category);
  if (filters.subCategories?.length > 0) params.append('subCategories', filters.subCategories.join(','));
  if (filters.colors?.length > 0) params.append('colors', filters.colors.join(','));
  if (filters.priceRange) params.append('priceRange', filters.priceRange);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.search) params.append('search', filters.search);

  // Dynamic filters - append any additional filter fields
  const knownFilters = ['category', 'subCategories', 'colors', 'priceRange', 'sort', 'search'];
  Object.entries(filters).forEach(([key, value]) => {
    if (!knownFilters.includes(key) && value) {
      // Handle arrays (convert to comma-separated string)
      if (Array.isArray(value) && value.length > 0) {
        params.append(key, value.join(','));
      } else if (typeof value === 'string' && value.trim() !== '') {
        params.append(key, value);
      }
    }
  });

  const { data } = await axios.get(BASE_URL, { params });
  return data;
};

export const fetchProductById = async (id) => {
  const { data } = await axios.get(`${BASE_URL}/${id}`);
  return data;
};
export const getProductById = fetchProductById; 

export const getProductsByCategory = async (category) => {
  return getAllProducts({ category });
};

// ============================================================
// ADMIN FUNCTIONS
// ============================================================

export const fetchAllProducts = async () => {
  return getAllProducts({});
};

export const createProduct = async (productData, token) => {
  const formData = new FormData();

  // 🚨🚨 CHECK THIS ARRAY IN YOUR FILE 🚨🚨
  // You are likely missing 'subCategory' and 'color' in this list!
  ['name', 'category', 'subCategory', 'color', 'price', 'stock', 'discount', 'details']
    .forEach(key => {
      const val = productData[key];
      if (val != null) formData.append(key, val);
    });

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

export const updateProduct = async (productId, productData, token) => {
  const formData = new FormData();

  // 🚨🚨 CHECK THIS ARRAY HERE TOO 🚨🚨
  ['name', 'category', 'subCategory', 'color', 'price', 'stock', 'discount', 'details']
    .forEach(key => {
      const val = productData[key];
      if (val != null) formData.append(key, val);
    });

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

export const deleteProduct = async (id, token) => {
  const { data } = await axios.delete(`${BASE_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};
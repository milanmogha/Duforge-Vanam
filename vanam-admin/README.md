- v 1.0
+ Products
+ Banner

- Products
- Banner

- v 1.0.1
- Coupons


-v1.0.3
Update the following:
-coupons
-Products
-Banner
-Add Products

-v 1.0.4

updated the UI  
- changed coupon, dashboard and banner  in css folder
- changed AddProductpage, banner,  coupon, dashboard, and product 
-v 1.0.4
- little work on ui 

- v 1.0.6
- Added Orders
- Coupons fixed 
- Added Users
- Added Sales Chart at dashboard

- v 1.0.7
- Added Product Details 
- Added Reviews

- v 1.0.8
- Fix Banner Uploading
- Fix Login
- Fix Navbar in Orders

- v 1.0.9
- Dashboard UI and Add/Edit Product Update 

- v 1.1.0
- Fix Something

- v 1.1.1
-Product Page Deleting Product Confirmation Fix

- v 1.1.2
-filter fix in product api

- v 1.1.3
- responsiveness fix - only order, order details and user page remains now.

- v 1.1.4
- convert into VITE

- v 1.1.4

-v 1.1.5
- fix image error, link updation for tracker 

- v1.1.6
- added web notification for new order and order deatils page ui

- v1.1.7

-v1.1.8
### Major Features
1. **Product Weight Management** - Added weight field for delivery calculations
2. **Dynamic Product Attributes** - Added 21+ furniture-specific fields
3. **Enhanced Product Forms** - Improved add/edit product interfaces

### Files Modified

#### 📁 `src/pages/`

**`AddProductPage.jsx`**
- Added weight input field (default: 1 KG, step: 0.1)
- Implemented dynamic filter fields based on subcategory selection
- Added 2-column layout for weight and color fields
- Integrated `getFiltersForCategory` for dynamic form fields
- Added form state for all 21 dynamic filter fields
- Enhanced form validation and submission

**`EditProductPage.jsx`**
- Added weight field with pre-population from database
- Implemented dynamic filter field pre-population
- Added all 21 dynamic filter fields to form state initialization
- Enhanced product data loading with dynamic attributes
- Improved form state management for existing products

**`Product.jsx`** (Product List Page)
- Added weight column display in product table
- Enhanced product list to show weight in KG

#### 📁 `src/api/`

**`ProductApi.js`** *(CRITICAL BUG FIX)*
- **createProduct**: Added `'weight'` to FormData fields array
- **createProduct**: Added all 21 dynamic filter fields to FormData
- **updateProduct**: Added `'weight'` to FormData fields array
- **updateProduct**: Added all 21 dynamic filter fields to FormData
- Fields now include:
  ```javascript
  ['name', 'category', 'subCategory', 'color', 'price', 'stock', 'weight', 'discount', 'details']
  + 21 dynamic fields (bedSize, sofaType, materialType, etc.)
  ```

#### 📁 `src/config/`

**`filterConfig.js`** *(NEW FILE - Shared with Customer)*
- Same filter configuration as customer frontend
- Used to render dynamic fields in add/edit product forms

---# vanam-admin

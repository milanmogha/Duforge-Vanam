- v 1.0
- Banners Fetching

- v 1.0.1
- product image
- banner issue resolved
<<<<<<< HEAD
- product card updated
=======
- product card updated


- v 1.0.2
- made Address Book
- Created OTP Signin
- Created OTP Login
<<<<<<< HEAD
=======


- v 1.0.3
- Added Coupons
- Cart Fully Functional
- Order Creation, Deletion, Details
>>>>>>> 84bafaf4326a06b50df303f994f3e756df783cd0

- v 1.0.4
- cart product image fixed 

- v 1.0.5
- made my account
- fixed coupon 


- v 1.0.6
- Fixed Wishlist
- Added Review and rating system 
- Added Product Details

-v 1.0.7
-Fix Homepage UI

- v 1.0.8
- Responsive Navbar, HomePage, Footer

- v 1.0.9
- Fix Product Filteration or Sorting By Category

- v 1.1.0
- Checkout Page UI / Payment Method

- v 1.1.1
-Address books, profile Panel, My Account

- v 1.1.2
- Account deletion confirmation fix/Review

- v 1.1.3
- Product Details Page - Image slider added/Cart button Function updated

v 1.1.4 
- Product category page responsiveness done.
- and some responsiveness changes in the product details page

v 1.1.5 
- updated the responsiveness of the navbar , login page updated, signup page updated.

- tasks - 1. there will be changes into navbar dropdown screen that needed to be done    ...
          2. home page Why Us section is needed to up updated too. its Responsiveness between  780px and below is not good.

v 1.1.6
- Updated Product Api for handling filter
- Updated navbar fixed profile dropdown
- Updated product page and product card (js and css both) fix issue with toast notification and filter 
- Updated wishlist card add delete button
- updated homepage banner 

-v 1.1.7
-converted into VITE
- banner image resize fix

<<<<<<< HEAD
-v 1.1.8
- home page - new arrival  done
=======
- v 1.1.8
- Left sidebar remove

deployed...

- v.1.1.9
- payment order creation fixed.
>>>>>>> b877badb28b533e11f0b0ef29df9bb75d70fde28

- v.2.0.0
- login and signup page responsiveness complete .

new fix

- v 2.0.1
- changes in banner css

- v2.0.2
- homepage responsiveness complete except new arrival section(need some improvement in this section.)
- footer responsiveness completely done.

- v2.0.3

-v 2.0.4
- added tracker fix image and ui

- v2.0.5
- Edit tracker and add animation, realtime update changes in tracker

- v2.0.6

-v2.0.7
### Major Features
1. **Dynamic Delivery Charges** - Weight-based, zone-specific delivery pricing
2. **Advanced Product Filtering** - Dynamic filters based on product categories
3. **Improved UI/UX** - Scrollable containers, modern design

### Files Modified

#### 📁 `src/pages/`

**`CheckoutPage.jsx`**
- Added delivery charge calculation API integration
- Implemented dynamic delivery fee display with zone information
- Added address selection with scrollable container
- Fixed "Add New Address" button to stay outside scroll area
- Removed weight display from price breakdown (hidden from customers)
- Enhanced checkout flow with delivery charge recalculation on address change

**`ProductPage.jsx`**
- Added dynamic filter state management (`selectedDynamicFilters`)
- Integrated filter configuration for subcategory-specific filters
- Implemented filter API calls with dynamic filter parameters
- Added filter reset on category change
- Enhanced product filtering logic to support 21+ furniture attributes

#### 📁 `src/components/`

**`FilterSidebar.jsx`**
- Added dynamic filter rendering based on subcategory
- Implemented `handleDynamicFilterToggle` for multi-select filters
- Added filter divider for better visual separation
- Enhanced checkbox UI for dynamic filters
- Made sidebar scrollable with custom scrollbar styling

#### 📁 `src/api/`

**`orderApi.js`**
- Created `calculateDeliveryCharges` function for delivery fee estimation
- Added API endpoint integration for delivery charge calculation
- Implemented cart-based delivery charge requests

**`productApi.js`**
- Enhanced `getAllProducts` to send dynamic filter parameters
- Added logic to append all non-standard filter fields to query params
- Implemented array-to-comma-separated string conversion for filters

#### 📁 `src/config/`

**`filterConfig.js`** *(NEW FILE)*
- Created comprehensive filter library with 21+ filter types
- Mapped filters to specific subcategories (beds, sofas, tables, etc.)
- Defined filter options with labels and values
- Filter types include:
  - Bed Size (single, double, queen, king)
  - Sofa Type (sectional, recliner, sleeper, etc.)
  - Material Type (wood, metal, fabric, etc.)
  - Table Shape (round, square, rectangular, oval)
  - Storage options, seating capacity, and more

#### 📁 `src/css/`

**`FilterSidebar.css`**
- Made filter sidebar sticky and scrollable
- Added custom scrollbar styling (6px width, smooth hover effects)
- Set max-height and overflow for long filter lists
- Enhanced mobile filter dropdown scrolling

**`CheckoutPage.css`**
- Created `.address-section-wrapper` for layout structure
- Made `.address-selection` scrollable (max-height: 400px)
- Added custom scrollbar for address list
- Fixed "Add New Address" button positioning outside scroll area
- Enhanced address card hover and selection states

---# vanam-customer

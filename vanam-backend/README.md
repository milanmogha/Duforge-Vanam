- v 1.0
+ Products 
+ Banners
+ Admin Login

- v 1.0.1
+ Coupons

- v 1.0.2
+ AddressBook Done
+ User Login Done 

- v 1.0.3
+ Orders done
+ Cart done
+ Coupons done for all the apps 

- v 1.0.4
+ cart product image 

- v 1.0.5
- users fetched on admin 
- coupons fixed properly 
- user profile updating 
- orders fetching on admin 

- v 1.0.6 
- Creted Rating and Review System

- v 1.0.7
- Fix Multiple Order Error 

- v 1.0.8
- Add Payment Integration and Fix Order Control

- v 1.0.9
- Account deletion with confirmation fix

- v 1.1.0
- OrderConroller - Stock system fix

-v 1.1.1
-Initialize socket.io in ndex.js
-update product controller to handle filters
-update order controller to handle order confirmation automate(like if custormer choose COD order state will be pending until admin confirms it anad if payment method is using online mode(razorpay) order will confirmed automatically)

- v 1.1.1
- Initialize notification for order placed

- v 1.1.2
- order page after checkout fix(order not found error)

- v.1.1.3
- payment order creation fixed

- v 1.1.4
 

- v 1.1.5
- login fixed  

- v 1.1.6

-v 1.1.7
-updated sms logic, sms will be sent only once order tracker

- v1.1.8
- Web Notification for admin, Coupon fix

- v1.1.9

-v2.0.0
### Major Features
1. **Dynamic Delivery Charge System** - Zone and weight-based pricing
2. **Product Schema Enhancement** - Added weight and 21 dynamic fields
3. **Advanced Filtering** - Support for furniture-specific attributes

### Files Modified

#### 📁 `models/`

**`Product.js`**
- Added `weight` field (type: Number, default: 1)
- Added 21 dynamic filter fields:
  - `bedSize`, `primaryMaterial`, `storageIncluded`
  - `seatingCapacity`, `sofaType`, `wardrobeType`
  - `numberOfDoors`, `tableShape`, `chairType`
  - `adjustableHeight`, `wheelBase`, `materialType`
  - `dishwasherSafe`, `ovenSafe`, `numberOfPieces`
  - `lightType`, `powerSource`, `frameType`
  - `threadCount`, `fabricType`, `pattern`, `brand`
- All dynamic fields: type String, trim: true

#### 📁 `controllers/`

**`orderController.js`**
- Created `calculateDeliveryCharges` endpoint (POST `/api/orders/calculate-delivery`)
- Integrated delivery charge calculation utility
- Returns zone, total weight, and delivery charge
- Validates cart items and address data

**`productController.js`** *(CRITICAL BUG FIX)*
- **getAllProducts**: Added extraction of 21 dynamic filter fields from `req.query`
- Implemented dynamic filter MongoDB query logic
- Added support for comma-separated multi-value filters
- Handles both array and string filter formats
- Filter matching logic:
  ```javascript
  // Single value: { bedSize: 'queen' }
  // Multiple values: { bedSize: { $in: ['queen', 'king'] } }
  ```
- **getProductById**: Removed `.select()` restriction to return all fields
- Now returns weight and all dynamic filter fields for edit forms

#### 📁 `routes/`

**`customerOrderRoutes.js`**
- Added delivery charge calculation route
- Endpoint: `POST /api/orders/calculate-delivery`
- Requires authentication

#### 📁 `utils/`

**`deliveryCharges.js`** *(NEW FILE)*
- Comprehensive delivery charge calculation system
- **Zone Mapping:**
  - **NCR**: Delhi, Gurgaon, Noida, Ghaziabad, Faridabad (110xxx, 122xxx, 201xxx, 121xxx)
  - **NORTH**: Punjab, Haryana, HP, J&K, Chandigarh, Uttarakhand
  - **ROI**: Rest of India (UP, MP, Rajasthan, Gujarat, Maharashtra, South India)
  - **NE/SPL DEST**: North-East states, Andaman, Lakshadweep
- **Pricing Tables:**
  - Lightweight (≤3 KG): Fixed rates per weight bracket
  - Heavy (>3 KG): Per-KG rates based on weight ranges
- **Rate Examples (NCR):**
  - 1 KG: ₹75
  - 3 KG: ₹155
  - 10 KG: ₹45/kg = ₹450
  - 50 KG: ₹35/kg = ₹1,750
  - 100 KG: ₹30/kg = ₹3,000
- **Functions:**
  - `getZone(pincode, city, state)` - Determines delivery zone
  - `calculateDeliveryCharge(totalWeight, zone)` - Calculates charge
  - `calculateOrderDeliveryCharge(products, address)` - Main order calculation
  - `getDeliveryEstimate(totalWeight, pincode, city, state)` - Quick estimate

---


---
# vanam-backend

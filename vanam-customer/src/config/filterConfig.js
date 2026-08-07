// src/config/filterConfig.js
const createOptions = (items) => items.map(item => ({ value: item.toLowerCase().replace(/\s+/g, "-"), label: item }));

const FILTER_LIBRARY = {
  bedSize: {
    id: "bedSize",
    title: "Bed Size",
    options: createOptions(["Single", "Double", "Queen", "King", "California King"]),
  },
  primaryMaterial: {
    id: "primaryMaterial",
    title: "Primary Material",
    options: createOptions(["Solid Wood", "Engineered Wood", "Metal", "Fabric", "Leather", "Glass", "Marble"]),
  },
  storageIncluded: {
    id: "storageIncluded",
    title: "Storage Included",
    options: createOptions(["Yes", "No"]),
  },
  seatingCapacity: {
    id: "seatingCapacity",
    title: "Seating Capacity",
    options: createOptions(["2-Seater", "3-Seater", "4-Seater", "5-Seater"]),
  },
  sofaType: {
    id: "sofaType",
    title: "Sofa Type",
    options: createOptions(["L-Shaped", "3-Seater", "Recliner", "Sectional", "Loveseat"]),
  },
  wardrobeType: {
    id: "wardrobeType",
    title: "Wardrobe Type",
    options: createOptions(["Sliding", "Hinged", "Modular", "Wardrobe with Mirror"]),
  },
  numberOfDoors: {
    id: "numberOfDoors",
    title: "Number of Doors",
    options: createOptions(["2 Doors", "3 Doors", "4 Doors", "5 Doors", "6 Doors"]),
  },
  tableShape: {
    id: "tableShape",
    title: "Table Shape",
    options: createOptions(["Rectangular", "Round", "Oval", "Square", "Extendable"]),
  },
  chairType: {
    id: "chairType",
    title: "Chair Type",
    options: createOptions(["Dining Chair", "Arm Chair", "Accent Chair", "Bar Stool", "Office Chair"]),
  },
  adjustableHeight: {
    id: "adjustableHeight",
    title: "Adjustable Height",
    options: createOptions(["Yes", "No"]),
  },
  wheelBase: {
    id: "wheelBase",
    title: "Wheel Base",
    options: createOptions(["Yes", "No"]),
  },
  materialType: {
    id: "materialType",
    title: "Material Type",
    options: createOptions(["Solid Wood", "Engineered Wood", "Metal", "Marble", "Glass", "Fabric", "Plastic"]),
  },
  dishwasherSafe: {
    id: "dishwasherSafe",
    title: "Dishwasher Safe",
    options: createOptions(["Yes", "No"]),
  },
  ovenSafe: {
    id: "ovenSafe",
    title: "Oven Safe",
    options: createOptions(["Yes", "No"]),
  },
  numberOfPieces: {
    id: "numberOfPieces",
    title: "Number of Pieces",
    options: createOptions(["2-Piece Set", "4-Piece Set", "6-Piece Set", "8-Piece Set", "12-Piece Set"]),
  },
  lightType: {
    id: "lightType",
    title: "Light Type",
    options: createOptions(["LED", "Pendant", "Floor Lamp", "Table Lamp", "Spotlight"]),
  },
  powerSource: {
    id: "powerSource",
    title: "Power Source",
    options: createOptions(["Plug-in", "Battery", "Solar"]),
  },
  frameType: {
    id: "frameType",
    title: "Frame Type",
    options: createOptions(["Metal", "Wood", "Composite"]),
  },
  threadCount: {
    id: "threadCount",
    title: "Thread Count",
    options: createOptions(["200", "300", "400", "600", "800"]),
  },
  fabricType: {
    id: "fabricType",
    title: "Fabric Type",
    options: createOptions(["Cotton", "Linen", "Silk", "Polyester", "Velvet"]),
  },
  pattern: {
    id: "pattern",
    title: "Pattern",
    options: createOptions(["Solid", "Floral", "Striped", "Geometric", "Textured"]),
  },
  brand: {
    id: "brand",
    title: "Brand",
    options: createOptions(["UltraCore", "Haven Living", "Bespoke Line", "Crafted Home", "Studio 7", "Northwood"]),
  },
};

const FILTERS_BY_SUBCATEGORY = {
  beds: ["bedSize", "primaryMaterial", "storageIncluded", "brand"],
  sofas: ["seatingCapacity", "sofaType", "materialType", "frameType", "brand"],
  wardrobes: ["wardrobeType", "numberOfDoors", "materialType", "brand"],
  "nightstands": ["materialType", "brand"],
  "coffee-tables": ["tableShape", "materialType", "brand"],
  "accent-chairs": ["chairType", "adjustableHeight", "wheelBase", "brand"],
  recliners: ["seatingCapacity", "sofaType", "adjustableHeight", "brand"],
  "tv-units": ["materialType", "storageIncluded", "brand"],
  "dining-tables": ["tableShape", "materialType", "numberOfPieces", "brand"],
  "dining-chairs": ["chairType", "materialType", "numberOfPieces", "brand"],
  "office-chairs": ["chairType", "adjustableHeight", "wheelBase", "brand"],
  "work-desks": ["materialType", "frameType", "brand"],
  bookshelves: ["materialType", "brand"],
  cookware: ["dishwasherSafe", "ovenSafe", "materialType", "brand"],
  "storage-containers": ["materialType", "brand"],
  kitchenware: ["dishwasherSafe", "materialType", "brand"],
  "kitchen-linen": ["fabricType", "pattern", "brand"],
  bedding: ["fabricType", "threadCount", "pattern", "brand"],
  curtains: ["fabricType", "pattern", "brand"],
  cushions: ["fabricType", "pattern", "brand"],
  "floor-coverings": ["materialType", "pattern", "brand"],
  "wall-decor": ["materialType", "pattern", "brand"],
  lighting: ["lightType", "powerSource", "brand"],
  "home-accessories": ["materialType", "brand"],
  fragrances: ["brand"],
  "garden-decor": ["materialType", "brand"],
  "dinner-sets": ["dishwasherSafe", "materialType", "numberOfPieces", "brand"],
  serveware: ["dishwasherSafe", "materialType", "numberOfPieces", "brand"],
  crockery: ["dishwasherSafe", "materialType", "numberOfPieces", "brand"],
  cutlery: ["materialType", "numberOfPieces", "brand"],
  "table-linen": ["fabricType", "pattern", "brand"],
  accessories: ["materialType", "brand"],
};

const DEFAULT_FILTER_SEQUENCE = ["brand", "materialType", "pattern", "primaryMaterial"];

export const getFiltersForCategory = (subCategorySlug) => {
  if (!subCategorySlug) return [];
  const ids = FILTERS_BY_SUBCATEGORY[subCategorySlug] || DEFAULT_FILTER_SEQUENCE;
  const seen = new Set();
  return ids
    .map(id => FILTER_LIBRARY[id])
    .filter(Boolean)
    .filter(filter => {
      if (seen.has(filter.id)) return false;
      seen.add(filter.id);
      return true;
    });
};

// Get all unique filters from FILTER_LIBRARY for general use
export const getAllFilters = () => Object.values(FILTER_LIBRARY);

// Get filter by ID
export const getFilterById = (filterId) => FILTER_LIBRARY[filterId] || null;

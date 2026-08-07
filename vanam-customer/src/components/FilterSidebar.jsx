// src/components/FilterSidebar.js

import React from 'react';
import '../css/FilterSidebar.css';
import { formatPrice } from '../utils/formatters'; // Import the price formatter

const FilterSidebar = ({
    categoryTitle,
    subCategoryOptions,
    selectedSubCategories,
    onSubCategoryChange,
    colorOptions,
    selectedColors,
    onColorChange,
    priceRange,
    onPriceChange,
    maxPrice,
    dynamicFilters = [],
    selectedDynamicFilters = {},
    onDynamicFilterChange
}) => {

  const handleSubCategoryToggle = (option) => {
    // option is now an object with { title, slug }
    const slug = option.slug || option;
    const newSelection = selectedSubCategories.includes(slug)
      ? selectedSubCategories.filter(o => o !== slug)
      : [...selectedSubCategories, slug];
    onSubCategoryChange(newSelection);
  };

  const handleColorToggle = (colorName) => {
    const newSelection = selectedColors.includes(colorName)
      ? selectedColors.filter(c => c !== colorName)
      : [...selectedColors, colorName];
    onColorChange(newSelection);
  };

  const handleDynamicFilterToggle = (filterId, value) => {
    if (!onDynamicFilterChange) return;
    
    const currentValues = selectedDynamicFilters[filterId] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onDynamicFilterChange(filterId, newValues);
  };

  return (
    <aside className="filter-sidebar">
      <h3>FILTER</h3>

      {/* --- NEW: Price Range Filter Section --- */}
      <div className="filter-group">
        <h4>PRICE</h4>
        <input
            type="range"
            min="0"
            max={maxPrice}
            step="500"
            value={priceRange}
            onChange={onPriceChange}
            className="price-slider"
        />
        <div className="price-label">
            Up to: {formatPrice(priceRange)}
        </div>
      </div>
      {/* --- End of New Section --- */}

      {/* Sub-Category Section */}
      {subCategoryOptions && subCategoryOptions.length > 0 && (
        <div className="filter-group">
          <h4>{categoryTitle || 'CATEGORY'}</h4>
          {subCategoryOptions.map(option => {
            const slug = option.slug || option;
            const title = option.title || option;
            return (
              <label key={slug} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={selectedSubCategories.includes(slug)}
                  onChange={() => handleSubCategoryToggle(option)}
                />
                <span className="checkbox-custom"></span>
                {title}
              </label>
            );
          })}
        </div>
      )}

      {/* Color Filter Section */}
      <div className="filter-group">
        <h4>FINISH / COLOR</h4>
        <div className="color-swatches">
          {colorOptions.map(color => (
            <span
              key={color.name}
              className={`swatch ${selectedColors.includes(color.name) ? 'selected' : ''}`}
              style={{ backgroundColor: color.hex, border: color.hex === '#ffffff' ? '1px solid #ddd' : 'none' }}
              onClick={() => handleColorToggle(color.name)}
              title={color.name}
            >
              {selectedColors.includes(color.name) && '✔'}
            </span>
          ))}
        </div>
      </div>

      {/* Dynamic Filters Section */}
      {dynamicFilters && dynamicFilters.length > 0 && (
        <>
          <div className="filter-divider" style={{ margin: '1.5rem 0', height: '1px', background: '#e0e0e0' }}></div>
          {dynamicFilters.map(filter => (
            <div key={filter.id} className="filter-group">
              <h4>{filter.title.toUpperCase()}</h4>
              {filter.options.map(option => {
                const isSelected = (selectedDynamicFilters[filter.id] || []).includes(option.value);
                return (
                  <label key={option.value} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleDynamicFilterToggle(filter.id, option.value)}
                    />
                    <span className="checkbox-custom"></span>
                    {option.label}
                  </label>
                );
              })}
            </div>
          ))}
        </>
      )}
    </aside>
  );
};

export default FilterSidebar;
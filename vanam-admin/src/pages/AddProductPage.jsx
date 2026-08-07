import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../api/ProductApi";
import AdminNavbar from "./Navbar";
import { CATEGORIES } from "../config/categories";
import { getFiltersForCategory } from "../config/filterConfig";
import "../css/AddProductPage.css";

const COLOR_OPTIONS = ["Brown", "Beige", "Black", "White"];

const AddProductPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category: "",
    subCategory: "",
    color: "",
    price: "",
    stock: "",
    weight: "1",
    discount: "",
    details: "",
    image1: null,
    image2: null,
    image3: null,
    image4: null,
    image5: null,
  });

  /* ---------------- CATEGORY DERIVATIONS ---------------- */

  const level1Categories = CATEGORIES;

  const level2Categories = useMemo(() => {
    return (
      level1Categories.find(c => c.slug === form.category)?.children || []
    );
  }, [form.category]);

  // Get dynamic filters based on selected subCategory
  const dynamicFilters = useMemo(() => {
    return getFiltersForCategory(form.subCategory);
  }, [form.subCategory]);


  /* ---------------- HANDLERS ---------------- */

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setForm(prev => ({ ...prev, [name]: files[0] }));
      return;
    }

    if (name === "category") {
      setForm(prev => ({
        ...prev,
        category: value,
        subCategory: "",
      }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const adminToken = localStorage.getItem('adminToken');
      await createProduct(form, adminToken);
      navigate("/admin/products");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add product");
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <>
      <AdminNavbar />
      <div className="add-product-page">
        <div className="add-product-card">
          <h2 className="heading">🪑 Add New Product</h2>

          <form className="add-product-form" onSubmit={handleSubmit}>

            <div className="form-row">
              <FormInput label="Product Name" name="name" value={form.name} onChange={handleChange} />
              <FormInput label="Price" name="price" type="number" value={form.price} onChange={handleChange} />
            </div>

            <div className="form-row">
              <FormInput label="Stock" name="stock" type="number" value={form.stock} onChange={handleChange} />
              <FormInput label="Discount (%)" name="discount" type="number" value={form.discount} onChange={handleChange} />
            </div>

            <div className="form-row">
              <FormInput 
                label="Weight (KG)" 
                name="weight" 
                type="number" 
                step="0.1" 
                min="0.1"
                value={form.weight} 
                onChange={handleChange} 
                title="Product weight for delivery charge calculation"
              />
              <SelectSimple
                label="Color / Finish"
                name="color"
                value={form.color}
                onChange={handleChange}
                options={COLOR_OPTIONS}
              />
            </div>

            <div className="form-row">
              <Select
                label="Category"
                name="category"
                value={form.category}
                onChange={handleChange}
                options={level1Categories}
              />

              <Select
                label="Sub Category"
                name="subCategory"
                value={form.subCategory}
                onChange={handleChange}
                options={level2Categories}
                disabled={!form.category}
              />
            </div>

            {/* Dynamic Filter Fields */}
            {dynamicFilters.length > 0 && (
              <div className="dynamic-filters-section">
                <h3 style={{ margin: '1.5rem 0 1rem', color: '#734128' }}>Additional Product Details</h3>
                <div className="form-row" style={{ flexWrap: 'wrap' }}>
                  {dynamicFilters.map(filter => {
                    // Skip rating, discount, and availability filters in add form
                    if (['rating', 'discount', 'availability'].includes(filter.id)) {
                      return null;
                    }
                    
                    return (
                      <SelectSimple
                        key={filter.id}
                        label={filter.title}
                        name={filter.id}
                        value={form[filter.id] || ""}
                        onChange={handleChange}
                        options={filter.options.map(opt => opt.value)}
                        optionLabels={filter.options.map(opt => opt.label)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="details"
                rows={4}
                value={form.details}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Upload Images</label>
              <div className="image-grid">
                {[1, 2, 3, 4, 5].map(i => (
                  <input
                    key={i}
                    type="file"
                    name={`image${i}`}
                    accept="image/*"
                    onChange={handleChange}
                  />
                ))}
              </div>
            </div>

            <div className="form-group text-center">
              <button className="submit-btn" type="submit">
                Create Product
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
};

/* ---------------- HELPERS ---------------- */

const FormInput = ({ label, ...props }) => (
  <div className="form-group">
    <label>{label}</label>
    <input {...props} required />
  </div>
);

const Select = ({ label, name, value, onChange, options, disabled }) => (
  <div className="form-group">
    <label>{label}</label>
    <select name={name} value={value} onChange={onChange} disabled={disabled}>
      <option value="">Select</option>
      {options.map(o => (
        <option key={o.slug} value={o.slug}>{o.title}</option>
      ))}
    </select>
  </div>
);

const SelectSimple = ({ label, name, value, onChange, options, optionLabels }) => (
  <div className="form-group">
    <label>{label}</label>
    <select name={name} value={value} onChange={onChange}>
      <option value="">Select</option>
      {options.map((o, idx) => (
        <option key={o} value={o}>
          {optionLabels ? optionLabels[idx] : o}
        </option>
      ))}
    </select>
  </div>
);

export default AddProductPage;

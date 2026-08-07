// src/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// CONTEXT PROVIDERS
import { AuthProvider } from './pages/AuthContext';
import { CartProvider } from './pages/CartContext';
import { WishlistProvider } from './pages/WishlistContext';
import { CompareProvider } from './pages/CompareContext';

// LAYOUT & PROTECTED ROUTE COMPONENTS
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './api/ProtectedRoute';
import CartPage from './pages/CartPage';

// PAGE COMPONENTS
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import ProductDetailsPage from './pages/ProductDetails';
import WishList from './pages/WishList';
import AddressBook from './pages/AddressBook';
import CheckoutPage from './pages/CheckoutPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import AccountDashboard from './pages/AccountDashboard'; // Import the new component
import Login from './pages/Login';
import Signup from './pages/Signup';

// CONTINUATION FEATURE PAGES
import FinishLab from './pages/FinishLab';
import Calculator from './pages/Calculator';
import Advisor from './pages/Advisor';
import Compare from './pages/Compare';
import Technology from './pages/Technology';
import Visualizer from './pages/Visualizer';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Samples from './pages/Samples';
import Quote from './pages/Quote';
import Collections from './pages/Collections';
import Materials from './pages/Materials';
import { About, Contact, Sustainability, Journal } from './pages/ContentPages';


function App() {
  const [isCartOpen, setCartOpen] = useState(false);
  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);

  // Lock background scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('body-no-scroll');
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('body-no-scroll');
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('body-no-scroll');
    };
  }, [isCartOpen]);

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <CompareProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <Navbar openCart={openCart} />

            <Routes>
              {/* --- Public Routes --- */}
              <Route path="/" element={<HomePage openCart={openCart} />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* --- Product Routes --- */}
              <Route path="/products" element={<ProductPage openCart={openCart} />} />
              <Route path="/products/:id" element={<ProductDetailsPage openCart={openCart} />} />

              {/* --- Discovery & content (public) --- */}
              <Route path="/collections" element={<Collections />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/sustainability" element={<Sustainability />} />
              <Route path="/journal" element={<Journal />} />

              {/* --- Tools & experiences (public) --- */}
              <Route path="/finish-lab" element={<FinishLab />} />
              <Route path="/visualizer" element={<Visualizer />} />
              <Route path="/technology" element={<Technology />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/advisor" element={<Advisor />} />
              <Route path="/compare" element={<Compare />} />

              {/* --- Protected User Routes --- */}
              <Route path="/wishlist" element={<ProtectedRoute><WishList openCart={openCart} /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
              <Route path="/account" element={<ProtectedRoute><AccountDashboard /></ProtectedRoute>} />
              <Route path="/account/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/account/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
              <Route path="/account/samples" element={<ProtectedRoute><Samples /></ProtectedRoute>} />
              <Route path="/quote" element={<ProtectedRoute><Quote /></ProtectedRoute>} />
            </Routes>

            {/* The Cart Slider is rendered outside Routes to act as an overlay */}
            <CartPage isOpen={isCartOpen} onClose={closeCart} />

            <Footer />
          </Router>
          </CompareProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
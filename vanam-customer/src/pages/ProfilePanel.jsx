// src/pages/ProfilePanel.js

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import AddressBook from './AddressBook';
import OrdersPage from './OrdersPage';
import MyAccount from './MyAccount';

import '../css/AddressBook.css'; // Reusing the styles

const ProfilePanel = () => {
  const location = useLocation();

  // State for the main active component (account, orders, or address)
  const [activeComponent, setActiveComponent] = useState('account');
  // State for the address-specific view (list or form)
  const [addressView, setAddressView] = useState('list');
  // State to control the visibility of the "Address Info" sub-menu
  const [isAddressMenuOpen, setAddressMenuOpen] = useState(false);

  // This effect handles the initial state when navigating from the Navbar
  useEffect(() => {
    const initialTab = location.state?.defaultTab;
    if (initialTab === 'account') {
      setActiveComponent('account');
      setAddressMenuOpen(false);
    } else if (initialTab === 'orders') {
      setActiveComponent('orders');
      setAddressMenuOpen(false);
    } else if (initialTab === 'address') {
      setActiveComponent('address');
      setAddressView('list'); // Default to showing the list
      setAddressMenuOpen(true); // Open the dropdown
    }
  }, [location.state]);

  const handleMenuClick = (component, addressViewType = 'list') => {
    setActiveComponent(component);
    if (component === 'address') {
      setAddressMenuOpen(true);
      setAddressView(addressViewType);
    } else {
      setAddressMenuOpen(false);
    }
  };
  
  const handleAddressSubMenuClick = (viewType) => {
      setActiveComponent('address');
      setAddressView(viewType);
  }

  // A function to render the correct component in the content area
  const renderContent = () => {
    switch (activeComponent) {
      case 'account':
        return <MyAccount />;
      case 'orders':
        return <OrdersPage />;
      case 'address':
        // Pass the view and a function to switch the view to the AddressBook
        return <AddressBook 
                  initialView={addressView} 
                  onSwitchView={(view) => setAddressView(view)} 
                />;
      default:
        return <MyAccount />;
    }
  };

  return (
    <div className="address-page-wrapper">
      <div className="address-sidebar">
        {/* My Account Tab */}
        <div
          className={`sidebar-item ${activeComponent === 'account' ? 'active' : ''}`}
          onClick={() => handleMenuClick('account')}
        >
          My Account
        </div>

        {/* Orders Tab */}
        <div
          className={`sidebar-item ${activeComponent === 'orders' ? 'active' : ''}`}
          onClick={() => handleMenuClick('orders')}
        >
          Orders
        </div>

        {/* Address Info Dropdown Header */}
        <div
          className={`sidebar-item dropdown ${activeComponent === 'address' ? 'active' : ''}`}
          onClick={() => setAddressMenuOpen(!isAddressMenuOpen)}
        >
          Address Info <span className={`drop_address ${isAddressMenuOpen ? 'rotate' : ''}`}>{isAddressMenuOpen ? '▲' : '▼'}</span>
        </div>

        {/* Address Info Sub-menu (conditionally rendered) */}
        {isAddressMenuOpen && (
          <div className="submenu open">
            <div
              className={`sidebar-subitem ${activeComponent === 'address' && addressView === 'list' ? 'active' : ''}`}
              onClick={() => handleAddressSubMenuClick('list')}
            >
              Saved Address
            </div>
            <div
              className={`sidebar-subitem ${activeComponent === 'address' && addressView === 'form' ? 'active' : ''}`}
              onClick={() => handleAddressSubMenuClick('form')}
            >
              Add New Address
            </div>
          </div>
        )}
      </div>

      <div className="address-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default ProfilePanel;

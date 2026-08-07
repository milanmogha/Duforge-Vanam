// src/pages/AccountDashboard.js

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AddressBook from './AddressBook';
import OrdersPage from './OrdersPage';
import MyAccount from './MyAccount';
import '../css/AddressBook.css'; 

export default function AccountDashboard() {
  const location = useLocation();
  const [mainView, setMainView] = useState('account');
  const [addressView, setAddressView] = useState('list'); // 'list' or 'form'

  // Listen for changes coming from Navbar clicks
  useEffect(() => {
    if (location.state?.defaultTab) {
      const tab = location.state.defaultTab;
      
      if (tab === 'savedAddresses') {
        setMainView('address');
        setAddressView('list');
      } else if (tab === 'addAddress') {
        setMainView('address');
        setAddressView('form');
      } else {
        setMainView(tab);
      }
    }
  }, [location.state]);

  // Handle internal switching within AddressBook (e.g., clicking "Add Address" inside the list)
  const handleAddressViewSwitch = (subView) => {
    setAddressView(subView);
  };

  const renderContent = () => {
    switch (mainView) {
      case 'orders':
        return <OrdersPage />;
      case 'address':
        return (
          <AddressBook 
            initialView={addressView} 
            onSwitchView={handleAddressViewSwitch} 
          />
        );
      case 'account':
      default:
        return <MyAccount />;
    }
  };

  return (
    <div className="account-dashboard-wrapper">
      <div className="account-content">
        {renderContent()}
      </div>
    </div>
  );
}
// src/pages/Users.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllUsers } from '../api/userApi';
import AdminNavbar from './Navbar'; // or './Navbar' if that’s your file
import '../css/Users.css';               // create or adjust this CSS file as needed

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const adminToken = localStorage.getItem('adminToken');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        if (!adminToken) throw new Error('Not authenticated as admin');
        const data = await fetchAllUsers(adminToken);
        setUsers(data);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError(err.message || 'Could not load users');
      } finally {
        setLoading(false);
      }
    })();
  }, [adminToken]);

  const renderContent = () => {
    if (loading) return <p className="center">Loading users…</p>;
    if (error) return <p className="center error">{error}</p>;
    if (!users.length) return <p className="center">No users found.</p>;

    return (
      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Phone</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td data-label="User ID">{u._id}</td>
                <td data-label="Phone">{u.phone}</td>
                <td data-label="Name">{u.name || '—'}</td>
                <td data-label="Email">{u.email || '—'}</td>
                <td data-label="Role">{u.role}</td>
                <td data-label="Created At">{new Date(u.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <AdminNavbar />
      <div className="users-container">
        <h1>All Users</h1>
        {renderContent()}
      </div>
    </>
  );
}

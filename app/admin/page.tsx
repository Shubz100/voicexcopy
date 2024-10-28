'use client'

import React, { useState, useEffect } from 'react';
import './admin.css';

interface User {
  id: string;
  telegramId: number;
  username?: string;
  points: number;
  introSeen: boolean;
  paymentMethod?: string;
  paymentAddress?: string;
  isUpload: boolean;
  imageUrl?: string;
  savedImages: string[];
  piAmount: number[];
  finalpis: number[];
  piaddress?: string;
  istransaction: boolean;
}

interface EditForm {
  points: number;
  introSeen: boolean;
  paymentMethod: string;
  paymentAddress: string;
  isUpload: boolean;
  imageUrl: string;
  savedImages: string[];
  piAmount: number[];
  finalpis: number[];
  piaddress: string;
  istransaction: boolean;
}

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    points: 0,
    introSeen: false,
    paymentMethod: '',
    paymentAddress: '',
    isUpload: false,
    imageUrl: '',
    savedImages: [],
    piAmount: [],
    finalpis: [],
    piaddress: '',
    istransaction: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      points: user.points,
      introSeen: user.introSeen,
      paymentMethod: user.paymentMethod || '',
      paymentAddress: user.paymentAddress || '',
      isUpload: user.isUpload,
      imageUrl: user.imageUrl || '',
      savedImages: user.savedImages || [],
      piAmount: user.piAmount || [],
      finalpis: user.finalpis || [],
      piaddress: user.piaddress || '',
      istransaction: user.istransaction
    });
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        fetchUsers();
        alert('User updated successfully!');
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.telegramId.toString().includes(searchTerm)
  );

  return (
    <div className="admin-container">
      <div className="header-card">
        <h1>Admin Dashboard</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by username or Telegram ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid-container">
        <div className="card">
          <h2>Users</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Telegram ID</th>
                  <th>Username</th>
                  <th>Points</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.telegramId}</td>
                    <td>{user.username || 'N/A'}</td>
                    <td>{user.points}</td>
                    <td>
                      <button 
                        className="button outline"
                        onClick={() => handleUserSelect(user)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedUser && (
          <div className="card">
            <h2>Edit User: {selectedUser.username || selectedUser.telegramId}</h2>
            <div className="form-grid">
              <div className="form-field">
                <label>Points</label>
                <input
                  type="number"
                  value={editForm.points}
                  onChange={(e) => setEditForm({...editForm, points: parseInt(e.target.value)})}
                />
              </div>

              <div className="form-field">
                <label>Payment Method</label>
                <input
                  type="text"
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm({...editForm, paymentMethod: e.target.value})}
                />
              </div>

              <div className="form-field">
                <label>Payment Address</label>
                <input
                  type="text"
                  value={editForm.paymentAddress}
                  onChange={(e) => setEditForm({...editForm, paymentAddress: e.target.value})}
                />
              </div>

              <div className="form-field">
                <label>Pi Address</label>
                <input
                  type="text"
                  value={editForm.piaddress}
                  onChange={(e) => setEditForm({...editForm, piaddress: e.target.value})}
                />
              </div>

              <div className="switch-container">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={editForm.introSeen}
                    onChange={(e) => setEditForm({...editForm, introSeen: e.target.checked})}
                  />
                  <span className="slider"></span>
                </label>
                <span>Intro Seen</span>
              </div>

              <div className="switch-container">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={editForm.isUpload}
                    onChange={(e) => setEditForm({...editForm, isUpload: e.target.checked})}
                  />
                  <span className="slider"></span>
                </label>
                <span>Is Upload</span>
              </div>

              <div className="switch-container">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={editForm.istransaction}
                    onChange={(e) => setEditForm({...editForm, istransaction: e.target.checked})}
                  />
                  <span className="slider"></span>
                </label>
                <span>Is Transaction</span>
              </div>

              <div className="form-field">
                <label>Image URL</label>
                <input
                  type="text"
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm({...editForm, imageUrl: e.target.value})}
                />
              </div>

              <div className="form-field">
                <label>Saved Images (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.savedImages.join(',')}
                  onChange={(e) => setEditForm({...editForm, savedImages: e.target.value.split(',')})}
                />
              </div>

              <div className="form-field">
                <label>Pi Amount (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.piAmount.join(',')}
                  onChange={(e) => setEditForm({...editForm, piAmount: e.target.value.split(',').map(Number)})}
                />
              </div>

              <div className="form-field">
                <label>Final Pis (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.finalpis.join(',')}
                  onChange={(e) => setEditForm({...editForm, finalpis: e.target.value.split(',').map(Number)})}
                />
              </div>
            </div>

            <button 
              className="button full-width-button"
              onClick={handleUpdateUser}
            >
              Update User
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;

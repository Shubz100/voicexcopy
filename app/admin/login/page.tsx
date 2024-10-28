'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function AdminLogin() {
  const [token, setToken] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set the admin token cookie
    Cookies.set('admin_token', token, { expires: 7 }); // Expires in 7 days
    
    // Redirect to admin page
    router.push('/admin');
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <form onSubmit={handleSubmit}>
        <h1>Admin Login</h1>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter admin token"
          style={{ 
            width: '100%', 
            padding: '10px', 
            marginBottom: '10px' 
          }}
        />
        <button 
          type="submit"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface User {
  telegramId: number
  username: string
  piAmount: number[]
  transactionStatus: string[]
  paymentMethod: string[]
  paymentAddress: string[]
}

export default function AdminTransactions() {
  const [users, setUsers] = useState<User[]>([])
  const [adminKey, setAdminKey] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${adminKey}`
        }
      })
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setUsers(data.users)
        setIsAuthenticated(true)
      }
    } catch (err) {
      setError('Authentication failed. Please check your admin key.')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(telegramId: number, transactionIndex: number, newStatus: string) {
    try {
      const response = await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`
        },
        body: JSON.stringify({
          telegramId,
          transactionIndex,
          newStatus
        })
      })

      const data = await response.json()
      if (data.error) {
        setError(data.error)
      } else {
        // Update the local state with the new status
        setUsers(prevUsers => {
          return prevUsers.map(user => {
            if (user.telegramId === telegramId) {
              const newTransactionStatus = [...user.transactionStatus]
              newTransactionStatus[transactionIndex] = newStatus
              return { ...user, transactionStatus: newTransactionStatus }
            }
            return user
          })
        })
        toast.success('Transaction status updated successfully.')
      }
    } catch (err) {
      setError('Failed to update status')
      toast.error('Failed to update transaction status.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Admin Authentication</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="password"
                placeholder="Enter Admin Key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Group transactions by status
  const groupedTransactions: { [key: string]: User[] } = users.reduce((acc, user) => {
    user.transactionStatus.forEach((status, index) => {
      if (!acc[status]) {
        acc[status] = []
      }
      acc[status].push({
        telegramId: user.telegramId,
        username: user.username,
        piAmount: [user.piAmount[index]],
        transactionStatus: [status],
        paymentMethod: [user.paymentMethod[index]],
        paymentAddress: [user.paymentAddress[index]]
      })
    })
    return acc
  }, {} as { [key: string]: User[] })

  const statusCounts: { [key: string]: number } = Object.keys(groupedTransactions).reduce((acc, status) => {
    acc[status] = groupedTransactions[status].length
    return acc
  }, {})

  return (
    <div className="container">
      <div className="header">
        <h1>Transaction Management</h1>
        <button 
          className="logout-button"
          onClick={() => {
            setIsAuthenticated(false)
            setAdminKey('')
            setUsers([])
          }}
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="tabs">
        {['Pending', 'Completed', 'Failed'].map((status) => (
          <div
            key={status}
            className={`tab ${groupedTransactions[status]?.length ? 'active' : ''}`}
          >
            <span>{status}</span>
            <span className="tab-count">{statusCounts[status] || 0}</span>
          </div>
        ))}
      </div>

      <div className="transactions-grid">
        {['Pending', 'Completed', 'Failed'].map((status) => (
          <div key={status} className="transaction-section">
            <h2>{status} Transactions</h2>
            {groupedTransactions[status]?.map((user, index) => (
              <div key={`${user.telegramId}-${index}`} className="user-card">
                <h3>
                  {user.username ? `@${user.username}` : `User ${user.telegramId}`}
                </h3>
                <div className="transaction-item">
                  <div className="transaction-details">
                    <p><strong>Transaction #{index + 1}</strong></p>
                    <p><strong>Amount:</strong> {user.piAmount[0]} Pi</p>
                    <p><strong>Payment Method:</strong> {user.paymentMethod[0]}</p>
                    <p><strong>Payment Address:</strong> {user.paymentAddress[0]}</p>
                    <CopyToClipboard
                      text={user.paymentAddress[0]}
                      onCopy={() => toast.success('Payment address copied to clipboard')}
                    >
                      <button className="copy-button">
                        <i className="fas fa-copy"></i>
                      </button>
                    </CopyToClipboard>
                  </div>
                  <div className="status-selector">
                    <select
                      value={user.transactionStatus[0]}
                      onChange={(e) => updateStatus(user.telegramId, 0, e.target.value)}
                      className={user.transactionStatus[0]}
                    >
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <style jsx>{`
        .container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .logout-button {
          padding: 8px 16px;
          background-color: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .error-message {
          background-color: #fff3f3;
          color: #dc3545;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
          border: 1px solid #dc3545;
        }

        .tabs {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .tab {
          background-color: #f8f9fa;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin: 0 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #333;
        }

        .tab.active {
          background-color: #670773;
          color: white;
        }

        .tab-count {
          background-color: #d6d6d6;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 14px;
          margin-left: 8px;
        }

        .transactions-grid {
          display: grid;
          gap: 20px;
        }

        .transaction-section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .transaction-section h2 {
          margin-bottom: 15px;
          color: #333;
        }

        .user-card {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .user-card h3 {
          margin-bottom: 10px;
          color: #333;
        }

        .transaction-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: white;
          padding: 15px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .transaction-details {
          flex: 1;
          margin-right: 20px;
        }

        .transaction-details p {
          margin: 5px 0;
        }

        .status-selector select {
          width: 150px;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ddd;
          font-size: 14px;
        }

        .status-selector select.processing {
          background-color: #fff3cd;
        }

        .status-selector select.completed {
          background-color: #d4edda;
        }

        .status-selector select.failed {
          background-color: #f8d7da;
        }

        .copy-button {
          background-color: #670773;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .container {
            padding: 10px;
          }

          .header {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }

          .transaction-item {
            padding: 10px;
          }

          .transaction-details {
            margin-right: 10px;
          }

          .status-selector select {
            width: 120px;
          }
        }
      `}</style>
    </div>
  )
}

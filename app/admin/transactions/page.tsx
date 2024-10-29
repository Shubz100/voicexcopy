'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
            }
        } catch (err) {
            setError('Failed to update status')
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

            <div className="transactions-grid">
                {users.map((user) => (
                    <div key={user.telegramId} className="user-card">
                        <h2>
                            {user.username ? `@${user.username}` : `User ${user.telegramId}`}
                        </h2>
                        
                        {user.piAmount.map((amount, index) => (
                            <div key={index} className="transaction-item">
                                <div className="transaction-details">
                                    <p><strong>Transaction #{index + 1}</strong></p>
                                    <p><strong>Amount:</strong> {amount} Pi</p>
                                    <p><strong>Payment Method:</strong> {user.paymentMethod[index]}</p>
                                    <p><strong>Payment Address:</strong> {user.paymentAddress[index]}</p>
                                </div>
                                <div className="status-selector">
                                    <select
                                        value={user.transactionStatus[index]}
                                        onChange={(e) => updateStatus(user.telegramId, index, e.target.value)}
                                        className={user.transactionStatus[index]}
                                    >
                                        <option value="processing">Processing</option>
                                        <option value="completed">Completed</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <style jsx>{`
                .login-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background-color: #f5f5f5;
                    padding: 20px;
                }

                .login-card {
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    width: 100%;
                    max-width: 400px;
                }

                .login-card h1 {
                    text-align: center;
                    margin-bottom: 20px;
                    color: #333;
                }

                .form-group {
                    margin-bottom: 15px;
                }

                input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 16px;
                }

                .login-button {
                    width: 100%;
                    padding: 12px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                }

                .login-button:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                }

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

                .transactions-grid {
                    display: grid;
                    gap: 20px;
                }

                .user-card {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .user-card h2 {
                    margin-bottom: 15px;
                    color: #333;
                }

                .transaction-item {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                }

                .transaction-details {
                    margin-bottom: 10px;
                }

                .transaction-details p {
                    margin: 5px 0;
                }

                select {
                    width: 100%;
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                    font-size: 14px;
                }

                select.processing {
                    background-color: #fff3cd;
                }

                select.completed {
                    background-color: #d4edda;
                }

                select.failed {
                    background-color: #f8d7da;
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
                }
            `}</style>
        </div>
    )
}

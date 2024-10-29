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

interface TransactionGroup {
    [key: string]: User[];
}

export default function AdminTransactions() {
    const [users, setUsers] = useState<User[]>([])
    const [adminKey, setAdminKey] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [groupedTransactions, setGroupedTransactions] = useState<TransactionGroup>({
        pending: [],
        completed: [],
        failed: []
    })
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
                groupTransactions(data.users)
            }
        } catch (err) {
            setError('Authentication failed. Please check your admin key.')
        } finally {
            setLoading(false)
        }
    }

    function groupTransactions(users: User[]) {
        const grouped: TransactionGroup = {
            pending: [],
            completed: [],
            failed: []
        }

        users.forEach(user => {
            user.transactionStatus.forEach((status, index) => {
                const transaction = {
                    telegramId: user.telegramId,
                    username: user.username,
                    piAmount: user.piAmount[index],
                    transactionStatus: status,
                    paymentMethod: user.paymentMethod[index],
                    paymentAddress: user.paymentAddress[index]
                }

                if (status === 'processing') {
                    grouped.pending.push(transaction)
                } else if (status === 'completed') {
                    grouped.completed.push(transaction)
                } else if (status === 'failed') {
                    grouped.failed.push(transaction)
                }
            })
        })

        setGroupedTransactions(grouped)
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
                groupTransactions(prevUsers => prevUsers)
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
                        setGroupedTransactions({
                            pending: [],
                            completed: [],
                            failed: []
                        })
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
                <div className={`tab ${groupedTransactions.pending.length > 0 ? 'active' : ''}`}>
                    <h2>Pending ({groupedTransactions.pending.length})</h2>
                    {groupedTransactions.pending.length > 0 ? (
                        <div className="transactions-grid">
                            {groupedTransactions.pending.map((transaction, index) => (
                                <div key={`${transaction.telegramId}-${index}`} className="transaction-item">
                                    <div className="transaction-details">
                                        <p><strong>Transaction #{index + 1}</strong></p>
                                        <p><strong>Amount:</strong> {transaction.piAmount} Pi</p>
                                        <p><strong>Payment Method:</strong> {transaction.paymentMethod}</p>
                                        <p><strong>Payment Address:</strong> {transaction.paymentAddress}</p>
                                    </div>
                                    <div className="status-selector">
                                        <select
                                            value={transaction.transactionStatus}
                                            onChange={(e) => updateStatus(transaction.telegramId, index, e.target.value)}
                                            className={transaction.transactionStatus}
                                        >
                                            <option value="processing">Processing</option>
                                            <option value="completed">Completed</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-transactions">No pending transactions</div>
                    )}
                </div>
                <div className={`tab ${groupedTransactions.completed.length > 0 ? 'active' : ''}`}>
                    <h2>Completed ({groupedTransactions.completed.length})</h2>
                    {groupedTransactions.completed.length > 0 ? (
                        <div className="transactions-grid">
                            {groupedTransactions.completed.map((transaction, index) => (
                                <div key={`${transaction.telegramId}-${index}`} className="transaction-item">
                                    <div className="transaction-details">
                                        <p><strong>Transaction #{index + 1}</strong></p>
                                        <p><strong>Amount:</strong> {transaction.piAmount} Pi</p>
                                        <p><strong>Payment Method:</strong> {transaction.paymentMethod}</p>
                                        <p><strong>Payment Address:</strong> {transaction.paymentAddress}</p>
                                    </div>
                                    <div className="status-selector">
                                        <select
                                            value={transaction.transactionStatus}
                                            onChange={(e) => updateStatus(transaction.telegramId, index, e.target.value)}
                                            className={transaction.transactionStatus}
                                        >
                                            <option value="processing">Processing</option>
                                            <option value="completed">Completed</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-transactions">No completed transactions</div>
                    )}
                </div>
                <div className={`tab ${groupedTransactions.failed.length > 0 ? 'active' : ''}`}>
                    <h2>Failed ({groupedTransactions.failed.length})</h2>
                    {groupedTransactions.failed.length > 0 ? (
                        <div className="transactions-grid">
                            {groupedTransactions.failed.map((transaction, index) => (
                                <div key={`${transaction.telegramId}-${index}`} className="transaction-item">
                                    <div className="transaction-details">
                                        <p><strong>Transaction #{index + 1}</strong></p>
                                        <p><strong>Amount:</strong> {transaction.piAmount} Pi</p>
                                        <p><strong>Payment Method:</strong> {transaction.paymentMethod}</p>
                                        <p><strong>Payment Address:</strong> {transaction.paymentAddress}</p>
                                    </div>
                                    <div className="status-selector">
                                        <select
                                            value={transaction.transactionStatus}
                                            onChange={(e) => updateStatus(transaction.telegramId, index, e.target.value)}
                                            className={transaction.transactionStatus}
                                        >
                                            <option value="processing">Processing</option>
                                            <option value="completed">Completed</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-transactions">No failed transactions</div>
                    )}
                </div>
            </div>

            {loading && (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                </div>
            )}

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
                    margin: 0 10px;
                    transition: background-color 0.3s ease;
                }

                .tab.active {
                    background-color: #670773;
                    color: white;
                }

                .transactions-grid {
                    display: grid;
                    gap: 20px;
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

                .no-transactions {
                    text-align: center;
                    color: #666;
                    padding: 20px;
                }

                .loading-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(255, 255, 255, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .loading-spinner {
                    border: 4px solid rgba(103, 7, 115, 0.1);
                    border-left-color: #670773;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
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

                    .tabs {
                        flex-direction: column;
                        align-items: center;
                    }

                    .tab {
                        width: 100%;
                        margin: 5px 0;
                    }

                    .transaction-item {
                        padding: 10px;
                    }
                }
            `}</style>
        </div>
    )
}

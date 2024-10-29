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

interface Transaction {
    telegramId: number
    username: string
    amount: number
    status: string
    paymentMethod: string
    paymentAddress: string
    index: number
}

export default function AdminTransactions() {
    const [users, setUsers] = useState<User[]>([])
    const [adminKey, setAdminKey] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('pending')
    const router = useRouter()

    // Transform users data into transaction arrays
    const getAllTransactions = (): Transaction[] => {
        return users.flatMap(user =>
            user.piAmount.map((amount, index) => ({
                telegramId: user.telegramId,
                username: user.username,
                amount,
                status: user.transactionStatus[index],
                paymentMethod: user.paymentMethod[index],
                paymentAddress: user.paymentAddress[index],
                index
            }))
        )
    }

    const pendingTransactions = getAllTransactions().filter(t => t.status === 'processing')
    const completedTransactions = getAllTransactions().filter(t => t.status === 'completed')
    const failedTransactions = getAllTransactions().filter(t => t.status === 'failed')

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
                    newStatus,
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        alert(`Copied to clipboard: ${text}`)
    }

    const renderTransactionCard = (transaction: Transaction) => (
        <div key={`${transaction.telegramId}-${transaction.index}`} className="transaction-card">
            <div className="transaction-header">
                <h3>{transaction.username ? `@${transaction.username}` : `User ${transaction.telegramId}`}</h3>
                <div className="transaction-details">
                    <p><strong>Amount:</strong> {transaction.amount} Pi</p>
                    <p><strong>Payment Method:</strong> {transaction.paymentMethod}</p>
                    <p><strong>Payment Address:</strong> <span onClick={() => copyToClipboard(transaction.paymentAddress)} className="clickable">{transaction.paymentAddress}</span></p>
                </div>
            </div>
            <div className="status-selector">
                <select
                    value={transaction.status}
                    onChange={(e) => updateStatus(transaction.telegramId, transaction.index, e.target.value)}
                    className={transaction.status}
                >
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                </select>
            </div>
        </div>
    )

    if (!isAuthenticated) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <h1>Admin Authentication</h1>
                    {loading ? (
                        <div className="loading-spinner"></div>
                    ) : (
                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <input
                                    type="password"
                                    placeholder="Enter Admin Key"
                                    value={adminKey}
                                    onChange={(e) => setAdminKey(e.target.value)}
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
                            >
                                Login
                            </button>
                        </form>
                    )}
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

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending ({pendingTransactions.length})
                </button>
                <button
                    className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('completed')}
                >
                    Completed ({completedTransactions.length})
                </button>
                <button
                    className={`tab ${activeTab === 'failed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('failed')}
                >
                    Failed ({failedTransactions.length})
                </button>
            </div>

            <div className="transactions-grid">
                {activeTab === 'pending' && pendingTransactions.map(renderTransactionCard)}
                {activeTab === 'completed' && completedTransactions.map(renderTransactionCard)}
                {activeTab === 'failed' && failedTransactions.map(renderTransactionCard)}
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
                    display: flex;
                    flex-direction: column;
                    align-items: center;
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
                    transition: background-color 0.3s;
                }

                .login-button:hover {
                    background-color: #0056b3;
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
                    transition: background-color 0.3s;
                }

                .logout-button:hover {
                    background-color: #c82333;
                }

                .error-message {
                    background-color: #fff3f3;
                    color: #dc3545;
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                    border: 1px solid #dc3545;
                    animation: fade-in 0.5s ease-in-out;
                }

                @keyframes fade-in {
                    0% {
                        opacity: 0;
                    }
                    100% {
                        opacity: 1;
                    }
                }

                .tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }

                .tab {
                    padding: 5px 10px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    background-color: #f0f0f0;
                    color: #333;
                    font-weight: 500;
                    transition: background-color 0.3s, color 0.3s;
                }

                .tab.active {
                    background-color: #007bff;
                    color: white;
                }

                .tab:hover {
                    background-color: #e0e0e0;
                }

                .transactions-grid {
                    display: grid;
                    gap: 20px;
                    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                }

                .transaction-card {
                    background: #4d9aa1;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    animation: fade-in 0.5s ease-in-out;
                }

                .transaction-header {
                    margin-bottom: 10px;
                }

                .transaction-card h3 {
                    margin-bottom: 10px;
                    color: #333;
                }

                .transaction-details {
                    margin-bottom: 10px;
                }

                .transaction-details p {
                    margin: 5px 0;
                    display: flex;
                    align-items: center;
                }

                .clickable {
                    cursor: pointer;
                    color: #007bff;
                    transition: color 0.3s;
                }

                .clickable:hover {
                    color: #0056b3;
                }

                select {
                    width: 100%;
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                    font-size: 14px;
                    background-color: #f8f9fa;
                    color: #495057;
                    transition: background-color 0.3s, color 0.3s;
                }

                select.processing {
                    background-color: #fff3cd;
                    color: #856404;
                }

                select.completed {
                    background-color: #d4edda;
                    color: #155724;
                }

                select.failed {
                    background-color: #f8d7da;
                    color: #721c24;
                }

                .loading-spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #007bff;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    animation: spin 2s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
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
                        flex-wrap: wrap;
                    }

                    .transactions-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    )
}

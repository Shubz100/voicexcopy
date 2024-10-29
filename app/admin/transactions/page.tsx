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
    const [activeTab, setActiveTab] = useState('pending')
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
                    'Authorization': `Bearer ${adminKey}`  // Include the adminKey in the headers
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
            }
        } catch (err) {
            setError('Failed to update status')
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="login-container">
                {/* Login form */}
            </div>
        )
    }

    const pendingTransactions = users.filter(user => user.transactionStatus.some(status => status === 'processing'))
    const completedTransactions = users.filter(user => user.transactionStatus.some(status => status === 'completed'))
    const failedTransactions = users.filter(user => user.transactionStatus.some(status => status === 'failed'))

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
                    className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending ({pendingTransactions.length})
                </button>
                <button
                    className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('completed')}
                >
                    Completed ({completedTransactions.length})
                </button>
                <button
                    className={`tab-button ${activeTab === 'failed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('failed')}
                >
                    Failed ({failedTransactions.length})
                </button>
            </div>

            <div className="transactions-grid">
                {activeTab === 'pending' && pendingTransactions.map((user) => (
                    <UserCard key={user.telegramId} user={user} onUpdateStatus={updateStatus} />
                ))}
                {activeTab === 'completed' && completedTransactions.map((user) => (
                    <UserCard key={user.telegramId} user={user} onUpdateStatus={updateStatus} />
                ))}
                {activeTab === 'failed' && failedTransactions.map((user) => (
                    <UserCard key={user.telegramId} user={user} onUpdateStatus={updateStatus} />
                ))}
            </div>
        </div>
    )
}

interface UserCardProps {
    user: User
    onUpdateStatus: (telegramId: number, transactionIndex: number, newStatus: string) => void
}

const UserCard = ({ user, onUpdateStatus }: UserCardProps) => {
    return (
        <div className="user-card">
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
                            onChange={(e) => onUpdateStatus(user.telegramId, index, e.target.value)}
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
    )
}

const LoadingIndicator = () => {
    return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
        </div>
    )
}

const ErrorMessage = ({ message }: { message: string }) => {
    return (
        <div className="error-message">
            {message}
        </div>
    )
}

<style jsx>{`
    /* ... existing styles ... */

    .tabs {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
    }

    .tab-button {
        padding: 10px 20px;
        background-color: #f8f9fa;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.3s;
    }

    .tab-button.active {
        background-color: #670773;
        color: white;
    }

    .tab-button:hover:not(.active) {
        background-color: #e9ecef;
    }

    .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 200px;
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
        .tabs {
            flex-wrap: wrap;
            gap: 10px;
        }

        .tab-button {
            flex-grow: 1;
        }
    }
`}</style>

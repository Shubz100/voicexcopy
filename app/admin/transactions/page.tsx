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
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const router = useRouter()

    useEffect(() => {
        fetchUsers()
    }, [])

    async function fetchUsers() {
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
            }
        } catch (err) {
            setError('Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }

    async function updateStatus(telegramId: number, transactionIndex: number, newStatus: string) {
        try {
            const response = await fetch('/api/admin/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    telegramId,
                    transactionIndex,
                    newStatus,
                    adminKey
                })
            })

            const data = await response.json()
            if (data.error) {
                setError(data.error)
            } else {
                // Refresh the users list
                await fetchUsers()
            }
        } catch (err) {
            setError('Failed to update status')
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>
    }

    return (
        <div className="container mx-auto p-4">
            <div className="mb-4">
                <input
                    type="password"
                    placeholder="Admin Key"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="border p-2 rounded"
                />
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="grid gap-4">
                {users.map((user) => (
                    <div key={user.telegramId} className="border rounded p-4">
                        <h2 className="text-xl font-bold mb-2">
                            {user.username ? `@${user.username}` : `User ${user.telegramId}`}
                        </h2>
                        
                        {user.piAmount.map((amount, index) => (
                            <div key={index} className="mb-4 p-2 bg-gray-50 rounded">
                                <p>Transaction #{index + 1}</p>
                                <p>Amount: {amount} Pi</p>
                                <p>Payment Method: {user.paymentMethod[index]}</p>
                                <p>Payment Address: {user.paymentAddress[index]}</p>
                                <div className="mt-2">
                                    <select
                                        value={user.transactionStatus[index]}
                                        onChange={(e) => updateStatus(user.telegramId, index, e.target.value)}
                                        className={`p-2 rounded ${
                                            user.transactionStatus[index] === 'processing' ? 'bg-yellow-100' :
                                            user.transactionStatus[index] === 'completed' ? 'bg-green-100' :
                                            user.transactionStatus[index] === 'failed' ? 'bg-red-100' : ''
                                        }`}
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
        </div>
    )
}

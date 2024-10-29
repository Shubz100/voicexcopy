'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './page.css';

interface User {
    telegramId: number;
    username: string;
    piAmount: number[];
    transactionStatus: string[];
    paymentMethod: string[];
    paymentAddress: string[];
}

export default function AdminTransactions() {
    const [users, setUsers] = useState<User[]>([]);
    const [adminKey, setAdminKey] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (adminKey) {
            fetchTransactions();
        }
    }, [adminKey]);

    const fetchTransactions = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${adminKey}`
                }
            });
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError('Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    const pendingTransactions = users.filter(user => user.transactionStatus.includes('Pending'));
    const completedTransactions = users.filter(user => user.transactionStatus.includes('Completed'));
    const failedTransactions = users.filter(user => user.transactionStatus.includes('Failed'));

    return (
        <div className="container">
            <h1 className="title">Admin Transactions</h1>
            {error && <p className="error">{error}</p>}
            {loading && <p className="loading">Loading...</p>}
            
            <section className="section">
                <h2 className="section-title pending">Pending Transactions</h2>
                {pendingTransactions.length > 0 ? (
                    pendingTransactions.map(user => (
                        <div key={user.telegramId} className="card">
                            <p><strong>Username:</strong> {user.username}</p>
                            <p><strong>Amount:</strong> {user.piAmount.join(', ')}</p>
                            <p><strong>Payment Method:</strong> {user.paymentMethod.join(', ')}</p>
                            <p><strong>Address:</strong> {user.paymentAddress.join(', ')}</p>
                        </div>
                    ))
                ) : (
                    <p>No pending transactions</p>
                )}
            </section>

            <section className="section">
                <h2 className="section-title completed">Completed Transactions</h2>
                {completedTransactions.length > 0 ? (
                    completedTransactions.map(user => (
                        <div key={user.telegramId} className="card">
                            <p><strong>Username:</strong> {user.username}</p>
                            <p><strong>Amount:</strong> {user.piAmount.join(', ')}</p>
                            <p><strong>Payment Method:</strong> {user.paymentMethod.join(', ')}</p>
                            <p><strong>Address:</strong> {user.paymentAddress.join(', ')}</p>
                        </div>
                    ))
                ) : (
                    <p>No completed transactions</p>
                )}
            </section>

            <section className="section">
                <h2 className="section-title failed">Failed Transactions</h2>
                {failedTransactions.length > 0 ? (
                    failedTransactions.map(user => (
                        <div key={user.telegramId} className="card">
                            <p><strong>Username:</strong> {user.username}</p>
                            <p><strong>Amount:</strong> {user.piAmount.join(', ')}</p>
                            <p><strong>Payment Method:</strong> {user.paymentMethod.join(', ')}</p>
                            <p><strong>Address:</strong> {user.paymentAddress.join(', ')}</p>
                        </div>
                    ))
                ) : (
                    <p>No failed transactions</p>
                )}
            </section>
        </div>
    );
}

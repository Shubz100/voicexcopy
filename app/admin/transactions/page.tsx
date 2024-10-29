'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
        <div style={styles.container}>
            <h1 style={styles.title}>Admin Transactions</h1>
            {error && <p style={styles.error}>{error}</p>}
            {loading && <p style={styles.loading}>Loading...</p>}
            
            <section style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, color: '#FFA500' }}>Pending Transactions</h2>
                {pendingTransactions.length > 0 ? (
                    pendingTransactions.map(user => (
                        <div key={user.telegramId} style={styles.card}>
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

            <section style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, color: '#28A745' }}>Completed Transactions</h2>
                {completedTransactions.length > 0 ? (
                    completedTransactions.map(user => (
                        <div key={user.telegramId} style={styles.card}>
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

            <section style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, color: '#DC3545' }}>Failed Transactions</h2>
                {failedTransactions.length > 0 ? (
                    failedTransactions.map(user => (
                        <div key={user.telegramId} style={styles.card}>
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

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
    },
    title: {
        fontSize: '2em',
        textAlign: 'center',
        marginBottom: '20px',
    },
    error: {
        color: 'red',
        textAlign: 'center',
    },
    loading: {
        textAlign: 'center',
        fontStyle: 'italic',
    },
    section: {
        marginTop: '20px',
    },
    sectionTitle: {
        fontSize: '1.5em',
        marginBottom: '10px',
    },
    card: {
        border: '1px solid #ccc',
        borderRadius: '5px',
        padding: '10px',
        marginBottom: '10px',
        backgroundColor: '#f9f9f9',
    },
};

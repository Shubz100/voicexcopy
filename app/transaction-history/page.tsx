'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WebApp } from '@twa-dev/types'
import Script from 'next/script'

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

interface Transaction {
  piAmount: number
  paymentMethod: string
  paymentAddress: string
  status: string // 'processing' | 'completed' | 'failed'
  piAddress: string
}

interface User {
  piAmount: number[]
  paymentMethod: string[]
  paymentAddress: string[]
  transactionStatus: string[] // Array of status values
  piaddress: string[]
  level: number
  points: number
  totalPiSold: number
  xp: number
}

export default function TransactionHistory() {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()

      const initDataUnsafe = tg.initDataUnsafe || {}

      if (initDataUnsafe.user) {
        fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(initDataUnsafe.user),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              setError(data.error)
            } else {
              setUser(data)
            }
          })
          .catch((err) => {
            setError('Failed to fetch user data')
          })
          .finally(() => {
            setLoading(false)
          })
      } else {
        setError('No user data available')
        setLoading(false)
      }
    } else {
      setError('This App Should Be Opened On Telegram')
      setLoading(false)
    }
  }, [])

  // Helper function to get status display information
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return {
          color: 'text-yellow-500',
          icon: 'fas fa-spinner fa-spin',
          text: 'Processing'
        }
      case 'completed':
        return {
          color: 'text-green-500',
          icon: 'fas fa-check-circle',
          text: 'Completed'
        }
      case 'failed':
        return {
          color: 'text-red-500',
          icon: 'fas fa-times-circle',
          text: 'Failed'
        }
      default:
        return {
          color: 'text-gray-500',
          icon: 'fas fa-question-circle',
          text: 'Unknown'
        }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-screen">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500 flex items-center justify-center h-screen fade-in">
        {error}
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-screen">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  // Create transaction array by combining data
  const transactions = user.piAmount.map((amount, index) => ({
    piAmount: amount,
    paymentMethod: user.paymentMethod[index] || '',
    paymentAddress: user.paymentAddress[index] || '',
    status: user.transactionStatus[index] || 'processing',
    piAddress: user.piaddress[index] || ''
  }))

  return (
    <div className={`bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen ${mounted ? 'fade-in' : ''}`}>
      <Script src="https://kit.fontawesome.com/18e66d329f.js"/>
      
      {/* Header */}
      <div className="w-full custom-purple text-white p-4 flex items-center justify-between shadow-lg slide-down">
        <Link href="/">
          <button className="focus:outline-none hover-scale">
            <i className="fas fa-arrow-left text-2xl"></i>
          </button>
        </Link>
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <div></div>
      </div>

      {/* User Stats Section */}
      <div className="container mx-auto p-4 mb-4">
        <div className="bg-white rounded-lg shadow-lg p-4 space-y-2 fade-in-up">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Level:</span>
            <span className="font-bold custom-purple-text">{user.level}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Pi Sold:</span>
            <span className="font-bold custom-purple-text">{user.totalPiSold} Pi</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Points:</span>
            <span className="font-bold custom-purple-text">{user.points}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">XP:</span>
            <span className="font-bold custom-purple-text">{user.xp}</span>
          </div>
        </div>
      </div>

      {/* Transaction Cards */}
      <div className="container mx-auto p-4 space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center text-gray-500 mt-8 fade-in-up">
            No transactions yet
          </div>
        ) : (
          [...transactions].reverse().map((transaction, index) => {
            const statusInfo = getStatusInfo(transaction.status)
            
            return (
              <div 
                key={index}
                className="bg-white rounded-lg shadow-lg p-6 space-y-3 fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pi Amount Sold:</span>
                  <span className="font-bold custom-purple-text">{transaction.piAmount} Pi</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount to Receive:</span>
                  <span className="font-bold custom-purple-text">
                    ${(transaction.piAmount * 0.65).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">{transaction.paymentMethod}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Address:</span>
                  <span className="font-medium break-all">{transaction.paymentAddress}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pi Wallet Address:</span>
                  <span className="font-medium break-all">{transaction.piAddress}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${statusInfo.color} flex items-center gap-2`}>
                    <i className={statusInfo.icon}></i>
                    {statusInfo.text}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <style jsx>{`
        .custom-purple {
          background-color: #670773;
        }
        .custom-purple-text {
          color: #670773;
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
        .fade-in {
          opacity: 0;
          animation: fadeIn 0.5s ease-out forwards;
        }
        .fade-in-up {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .slide-down {
          transform: translateY(-100%);
          animation: slideDown 0.5s ease-out forwards;
        }
        .hover-scale {
          transition: transform 0.2s ease-out;
        }
        .hover-scale:hover {
          transform: scale(1.05);
        }
        .hover-scale:active {
          transform: scale(0.95);
        }
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

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
  istransaction: boolean
}

interface User {
  piAmount: number[]
  paymentMethod: string
  paymentAddress: string
  istransaction: boolean
  level: number
  baseprice: number
}

const getLevelBonus = (level: number): number => {
  switch (level) {
    case 1: return 0
    case 2: return 0.01
    case 3: return 0.03
    case 4: return 0.05
    case 5: return 0.07
    case 6: return 0.10
    default: return 0
  }
}

const getPaymentMethodBonus = (method: string): number => {
  switch (method?.toLowerCase()) {
    case 'paypal': return 0.28
    case 'google pay': return 0.25
    case 'apple pay': return 0.15
    case '2766': return 0
    default: return 0
  }
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

      {/* Transaction Cards */}
      <div className="container mx-auto p-4 space-y-4">
        {user.piAmount.length === 0 ? (
          <div className="text-center text-gray-500 mt-8 fade-in-up">
            No transactions yet
          </div>
        ) : (
          [...user.piAmount].reverse().map((amount, index) => {
            const realIndex = user.piAmount.length - 1 - index
            return (
              <div 
                key={index}
                className="bg-white rounded-lg shadow-lg p-6 space-y-3 fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pi Amount Sold:</span>
                  <span className="font-bold custom-purple-text">{amount} Pi</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount to Receive:</span>
                  <span className="font-bold custom-purple-text">
                    ${(amount * (user.baseprice + getLevelBonus(user.level) + getPaymentMethodBonus(user.paymentMethod))).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">{user.paymentMethod}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Address:</span>
                  <span className="font-medium break-all">{user.paymentAddress}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${user.istransaction ? 'text-yellow-500' : 'text-green-500'}`}>
                    {user.istransaction ? 'Processing' : 'Completed'}
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

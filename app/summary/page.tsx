'use client'

import { useEffect, useState } from 'react'
import { WebApp } from '@twa-dev/types'
import Script from 'next/script'
import Link from 'next/link'

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

interface UserData {
  piAmount: number[]
  paymentMethod: string[]
  paymentAddress: string[]
  piaddress: string[]
  baseprice: number
  level: number
}

const getPaymentBonus = (paymentMethod: string): number => {
  switch (paymentMethod.toLowerCase()) {
    case 'paypal':
      return 0.28
    case 'googlepay':
      return 0.25
    case 'applepay':
      return 0.15
    case 'mastercard':
      return 0.25
    default:
      return 0
  }
}

const getLevelBonus = (level: number): number => {
  switch (level) {
    case 2:
      return 0.01
    case 3:
      return 0.03
    case 4:
      return 0.05
    case 5:
      return 0.07
    case 6:
      return 0.01
    default:
      return 0
  }
}

export default function Summary() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
              setUserData(data)
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
      <div className="container mx-auto p-4 text-red-500 flex items-center justify-center h-screen">
        {error}
      </div>
    )
  }

  const latestPiAmount = userData?.piAmount[userData.piAmount.length - 1] || 0
  const latestPaymentMethod = userData?.paymentMethod[userData.paymentMethod.length - 1] || ''
  const latestPaymentAddress = userData?.paymentAddress[userData.paymentAddress.length - 1] || ''
  const latestPiAddress = userData?.piaddress[userData.piaddress.length - 1] || ''
  
  const paymentBonus = getPaymentBonus(latestPaymentMethod)
  const levelBonus = getLevelBonus(userData?.level || 1)
  const basePrice = userData?.baseprice || 0.15
  
  const pricePerPi = basePrice + paymentBonus + levelBonus
  const amountToReceive = latestPiAmount * pricePerPi

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Script src="https://kit.fontawesome.com/18e66d329f.js" />
      
      {/* Header */}
      <div className="w-full bg-[#670773] text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold text-center">Pi Trader Official</h1>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 flex flex-col items-center text-center">
        {/* Verification Icon */}
        <div className="w-32 h-32 mb-8 text-[#670773] animate-scale-in">
          <div className="relative">
            <i className="fas fa-circle text-[#670773] text-8xl"></i>
            <i className="fas fa-check absolute text-white text-5xl" style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}></i>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-[#670773] mb-6">Transaction Summary</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Amount of Pi Sold:</span>
              <span className="font-semibold text-[#670773]">{latestPiAmount} Pi</span>
            </div>
            
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Price per Pi:</span>
              <span className="font-semibold text-[#670773]">${pricePerPi.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Amount to be Received:</span>
              <span className="font-semibold text-[#670773]">${amountToReceive.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-semibold text-[#670773]">{latestPaymentMethod || 'N/A'}</span>
            </div>
            
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Payment Address:</span>
              <span className="font-semibold text-[#670773] break-all text-sm">
                {latestPaymentAddress || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Pi Wallet Address:</span>
              <span className="font-semibold text-[#670773] break-all text-sm">
                {latestPiAddress || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Processing Message */}
        <div className="mt-8 text-center space-y-2 animate-slide-up">
          <p className="text-gray-600">
            The payment process may take 5-8hrs. Wait patiently
          </p>
          <p className="text-gray-600">
            You can check transaction status in menu &gt; Transaction History
          </p>
        </div>

        {/* Back to Home Button */}
        <Link href="/">
          <button className="bg-[#670773] text-white text-xl font-bold py-3 px-12 rounded-full mt-8 shadow-lg hover-scale animate-fade-in">
            Back to Home
          </button>
        </Link>
      </div>

      <style jsx>{`
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
        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-up {
          0% {
            opacity: 0;
            transform: translateY(40px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards 0.3s;
          opacity: 0;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards 0.6s;
          opacity: 0;
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
      `}</style>
    </div>
  )
}

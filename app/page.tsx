'use client'

import { useEffect, useState } from 'react'
import { WebApp } from '@twa-dev/types'
import Script from 'next/script'
import Link from 'next/link'
import IntroPage from './components/IntroPage'

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  const handleMenuItemClick = (item: string) => {
    if (item === 'Live Support') {
      window.location.href = '/LiveSupport.html'
    } else if (item === 'Home') {
      window.location.href = '/'
    } else if (item === 'Transaction History') {
      window.location.href = './transaction-history'
    } else if (item === 'Profile') {
      window.location.href = './profile'
    } else if (item === 'Invite & Earn') {
      window.location.href = './invite'
    } else if (item === 'Admin') {
      window.location.href = './admin/transactions'
    }
    setMenuOpen(false)
  }

  const handleBuyPi = () => {
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
  }

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
              setShowIntro(!data.introSeen)
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="bg-white p-4 rounded-lg shadow-lg text-red-500 text-center">
          {error}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (showIntro) {
    return <IntroPage telegramId={user.telegramId} />
  }

  return (
    <div className="h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <Script src="https://kit.fontawesome.com/18e66d329f.js"/>
      
      {/* Header */}
      <div className="w-full bg-[#670773] text-white p-3 shadow-lg flex items-center justify-between relative z-10">
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="hover:scale-110 transition-transform"
        >
          <i className="fas fa-bars text-xl"></i>
        </button>
        <h1 className="text-xl font-bold">Pi Trader Official</h1>
        <div className="w-8"></div>
      </div>

      {/* Notification */}
      {showNotification && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-[#670773] text-white px-4 py-2 rounded-lg shadow-lg z-50">
          This feature will be available soon
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 py-3 space-y-3">
        <div className="bg-white rounded-lg p-3 shadow-md text-center">
          <p className="text-[#670773] text-sm">
            Pi Coin has not launched. This is the premarket price set by our team and does not represent Official data
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md text-center">
          <h2 className="text-4xl font-bold text-[#670773]">
            $0.65/Pi
          </h2>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-48 h-48">
            <img 
              src="/api/placeholder/400/320" 
              alt="Pi Coin" 
              className="w-full h-full object-cover rounded-full shadow-xl"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pb-4">
          <Link href="/PaymentMethods" className="w-full">
            <button className="w-full bg-[#670773] text-white text-lg font-bold py-3 px-6 rounded-full shadow-lg hover:bg-[#7a1b86] transition-colors">
              Sell Your Pi
            </button>
          </Link>
          <button 
            onClick={handleBuyPi}
            className="w-full bg-white text-[#670773] text-lg font-bold py-3 px-6 rounded-full shadow-lg border-2 border-[#670773] hover:bg-[#670773] hover:text-white transition-colors"
          >
            Buy Pi
          </button>
        </div>
      </div>

      {/* Sliding Menu */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-[#670773] text-white shadow-2xl transform transition-transform duration-300 z-50 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-white/20">
          <button 
            onClick={() => setMenuOpen(false)} 
            className="absolute top-4 right-4 text-white hover:scale-110 transition-transform"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
          <h2 className="text-lg font-bold mt-6">Menu</h2>
        </div>
        <nav className="mt-2">
          <ul>
            {['Home', 'Transaction History', 'Live Support', 'Profile', 'Invite & Earn', 'Admin'].map((item, index) => (
              <li key={index}>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault()
                    handleMenuItemClick(item)
                  }}
                  className="block py-3 px-6 hover:bg-white/10 transition-colors duration-300"
                >
                  <i className={`fas fa-${
                    item === 'Home' ? 'home' :
                    item === 'Transaction History' ? 'history' :
                    item === 'Live Support' ? 'headset' :
                    item === 'Profile' ? 'user' :
                    item === 'Invite & Earn' ? 'gift' :
                    'tools'
                  } mr-3`}></i>
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </nav>
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
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

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

  const handleMenuItemClick = (item: string) => {
    if (item === 'Live Support') {
      window.location.href = '/LiveSupport.html'
    } else if (item === 'Home') {
      // Stay on the current page or refresh
      window.location.href = '/'
    } else if (item === 'Transaction History') {
      // Add your transaction history route here
      window.location.href = './transaction-history'
    } else if (item === 'Profile') {
      window.location.href = './profile'
      else if (item === 'Invite & Earn') {
      window.location.href = './invite'
    } else if (item === 'Admin') {
      window.location.href = './admin/transactions'
    }
    setMenuOpen(false)
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

  if (showIntro) {
    return <IntroPage telegramId={user.telegramId} />
  }

  return (
    <div className={`bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-between min-h-screen relative overflow-hidden ${mounted ? 'fade-in' : ''}`}>
      <Script src="https://kit.fontawesome.com/18e66d329f.js"/>
      
      <div className="w-full custom-purple text-white p-4 flex items-center justify-between shadow-lg slide-down">
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="focus:outline-none hover-scale"
        >
          <i className="fas fa-bars text-2xl"></i>
        </button>
        <h1 className="text-2xl font-bold">Pi Trader Official</h1>
        <div></div>
      </div>

      <div className="text-center mt-8 px-4 fade-in-up">
        <p className="custom-purple-text text-lg font-medium bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          Pi Coin has not launched. This is the premarket price set by our team and does not represent Official data
        </p>
        <h2 className="text-5xl font-bold mt-8 custom-purple-text price-animate">
          $0.65/Pi
        </h2>
      </div>

      <div className="flex justify-center mt-8 scale-in">
        <div className="relative w-64 h-64 custom-purple rounded-full shadow-2xl overflow-hidden hover-glow">
          <img 
            src="/api/placeholder/400/320" 
            alt="Pi Coin" 
            className="w-full h-full object-cover"
            width="256"
            height="256"
          />
        </div>
      </div>

      <div className="w-full flex flex-col items-center mb-12 slide-up">
        <Link href="/PaymentMethods">
          <button className="custom-purple text-white text-2xl font-bold py-4 px-16 rounded-full mt-8 shadow-lg hover-scale">
            Sell Your Pi
          </button>
        </Link>
        <p className="mt-6 text-lg font-medium custom-purple-text fade-in">
          Your current points: {user.points}
        </p>
      </div>

      <div className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-purple-900 to-purple-700 text-white shadow-2xl transform transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button 
          onClick={() => setMenuOpen(false)} 
          className="absolute top-4 right-4 text-white focus:outline-none hover-scale"
        >
          <i className="fas fa-times text-2xl"></i>
        </button>
        <nav className="mt-16">
          <ul className="menu-items">
            {['Home', 'Transaction History', 'Live Support', 'Profile', 'Invite & Earn', 'Admin'].map((item, index) => (
              <li key={index} style={{animationDelay: `${index * 0.1}s`}}>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault()
                    handleMenuItemClick(item)
                  }}
                  className="block py-3 px-6 hover:bg-white/10 transition-colors duration-300"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </nav>
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
        .slide-up {
          opacity: 0;
          transform: translateY(50px);
          animation: slideUp 0.5s ease-out forwards;
        }
        .scale-in {
          opacity: 0;
          transform: scale(0.8);
          animation: scaleIn 0.5s ease-out forwards;
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
        .hover-glow {
          transition: box-shadow 0.3s ease-out;
        }
        .hover-glow:hover {
          box-shadow: 0 0 20px rgba(103, 7, 115, 0.3);
        }
        .price-animate {
          animation: pulseScale 2s infinite;
        }
        .menu-items li {
          opacity: 0;
          transform: translateX(-20px);
          animation: slideInRight 0.3s ease-out forwards;
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
        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulseScale {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        @keyframes slideInRight {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}

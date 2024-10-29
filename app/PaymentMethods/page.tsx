'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import './payment.css';

interface PaymentMethod {
  id: string;
  label: string;
  placeholder: string;
  image: string;
  badge?: string;
}

const PaymentOptions: React.FC = () => {
  const router = useRouter();
  const [visibleInput, setVisibleInput] = useState<string | null>(null);
  const [isContinueLoading, setIsContinueLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [paymentAddress, setPaymentAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<{
    methods: string[];
    addresses: string[];
  }>({ methods: [], addresses: [] });

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'paypal',
      label: 'PayPal',
      placeholder: 'Enter PayPal address',
      image: 'https://storage.googleapis.com/a1aa/image/LM00lHy4e4VEfEwshfXBUMcJYM0B328inIsGRj7TYfhafrHdC.jpg',
    },
    {
      id: 'googlepay',
      label: 'Google Pay',
      placeholder: 'Enter Google Pay address',
      image: 'https://storage.googleapis.com/a1aa/image/SvKY98RDkvYhENmLE9Ukt5u94yGsWNixkJM5U691UbdeveoTA.jpg',
    },
    {
      id: 'applepay',
      label: 'Apple Pay',
      placeholder: 'Enter Apple Pay address',
      image: 'https://storage.googleapis.com/a1aa/image/YqpCh7xg0Ab9N17SKmdPm6cBYfCqsSwebOnsx553IeS1f1jOB.jpg',
      badge: 'High Rate'
    },
    {
      id: 'mastercard',
      label: '•••• 2766',
      placeholder: 'Enter Mastercard details',
      image: 'https://storage.googleapis.com/a1aa/image/XBvmqXf3efCHMIrLcbgQfNciUh1kUfjmogYgjIg8xeoIeveoTA.jpg',
    },
  ];

  useEffect(() => {
    setMounted(true);
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      const webAppUser = tg.initDataUnsafe?.user;
      if (webAppUser) {
        setTelegramId(webAppUser.id);
        fetchPaymentData(webAppUser.id);
      }
    }
  }, []);

  const fetchPaymentData = async (userId: number) => {
    try {
      const response = await fetch(`/api/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      });
      const userData = await response.json();
      
      if (userData.paymentMethod?.length > 0 && userData.paymentAddress?.length > 0) {
        setPaymentHistory({
          methods: userData.paymentMethod,
          addresses: userData.paymentAddress
        });
        // Set the most recent payment method and address
        setSelectedPayment(userData.paymentMethod[userData.paymentMethod.length - 1]);
        setPaymentAddress(userData.paymentAddress[userData.paymentAddress.length - 1]);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
    }
  };
  
  const handleBack = () => {
    router.push('/');
  };

  const toggleInput = (id: string) => {
    if (!isConnected) {
      setVisibleInput(prev => prev === id ? null : id);
      setSelectedPayment(id);
      setPaymentAddress('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentAddress(e.target.value);
  };

  const handleConnectPayment = async () => {
    if (isLoading || !telegramId) return;
    
    setIsLoading(true);
    
    try {
      if (!isConnected) {
        const response = await fetch('/api/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId,
            paymentMethod: selectedPayment,
            paymentAddress
          })
        });
        const data = await response.json();
        if (data.success) {
          setPaymentHistory({
            methods: [...paymentHistory.methods, selectedPayment!],
            addresses: [...paymentHistory.addresses, paymentAddress]
          });
          setIsConnected(true);
        }
      } else {
        const response = await fetch('/api/payment', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId })
        });
        const data = await response.json();
        if (data.success) {
          setIsConnected(false);
          setSelectedPayment(null);
          setPaymentAddress('');
          setVisibleInput(null);
          setPaymentHistory({ methods: [], addresses: [] });
        }
      }
    } catch (error) {
      console.error('Error managing payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
  if (!telegramId || !selectedPayment || !paymentAddress || isContinueLoading) return;
  
  setIsContinueLoading(true);
  try {
    const response = await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId,
        paymentMethod: selectedPayment,
        paymentAddress
      })
    });
    
    const data = await response.json();
    if (data.success) {
      setPaymentHistory({
        methods: [...paymentHistory.methods, selectedPayment],
        addresses: [...paymentHistory.addresses, paymentAddress]
      });
      router.push('/paymentproof');
    }
  } catch (error) {
    console.error('Error saving payment details:', error);
  } finally {
    setIsContinueLoading(false);
  }
};

  const isValidPaymentAddress = paymentAddress.length > 0;
  const canConnect = selectedPayment && isValidPaymentAddress && !isConnected;
  const canContinue = isConnected;

  return (
    <div className={`payment-container bg-gradient-to-b from-gray-50 to-gray-100 ${mounted ? 'fade-in' : ''}`}>
      <Script src="https://kit.fontawesome.com/18e66d329f.js" />
      
      <div className="custom-purple text-white p-4 flex items-center justify-between shadow-lg slide-down">
        <i 
          className="fas fa-arrow-left header-icon clickable" 
          onClick={handleBack}
        ></i>
        <h1 className="text-2xl font-bold">Pi Trader Official</h1>
        <div></div>
      </div>

      <div className="payment-content">
        <div className="payment-header">
          <h2 className="text-xl font-semibold custom-purple-text mb-4 fade-in-up">Select Payment Method</h2>
        </div>

        <div className="payment-methods-list">
          {paymentMethods.map(({ id, label, placeholder, image, badge }, index) => (
            <div key={id} className="payment-method-wrapper" style={{animationDelay: `${index * 0.1}s`}}>
              <div
                className={`payment-method-box ${
                  isConnected && selectedPayment === id
                    ? 'payment-method-connected'
                    : isConnected
                    ? 'payment-method-disabled'
                    : ''
                }`}
                onClick={() => toggleInput(id)}
              >
                <div className="payment-method-info">
                  <img alt={`${label} logo`} className="payment-method-image" src={image} />
                  <div className="payment-method-details">
                    <span className="payment-method-label">{label}</span>
                    {badge && <span className="payment-method-badge">{badge}</span>}
                  </div>
                </div>
                <span className={`payment-status ${
                  isConnected && selectedPayment === id ? 'status-connected' : ''
                }`}>
                  {isConnected && selectedPayment === id ? 'Connected' : 'Select'}
                </span>
              </div>

              {visibleInput === id && !isConnected && (
                <div className="payment-input-container fade-in">
                  <input
                    type="text"
                    placeholder={placeholder}
                    className="payment-input"
                    value={paymentAddress}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="connect-button-container slide-up">
          <button
            className={`connect-button ${
              (canConnect || isConnected) ? 'button-active' : 'button-disabled'
            } ${isLoading ? 'button-loading' : ''}`}
            onClick={handleConnectPayment}
            disabled={(!canConnect && !isConnected) || isLoading}
          >
            {isLoading ? 'Processing...' : (isConnected ? 'Disconnect Payment Method' : 'Connect Payment Method')}
          </button>
        </div>
      </div>

      <div className="bottom-buttons slide-up">
        <button 
          className="cancel-button"
          onClick={handleBack}
        >
          Cancel
        </button>
        <button
  className={`continue-button ${canContinue ? 'button-active' : 'button-disabled'}`}
  onClick={handleContinue}
  disabled={!canContinue || isContinueLoading}
>
  {isContinueLoading ? 'Processing...' : 'Continue'}
</button>
      </div>
    </div>
  );
};

export default PaymentOptions;

'use client'

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

const paymentMethods = [
  {
    id: 'paypal',
    label: 'Binance',
    bonus: 0.28,
    placeholder: 'Enter Binance UID',
    image: 'https://i.imgur.com/iM5K2ey.jpg',
    badge: 'High Rate'
  },
  {
    id: 'googlepay',
    label: 'Trust Wallet',
    bonus: 0.25,
    placeholder: 'Enter USDT TRC-20 Address',
    image: 'https://i.imgur.com/fZI0OD2.jpg',
  },
  {
    id: 'applepay',
    label: 'KuCoin',
    bonus: 0.15,
    placeholder: 'Enter KuCoin UID',
    image: 'https://i.imgur.com/jfjFkeA.jpg',
  },
  {
    id: 'mastercard',
    label: 'UPI (Lowest Rate)',
    bonus: 0,
    placeholder: 'Enter UPI Address',
    image: 'https://i.imgur.com/FK31xFx.jpg',
  },
];

const getLevelBonus = (level: number): number => {
  const bonuses = {
    1: 0,
    2: 0.01,
    3: 0.03,
    4: 0.05,
    5: 0.07,
    6: 0.01
  };
  return bonuses[level as keyof typeof bonuses] || 0;
};

const MergedPaymentPage = () => {
  const router = useRouter();
  const [piAmount, setPiAmount] = useState<string>('');
  const [imageUploaded, setImageUploaded] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [piAddress, setPiAddress] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [paymentAddress, setPaymentAddress] = useState<string>('');
  const [userLevel, setUserLevel] = useState<number>(1);
  const [basePrice, setBasePrice] = useState<number>(0.15);
  const [showPaymentMethods, setShowPaymentMethods] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const walletAddress = 'GHHHjJhGgGfFfHjIuYrDc';
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      const webAppUser = tg.initDataUnsafe?.user;
      if (webAppUser) {
        setTelegramId(webAppUser.id);
        fetchUserData(webAppUser.id);
      }
    }
  }, []);

  const fetchUserData = async (userId: number): Promise<void> => {
    try {
      const response = await fetch(`/api/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      });
      const userData = await response.json();
      setImageUploaded(userData.isUpload || false);
      setImageUrl(userData.imageUrl || null);
      setUserLevel(userData.level || 1);
      setBasePrice(userData.baseprice || 0.15);
      if (userData.piaddress) {
        setPiAddress(userData.piaddress[userData.piaddress.length - 1]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (e.target.files && e.target.files.length > 0 && telegramId) {
      setIsLoading(true);
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('telegramId', telegramId.toString());

      try {
        const response = await fetch('/api/imageupload', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        if (data.success) {
          setImageUploaded(true);
          setImageUrl(data.imageUrl);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRemoveImage = async (): Promise<void> => {
    if (telegramId) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/imageupload?telegramId=${telegramId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          setImageUploaded(false);
          setImageUrl(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      } catch (error) {
        console.error('Error removing image:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy wallet address:', error);
    }
  };

  const calculateUSDT = (pi: string): string => {
    const amount = parseFloat(pi);
    if (!amount) return '0.00';
    
    const selectedMethod = paymentMethods.find(m => m.id === selectedPayment);
    const paymentBonus = selectedMethod?.bonus || 0;
    const levelBonus = getLevelBonus(userLevel);
    const totalRate = basePrice + paymentBonus + levelBonus;
    
    return (amount * totalRate).toFixed(2);
  };

  const handleContinue = async () => {
    if (telegramId && piAmount && imageUrl && selectedPayment && paymentAddress) {
      setIsLoading(true);
      try {
        // Save payment method data
        await fetch('/api/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId,
            paymentMethod: selectedPayment,
            paymentAddress,
            transactionStatus: "processing"
          })
        });

        // Save Pi amount and address
        await fetch('/api/piamount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId,
            amount: piAmount,
            imageUrl: imageUrl,
            piaddress: piAddress
          })
        });
        
        router.push('/summary');
      } catch (error) {
        console.error('Error saving data:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isButtonEnabled = piAmount && imageUploaded && piAddress && selectedPayment && paymentAddress;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Script src="https://kit.fontawesome.com/18e66d329f.js" />
      
      {/* Header */}
      <div className="w-full bg-[#670773] text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold text-center">Pi Trader</h1>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="space-y-6">
          {/* Wallet Section */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-lg font-semibold text-[#670773] mb-3">
              Send your Pi to this wallet address
            </h2>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-100 p-3 rounded-lg font-mono text-sm break-all text-black">
                {walletAddress}
              </div>
              <button
                onClick={handleCopyAddress}
                className="bg-[#670773] text-white p-2 rounded-lg hover:bg-[#7a1b86] transition-colors"
              >
                <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} text-lg`}></i>
              </button>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-lg font-semibold text-[#670773] mb-3">
              Choose Your Payment Method
            </h2>
            <div className="relative">
              <div
                className="w-full p-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#670773] text-black mb-4 flex items-center justify-between cursor-pointer"
                onClick={() => setShowPaymentMethods(!showPaymentMethods)}
              >
                {selectedPayment
                  ? paymentMethods.find(m => m.id === selectedPayment)?.label
                  : 'Select payment method'}
                <i className={`fas ${showPaymentMethods ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-500`}></i>
              </div>
              {showPaymentMethods && (
                <div className="absolute z-10 w-full bg-white rounded-lg shadow-lg border border-gray-300 mt-1">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="p-3 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={() => {
                        setSelectedPayment(method.id);
                        setPaymentAddress('');
                        setShowPaymentMethods(false);
                      }}
                    >
                      <img
                        src={method.image}
                        alt={method.label}
                        className="w-6 h-6 object-contain mr-3"
                      />
                      <span>{method.label} {method.badge && `(${method.badge})`}</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedPayment && (
                <input
                  type="text"
                  value={paymentAddress}
                  onChange={(e) => setPaymentAddress(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#670773] text-black"
                  placeholder={paymentMethods.find(m => m.id === selectedPayment)?.placeholder}
                />
              )}
            </div>
          </div>

          {/* Amount Section */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-lg font-semibold text-[#670773] mb-3">
              How many Pi you want to sell?
            </h2>
            <input
              type="number"
              value={piAmount}
              onChange={(e) => setPiAmount(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#670773] text-black"
              placeholder="Enter amount"
            />
            {piAmount && (
              <p className="mt-3 text-[#670773] font-medium">
                You will receive {calculateUSDT(piAmount)} USDT
              </p>
            )}
          </div>

          {/* Pi Address Section */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-lg font-semibold text-[#670773] mb-3">
              Your Pi Wallet Address
            </h2>
            <input
              type="text"
              value={piAddress}
              onChange={(e) => setPiAddress(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#670773] text-black"
              placeholder="Enter your Pi wallet address"
            />
          </div>

          {/* Image Upload Section */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-lg font-semibold text-[#670773] mb-3">
              Payment Proof Screenshot
            </h2>
            <div
              onClick={() => !imageUploaded && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                ${imageUploaded ? 'border-[#670773] bg-purple-50' : 'border-gray-300'}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              {isLoading ? (
                <div className="text-[#670773]">
                  <i className="fas fa-spinner fa-spin text-3xl mb-2"></i>
                  <p>Uploading...</p>
                </div>
              ) : imageUploaded && imageUrl ? (
                <div className="text-[#670773]">
                  <i className="fas fa-check-circle text-3xl mb-2"></i>
                  <p>Image uploaded successfully</p>
                  <div className="mt-4 mb-4">
                    <img 
                      src={imageUrl} 
                      alt="Payment proof" 
                      className="max-w-full h-auto rounded-lg mx-auto"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="text-gray-500">
                  <i className="fas fa-cloud-upload-alt text-3xl mb-2"></i>
                  <p>Click to upload screenshot</p>
                </div>
              )}
            </div>
          </div>

          {/* Continue Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleContinue}
              disabled={!isButtonEnabled}
              className={`px-8 py-3 rounded-full text-white font-bold text-lg transition-all
                ${isButtonEnabled 
                  ? 'bg-[#670773] hover:bg-[#7a1b86] transform hover:scale-105'
                  : 'bg-gray-400 cursor-not-allowed'}`}
            >
              Continue
            </button>
          </div>
        </div>

        {/* Notification for copy */}
        {copied && (
          <div className="fixed bottom-4 right-4 bg-[#670773] text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
            Address copied!
          </div>
        )}
        
        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
};

export default MergedPaymentPage;

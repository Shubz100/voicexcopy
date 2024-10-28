'use client'

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const PaymentProof = () => {
  const router = useRouter();
  const [piAmount, setPiAmount] = useState<string>('');
  const [imageUploaded, setImageUploaded] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [piAddress, setPiAddress] = useState<string>('');
  const [hasStoredAddress, setHasStoredAddress] = useState<boolean>(false);
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);
  const [previousAddresses, setPreviousAddresses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const walletAddress = 'GHHHjJhGgGfFfHjIuYrDc';
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      const webAppUser = tg.initDataUnsafe?.user;
      if (webAppUser) {
        setTelegramId(webAppUser.id);
        fetchUploadStatus(webAppUser.id);
      }
    }
  }, []);

  const fetchUploadStatus = async (userId: number): Promise<void> => {
    try {
      const response = await fetch(`/api/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      });
      const userData = await response.json();
      setImageUploaded(userData.isUpload || false);
      setImageUrl(userData.imageUrl || null);
      if (userData.piaddress && userData.piaddress.length > 0) {
        setPiAddress(userData.piaddress[userData.piaddress.length - 1]);
        setPreviousAddresses(userData.piaddress);
        setHasStoredAddress(true);
      }
    } catch (error) {
      console.error('Error fetching upload status:', error);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (e.target.files && e.target.files.length > 0 && telegramId) {
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
      }
    }
  };

  const handleRemoveImage = async (): Promise<void> => {
    if (telegramId) {
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
    return amount ? (amount * 0.65).toFixed(2) : '0.00';
  };

  const handleContinue = async () => {
    if (!telegramId || !piAmount || !imageUrl || !piAddress) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/piamount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId,
          amount: piAmount,
          imageUrl,
          piaddress: piAddress
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

      const result = await response.json();
      
      if (result.success) {
        if (result.piaddress) {
          setPreviousAddresses(result.piaddress);
          setHasStoredAddress(true);
        }
        setIsEditingAddress(false);
        // Use replace instead of push to avoid the back button issue
        router.replace('/summary');
      }
    } catch (error) {
      console.error('Error saving data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonEnabled = Boolean(piAmount && imageUploaded && piAddress && !isLoading);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
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
              <div className="flex-1 bg-gray-100 p-3 rounded-lg font-mono text-sm break-all">
                {walletAddress}
              </div>
              <button
                onClick={handleCopyAddress}
                className="bg-[#670773] text-white p-2 rounded-lg hover:bg-[#7a1b86] transition-colors"
              >
                {copied ? (
                  <i className="fas fa-check text-lg"></i>
                ) : (
                  <i className="fas fa-copy text-lg"></i>
                )}
              </button>
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#670773]"
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
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={piAddress}
                onChange={(e) => setPiAddress(e.target.value)}
                disabled={hasStoredAddress && !isEditingAddress}
                className={`flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#670773] ${
                  hasStoredAddress && !isEditingAddress ? 'bg-gray-100' : ''
                }`}
                placeholder="Enter your Pi wallet address"
              />
              {hasStoredAddress && (
                <button
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  className="bg-[#670773] text-white p-2 rounded-lg hover:bg-[#7a1b86] transition-colors"
                >
                  <i className={`fas fa-${isEditingAddress ? 'times' : 'edit'} text-lg`}></i>
                </button>
              )}
            </div>
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
              {imageUploaded && imageUrl ? (
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
              {isLoading ? 'Processing...' : 'Continue'}
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

export default PaymentProof;

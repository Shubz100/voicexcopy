'use client'

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

const paymentMethods = [
  {
    id: 'paypal',
    label: 'PayPal',
    bonus: 0.28,
    placeholder: 'Enter PayPal address',
    image: 'https://storage.googleapis.com/a1aa/image/LM00lHy4e4VEfEwshfXBUMcJYM0B328inIsGRj7TYfhafrHdC.jpg',
  },
  {
    id: 'googlepay',
    label: 'Google Pay',
    bonus: 0.25,
    placeholder: 'Enter Google Pay address',
    image: 'https://storage.googleapis.com/a1aa/image/SvKY98RDkvYhENmLE9Ukt5u94yGsWNixkJM5U691UbdeveoTA.jpg',
  },
  {
    id: 'applepay',
    label: 'Apple Pay',
    bonus: 0.15,
    placeholder: 'Enter Apple Pay address',
    image: 'https://storage.googleapis.com/a1aa/image/YqpCh7xg0Ab9N17SKmdPm6cBYfCqsSwebOnsx553IeS1f1jOB.jpg',
    badge: 'High Rate'
  },
  {
    id: 'mastercard',
    label: '•••• 2766',
    bonus: 0,
    placeholder: 'Enter Mastercard details',
    image: 'https://storage.googleapis.com/a1aa/image/XBvmqXf3efCHMIrLcbgQfNciUh1kUfjmogYgjIg8xeoIeveoTA.jpg',
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
  const [showSummary, setShowSummary] = useState(false);
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
    if (!amount) return '0.00';
    
    const selectedMethod = paymentMethods.find(m => m.id === selectedPayment);
    const paymentBonus = selectedMethod?.bonus || 0;
    const levelBonus = getLevelBonus(userLevel);
    const totalRate = basePrice + paymentBonus + levelBonus;
    
    return (amount * totalRate).toFixed(2);
  };

  const calculatePricePerPi = () => {
    const selectedMethod = paymentMethods.find(m => m.id === selectedPayment);
    const paymentBonus = selectedMethod?.bonus || 0;
    const levelBonus = getLevelBonus(userLevel);
    return (basePrice + paymentBonus + levelBonus).toFixed(2);
  };

  const handleContinue = async () => {
    if (telegramId && piAmount && imageUrl && selectedPayment && paymentAddress) {
      setShowSummary(true);
    }
  };

  const handleConfirm = async () => {
    try {
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

      await fetch('/api/piamount', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           telegramId,
           piAmount,
           transactionStatus: "processing"
         })
       });

      router.push('/success');
    } catch (error) {
      console.error('Error processing payment:', error);
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
        <h2 className="text-lg font-bold mb-4">Payment Methods</h2>
        <ul className="flex flex-wrap justify-center mb-4">
          {paymentMethods.map((method, index) => (
            <li key={index} className="mr-4 mb-4">
              <input
                type="radio"
                id={method.id}
                name="paymentMethod"
                value={method.id}
                onChange={(e) => setSelectedPayment(e.target.value)}
              />
              <label
                htmlFor={method.id}
                className="flex items-center cursor-pointer"
              >
                <img src={method.image} alt={method.label} className="w-8 h-8 mr-2" />
                <span className="text-lg">{method.label}</span>
                {method.badge && (
                  <span
                    className="bg-orange-500 text-white text-xs font-bold py-1 px-2 rounded-full ml-2"
                  >
                    {method.badge}
                  </span>
                )}
              </label>
            </li>
          ))}
        </ul>

        <div className="mb-4">
          <label
            htmlFor="piAmount"
            className="block text-lg font-bold mb-2"
          >
            Enter Pi Amount
          </label>
          <input
            type="number"
            id="piAmount"
            value={piAmount}
            onChange={(e) => setPiAmount(e.target.value)}
            className="w-full p-2 pl-10 text-lg"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="paymentAddress"
            className="block text-lg font-bold mb-2"
          >
            Enter Payment Address
          </label>
          <input
            type="text"
            id="paymentAddress"
            value={paymentAddress}
            onChange={(e) => setPaymentAddress(e.target.value)}
            className="w-full p-2 pl-10 text-lg"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="piAddress"
            className="block text-lg font-bold mb-2"
          >
            Enter Pi Address
          </label>
          <input
            type="text"
            id="piAddress"
            value={piAddress}
            onChange={(e) => setPiAddress(e.target.value)}
            className="w-full p-2 pl-10 text-lg"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="imageUpload"
            className="block text-lg font-bold mb-2"
          >
            Upload Image
          </label>
          <input
            type="file"
            id="imageUpload"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="w-full p-2 pl-10 text-lg"
          />
          {imageUrl && (
            <img src={imageUrl} alt="Uploaded Image" className="w-24 h-24 mb-2" />
          )}
          {imageUploaded && (
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={handleRemoveImage}
            >
              Remove Image
            </button>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="walletAddress"
            className="block text-lg font-bold mb-2"
          >
            Wallet Address
          </label>
          <input
            type="text"
            id="walletAddress"
            value={walletAddress}
            readOnly
            className="w-full p-2 pl-10 text-lg"
          />
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleCopyAddress}
          >
            Copy Address
          </ button>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2">Summary</h2>
          <p>
            You will receive <span className="font-bold">{calculateUSDT(piAmount)}</span> USDT
          </p>
          <p>
            Price per Pi: <span className="font-bold">{calculatePricePerPi()}</span> USDT
          </p>
        </div>

        <button
          className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleContinue}
          disabled={!isButtonEnabled}
        >
          Continue
        </button>

        {showSummary && (
          <div className="fixed top-0 left-0 w-full h-screen bg-gray-500 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-4 rounded shadow-lg">
              <h2 className="text-lg font-bold mb-2">Confirm Payment</h2>
              <p>
                You will receive <span className="font-bold">{calculateUSDT(piAmount)}</span> USDT
              </p>
              <p>
                Price per Pi: <span className="font-bold">{calculatePricePerPi()}</span> USDT
              </p>
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleConfirm}
              >
                Confirm
              </button>
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => setShowSummary(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification for copy */}
      {copied && (
        <div className="fixed top-0 left-0 w-full h-screen bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-4 rounded shadow-lg">
            <p>Wallet address copied to clipboard!</p>
          </div>
        </div>
      )}
      
      <style jsx>{`
        // ... your styles ...
      `}</style>
    </div>
  );
};

export default MergedPaymentPage;

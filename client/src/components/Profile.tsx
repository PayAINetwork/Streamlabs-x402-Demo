import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { API_BASE_URL } from '../config';
import { MultiNetworkPaywallApp } from './MultiNetworkPaywallApp';
import { MultiNetworkProviders } from './MultiNetworkProviders';

// Type definitions
interface FormData {
  name: string;
  email: string;
  message: string;
}

interface ServerResponse {
  accepts: any;
  message?: string;
}


const Profile: React.FC = () => {
  const [formData, setFormData] = useState<FormData | null>(null)
  const [payWall, setPayWall] = useState<any | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  // Fetch streamer info when component mounts
  useEffect(() => {
    const fetchStreamerInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/get-streamer-info`);
        if (response.ok) {
          const data = await response.json();
          console.log('Streamer info response:', data);
          
          // Extract display name and thumbnail from the streamlabs object
          if (data && data.streamlabs) {
            setDisplayName(data.streamlabs.display_name || '');
            setThumbnailUrl(data.streamlabs.thumbnail || '');
          }
        } else {
          console.error('Failed to fetch streamer info:', response.status);
        }
      } catch (error) {
        console.error('Error fetching streamer info:', error);
      }
    };

    fetchStreamerInfo();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    } as FormData));
  };


  const handleSubmit = async (amount: number): Promise<void> => {
    if (!formData?.name || !formData?.email) {
      setSubmitMessage('Name and Email are required!');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

      try {
        const formDataCollected = {
          name: formData.name,
          email: formData.email,
          message: formData.message,
          amount: amount
        }
        setFormData(formDataCollected as FormData);
        const response = await fetch(`${API_BASE_URL}/${amount}-dollar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formDataCollected),
        });
        
        if (response.status !== 402) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: ServerResponse = await response.json();
        
        // Determine EVM testnet from network
        const evmTestnet = data.accepts[0].network === 'base-sepolia';
        
        // Fetch Solana endpoint to determine its network
        const solanaResponse = await fetch(`${API_BASE_URL}/solana/${amount}-dollar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formDataCollected),
        });
        
        let solanaTestnet = true; // Default to devnet
        if (solanaResponse.status === 402) {
          const solanaData = await solanaResponse.json();
          // Check the actual Solana network from server response
          if (solanaData.accepts && solanaData.accepts.length > 0) {
            solanaTestnet = solanaData.accepts[0].network === 'solana-devnet';
          }
        }
        
        const payWallValue = ({
          amount: amount,
          paymentRequirements: data.accepts,
          currentUrl: `${API_BASE_URL}/${amount}-dollar`,
          solanaUrl: `${API_BASE_URL}/solana/${amount}-dollar`,
          testnet: evmTestnet,
          solanaTestnet: solanaTestnet,
          appName: 'StreamLabs',
          appLogo: 'https://streamlabs.com/favicon.ico',
        });

        setPayWall(payWallValue);

        console.log("payWall: ",payWallValue);

    } catch (error) {
      console.error('Error:', error);
      setSubmitMessage('Error connecting to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentComplete = (response: Response) => {
    // Reset the form and close paywall after successful payment
    setFormData({
      name: '',
      email: '',
      message: ''
    });
    setSelectedAmount(null);
    setPayWall(null);
    setSubmitMessage('Donation successful! Thank you for your support.');
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setSubmitMessage('');
    }, 10000);
  };

  const handlePaymentError = (error: Error) => {
    setSubmitMessage(`Payment failed: ${error.message}`);
  };

  const dollarAmounts: number[] = [1, 5, 10, 20, 50, 100];

  return (
    <div className="relative">
      {/* Form content */}
      <div className={`min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 p-5 ${payWall ? 'pointer-events-none' : ''}`}>
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
          <header 
            className="text-white p-10 text-center relative"
            style={{
              backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'linear-gradient(to right, #2563eb, #7c3aed)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-20 rounded-t-3xl"></div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-3">
                {displayName ? displayName : 'Welcome to TipsyLink'}
              </h1>
              <p className="text-xl opacity-90">Support {displayName} with a donation</p>
            </div>
          </header>

          <form className="p-10" onSubmit={(e: FormEvent) => e.preventDefault()}>
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Name <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData?.name || ''}
                onChange={handleInputChange}
                placeholder="Enter your name"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData?.email || ''}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
              />
              <small className="text-gray-500 text-sm mt-1 block">This will be used as your identifier</small>
            </div>

            <div className="mb-8">
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData?.message || ''}
                onChange={handleInputChange}
                placeholder="Leave a message (optional)"
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 resize-none"
              />
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 text-center mb-6">Select Donation Amount:</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {dollarAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={`py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                      selectedAmount === amount
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                    onClick={() => setSelectedAmount(amount)}
                    disabled={isSubmitting}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {selectedAmount && (
              <div className="text-center">
                <button
                  type="button"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-10 py-4 rounded-full text-xl font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  onClick={() => handleSubmit(selectedAmount)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : `Donate $${selectedAmount}`}
                </button>
              </div>
            )}

            {submitMessage && (
              <div className={`mt-6 p-4 rounded-xl text-center font-medium ${
                submitMessage.includes('Error') 
                  ? 'bg-red-100 text-red-800 border border-red-200' 
                  : 'bg-green-100 text-green-800 border border-green-200'
              }`}>
                {submitMessage}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Paywall overlay */}
      {payWall && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-500/90 via-purple-600/90 to-blue-700/90 backdrop-blur-sm z-40">
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
              <button
                onClick={() => setPayWall(null)}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Donation Form
              </button>
              <div className="text-sm text-gray-500">
                Donation Amount: ${selectedAmount}
              </div>
            </div>
          </div>
          <MultiNetworkProviders evmConfig={payWall}>
            <MultiNetworkPaywallApp 
              config={payWall} 
              bodyData={formData}
              onPaymentComplete={handlePaymentComplete}
              onPaymentError={handlePaymentError}
            />
          </MultiNetworkProviders>
        </div>
      )}
    </div>
  );
};

export default Profile;



import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useNetwork } from 'wagmi';
import SwapInterface from '../components/SwapInterface';
import SwapHistory from '../components/SwapHistory';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [activeTab, setActiveTab] = useState('swap');
  const [swapHistory, setSwapHistory] = useState([]);

  useEffect(() => {
    if (isConnected && address) {
      loadSwapHistory();
    }
  }, [isConnected, address]);

  const loadSwapHistory = async () => {
    try {
      const response = await fetch(`/api/swaps/history/${address}`);
      if (response.ok) {
        const history = await response.json();
        setSwapHistory(history);
      }
    } catch (error) {
      console.error('Error loading swap history:', error);
    }
  };

  const handleSwapCreated = (swapData) => {
    setSwapHistory(prev => [swapData, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Bitcoin ↔ Ethereum Cross-Chain Swap
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Trustless atomic swaps between Bitcoin and Ethereum using 1inch Fusion+
            </p>
            
            {!isConnected && (
              <div className="mb-8">
                <ConnectButton />
              </div>
            )}
          </div>

          {/* Main Content */}
          {isConnected ? (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('swap')}
                    className={`flex-1 py-4 px-6 text-center font-medium ${
                      activeTab === 'swap'
                        ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Create Swap
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-4 px-6 text-center font-medium ${
                      activeTab === 'history'
                        ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Swap History
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'swap' && (
                  <SwapInterface 
                    userAddress={address}
                    onSwapCreated={handleSwapCreated}
                  />
                )}
                {activeTab === 'history' && (
                  <SwapHistory 
                    swaps={swapHistory}
                    onRefresh={loadSwapHistory}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-white rounded-2xl shadow-xl p-12">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Connect Your Wallet
                </h2>
                <p className="text-gray-600 mb-6">
                  Connect your Ethereum wallet to start swapping between Bitcoin and Ethereum
                </p>
                <ConnectButton />
              </div>
            </div>
          )}

          {/* Features Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-bitcoin rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">₿</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Native Bitcoin
              </h3>
              <p className="text-gray-600">
                Swap native Bitcoin without wrapping or bridging
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-ethereum rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">Ξ</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                1inch Fusion+
              </h3>
              <p className="text-gray-600">
                Powered by 1inch for optimal Ethereum-side routing
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Trustless
              </h3>
              <p className="text-gray-600">
                Atomic swaps with automatic refunds and no custodial risk
              </p>
            </div>
          </div>

          {/* Network Status */}
          {isConnected && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Connected to: {chain?.name || 'Unknown Network'}</span>
                <span>Address: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
} 
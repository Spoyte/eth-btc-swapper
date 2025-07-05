import { useState, useEffect } from 'react';
import { useAccount, useNetwork } from 'wagmi';

export default function SwapInterface({ userAddress, onSwapCreated }) {
  const { chain } = useNetwork();
  const [swapData, setSwapData] = useState({
    btcAmount: '',
    ethAmount: '',
    btcAddress: '',
    lockTime: 24 // hours
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState(null);
  const [step, setStep] = useState(1);

  const handleInputChange = (field, value) => {
    setSwapData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const getQuote = async () => {
    if (!swapData.btcAmount || !swapData.ethAmount) {
      setError('Please enter both BTC and ETH amounts');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/swaps/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          btcAmount: parseFloat(swapData.btcAmount),
          ethAmount: parseFloat(swapData.ethAmount),
          userAddress
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get quote');
      }

      const quoteData = await response.json();
      setQuote(quoteData);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSwap = async () => {
    if (!swapData.btcAddress) {
      setError('Please enter your Bitcoin address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/swaps/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          btcAmount: parseFloat(swapData.btcAmount),
          ethAmount: parseFloat(swapData.ethAmount),
          btcAddress: swapData.btcAddress,
          ethAddress: userAddress,
          lockTime: swapData.lockTime
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create swap');
      }

      const swapResult = await response.json();
      onSwapCreated(swapResult);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSwapData({
      btcAmount: '',
      ethAmount: '',
      btcAddress: '',
      lockTime: 24
    });
    setQuote(null);
    setStep(1);
    setError('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <span className="ml-2 font-medium">Configure Swap</span>
          </div>
          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span className="ml-2 font-medium">Review & Create</span>
          </div>
          <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              3
            </div>
            <span className="ml-2 font-medium">Fund & Complete</span>
          </div>
        </div>
      </div>

      {/* Step 1: Configure Swap */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bitcoin Amount
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.00000001"
                value={swapData.btcAmount}
                onChange={(e) => handleInputChange('btcAmount', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.001"
              />
              <div className="absolute right-3 top-3 text-gray-500">
                <span className="text-bitcoin font-bold">₿</span> BTC
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ethereum Amount
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.000000000000000001"
                value={swapData.ethAmount}
                onChange={(e) => handleInputChange('ethAmount', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.1"
              />
              <div className="absolute right-3 top-3 text-gray-500">
                <span className="text-ethereum font-bold">Ξ</span> ETH
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Bitcoin Address
            </label>
            <input
              type="text"
              value={swapData.btcAddress}
              onChange={(e) => handleInputChange('btcAddress', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tb1q... (testnet address)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lock Time (hours)
            </label>
            <select
              value={swapData.lockTime}
              onChange={(e) => handleInputChange('lockTime', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={6}>6 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Time before automatic refund if swap is not completed
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={getQuote}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Getting Quote...' : 'Get Quote'}
          </button>
        </div>
      )}

      {/* Step 2: Review & Create */}
      {step === 2 && quote && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Swap Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">You Send:</span>
                <span className="font-medium">{swapData.btcAmount} BTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">You Receive:</span>
                <span className="font-medium">{swapData.ethAmount} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Exchange Rate:</span>
                <span className="font-medium">1 BTC = {quote.rate} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lock Time:</span>
                <span className="font-medium">{swapData.lockTime} hours</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Bitcoin HTLC Address</h4>
            <p className="text-sm text-blue-700 font-mono break-all">
              {quote.btcHtlcAddress}
            </p>
            <p className="text-sm text-blue-600 mt-2">
              You will need to send Bitcoin to this address to complete the swap
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">Important:</p>
                <p className="text-sm text-yellow-700">
                  This is a testnet swap. Only use testnet Bitcoin addresses and small amounts for testing.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300"
            >
              Back
            </button>
            <button
              onClick={createSwap}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Swap...' : 'Create Swap'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Fund & Complete */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Swap Created Successfully!
            </h3>
            <p className="text-gray-600">
              Your swap has been created. Follow the instructions below to complete it.
            </p>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-4">Next Steps:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
              <li>Send {swapData.btcAmount} BTC to the HTLC address</li>
              <li>Wait for 3 Bitcoin confirmations</li>
              <li>The swap will automatically complete and you'll receive ETH</li>
              <li>If not completed within {swapData.lockTime} hours, you can claim a refund</li>
            </ol>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">HTLC Address</h4>
            <p className="text-sm font-mono break-all bg-white p-3 rounded border">
              {quote?.btcHtlcAddress}
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(quote?.btcHtlcAddress)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Copy Address
            </button>
          </div>

          <button
            onClick={resetForm}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700"
          >
            Create Another Swap
          </button>
        </div>
      )}
    </div>
  );
} 
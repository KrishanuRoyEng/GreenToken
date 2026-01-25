import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalFooter } from '../ui';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { paymentService } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import razorpayLogo from '../../assets/razorpay-logo.svg';

// Razorpay types
declare global {
    interface Window {
        Razorpay: any;
    }
}

interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayCheckoutProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    tokenAmount: number;
    orderId?: string;
    sellerName?: string;
    onSuccess: (response: any) => void;
    onError?: (error: any) => void;
}

export const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
    isOpen,
    onClose,
    amount,
    tokenAmount,
    orderId,
    sellerName,
    onSuccess,
    onError,
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
    const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'crypto'>('razorpay');
    const [demoMode, setDemoMode] = useState(false);
    const [orderData, setOrderData] = useState<any>(null);

    // Check payment mode on mount
    useEffect(() => {
        const checkPaymentMode = async () => {
            try {
                const data = await paymentService.getPaymentMode();
                setDemoMode(data.demoMode);
            } catch {
                setDemoMode(true); // Fallback to demo if API unavailable
            }
        };
        if (isOpen) {
            checkPaymentMode();
            setPaymentStatus('idle'); // Reset status on open
        }
    }, [isOpen]);

    const handlePayment = async () => {
        if (paymentMethod === 'crypto') {
            handleCryptoPayment();
            return;
        }
        await initiatePayment();
    };

    const handleCryptoPayment = async () => {
        setIsLoading(true);
        setPaymentStatus('processing');

        try {
            // Check if MetaMask is installed
            if (!window.ethereum) {
                toast.error('MetaMask is not installed. Please install it to pay with crypto.');
                setIsLoading(false);
                setPaymentStatus('idle');
                return;
            }

            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (!accounts || accounts.length === 0) {
                toast.error('Please connect your MetaMask wallet.');
                setIsLoading(false);
                setPaymentStatus('idle');
                return;
            }

            const userWallet = accounts[0];

            // Get treasury address from backend or use env
            const treasuryAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f8fEbC'; // TODO: Get from backend

            // Convert INR amount to ETH (approximate rate: 1 ETH = 250000 INR for demo)
            const ethRate = 250000;
            const ethAmount = (amount / ethRate).toFixed(6);
            const weiAmount = BigInt(Math.floor(parseFloat(ethAmount) * 1e18));
            const valueHex = '0x' + weiAmount.toString(16);

            toast.loading('Please confirm the transaction in MetaMask...', { id: 'crypto-tx' });

            // Send transaction
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: userWallet,
                    to: treasuryAddress,
                    value: valueHex,
                }],
            });

            toast.loading('Transaction submitted. Waiting for confirmation...', { id: 'crypto-tx' });

            // Verify transaction with backend
            const verifyResponse = await paymentService.verifyCryptoPayment({
                txHash,
                amount,
                tokenAmount,
                orderId,
                walletAddress: userWallet,
            });

            toast.dismiss('crypto-tx');

            if (verifyResponse.success) {
                setPaymentStatus('success');
                toast.success('Crypto payment successful!');
                onSuccess(verifyResponse);

                // Redirect after showing success
                setTimeout(() => {
                    navigate('/dashboard?tab=marketplace');
                }, 3000);
            } else {
                throw new Error('Transaction verification failed');
            }

        } catch (error: any) {
            toast.dismiss('crypto-tx');
            console.error('Crypto payment error:', error);

            if (error.code === 4001) {
                toast.error('Transaction cancelled by user');
            } else {
                toast.error(error.message || 'Crypto payment failed');
            }

            setPaymentStatus('failed');
            onError?.(error);
        } finally {
            setIsLoading(false);
        }
    };

    const initiatePayment = async () => {
        setIsLoading(true);
        setPaymentStatus('processing');

        try {
            const data = await paymentService.createOrder({
                amount,
                tokenAmount,
                orderId,
                currency: 'INR',
            });

            // DEMO MODE check
            if (data.demoMode) {
                setOrderData(data);
                setIsLoading(false);
                return;
            }

            // PRODUCTION: Load Razorpay
            if (!window.Razorpay) {
                try {
                    await loadRazorpayScript();
                } catch (e) {
                    toast.error('Failed to load Razorpay SDK. Please check your connection.');
                    setIsLoading(false);
                    setPaymentStatus('idle');
                    return;
                }
            }

            const options = {
                key: data.key,
                amount: data.order.amount,
                currency: data.order.currency,
                name: 'GreenToken',
                description: `Purchase ${tokenAmount} Carbon Credits`,
                image: razorpayLogo,
                order_id: data.order.id,
                handler: async (response: RazorpayResponse) => {
                    await verifyPayment(response, false);
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: ''
                },
                theme: { color: '#0891b2' },
                modal: {
                    ondismiss: () => {
                        setIsLoading(false);
                        setPaymentStatus('idle');
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', (response: any) => {
                toast.error('Payment failed: ' + response.error.description);
                onError?.(response.error);
                setIsLoading(false);
                setPaymentStatus('failed');
            });
            razorpay.open();
        } catch (error: any) {
            toast.error(error.message || 'Failed to initiate payment');
            onError?.(error);
            setIsLoading(false);
            setPaymentStatus('failed');
        }
    };

    const completeDemoPayment = async () => {
        if (!orderData) return;
        setIsLoading(true);
        setPaymentStatus('processing');

        try {
            await verifyPayment({
                razorpay_order_id: orderData.order.id,
                razorpay_payment_id: `demo_pay_${Date.now()}`,
                razorpay_signature: 'demo_signature',
            }, true);
        } catch (error: any) {
            toast.error(error.message || 'Failed to complete demo payment');
            onError?.(error);
            setIsLoading(false);
            setPaymentStatus('failed');
        }
    };

    const verifyPayment = async (response: RazorpayResponse, isDemo: boolean) => {
        try {
            const data = await paymentService.verifyPayment({
                ...response,
                demoMode: isDemo,
            });

            setPaymentStatus('success');
            onSuccess(data);

            // Redirect after 3 seconds
            navigate('/dashboard?tab=marketplace');

        } catch (error: any) {
            toast.error(error.message || 'Payment verification failed');
            onError?.(error);
            setPaymentStatus('failed');
        } finally {
            setIsLoading(false);
            setOrderData(null);
        }
    };

    const loadRazorpayScript = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Razorpay'));
            document.body.appendChild(script);
        });
    };

    if (!isOpen) return null;

    const hasWallet = !!user?.walletAddress;

    return (
        <Modal isOpen={isOpen} onClose={paymentStatus === 'success' ? () => { } : onClose} title={paymentStatus === 'success' ? 'Payment Successful' : 'Complete Payment'} size="md">
            <div className="space-y-6">

                {/* SUCCESS VIEW */}
                {paymentStatus === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Verified!</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            You have successfully purchased <span className="font-semibold text-slate-900 dark:text-white">{tokenAmount} Tokens</span>.
                        </p>
                        <p className="text-sm text-slate-500 animate-pulse">
                            Redirecting to dashboard...
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Demo Mode Banner */}
                        {demoMode && (
                            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <span className="text-xl">🧪</span>
                                <div>
                                    <p className="font-medium text-amber-800 dark:text-amber-300">Demo Mode</p>
                                    <p className="text-sm text-amber-700 dark:text-amber-400">
                                        Payments are simulated. No real money will be charged.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Order Summary */}
                        <div className="bg-gradient-to-br from-ocean-50 to-kelp-50 dark:from-ocean-900/20 dark:to-kelp-900/20 rounded-xl p-6 border border-ocean-200 dark:border-ocean-800 relative overflow-hidden">
                            {/* Watermark Logo */}
                            <img src={razorpayLogo} alt="Razorpay" className="absolute top-4 right-4 h-6 opacity-50" />

                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Order Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Carbon Credits</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{tokenAmount} tokens</span>
                                </div>
                                {sellerName && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">Seller</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{sellerName}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Price per token</span>
                                    <span className="font-medium text-slate-900 dark:text-white">₹{(amount / tokenAmount).toFixed(2)}</span>
                                </div>
                                <div className="border-t border-ocean-200 dark:border-ocean-700 pt-3 mt-3">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-semibold text-slate-900 dark:text-white">Total</span>
                                        <span className="text-2xl font-bold text-ocean-600 dark:text-ocean-400">₹{amount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Demo Mode Confirmation */}
                        {orderData && demoMode && (
                            <div className="p-4 bg-kelp-50 dark:bg-kelp-900/20 border border-kelp-200 dark:border-kelp-800 rounded-lg">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-2xl">✅</span>
                                    <div>
                                        <p className="font-medium text-kelp-800 dark:text-kelp-300">Order Created</p>
                                        <p className="text-sm text-kelp-600 dark:text-kelp-400 font-mono">{orderData.order.id}</p>
                                    </div>
                                </div>
                                <Button onClick={completeDemoPayment} loading={isLoading} className="w-full">
                                    Complete Demo Payment
                                </Button>
                            </div>
                        )}

                        {/* Payment Method Selection (only for production mode) */}
                        {!orderData && !demoMode && (
                            <div>
                                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Payment Method</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { key: 'razorpay', label: 'Card / UPI', icon: '💳', desc: 'All Options' },
                                        { key: 'upi', label: 'UPI Only', icon: '📱', desc: 'Fastest' },
                                        {
                                            key: 'crypto',
                                            label: 'Crypto',
                                            icon: '🔗',
                                            desc: hasWallet ? 'Ready' : 'No Wallet',
                                            disabled: !hasWallet
                                        },
                                    ].map((method) => (
                                        <button
                                            key={method.key}
                                            onClick={() => !method.disabled && setPaymentMethod(method.key as any)}
                                            disabled={method.disabled}
                                            className={`p-4 rounded-lg border-2 transition-all text-left relative ${paymentMethod === method.key
                                                ? 'border-ocean-500 bg-ocean-50 dark:bg-ocean-900/20'
                                                : method.disabled
                                                    ? 'border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-ocean-300 dark:hover:border-ocean-600'
                                                }`}
                                        >
                                            <div className="text-2xl mb-1">{method.icon}</div>
                                            <div className="font-medium text-slate-900 dark:text-white text-sm">{method.label}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                {method.desc}
                                            </div>
                                            {paymentMethod === method.key && (
                                                <div className="absolute top-2 right-2 w-3 h-3 bg-ocean-500 rounded-full" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Security Note */}
                        <div className="flex items-start gap-3 p-3 bg-kelp-50 dark:bg-kelp-900/20 rounded-lg">
                            <svg className="w-5 h-5 text-kelp-600 dark:text-kelp-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <div className="text-sm text-kelp-700 dark:text-kelp-300">
                                <p className="font-medium">{demoMode ? 'Demo Environment' : 'Secure Payment'}</p>
                                <p className="text-kelp-600 dark:text-kelp-400">
                                    {demoMode
                                        ? 'This is a simulated payment for testing purposes.'
                                        : 'Powered by Razorpay. Your payment details are encrypted and secure.'}
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {paymentStatus !== 'success' && (
                <ModalFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    {!orderData && (
                        <Button onClick={handlePayment} disabled={isLoading} loading={isLoading}>
                            {isLoading ? (
                                <>
                                    <LoadingSpinner size="small" />
                                    <span className="ml-2">Processing...</span>
                                </>
                            ) : demoMode ? (
                                <>🧪 Start Demo Payment</>
                            ) : (
                                <>
                                    {paymentMethod === 'crypto' ? 'Connect Wallet & Pay' : `Pay ₹${amount.toLocaleString()}`}
                                </>
                            )}
                        </Button>
                    )}
                </ModalFooter>
            )}
        </Modal>
    );
};

export default RazorpayCheckout;

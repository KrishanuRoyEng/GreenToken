import React, { useState, useEffect } from 'react';
import { useTokens } from '../hooks/useTokens';
import { useAuth } from '../contexts/AuthContext';
import { Pagination } from '../components/ui';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { RazorpayCheckout } from '../components/payment';
import ProjectDetailModal from '../components/project/ProjectDetailModal';

const MarketplacePage: React.FC = () => {
    const { user } = useAuth();
    const {
        marketplaceOrders,
        isLoading,
        loadMarketplace,
    } = useTokens();

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [selectedProject, setSelectedProject] = useState<any>(null);

    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        if (user) {
            loadMarketplace();
        }
    }, [user, loadMarketplace]);

    const handlePurchaseFromMarketplace = (order: any) => {
        setSelectedOrder(order);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        // Do not close modal here, let RazorpayCheckout handle the success view and redirect
        // Just reload data in background
        loadMarketplace();
    };

    const handleViewProject = (order: any) => {
        if (order.projectId) {
            setSelectedProject({ id: order.projectId, name: order.projectName });
        }
    };

    // Filter marketplace orders
    const filteredOrders = marketplaceOrders.filter(order =>
        order.seller?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-ocean-50 dark:from-slate-900 dark:to-slate-800">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
                        <span className="text-4xl mr-4">🛒</span>
                        Carbon Credit Marketplace
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                        Browse and purchase verified carbon credits from restoration projects
                    </p>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-ocean-600 dark:text-ocean-400">{filteredOrders.length}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Active Listings</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-kelp-600 dark:text-kelp-400">
                            {filteredOrders.reduce((sum, o) => sum + o.amount, 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Total Tokens</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-coastal-600 dark:text-coastal-400">
                            ₹{filteredOrders.length > 0 ? Math.min(...filteredOrders.map(o => o.pricePerToken)) : 0}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Lowest Price</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            ₹{filteredOrders.length > 0 ? Math.round(filteredOrders.reduce((sum, o) => sum + o.pricePerToken, 0) / filteredOrders.length) : 0}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Avg Price</div>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by seller or project..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent text-slate-900 dark:text-white"
                            />
                        </div>
                        <Button variant="outline" onClick={() => loadMarketplace()} disabled={isLoading}>
                            <svg className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Listings */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <LoadingSpinner size="large" />
                        </div>
                    ) : paginatedOrders.length > 0 ? (
                        <>
                            <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                {paginatedOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                    >
                                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                                                        {order.amount} tokens
                                                    </span>
                                                    {order.ecosystemType && (
                                                        <span className="px-2.5 py-1 bg-kelp-100 dark:bg-kelp-900/30 text-kelp-700 dark:text-kelp-400 text-xs font-medium rounded-full">
                                                            {order.ecosystemType}
                                                        </span>
                                                    )}
                                                </div>
                                                {order.projectName && (
                                                    <button
                                                        onClick={() => handleViewProject(order)}
                                                        className="text-sm font-medium text-ocean-600 dark:text-ocean-400 hover:underline mb-2 text-left"
                                                    >
                                                        📁 {order.projectName}
                                                    </button>
                                                )}
                                                {order.location && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                                                        📍 {order.location}
                                                    </p>
                                                )}
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Seller: {order.seller}
                                                </p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                                    Listed: {new Date(order.listedAt).toLocaleDateString()}
                                                </p>
                                            </div>

                                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-kelp-600 dark:text-kelp-400">
                                                        ₹{order.pricePerToken}
                                                    </div>
                                                    <div className="text-sm text-slate-500 dark:text-slate-400">per token</div>
                                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                                                        Total: ₹{order.totalPrice.toLocaleString()}
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={() => handlePurchaseFromMarketplace(order)}
                                                    disabled={isLoading}
                                                    className="whitespace-nowrap"
                                                >
                                                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    Buy Now
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={filteredOrders.length}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-ocean-100 dark:bg-ocean-900/30 flex items-center justify-center">
                                <svg className="h-10 w-10 text-ocean-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
                                No listings available
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                No carbon credits are currently listed for sale. Check back later!
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedOrder && (
                <RazorpayCheckout
                    isOpen={showPaymentModal}
                    onClose={() => { setShowPaymentModal(false); setSelectedOrder(null); }}
                    amount={selectedOrder.totalPrice}
                    tokenAmount={selectedOrder.amount}
                    orderId={selectedOrder.id}
                    sellerName={selectedOrder.seller}
                    onSuccess={handlePaymentSuccess}
                />
            )}

            {/* Project Detail Modal */}
            {selectedProject && (
                <ProjectDetailModal
                    project={selectedProject}
                    onClose={() => setSelectedProject(null)}
                />
            )}
        </div>
    );
};

export default MarketplacePage;

import React from 'react';

interface StatsProps {
    stats: {
        totalUsers: number;
        totalProjects: number;
        pendingProjects: number;
        approvedProjects: number;
        totalCreditsIssued: number;
        totalTransactions: number;
    };
    onFilter: (type: 'projects' | 'users', filter?: string) => void;
}

const AdminStats: React.FC<StatsProps> = ({ stats, onFilter }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Pending Projects Card */}
            <button
                onClick={() => onFilter('projects', 'PENDING')}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow text-left group"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.pendingProjects}</span>
                </div>
                <h3 className="text-slate-600 dark:text-slate-400 font-medium">Pending Approvals</h3>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 font-medium">Action Required</p>
            </button>

            {/* Approved Projects Card */}
            <button
                onClick={() => onFilter('projects', 'APPROVED')}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow text-left group"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-kelp-100 dark:bg-kelp-900/30 rounded-lg text-kelp-600 dark:text-kelp-400 group-hover:bg-kelp-200 dark:group-hover:bg-kelp-900/50 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.approvedProjects}</span>
                </div>
                <h3 className="text-slate-600 dark:text-slate-400 font-medium">Active Projects</h3>
                <p className="text-xs text-kelp-600 dark:text-kelp-500 mt-2 font-medium">Total: {stats.totalProjects}</p>
            </button>

            {/* Total Users Card */}
            <button
                onClick={() => onFilter('users')}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow text-left group"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-ocean-100 dark:bg-ocean-900/30 rounded-lg text-ocean-600 dark:text-ocean-400 group-hover:bg-ocean-200 dark:group-hover:bg-ocean-900/50 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalUsers}</span>
                </div>
                <h3 className="text-slate-600 dark:text-slate-400 font-medium">Total Users</h3>
                <p className="text-xs text-ocean-600 dark:text-ocean-500 mt-2 font-medium">Registered Platform Users</p>
            </button>

            {/* Credit Stats Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-coastal-100 dark:bg-coastal-900/30 rounded-lg text-coastal-600 dark:text-coastal-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                        {(stats.totalCreditsIssued / 1000).toFixed(1)}k
                    </span>
                </div>
                <h3 className="text-slate-600 dark:text-slate-400 font-medium">Total Credits Issued</h3>
                <p className="text-xs text-coastal-600 dark:text-coastal-500 mt-2 font-medium">
                    {stats.totalTransactions} Total Transactions
                </p>
            </div>
        </div>
    );
};

export default AdminStats;

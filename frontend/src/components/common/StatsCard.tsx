import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  className = '',
}) => {
  return (
    <div
      className={`
        bg-white dark:bg-slate-800 rounded-xl p-6
        border border-slate-200 dark:border-slate-700
        shadow-sm hover:shadow-md transition-shadow
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {value}
          </p>
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${trend.isPositive
                  ? 'text-kelp-600 dark:text-kelp-400'
                  : 'text-red-600 dark:text-red-400'
                  }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                vs last month
              </span>
            </div>
          )}
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-xl bg-ocean-50 dark:bg-ocean-900/20 text-ocean-600 dark:text-ocean-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
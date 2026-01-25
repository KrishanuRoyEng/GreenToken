import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'ocean' | 'coastal';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    size?: 'sm' | 'md';
    className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
    success: 'bg-kelp-100 dark:bg-kelp-900/30 text-kelp-700 dark:text-kelp-400',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    info: 'bg-ocean-100 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-400',
    ocean: 'bg-ocean-100 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-400',
    coastal: 'bg-coastal-100 dark:bg-coastal-900/30 text-coastal-700 dark:text-coastal-400',
};

const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
};

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'sm',
    className = '',
}) => {
    return (
        <span
            className={`
        inline-flex items-center font-medium rounded-full
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
        >
            {children}
        </span>
    );
};

export const StatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => {
    const getVariant = (): BadgeVariant => {
        switch (status.toUpperCase()) {
            case 'APPROVED':
            case 'ACTIVE':
            case 'COMPLETED':
                return 'success';
            case 'PENDING':
                return 'warning';
            case 'REJECTED':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <Badge variant={getVariant()} className={className}>
            {status}
        </Badge>
    );
};

export const EcosystemBadge: React.FC<{ ecosystem: string; className?: string }> = ({ ecosystem, className }) => {
    const getVariant = (): BadgeVariant => {
        switch (ecosystem.toUpperCase()) {
            case 'MANGROVE':
                return 'success';
            case 'SEAGRASS':
                return 'ocean';
            case 'SALT_MARSH':
                return 'coastal';
            case 'KELP':
                return 'info';
            default:
                return 'default';
        }
    };

    const formatName = (name: string) => {
        return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <Badge variant={getVariant()} className={className}>
            {formatName(ecosystem)}
        </Badge>
    );
};

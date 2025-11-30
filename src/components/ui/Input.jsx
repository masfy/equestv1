import React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, type, label, error, ...props }, ref) => {
    return (
        <div className="w-full space-y-2">
            {label && (
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                    {label}
                </label>
            )}
            <input
                type={type}
                className={cn(
                    'flex w-full rounded-xl border-2 border-transparent bg-gray-50 px-4 py-3 text-sm ring-offset-white transition-all placeholder:text-gray-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50',
                    error && 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50',
                    className
                )}
                ref={ref}
                {...props}
            />
            {error && <p className="text-xs text-red-500 font-medium ml-1">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';

export { Input };

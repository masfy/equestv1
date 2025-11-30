import React from 'react';
import { cn } from '../../lib/utils';

const GlassCard = React.forwardRef(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md shadow-xl text-white',
            className
        )}
        {...props}
    >
        {children}
    </div>
));
GlassCard.displayName = 'GlassCard';

export { GlassCard };

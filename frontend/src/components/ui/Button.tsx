import { cn } from "@/utils/cn";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-white text-black hover:opacity-92 active:scale-[0.98]',
      secondary: 'bg-transparent border border-white/10 text-white hover:bg-white/5 active:scale-[0.98]',
      outline: 'border border-white/10 text-text-secondary hover:bg-white/5 hover:text-white active:scale-[0.98]',
      ghost: 'text-text-muted hover:text-white hover:bg-white/5 active:scale-[0.98]',
      danger: 'bg-danger text-white hover:opacity-92 active:scale-[0.98]',
      success: 'bg-security text-black hover:opacity-92 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'px-4 py-2 text-xs font-semibold rounded-xl',
      md: 'px-6 py-3 text-sm font-semibold rounded-[14px]',
      lg: 'px-10 py-4 text-base font-bold rounded-[16px]',
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed group',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-current/20 border-t-current" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

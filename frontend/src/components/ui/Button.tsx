import { cn } from "@/utils/cn";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all duration-200',
      secondary: 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20 active:scale-95 transition-all duration-200',
      outline: 'border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white active:scale-95 transition-all duration-200',
      ghost: 'text-slate-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all duration-200',
      danger: 'bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-500/20 active:scale-95 transition-all duration-200',
    };

    const sizes = {
      sm: 'px-4 py-2 text-xs rounded-xl',
      md: 'px-6 py-3 text-sm rounded-xl',
      lg: 'px-8 py-4 text-base rounded-2xl font-bold',
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

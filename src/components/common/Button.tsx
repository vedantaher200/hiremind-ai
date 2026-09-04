import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'hm-button hm-button-primary',
  secondary: 'hm-button hm-button-secondary',
  outline: 'hm-button hm-button-outline',
  danger: 'hm-button hm-button-danger',
  success: 'hm-button hm-button-success'
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading = false, disabled, className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${variantClasses[variant]} ${className}`.trim()}
      {...props}
    >
      {loading && <span className="hm-button-spinner" aria-hidden="true" />}
      {children}
    </button>
  )
);

Button.displayName = 'Button';

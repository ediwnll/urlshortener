import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button style variant */
  variant?: 'accent' | 'brutal'
}

/** Styled button component with brutal design */
export function Button({ variant = 'accent', className = '', children, ...props }: ButtonProps) {
  const baseClass = variant === 'accent' ? 'btn-accent' : 'btn-brutal'
  
  return (
    <button
      className={`${baseClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

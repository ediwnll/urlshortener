import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Whether the input has an error state */
  hasError?: boolean
}

/** Styled input component with brutal design */
export function Input({ hasError, className = '', ...props }: InputProps) {
  return (
    <input
      className={`input-brutal ${hasError ? 'border-[#ff3333]' : ''} ${className}`}
      {...props}
    />
  )
}

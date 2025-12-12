import type { InputHTMLAttributes, ReactElement } from 'react'
import { forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className = '', id, ...props },
  ref
): ReactElement {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  const hasError = error !== undefined && error !== ''

  return (
    <div className="w-full">
      {label !== undefined && label !== '' && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full rounded-lg border px-4 py-2.5 text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 ${
          hasError
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:focus:border-indigo-400 dark:focus:ring-indigo-400'
        } ${className}`}
        {...props}
      />
      {hasError && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
})

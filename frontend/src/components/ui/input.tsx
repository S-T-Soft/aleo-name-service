import * as React from "react"

import { cn } from "@/lib/util"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  suffix?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, suffix='', ...props }, ref) => {
    return (
      <div className="flex mb-4 border-2 border-gray-600 md:focus-within:border-aquamarine rounded-full">
        <input
          className={cn(
            "h-16 flex-grow appearance-none rounded-full border-r-0 py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 dark:hover:border-teal dark:focus:border-aquamarine dark:border-gray-600 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500",
            suffix !== '' ? 'md:rounded-l-full md:rounded-r-none ltr:pl-8 rtl:pr-8' : '',
            className
            )}
          type={type}
          autoComplete={"off"}
          ref={ref}
          {...props}
        />
        {suffix !== '' && <span
          className="hidden md:flex h-16 bg-gray-700 border-l-0 border-gray-600 items-center justify-center py-1 px-3 text-lg text-gray-400 rounded-r-full">{suffix}</span>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
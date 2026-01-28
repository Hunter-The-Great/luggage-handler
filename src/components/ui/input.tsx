import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-neutral-950 placeholder:text-neutral-500 selection:bg-neutral-900 selection:text-neutral-50 dark:bg-neutral-700/40 dark:hover:bg-neutral-600/40 border-neutral-200 h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:file:text-neutral-50 dark:placeholder:text-neutral-500 dark:selection:bg-blue-300/60 dark:selection:text-neutral-50  dark:border-white/40",
        "dark:focus-visible:bg-neutral-600/40 focus-visible:border-blue-600 focus-visible:inset-ring-blue-600 focus-visible:inset-ring-[1px] focus-visible:ring-neutral-200 focus-visible:ring-[1px] dark:focus-visible:border-neutral-300 dark:focus-visible:ring-neutral-300",
        "aria-invalid:ring-red-500/20 aria-invalid:border-red-500 dark:aria-invalid:ring-red-900/20 dark:dark:aria-invalid:ring-red-900/40 dark:aria-invalid:border-red-900",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function NativeSelect({
  className,
  size = "default",
  ...props
}: Omit<React.ComponentProps<"select">, "size"> & { size?: "sm" | "default" }) {
  return (
    <div
      className="group/native-select relative w-fit has-[select:disabled]:opacity-50"
      data-slot="native-select-wrapper"
    >
      <select
        data-slot="native-select"
        data-size={size}
        className={cn(
          "border-neutral-200 placeholder:text-neutral-500 selection:bg-neutral-700/40 selection:text-neutral-50 dark:bg-neutral-700/40 dark:hover:bg-neutral-600/40 h-9 w-full min-w-0 appearance-none rounded-md border px-3 py-2 pr-9 text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed data-[size=sm]:h-8 data-[size=sm]:py-1 dark:border-white/40 dark:placeholder:text-neutral-400 dark:selection:bg-neutral-50 dark:selection:text-neutral-900",
          "focus-visible:border-blue-600 focus-visible:ring-neutral-200 focus-visible:ring-[1px] dark:focus-visible:border-neutral-300 dark:focus-visible:ring-neutral-200 dark:focus-visible:inset-ring-blue-600 focus-visible:inset-ring-[1px]",
          "aria-invalid:ring-red-500/20 aria-invalid:border-red-500 dark:aria-invalid:ring-red-900/20 dark:dark:aria-invalid:ring-red-900/40 dark:aria-invalid:border-red-900",
          className,
        )}
        {...props}
      />
      <ChevronDownIcon
        className="text-neutral-500 pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 opacity-50 select-none dark:text-neutral-400"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  );
}

function NativeSelectOption({ ...props }: React.ComponentProps<"option">) {
  return <option data-slot="native-select-option" {...props} />;
}

function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn(className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };

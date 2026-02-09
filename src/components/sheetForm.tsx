import { useState, type ReactNode } from "react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Spinner } from "./ui/spinner";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

export const SheetForm = (props: {
  title: string;
  label: string;
  loading?: string | null;
  success?: string | null;
  error?: string | null;
  cssDisabled?: boolean;
  handleSubmit: (...args: any) => Promise<any>;
  submitArgs?: Array<any>;
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={
          props.cssDisabled
            ? "text-sm text-left px-2 py-1 rounded-sm text-neutral-400/80 dark:hover:bg-neutral-700/60 w-full"
            : "bg-blue-800 rounded-lg border border-blue-600/70 hover:border-blue-700/70 text-blue-50 hover:bg-blue-900/90 dark:bg-blue-700 dark:text-white dark:hover:bg-blue-800 hover:shadow dark:hover:shadow px-2"
        }
      >
        {props.label}
      </SheetTrigger>
      <SheetContent side="right">
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="flex flex-col h-3/4 justify-center pr-4"
        >
          <div className="flex bg-transparent px-4 p-3 flex-col">
            <h1 className="pb-1 font-semibold text-lg">{props.title}</h1>
            <Separator />
            <div className="flex h-4" />
            {props.children}
            <div className="pt-4 flex justify-between items-center">
              <div>
                {props.loading ? (
                  <div className="flex flex-row items-center">
                    <Spinner />
                    <div className="text-center pl-1 text-lg">
                      {props.loading}
                    </div>
                  </div>
                ) : null}
                {props.error ? (
                  <div className="text-red-400 text-lg text-center">
                    {props.error}
                  </div>
                ) : null}
                {props.success ? (
                  <div className="text-green-400 text-lg text-center">
                    {props.success}
                  </div>
                ) : null}
              </div>
              <Button
                variant="primary"
                className="self-end"
                onClick={() => {
                  props.handleSubmit(...(props.submitArgs || [])).then(() => {
                    setOpen(false);
                  });
                }}
              >
                Submit
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

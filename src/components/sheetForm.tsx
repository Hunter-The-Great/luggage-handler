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
  open?: boolean;
  setOpen?: (open: boolean) => void;
  handleSubmit: (...args: any) => Promise<void>;
  submitArgs?: Array<any>;
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>{props.label}</SheetTrigger>
      <SheetContent side="right" showCloseButton={false}>
        <div className="flex flex-col h-3/4 justify-center pr-4">
          <div className="flex bg-neutral-800/95 border rounded-lg border-neutral-600 px-4 shadow p-3 flex-col">
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
        </div>
      </SheetContent>
    </Sheet>
  );
};

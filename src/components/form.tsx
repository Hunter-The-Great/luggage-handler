import type { ReactNode } from "react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Spinner } from "./ui/spinner";

export const Form = (props: {
  title: string;
  loading?: string | null;
  success?: string | null;
  error?: string | null;
  handleSubmit: (...args: any) => void;
  submitArgs?: Array<any>;
  children: ReactNode;
}) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="flex bg-neutral-700/40 border w-1/2 rounded-lg border-neutral-600 px-4 shadow p-3  flex-col"
    >
      <h1 className="pb-1 font-semibold text-lg">{props.title}</h1>
      <Separator />
      <div className="flex h-4" />
      {props.children}
      <div className="pt-4 flex justify-between items-center">
        <div>
          {props.loading ? (
            <div className="flex flex-row items-center">
              <Spinner />
              <div className="text-center pl-1 text-lg">{props.loading}</div>
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
          onClick={() => props.handleSubmit(...(props.submitArgs || []))}
        >
          Submit
        </Button>
      </div>
    </form>
  );
};

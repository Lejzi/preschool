import { clsx } from "clsx";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  fullScreen,
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClass = { sm: "h-5 w-5", md: "h-8 w-8", lg: "h-12 w-12" }[size];

  const spinner = (
    <div
      className={clsx(
        "animate-spin rounded-full border-4 border-brand-200 border-t-brand-600",
        sizeClass,
      )}
    />
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-8">{spinner}</div>;
}

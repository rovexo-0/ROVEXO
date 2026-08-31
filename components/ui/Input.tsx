import { cn } from "@/lib/cn";
import { forwardRef, type InputHTMLAttributes } from "react";
/* OPT-HP-PERF: forms.css left platform index — load with form primitives. */
import "@/styles/rovexo/forms.css";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, type = "text", ...props }, ref) {
  return <input ref={ref} type={type} className={cn("rx-input", className)} {...props} />;
});

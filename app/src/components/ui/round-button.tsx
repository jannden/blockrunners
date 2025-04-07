import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const roundButtonVariants = cva(
  "relative inline-flex items-center justify-center rounded-full border-2 cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50 group aspect-square",
  {
    variants: {
      variant: {
        primary:
          "bg-[#FFDC58] text-black hover:bg-[#FFDC58] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[-2px_-2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]",
        token:
          "transform rotate-12 font-bold text-lg bg-black text-white hover:bg-black border-[#FF5A5F] shadow-[2px_2px_0px_0px_rgba(255,90,95,1)] hover:shadow-[-2px_-2px_0px_0px_rgba(255,90,95,1)] hover:translate-x-[1px] hover:translate-y-[1px]",
      },
      size: {
        default: "w-10 h-10 min-w-[2.5rem] min-h-[2.5rem]",
        sm: "w-8 h-8 min-w-[2rem] min-h-[2rem]",
        lg: "w-12 h-12 min-w-[3rem] min-h-[3rem]",
        xl: "w-16 h-16 min-w-[4rem] min-h-[4rem]",
      },
    },
    defaultVariants: {
      variant: "token",
      size: "default",
    },
  }
);

export interface RoundButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof roundButtonVariants> {
  asChild?: boolean;
}

const RoundButton = React.forwardRef<HTMLButtonElement, RoundButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(roundButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

RoundButton.displayName = "RoundButton";

export { RoundButton, roundButtonVariants };

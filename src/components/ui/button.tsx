import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-semibold ring-offset-background transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-x-[2px] active:translate-y-[2px]",
  {
    variants: {
      variant: {
        default:
          "border-2 border-foreground bg-primary text-primary-foreground shadow-stamp-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-stamp",
        destructive:
          "border-2 border-foreground bg-destructive text-destructive-foreground shadow-stamp-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-stamp",
        outline:
          "border-2 border-foreground bg-card text-foreground shadow-stamp-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-stamp hover:bg-secondary",
        secondary:
          "border-2 border-foreground bg-secondary text-secondary-foreground shadow-stamp-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-stamp",
        ghost: "hover:bg-secondary/60 hover:text-foreground",
        link: "text-primary underline underline-offset-4 decoration-2",
        hero:
          "border-2 border-foreground bg-foreground text-background shadow-stamp hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-stamp-lg hover:bg-primary",
        soft:
          "border-2 border-foreground/40 bg-card text-foreground hover:border-foreground hover:bg-secondary hover:shadow-stamp-sm",
        accent:
          "border-2 border-foreground bg-accent text-accent-foreground shadow-stamp-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-stamp",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-7 text-base",
        xl: "h-14 px-9 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

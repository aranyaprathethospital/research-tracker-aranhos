import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[#55346f]",
        destructive: "bg-rose-600 text-white hover:bg-rose-700",
        outline: "border border-border bg-white text-foreground hover:bg-[#f8f7fa]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[#e8e4ed]",
        ghost: "text-[#62596d] hover:bg-[#f2f0f5] hover:text-[#39244c]",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-[#648d35] text-white hover:bg-[#55782d]",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 rounded-md px-3 text-sm",
        lg: "h-11 rounded-lg px-5 text-base",
        icon: "size-10 rounded-lg p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };

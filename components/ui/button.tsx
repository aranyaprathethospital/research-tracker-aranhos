import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-base font-bold leading-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-[#4e305f] bg-[#59396b] text-white shadow-[0_1px_2px_#35213b20] hover:bg-[#493055]",
        destructive: "bg-rose-600 text-white hover:bg-rose-700",
        outline: "border border-[#ded7d4] bg-white text-foreground hover:border-[#cbbdce] hover:bg-[#faf7fa]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[#e8e4ed]",
        ghost: "text-[#62596d] hover:bg-[#f2f0f5] hover:text-[#39244c]",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-[#648d35] text-white hover:bg-[#55782d]",
      },
      size: {
        default: "min-h-11 px-4",
        sm: "min-h-9 rounded-md px-3 text-sm",
        lg: "min-h-12 rounded-lg px-5 text-lg",
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

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/10 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground [a]:hover:bg-primary/85",
        secondary: "border-transparent bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive: "border-transparent bg-rose-50 text-rose-700 [a]:hover:bg-rose-100",
        outline: "border-border bg-white text-foreground [a]:hover:bg-[#f8f7fa]",
        ghost: "border-transparent text-foreground hover:bg-[#f2f0f5]",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };

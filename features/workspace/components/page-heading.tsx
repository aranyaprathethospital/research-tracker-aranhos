import type { ReactNode } from "react";

type PageHeadingProps = {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function PageHeading({ eyebrow, title, description, action }: PageHeadingProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-[#ded8d1] pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pb-6">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <p className="mb-2 text-lg font-bold leading-none text-[#69467e]">{eyebrow}</p>}
        <h1 className="text-4xl font-bold leading-[1.06] tracking-tight text-[#302439] sm:text-5xl lg:text-[3.5rem]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-lg leading-snug text-[#675e6d] sm:text-xl">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{action}</div>}
    </div>
  );
}

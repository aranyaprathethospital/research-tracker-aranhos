import type { ReactNode } from "react";

type PageHeadingProps = {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function PageHeading({ eyebrow, title, description, action }: PageHeadingProps) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-[#e8e6ec] pb-6 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pb-7">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <p className="mb-2 text-xs font-semibold text-[#736184] sm:text-sm">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-[#30283a] sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#797381] sm:text-base sm:leading-7">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center">{action}</div>}
    </div>
  );
}

export const capabilityNames = { ADVISOR: "Advisor", ADVISEE: "Advisee" } as const;

export const systemRoleNames: Record<string, string> = {
  USER: "ผู้ใช้ทั่วไป",
  PM: "PM",
  SUPERADMIN: "Superadmin",
};

export const inputClass =
  "h-12 rounded-xl border-[#dfd6e7] bg-white text-base text-foreground transition-colors hover:border-[#c8b6d4] focus-visible:border-primary focus-visible:ring-primary/15";

export const selectClass =
  "h-12 w-full rounded-xl border border-[#dfd6e7] bg-white px-3 text-base font-medium text-foreground outline-none transition-colors hover:border-[#c8b6d4] focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15";

export function FormField({
  label,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`block min-w-0 space-y-1.5 text-sm font-semibold text-[#51465b] ${className}`}
    >
      <span className="block">{label}</span>
      {children}
      {error ? (
        <span className="block text-xs font-medium leading-5 text-[#a44e43]">
          {error}
        </span>
      ) : hint ? (
        <span className="block text-xs font-normal leading-5 text-[#948b9b]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

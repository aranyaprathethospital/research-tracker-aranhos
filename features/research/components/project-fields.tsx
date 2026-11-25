export const fieldClass = "h-11 rounded-xl border-[#e7e1eb] bg-white text-base focus-visible:border-[#9774b2] focus-visible:ring-[#9774b2]/20";

export const textareaClass = "min-h-24 rounded-xl border-[#e7e1eb] bg-white text-base focus-visible:border-[#9774b2] focus-visible:ring-[#9774b2]/20";

export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`block min-w-0 space-y-2 text-sm font-semibold text-[#51465b] ${className}`}>{label}{children}</label>; }

import { cn } from "@/utils/formatters";

export default function Card({ children, className }) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-soft backdrop-blur",
        className,
      )}
    >
      {children}
    </section>
  );
}

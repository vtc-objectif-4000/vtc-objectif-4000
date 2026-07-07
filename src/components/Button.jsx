import { Link } from "react-router-dom";
import { cn } from "@/utils/formatters";

const VARIANTS = {
  primary: "bg-pine-700 text-white hover:bg-pine-900",
  secondary: "bg-white text-pine-900 ring-1 ring-pine-100 hover:bg-pine-50",
  ghost: "bg-transparent text-pine-900 hover:bg-pine-50",
  danger: "bg-coral-500 text-white hover:bg-coral-500/90",
};

const SIZES = {
  sm: "min-h-10 px-4 text-sm",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-6 text-base",
};

export default function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  to,
  href,
  type = "button",
  ...props
}) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-full font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-pine-300 disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  if (to) {
    return (
      <Link className={classes} to={to} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a className={classes} href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}

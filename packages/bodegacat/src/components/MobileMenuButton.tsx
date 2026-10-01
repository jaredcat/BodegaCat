export default function MobileMenuButton({
  open,
  onToggle,
  className,
  label,
}: Readonly<{
  open: boolean;
  onToggle: () => void;
  className: string;
  label: string;
}>) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={className}
      aria-label={label}
    >
      <svg
        className={`${open ? "hidden" : "block"} h-6 w-6`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
      <svg
        className={`${open ? "block" : "hidden"} h-6 w-6`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}

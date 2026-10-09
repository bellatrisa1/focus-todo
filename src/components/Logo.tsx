export function Logo() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="20" fill="currentColor" />
      <circle
        cx="32"
        cy="32"
        r="20"
        stroke="white"
        strokeOpacity=".25"
        strokeWidth="2"
      />
      <path
        d="M19 32l9 9 18-21"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="47" cy="17" r="4" fill="#c7f6d5" />
    </svg>
  );
}

"use client";

interface FloatingActionButtonProps {
  onClick: () => void;
  label: string;
}

export default function FloatingActionButton({
  onClick,
  label,
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 bg-japandi-accent-primary hover:bg-japandi-accent-hover text-white rounded-full w-16 h-16 flex items-center justify-center shadow-button transition-all hover:scale-105 z-10"
      aria-label={label}
    >
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    </button>
  );
}


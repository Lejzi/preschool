import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { clsx } from "clsx";

export type SearchSelectOption = {
  value: string;
  label: string;
  description?: string;
  keywords?: string;
};

type SearchSelectProps = {
  options: SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
};

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Choose an option",
  searchPlaceholder = "Search",
  emptyLabel = "No results",
  disabled = false,
  className,
}: SearchSelectProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) =>
      [option.label, option.description || "", option.keywords || ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) return;

    searchRef.current?.focus();

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={clsx("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={clsx(
          "input flex items-center justify-between gap-3 text-left cursor-pointer",
          disabled && "cursor-not-allowed",
        )}
        onClick={() => {
          if (!disabled) {
            setIsOpen((open) => !open);
            if (isOpen) {
              setQuery("");
            }
          }
        }}
      >
        <span
          className={clsx(
            "truncate",
            selectedOption ? "text-slate-900" : "text-slate-400",
          )}
        >
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={clsx(
            "shrink-0 text-slate-400 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 rounded-xl border border-slate-200 bg-white p-2 shadow-[var(--shadow-elevated)]"
        >
          <div className="relative mb-2">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="input pl-9"
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="rounded-lg px-3 py-8 text-center text-sm text-slate-500">
                {emptyLabel}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={clsx(
                      "flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors cursor-pointer",
                      isSelected
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-700 hover:bg-slate-50",
                    )}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setQuery("");
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{option.label}</span>
                      {option.description && (
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {option.description}
                        </span>
                      )}
                    </span>
                    {isSelected && <Check size={15} className="mt-0.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}


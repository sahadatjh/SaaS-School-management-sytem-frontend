"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { dmyToIso, isoToDmy } from "@/lib/date";

export interface DateInputProps {
  id?: string;
  value?: string; // Expects ISO string YYYY-MM-DD
  onChange?: (isoDateString: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function applyDmyMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function isValidDmy(dmy: string): boolean {
  const match = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const [, dStr, mStr, yStr] = match;
  const d = parseInt(dStr, 10);
  const m = parseInt(mStr, 10);
  const y = parseInt(yStr, 10);
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  if (y < 1900 || y > 2100) return false;
  const dateObj = new Date(y, m - 1, d);
  return (
    dateObj.getFullYear() === y &&
    dateObj.getMonth() === m - 1 &&
    dateObj.getDate() === d
  );
}

export function DateInput({
  id,
  value = "",
  onChange,
  required = false,
  disabled = false,
  placeholder = "dd/mm/yyyy",
  className,
}: DateInputProps) {
  const [displayValue, setDisplayValue] = useState(() => isoToDmy(value));
  const [open, setOpen] = useState(false);

  // Calendar navigation state
  const initialDate = value ? new Date(value) : new Date();
  const validInitial = isNaN(initialDate.getTime()) ? new Date() : initialDate;

  const [viewYear, setViewYear] = useState(validInitial.getFullYear());
  const [viewMonth, setViewMonth] = useState(validInitial.getMonth());

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync display value when parent value changes
  useEffect(() => {
    if (value) {
      const dmy = isoToDmy(value);
      setDisplayValue(dmy);
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    } else {
      setDisplayValue("");
    }
  }, [value]);

  // Handle click outside to close popover
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Handle typing inside text input
  function handleTextInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = applyDmyMask(e.target.value);
    setDisplayValue(masked);

    if (masked.length === 10) {
      if (isValidDmy(masked)) {
        const iso = dmyToIso(masked);
        onChange?.(iso);
        const [d, m, y] = masked.split("/").map(Number);
        setViewYear(y);
        setViewMonth(m - 1);
      }
    } else if (masked.length === 0) {
      onChange?.("");
    }
  }

  function handleSelectDate(day: number) {
    const yStr = String(viewYear);
    const mStr = String(viewMonth + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");

    const iso = `${yStr}-${mStr}-${dStr}`;
    const dmy = `${dStr}/${mStr}/${yStr}`;

    setDisplayValue(dmy);
    onChange?.(iso);
    setOpen(false);
  }

  function handlePrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  }

  function handleNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  }

  function handleToday() {
    const today = new Date();
    const yStr = String(today.getFullYear());
    const mStr = String(today.getMonth() + 1).padStart(2, "0");
    const dStr = String(today.getDate()).padStart(2, "0");

    const iso = `${yStr}-${mStr}-${dStr}`;
    const dmy = `${dStr}/${mStr}/${yStr}`;

    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setDisplayValue(dmy);
    onChange?.(iso);
    setOpen(false);
  }

  function handleClear() {
    setDisplayValue("");
    onChange?.("");
    setOpen(false);
  }

  // Calculate calendar days
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Selected date components
  let selectedYear: number | null = null;
  let selectedMonth: number | null = null;
  let selectedDay: number | null = null;

  if (value) {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      selectedYear = parseInt(match[1], 10);
      selectedMonth = parseInt(match[2], 10) - 1;
      selectedDay = parseInt(match[3], 10);
    }
  }

  const today = new Date();
  const isTodayYear = today.getFullYear() === viewYear;
  const isTodayMonth = today.getMonth() === viewMonth;
  const todayDay = today.getDate();

  // Generate Year options from current - 40 to current + 20
  const currentFullYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentFullYear - 40; y <= currentFullYear + 20; y++) {
    yearOptions.push(y);
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleTextInputChange}
          required={required}
          disabled={disabled}
          maxLength={10}
          className={cn(
            "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 pr-10 text-sm text-slate-950 font-normal outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        />

        {/* Calendar picker toggle button */}
        <button
          type="button"
          onClick={() => {
            if (!disabled) setOpen((prev) => !prev);
          }}
          disabled={disabled}
          aria-label="Toggle calendar"
          className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none disabled:opacity-40 transition-colors"
        >
          <CalendarIcon className="size-4" />
        </button>
      </div>

      {/* Pure React Custom Calendar Popover (Zero Native mm/dd/yyyy) */}
      {open && (
        <div
          role="dialog"
          aria-label="Date Picker"
          className="absolute top-full left-0 z-50 mt-1.5 w-72 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl animate-in fade-in-0 zoom-in-95"
        >
          {/* Calendar Header: Month/Year Dropdowns + Arrows */}
          <div className="flex items-center justify-between gap-1 mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month selector */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="h-7 rounded-md border border-slate-200 bg-slate-50 px-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Year selector */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="h-7 rounded-md border border-slate-200 bg-slate-50 px-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 mb-1">
            {WEEK_DAYS.map((wd) => (
              <div key={wd} className="py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Previous month padding days */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => {
              const prevDay = daysInPrevMonth - firstDayOfWeek + idx + 1;
              return (
                <div
                  key={`prev-${idx}`}
                  className="py-1.5 text-slate-300 select-none text-[11px]"
                >
                  {prevDay}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isSelected =
                selectedYear === viewYear &&
                selectedMonth === viewMonth &&
                selectedDay === day;
              const isToday = isTodayYear && isTodayMonth && todayDay === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  className={cn(
                    "h-7 w-7 mx-auto rounded-lg text-xs font-medium transition-all select-none flex items-center justify-center",
                    isSelected
                      ? "bg-orange-600 text-white font-semibold shadow-xs"
                      : isToday
                        ? "border border-orange-500 text-orange-600 font-bold hover:bg-orange-50"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer with Today, Clear, and Format Indicator */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Format: dd/mm/yyyy
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToday}
                className="px-2 py-1 text-[11px] font-semibold text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
              >
                Today
              </button>
              {displayValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

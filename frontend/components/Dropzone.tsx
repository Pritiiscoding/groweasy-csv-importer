"use client";

import { useCallback, useRef, useState } from "react";

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

export default function Dropzone({ onFile, disabled }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.name.toLowerCase().endsWith(".csv")) {
        alert("Please upload a .csv file.");
        return;
      }
      onFile(file);
    },
    [onFile]
  );

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-16 text-center transition-colors ${
        isDragging
          ? "border-amber bg-amber/5"
          : "border-ink-line bg-ink-soft hover:border-amber/60"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        className="text-amber"
      >
        <path
          d="M20 6v20m0-20 7 7m-7-7-7 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 28v3a3 3 0 0 0 3 3h22a3 3 0 0 0 3-3v-3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <p className="font-display text-base font-medium text-mist">
        Drop a CSV, or click to browse
      </p>
      <p className="max-w-sm text-sm text-mist-muted">
        Facebook exports, Google Ads exports, real-estate CRM sheets, manual
        spreadsheets — any layout works.
      </p>
    </div>
  );
}

"use client";

import * as React from "react";
import { useState } from "react";
import { Upload, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, onChange, accept, ...props }, ref) => {
    const [fileName, setFileName] = useState<string>("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setFileName(e.target.files[0].name);
      } else {
        setFileName("");
      }
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <label className={cn(
        "flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-bg-elevated/50 px-3.5 transition-all duration-200 hover:border-border-strong hover:bg-bg-elevated focus-within:ring-2 focus-within:ring-fire/30 focus-within:border-fire/60",
        className
      )}>
        <span className="flex items-center gap-2.5 min-w-0 flex-1">
          {fileName ? (
            <CheckCircle2 className="size-4 text-success shrink-0" />
          ) : (
            <Upload className="size-4 text-content-secondary shrink-0" />
          )}
          <span className="truncate text-xs text-content-secondary pr-3 font-medium">
            {fileName || "Choose file..."}
          </span>
        </span>
        <span className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15 active:scale-95 transition-all duration-150 select-none">
          Browse
        </span>
        <input
          type="file"
          ref={ref}
          onChange={handleFileChange}
          accept={accept}
          className="sr-only"
          {...props}
        />
      </label>
    );
  }
);

FileInput.displayName = "FileInput";

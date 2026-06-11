"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface SettingsSection {
  id: string;
  label: string;
  content: React.ReactNode;
}

export function SettingsTabs({ sections }: { sections: SettingsSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  return (
    <div>
      <div className="no-scrollbar -mx-4 mb-5 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              active === s.id
                ? "bg-fire/15 text-warm"
                : "text-content-secondary hover:bg-bg-elevated",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      {sections.map((s) => (
        <div key={s.id} className={active === s.id ? "block" : "hidden"}>
          {s.content}
        </div>
      ))}
    </div>
  );
}

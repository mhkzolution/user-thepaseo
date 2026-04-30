"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

interface Item {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
}

export default function SimpleAccordion({ items }: { items: Item[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <div
            key={item.id}
            className="border rounded-xl overflow-hidden"
          >
            {/* HEADER */}
            <button
              onClick={() =>
                setOpenId(isOpen ? null : item.id)
              }
              className={clsx(
                "w-full flex items-center justify-between px-2 py-2 text-left transition-colors bg-gray-50",
                isOpen && "bg-paseo text-black text-sm"
              )}
            >
              <div className="font-medium">{item.title}</div>

              <ChevronDown
                className={clsx(
                  "h-4 w-4 transition-transform",
                  isOpen && "rotate-180 text-white"
                )}
              />
            </button>

            {/* CONTENT */}
            {isOpen && (
              <div className="px-2 py-2 text-xs bg-white text-gray-700">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

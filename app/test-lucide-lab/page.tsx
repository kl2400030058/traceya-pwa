"use client"

import { Icon } from "lucide-react";
import * as labIcons from "@lucide/lab";

export default function TestLucideLabPage() {
  // Check if burger icon exists in the imported module
  const { burger } = labIcons;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Testing @lucide/lab Icons</h1>
      <div className="flex items-center gap-4">
        {burger ? (
          <Icon iconNode={burger} size={48} />
        ) : (
          <div className="text-red-500">Burger icon not found in @lucide/lab</div>
        )}
        <span>Burger icon from @lucide/lab</span>
      </div>
    </div>
  );
}
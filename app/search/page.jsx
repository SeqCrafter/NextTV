"use client";

import { Suspense } from "react";
import SearchContent from "@/components/SearchContent";

export default function Search() {
  return (
    <Suspense fallback={<div className="w-full max-w-7xl flex flex-col gap-8 pt-6">加载中...</div>}>
      <SearchContent />
    </Suspense>
  );
}

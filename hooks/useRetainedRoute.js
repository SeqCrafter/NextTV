"use client";

import { useLayoutEffect, useState } from "react";
import { createStore, useStore } from "zustand";
import { useParams, usePathname, useSearchParams } from "next/navigation";

export function useRetainedRoute() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const paramsKey = JSON.stringify(useParams() ?? {});
  const [store] = useState(() => createStore(() => ({ pathname, search, paramsKey })));
  const route = useStore(store);

  // Activity pauses layout effects, not renders or the router's global contexts.
  useLayoutEffect(() => {
    const previous = store.getState();
    if (previous.pathname !== pathname || previous.search !== search || previous.paramsKey !== paramsKey) {
      store.setState({ pathname, search, paramsKey });
    }
  }, [pathname, search, paramsKey, store]);

  return { pathname: route.pathname, searchParams: new URLSearchParams(route.search), params: JSON.parse(route.paramsKey) };
}

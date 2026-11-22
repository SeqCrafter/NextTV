"use client";

import { useLayoutEffect, useState } from "react";
import { createStore, useStore } from "zustand";

export function useActivityPortal() {
  const [store] = useState(() => createStore(() => ({ root: null })));
  const root = useStore(store, (state) => state.root);
  useLayoutEffect(() => {
    const element = document.createElement("div");
    element.dataset.activityPortal = "";
    document.body.appendChild(element);
    store.setState({ root: element });
    // body portals are outside Activity's hidden DOM subtree.
    return () => {
      element.remove();
      store.setState({ root: null });
    };
  }, [store]);
  return root;
}

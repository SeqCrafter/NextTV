"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, useIsPresent } from "motion/react";
import * as m from "motion/react-m";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useActivityPortal } from "@/hooks/useActivityPortal";
import { reducedMotionQuery } from "@/lib/motion";
import { MaterialSymbolsCheckRounded, MaterialSymbolsChevronRightRounded } from "@/components/icons";

export function Select({
  id,
  name,
  value,
  options = [],
  onChange,
  disabled = false,
  size = "default",
  className = "",
  placeholder = "请选择",
  "aria-label": label,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
}) {
  const portalRoot = useActivityPortal();
  const generatedId = useId();
  const triggerId = id || generatedId;
  const listId = `${triggerId}-options`;
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const typeaheadRef = useRef({ text: "", time: 0 });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState(null);
  const reduceMotion = useMediaQuery(reducedMotionQuery);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = options[selectedIndex];
  const enabledIndices = options.flatMap((option, index) => option.disabled ? [] : [index]);
  const unavailable = disabled || enabledIndices.length === 0;
  const menuWidth = position?.width;

  useLayoutEffect(() => () => setOpen(false), []);

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (unavailable || !trigger?.isConnected || !trigger.getClientRects().length) {
        setOpen(false);
        return;
      }
      const rect = trigger.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop || 0;
      const viewportLeft = viewport?.offsetLeft || 0;
      const viewportWidth = viewport?.width || window.innerWidth;
      const viewportHeight = viewport?.height || window.innerHeight;
      if (rect.bottom <= viewportTop || rect.top >= viewportTop + viewportHeight) {
        setOpen(false);
        return;
      }
      const below = Math.max(0, viewportTop + viewportHeight - rect.bottom - 14);
      const above = Math.max(0, rect.top - viewportTop - 14);
      const menu = menuRef.current;
      const contentHeight = menu ? menu.scrollHeight + menu.offsetHeight - menu.clientHeight : options.reduce((height, option) => height + (option.description ? 64 : 44), 10);
      const side = below < Math.min(contentHeight, 288) && above > below ? "top" : "bottom";
      const maxHeight = Math.min(288, side === "top" ? above : below);
      const width = Math.min(rect.width, viewportWidth - 16);
      const next = {
        side,
        width,
        maxHeight,
        left: Math.max(viewportLeft + 8, Math.min(rect.left, viewportLeft + viewportWidth - width - 8)),
        top: side === "top" ? rect.top - 6 - Math.min(contentHeight, maxHeight) : rect.bottom + 6,
      };
      setPosition((current) => current && Object.keys(next).every((key) => current[key] === next[key]) ? current : next);
    }

    function closeOutside(event) {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    }

    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    observer.observe(triggerRef.current);
    if (menuRef.current) observer.observe(menuRef.current);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.visualViewport?.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("scroll", updatePosition);
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.visualViewport?.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("scroll", updatePosition);
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
    };
  }, [open, options, unavailable, menuWidth]);

  useLayoutEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const option = menu?.children[activeIndex];
    if (!option) return;
    if (option.offsetTop < menu.scrollTop) menu.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > menu.scrollTop + menu.clientHeight) {
      menu.scrollTop = option.offsetTop + option.offsetHeight - menu.clientHeight;
    }
  }, [open, activeIndex, menuWidth]);

  function openMenu(index = selectedIndex >= 0 && !selectedOption.disabled ? selectedIndex : enabledIndices[0]) {
    if (unavailable) return;
    typeaheadRef.current = { text: "", time: 0 };
    setActiveIndex(index);
    setOpen(true);
  }

  function choose(index) {
    const option = options[index];
    if (!option || option.disabled) return;
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
    if (option.value !== value) onChange?.(option.value);
  }

  function handleKeyDown(event) {
    if (unavailable || event.nativeEvent.isComposing) return;
    const { key } = event;
    if (key === "Tab") {
      setOpen(false);
      return;
    }
    if (key === "Escape") {
      if (open) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
      if (event.altKey && key === "ArrowUp") return setOpen(false);
      if (key === "Home" || key === "End") return openMenu(key === "Home" ? enabledIndices[0] : enabledIndices.at(-1));
      if (key === "Enter" || key === " ") return open ? choose(activeIndex) : openMenu();
      if (!open) return openMenu();
      const current = enabledIndices.indexOf(activeIndex);
      const next = Math.max(0, Math.min(enabledIndices.length - 1, current + (key === "ArrowDown" ? 1 : -1)));
      setActiveIndex(enabledIndices[next]);
      return;
    }
    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = event.timeStamp;
      const text = now - typeaheadRef.current.time < 700 ? typeaheadRef.current.text + key : key;
      typeaheadRef.current = { text, time: now };
      const prefix = (new Set(text.toLocaleLowerCase()).size === 1 ? key : text).toLocaleLowerCase();
      const start = open ? activeIndex : selectedIndex;
      const index = Array.from({ length: options.length }, (_, offset) => (start + offset + 1) % options.length)
        .find((candidate) => !options[candidate].disabled && options[candidate].label.toLocaleLowerCase().startsWith(prefix));
      if (index !== undefined) {
        event.preventDefault();
        setActiveIndex(index);
        setOpen(true);
      }
    }
  }

  return (
    <div className={`relative min-w-0 w-full ${className}`} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && options[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        disabled={unavailable}
        onClick={() => open ? setOpen(false) : openMenu()}
        className={`ui-input flex items-center justify-between gap-2 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${size === "compact" ? "min-h-11 py-2" : ""} ${open ? "border-primary-dark ring-3 ring-primary/15" : ""}`}
      >
        <span className="min-w-0 flex-1 truncate">{selectedOption?.label || value || placeholder}</span>
        <MaterialSymbolsChevronRightRounded aria-hidden="true" className={`size-4 shrink-0 text-muted transition-transform duration-150 ${open ? "-rotate-90" : "rotate-90"}`} />
      </button>
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      {position && portalRoot && createPortal(
        <AnimatePresence>
          {open && <SelectMenu key={listId} menuRef={menuRef} id={listId} labelledBy={triggerId} position={position} reduceMotion={reduceMotion}>
            {options.map((option, index) => (
              <div
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                tabIndex={-1}
                aria-selected={option.value === value}
                aria-disabled={option.disabled || undefined}
                onPointerDown={(event) => event.preventDefault()}
                onPointerMove={() => { if (!option.disabled) setActiveIndex(index); }}
                onClick={() => choose(index)}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer ${option.disabled ? "opacity-50 cursor-not-allowed" : ""} ${option.value === value ? "bg-primary-soft text-primary-dark" : activeIndex === index ? "bg-surface-active text-ink" : "text-ink"}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium break-words">{option.label}</span>
                  {option.description && <span className="mt-0.5 block text-xs leading-5 text-muted break-words">{option.description}</span>}
                </span>
                {option.value === value && <MaterialSymbolsCheckRounded className="size-4 shrink-0" aria-hidden="true" />}
              </div>
            ))}
          </SelectMenu>}
        </AnimatePresence>,
        portalRoot,
      )}
    </div>
  );
}

function SelectMenu({ menuRef, id, labelledBy, position, reduceMotion, children }) {
  const isPresent = useIsPresent();
  const { side, ...bounds } = position;
  return (
    <m.div
      ref={menuRef}
      id={id}
      role="listbox"
      aria-labelledby={labelledBy}
      aria-hidden={!isPresent || undefined}
      inert={!isPresent}
      initial={{ opacity: 0, y: reduceMotion ? 0 : side === "top" ? 4 : -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduceMotion ? 0 : side === "top" ? 4 : -4 }}
      transition={{ duration: reduceMotion ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
      style={{ ...bounds, position: "fixed", transformOrigin: side === "top" ? "bottom center" : "top center" }}
      className="z-[80] overflow-y-auto overscroll-contain custom-scrollbar rounded-xl border border-line bg-surface-light p-1 shadow-soft"
    >
      {children}
    </m.div>
  );
}

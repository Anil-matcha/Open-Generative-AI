"use client";

import { useCallback, useEffect, useRef } from "react";

const MENU_ITEMS = '[role="menuitemradio"]:not(:disabled), [role="menuitem"]:not(:disabled)';

export default function usePromptMenu({ open, onOpen, onClose, selectionKey }) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const focusTargetRef = useRef("selected");
  const getItems = useCallback(() => Array.from(
    menuRef.current?.querySelectorAll(MENU_ITEMS) || [],
  ), []);
  const focusItem = useCallback((target = "selected") => {
    const items = getItems();
    const item = target === "last"
      ? items[items.length - 1]
      : target === "first"
        ? items[0]
        : items.find((candidate) => candidate.getAttribute("aria-checked") === "true") || items[0];
    item?.focus();
  }, [getItems]);
  const restoreFocus = useCallback(() => {
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);
  const closeMenu = useCallback((restore = false, event) => {
    onClose(event);
    if (restore) restoreFocus();
  }, [onClose, restoreFocus]);

  const onTriggerKeyDown = useCallback((event) => {
    const target = event.key === "ArrowUp" || event.key === "End"
      ? "last"
      : event.key === "ArrowDown" || event.key === "Home"
        ? "first"
        : null;
    if (!target) return;

    event.preventDefault();
    event.stopPropagation();
    if (open) {
      focusItem(target);
    } else {
      focusTargetRef.current = target;
      onOpen(event);
    }
  }, [focusItem, onOpen, open]);

  const onMenuKeyDown = useCallback((event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true, event);
      return;
    }
    if (event.key === "Tab") {
      closeMenu(false, event);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

    const items = getItems();
    if (items.length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    const currentIndex = items.indexOf(document.activeElement);
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? items.length - 1
        : event.key === "ArrowDown"
          ? currentIndex < 0 ? 0 : (currentIndex + 1) % items.length
          : currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
    items[nextIndex].focus();
  }, [closeMenu, getItems]);

  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => {
      focusItem(focusTargetRef.current);
      focusTargetRef.current = "selected";
    });
    return () => cancelAnimationFrame(frame);
  }, [focusItem, open, selectionKey]);

  return {
    triggerRef, menuRef, focusTargetRef, onTriggerKeyDown, onMenuKeyDown,
    closeMenu, restoreFocus,
  };
}

"use client";

import { useEffect } from "react";

/** Dev-only: strip Cursor IDE `data-cursor-ref` attrs that confuse React hydration. */
export function StripCursorRefs() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const attr = "data-cursor-ref";

    function strip(node: Node) {
      if (!(node instanceof Element)) return;
      if (node.hasAttribute(attr)) node.removeAttribute(attr);
      node.querySelectorAll(`[${attr}]`).forEach((el) => el.removeAttribute(attr));
    }

    strip(document.documentElement);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes" && record.target instanceof Element) {
          record.target.removeAttribute(attr);
        } else {
          record.addedNodes.forEach(strip);
        }
      }
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [attr],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}

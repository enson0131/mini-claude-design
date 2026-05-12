"use client";

import { useCallback, useRef } from "react";

interface ResizeHandleProps {
  targetId: string;
}

export default function ResizeHandle({ targetId }: ResizeHandleProps) {
  const dragState = useRef<{ startX: number; startWidth: number; panel: HTMLElement | null }>({
    startX: 0,
    startWidth: 0,
    panel: null,
  });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const panel = document.getElementById(targetId);
      if (!panel) return;
      dragState.current = {
        startX: e.clientX,
        startWidth: panel.offsetWidth,
        panel,
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [targetId]
  );

  const onMouseMove = useCallback((e: MouseEvent) => {
    const { startX, startWidth, panel } = dragState.current;
    if (panel) {
      panel.style.width = Math.max(200, startWidth + e.clientX - startX) + "px";
    }
  }, []);

  const onMouseUp = useCallback(() => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  return (
    <div
      className="w-1 cursor-col-resize bg-transparent shrink-0 transition-colors hover:bg-[#8bb4f9]"
      onMouseDown={handleMouseDown}
    />
  );
}

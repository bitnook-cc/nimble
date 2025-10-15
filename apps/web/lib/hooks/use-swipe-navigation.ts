import { useCallback, useEffect, useRef, useState } from "react";

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
  preventScroll?: boolean;
}

interface SwipeState {
  isSwiping: boolean;
  swipeOffset: number;
}

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  minSwipeDistance = 50,
  preventScroll = true,
}: SwipeConfig) {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    swipeOffset: 0,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentX.current = e.touches[0].clientX;
    isDragging.current = false;
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!touchStartX.current) return;

      touchCurrentX.current = e.touches[0].clientX;
      const deltaX = touchCurrentX.current - touchStartX.current;
      const deltaY = e.touches[0].clientY - touchStartY.current;

      // Determine if this is a horizontal swipe (more horizontal than vertical movement)
      if (!isDragging.current && Math.abs(deltaX) > Math.abs(deltaY)) {
        isDragging.current = true;
        setSwipeState({ isSwiping: true, swipeOffset: deltaX });
      }

      // If we're in a horizontal swipe, prevent vertical scrolling
      if (isDragging.current) {
        if (preventScroll) {
          e.preventDefault();
        }
        setSwipeState({ isSwiping: true, swipeOffset: deltaX });
      }
    },
    [preventScroll],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) {
      setSwipeState({ isSwiping: false, swipeOffset: 0 });
      return;
    }

    const deltaX = touchCurrentX.current - touchStartX.current;

    // Determine if swipe threshold was met
    if (Math.abs(deltaX) >= minSwipeDistance) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    // Reset state
    touchStartX.current = 0;
    touchStartY.current = 0;
    touchCurrentX.current = 0;
    isDragging.current = false;
    setSwipeState({ isSwiping: false, swipeOffset: 0 });
  }, [minSwipeDistance, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const element = document.body;

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return swipeState;
}

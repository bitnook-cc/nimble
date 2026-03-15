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
  const hasCommittedToSwipe = useRef<boolean>(false);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    swipeOffset: 0,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentX.current = e.touches[0].clientX;
    isDragging.current = false;
    hasCommittedToSwipe.current = false;
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!touchStartX.current) return;

      touchCurrentX.current = e.touches[0].clientX;
      const deltaX = touchCurrentX.current - touchStartX.current;
      const deltaY = e.touches[0].clientY - touchStartY.current;

      // Need more horizontal movement to commit to horizontal swipe
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;

      // Once we've determined this is a horizontal swipe, commit to it
      if (!hasCommittedToSwipe.current && Math.abs(deltaX) > 10) {
        hasCommittedToSwipe.current = isHorizontalSwipe;
      }

      // If this is a committed horizontal swipe
      if (hasCommittedToSwipe.current) {
        if (!isDragging.current) {
          isDragging.current = true;
        }

        // Prevent vertical scroll during horizontal swipe
        if (preventScroll && Math.abs(deltaX) > 5) {
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
      touchStartX.current = 0;
      touchStartY.current = 0;
      touchCurrentX.current = 0;
      hasCommittedToSwipe.current = false;
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
    hasCommittedToSwipe.current = false;
    setSwipeState({ isSwiping: false, swipeOffset: 0 });
  }, [minSwipeDistance, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    // Use window instead of document.body for better event capture
    const element = window;

    element.addEventListener("touchstart", handleTouchStart as EventListener, { passive: true });
    element.addEventListener("touchmove", handleTouchMove as EventListener, { passive: false });
    element.addEventListener("touchend", handleTouchEnd as EventListener, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart as EventListener);
      element.removeEventListener("touchmove", handleTouchMove as EventListener);
      element.removeEventListener("touchend", handleTouchEnd as EventListener);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return swipeState;
}

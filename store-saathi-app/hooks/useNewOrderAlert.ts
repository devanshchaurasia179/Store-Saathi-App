import { useEffect, useRef, useCallback, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAudioPlayer } from "expo-audio";
import { getShopOrders } from "../constants/orders.api";

// Use the existing beep sound for new order notification
const alertSound = require("../assets/images/beep.mp3");

const POLL_INTERVAL = 15_000; // Poll every 15 seconds

/**
 * Hook that polls for new pending orders and plays a sound
 * when the count increases (i.e., a new order arrives).
 *
 * Returns the current pending order count for badge display.
 */
export function useNewOrderAlert() {
  const [pendingCount, setPendingCount] = useState(0);
  const prevCountRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Audio player for the notification sound
  const alertPlayer = useAudioPlayer(alertSound);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, []);

  const playAlert = useCallback(async () => {
    try {
      // Play the beep sound in a loop for ~3 seconds
      alertPlayer.loop = true;
      await alertPlayer.seekTo(0);
      alertPlayer.play();

      // Clear any existing stop timer
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);

      // Stop after 3 seconds
      stopTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        try {
          alertPlayer.pause();
          alertPlayer.loop = false;
        } catch (e) {
          // Player may have been released — ignore
        }
      }, 3000);
    } catch (e) {
      console.warn("Failed to play order alert sound:", e);
    }
  }, [alertPlayer]);

  const checkNewOrders = useCallback(async () => {
    try {
      const res = await getShopOrders({ status: "pending", page: 1, limit: 1 });

      if (res.data?.success) {
        const total = res.data.pagination?.total ?? 0;
        setPendingCount(total);

        // If we had a previous count and the new count is higher → new order!
        if (prevCountRef.current !== null && total > prevCountRef.current) {
          playAlert();
        }

        prevCountRef.current = total;
      }
    } catch (error) {
      // Silently fail — don't disrupt the dashboard
      console.warn("Order poll failed:", error);
    }
  }, [playAlert]);

  useEffect(() => {
    // Initial fetch
    checkNewOrders();

    // Start polling
    intervalRef.current = setInterval(checkNewOrders, POLL_INTERVAL);

    // Pause polling when app goes to background, resume on foreground
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        // App came to foreground — check immediately and restart polling
        checkNewOrders();
        if (!intervalRef.current) {
          intervalRef.current = setInterval(checkNewOrders, POLL_INTERVAL);
        }
      } else if (nextState.match(/inactive|background/)) {
        // App went to background — stop polling to save battery
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
      appStateRef.current = nextState;
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.remove();
    };
  }, [checkNewOrders]);

  return { pendingCount };
}

import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

/**
 * Provides a fade + slide-up entrance animation.
 * Usage: const { opacity, translateY } = useFadeIn(delay);
 */
export function useFadeIn(delay: number = 0, distance: number = 12) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  return {
    opacity: progress,
    translateY: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [distance, 0],
    }),
  };
}

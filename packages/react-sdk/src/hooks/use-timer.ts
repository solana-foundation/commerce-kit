/**
 * useTimer Hook
 * Countdown timer with configurable duration and callbacks
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
    duration: number; // in seconds
    autoStart?: boolean;
    onComplete?: () => void;
    onTick?: (remaining: number) => void;
}

interface UseTimerReturn {
    timeRemaining: number;
    isRunning: boolean;
    isComplete: boolean;
    progress: number; // 0-1
    start: () => void;
    pause: () => void;
    stop: () => void;
    reset: () => void;
    formatTime: (seconds?: number) => string;
}

export function useTimer({ duration, autoStart = false, onComplete, onTick }: UseTimerOptions): UseTimerReturn {
    const [timeRemaining, setTimeRemaining] = useState(duration);
    const [isRunning, setIsRunning] = useState(autoStart);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const start = useCallback(() => {
        setIsRunning(true);
    }, []);

    const pause = useCallback(() => {
        setIsRunning(false);
    }, []);

    const stop = useCallback(() => {
        setIsRunning(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        setTimeRemaining(duration);
        setIsRunning(autoStart);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, [duration, autoStart]);

    const formatTime = useCallback(
        (seconds: number = timeRemaining): string => {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        },
        [timeRemaining],
    );

    // Timer logic
    useEffect(() => {
        if (isRunning && timeRemaining > 0) {
            intervalRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    const newTime = prev - 1;

                    if (onTick) {
                        onTick(newTime);
                    }

                    if (newTime <= 0) {
                        setIsRunning(false);
                        if (onComplete) {
                            onComplete();
                        }
                        return 0;
                    }

                    return newTime;
                });
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRunning, timeRemaining, onComplete, onTick]);

    const isComplete = timeRemaining === 0;
    const progress = (duration - timeRemaining) / duration;

    return {
        timeRemaining,
        isRunning,
        isComplete,
        progress,
        start,
        pause,
        stop,
        reset,
        formatTime,
    };
}

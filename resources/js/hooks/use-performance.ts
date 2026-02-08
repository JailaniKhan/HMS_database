/**
 * Performance monitoring and optimization hooks
 * Provides React-specific performance utilities and monitoring
 */

import { useCallback, useEffect, useRef, useMemo, useState, createContext, useContext } from 'react';
import { logger } from '@/services/logger';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  RENDER_WARNING: 16, // ms - one frame at 60fps
  API_CALL_WARNING: 2000, // ms
  DATA_PROCESSING_WARNING: 500, // ms
  MEMORY_USAGE_WARNING: 80, // percentage
  LARGE_LIST_WARNING: 1000, // items
} as const;

// Performance metrics interface
interface PerformanceMetrics {
  renderTime: number;
  component: string;
  timestamp: number;
  propsChanged: boolean;
  stateChanged: boolean;
}

// Custom hook for measuring component render performance
export function useRenderPerformance(componentName: string, deps: unknown[] = []) {
  const renderStartRef = useRef<number>(0);
  const prevDepsRef = useRef<unknown[]>([]);
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  const measureRender = useCallback(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const propsChanged = JSON.stringify(deps) !== JSON.stringify(prevDepsRef.current);
      
      const metric: PerformanceMetrics = {
        renderTime: duration,
        component: componentName,
        timestamp: Date.now(),
        propsChanged,
        stateChanged: false // Would need to track state changes separately
      };
      
      metricsRef.current.push(metric);
      
      // Keep only last 100 metrics to prevent memory issues
      if (metricsRef.current.length > 100) {
        metricsRef.current.shift();
      }
      
      // Log performance warnings
      if (duration > PERFORMANCE_THRESHOLDS.RENDER_WARNING) {
        logger.performanceWarning(componentName, duration, PERFORMANCE_THRESHOLDS.RENDER_WARNING);
      }
      
      prevDepsRef.current = [...deps];
    };
  }, [componentName, deps]);

  // Return cleanup function to be called after render
  return measureRender;
}

// Hook for measuring API call performance
export function useApiPerformance() {
  const apiMetricsRef = useRef<Map<string, { startTime: number; endTime?: number }>>(new Map());

  const startApiCall = useCallback((endpoint: string) => {
    apiMetricsRef.current.set(endpoint, { startTime: performance.now() });
  }, []);

  const endApiCall = useCallback((endpoint: string, success: boolean = true) => {
    const metric = apiMetricsRef.current.get(endpoint);
    if (metric) {
      const endTime = performance.now();
      const duration = endTime - metric.startTime;
      
      if (duration > PERFORMANCE_THRESHOLDS.API_CALL_WARNING) {
        logger.performanceWarning(`API: ${endpoint}`, duration, PERFORMANCE_THRESHOLDS.API_CALL_WARNING);
      }
      
      // Store completed metric
      apiMetricsRef.current.set(endpoint, { ...metric, endTime });
      
      // Clean up old metrics (keep last 50)
      if (apiMetricsRef.current.size > 50) {
        const firstKey = apiMetricsRef.current.keys().next().value;
        apiMetricsRef.current.delete(firstKey);
      }
    }
  }, []);

  return { startApiCall, endApiCall };
}

// Hook for virtualized lists (performance optimization for large datasets)
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  scrollTop: number
) {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // Extra items for smooth scrolling
  const endIndex = Math.min(startIndex + visibleCount, items.length);

  const visibleItems = useMemo(() => {
    // Warn about large lists
    if (items.length > PERFORMANCE_THRESHOLDS.LARGE_LIST_WARNING) {
      logger.warn(`Large list detected: ${items.length} items. Consider virtualization or pagination.`, {
        itemCount: items.length,
        component: 'useVirtualList'
      });
    }

    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: 'absolute' as const,
        top: `${(startIndex + index) * itemHeight}px`,
        height: `${itemHeight}px`,
        width: '100%',
      }
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    startIndex,
    endIndex
  };
}

// Hook for debouncing expensive operations
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttling operations
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastRunRef.current >= delay) {
      lastRunRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastRunRef.current = Date.now();
        callback(...args);
      }, delay - (now - lastRunRef.current));
    }
  }) as T, [callback, delay]);
}

// Hook for lazy loading components
export function useLazyLoad(
  elementRef: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, {
      threshold: 0.1,
      ...options
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef, options]);

  return isVisible;
}

// Hook for memory usage monitoring
export function useMemoryMonitor(warningThreshold: number = PERFORMANCE_THRESHOLDS.MEMORY_USAGE_WARNING) {
  const [memoryUsage, setMemoryUsage] = useState<{
    used: number;
    limit: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
        const percentage = (usedMB / limitMB) * 100;
        
        setMemoryUsage({
          used: usedMB,
          limit: limitMB,
          percentage
        });

        if (percentage > warningThreshold) {
          logger.warn(`High memory usage detected: ${percentage.toFixed(2)}% (${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB)`, {
            memoryUsage: { used: usedMB, limit: limitMB, percentage }
          });
        }
      }
    };

    // Check immediately and then every 30 seconds
    checkMemory();
    const interval = setInterval(checkMemory, 30000);

    return () => clearInterval(interval);
  }, [warningThreshold]);

  return memoryUsage;
}

// Hook for preventing unnecessary re-renders
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef<T>(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }) as T, []);
}

// Hook for memoizing complex objects with deep comparison
export function useDeepMemo<T>(factory: () => T, deps: unknown[]): T {
  const ref = useRef<{ deps: unknown[]; result: T } | null>(null);

  if (
    ref.current === null ||
    deps.length !== ref.current.deps.length ||
    deps.some((dep, index) => dep !== ref.current!.deps[index])
  ) {
    ref.current = {
      deps,
      result: factory()
    };
  }

  return ref.current.result;
}

// Performance monitoring context
interface PerformanceContextValue {
  isDevMode: boolean;
  logPerformance: boolean;
  thresholds: typeof PERFORMANCE_THRESHOLDS;
}

const PerformanceContext = createContext<PerformanceContextValue>({
  isDevMode: process.env.NODE_ENV === 'development',
  logPerformance: process.env.NODE_ENV === 'development',
  thresholds: PERFORMANCE_THRESHOLDS
});

// Provider for performance monitoring
export const PerformanceProvider: React.FC<{
  children: React.ReactNode;
  logPerformance?: boolean;
  customThresholds?: Partial<typeof PERFORMANCE_THRESHOLDS>;
}> = ({ children, logPerformance, customThresholds }) => {
  const value = useMemo(() => ({
    isDevMode: process.env.NODE_ENV === 'development',
    logPerformance: logPerformance ?? process.env.NODE_ENV === 'development',
    thresholds: { ...PERFORMANCE_THRESHOLDS, ...customThresholds }
  }), [logPerformance, customThresholds]);

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Hook to access performance context
export function usePerformanceContext() {
  return useContext(PerformanceContext);
}
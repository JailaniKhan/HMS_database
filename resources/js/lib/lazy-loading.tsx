import { ReactNode, Suspense, lazy } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface LazyPageProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Higher-order component for lazy loading heavy pages
 * Use this for Pharmacy and Laboratory pages that have heavy components
 */
export function LazyPage({ children, fallback }: LazyPageProps) {
    return (
        <Suspense
            fallback={
                fallback || (
                    <div className="flex h-96 items-center justify-center">
                        <LoadingSpinner size="lg" />
                    </div>
                )
            }
        >
            {children}
        </Suspense>
    );
}

// Pre-configured lazy loaders for heavy pages
export function lazyLoadPharmacy() {
    return lazy(() => import('@/Pages/Pharmacy/Dashboard'));
}

export function lazyLoadLaboratory() {
    return lazy(() => import('@/Pages/Laboratory/Index'));
}

// Hook for using lazy loaded components with proper typing
export function useLazyPage<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
) {
    const Component = lazy(importFn);
    return Component;
}
import LoadingSpinner from '@/components/LoadingSpinner';

interface LazyPageProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Higher-order component for lazy loading heavy pages
 * Use this for Pharmacy and Laboratory pages that have heavy components
 */
export function LazyPage({ children, fallback }: LazyPageProps) {
    return (
        <Suspense
            fallback={
                fallback || (
                    <div className="flex h-96 items-center justify-center">
                        <LoadingSpinner size="lg" />
                    </div>
                )
            }
        >
            {children}
        </Suspense>
    );
}

// Pre-configured lazy loaders for heavy pages
export function lazyLoadPharmacy() {
    return lazy(() => import('@/Pages/Pharmacy/Dashboard'));
}

export function lazyLoadLaboratory() {
    return lazy(() => import('@/Pages/Laboratory/Index'));
}

// Hook for using lazy loaded components with proper typing
export function useLazyPage<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
) {
    const Component = lazy(importFn);
    return Component;
}


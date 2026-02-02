import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Disable refetching on window focus for Inertia apps
                        // since Inertia handles its own data refreshing
                        refetchOnWindowFocus: false,
                        // Cache data for 5 minutes by default
                        staleTime: 5 * 60 * 1000,
                        // Retry failed requests 3 times
                        retry: 3,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}


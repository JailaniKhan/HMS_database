declare global {
    interface Window {
        getCSRFToken(): string | null;
        Laravel?: {
            csrfToken?: string;
        };
        axios: typeof import('axios');
    }
}

export {};
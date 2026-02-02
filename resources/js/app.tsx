import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { QueryProvider } from '@/lib/query-provider';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        // Convert route-style names to proper component paths
        // e.g., 'patients.index' -> 'Patient/Index', 'admin.users.index' -> 'Admin/Users/Index'
        let path = name;
        
        // Handle common mappings where route names don't match directory names
        path = path
            .replace(/^patients\./, 'Patient/')
            .replace(/^doctors\./, 'Doctor/')
            .replace(/^appointments\./, 'Appointment/')
            .replace(/^billing\./, 'Billing/')
            .replace(/^laboratory\./, 'Laboratory/')
            .replace(/^pharmacy\./, 'Pharmacy/')
            .replace(/^admin\./, 'Admin/')
            .replace(/^settings\./, 'Settings/')
            .replace(/^reports\./, 'Reports/')
            .replace(/^departments\./, 'Department/')
            .replace(/^figma\./, 'Figma/')
            .replace(/^pharmacy\.medicines\./, 'Pharmacy/Medicines/')
            .replace(/^pharmacy\.stock\./, 'Pharmacy/Stock/')
            .replace(/^pharmacy\.sales\./, 'Pharmacy/Sales/')
            .replace(/^pharmacy\.purchase-orders\./, 'Pharmacy/PurchaseOrders/')
            .replace(/^pharmacy\.alerts\./, 'Pharmacy/Alerts/')
            .replace(/^laboratory\.lab-tests\./, 'Laboratory/LabTests/')
            .replace(/^laboratory\.lab-test-results\./, 'Laboratory/LabTestResults/')
            .replace(/\.index$/, '/Index')
            .replace(/\.create$/, '/Create')
            .replace(/\.edit$/, '/Edit')
            .replace(/\.show$/, '/Show');
        
        // If it's still in route format, try to convert first part to title case
        if (path.includes('.')) {
            const parts = path.split('.');
            const convertedParts = parts.map((part, index) => {
                // Capitalize first letter (title case) for directory names
                if (index === 0) {
                    return part.charAt(0).toUpperCase() + part.slice(1);
                }
                // Convert action names to title case
                return part.charAt(0).toUpperCase() + part.slice(1);
            });
            path = convertedParts.join('/');
        } else {
            // If there are no dots, it might be a simple path like 'patients', convert to 'Patient/Index'
            if (!path.includes('/')) {
                path = path.charAt(0).toUpperCase() + path.slice(1) + '/Index';
            }
        }
        
        return resolvePageComponent(
            `./Pages/${path}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ).catch(() => {
            // Fallback to original name if conversion failed
            return resolvePageComponent(
                `./Pages/${name}.tsx`,
                import.meta.glob('./Pages/**/*.tsx'),
            );
        });
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <QueryProvider>
                <App {...props} />
            </QueryProvider>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

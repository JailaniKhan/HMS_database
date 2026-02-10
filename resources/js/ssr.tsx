import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: (name) => {
            // Convert route-style names to proper component paths matching app.tsx
            let path = name;
            
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
                .replace(/^pharmacy\.alerts\./, 'Pharmacy/Alerts/')
                .replace(/^laboratory\.lab-tests\./, 'Laboratory/LabTests/')
                .replace(/^laboratory\.lab-test-results\./, 'Laboratory/LabTestResults/')
                .replace(/\.index$/, '/Index')
                .replace(/\.create$/, '/Create')
                .replace(/\.edit$/, '/Edit')
                .replace(/\.show$/, '/Show');
            
            if (path.includes('.')) {
                const parts = path.split('.');
                const convertedParts = parts.map((part, index) => {
                    if (index === 0) {
                        return part.charAt(0).toUpperCase() + part.slice(1);
                    }
                    return part.charAt(0).toUpperCase() + part.slice(1);
                });
                path = convertedParts.join('/');
            } else {
                if (!path.includes('/')) {
                    path = path.charAt(0).toUpperCase() + path.slice(1) + '/Index';
                }
            }
            
            return resolvePageComponent(
                `./Pages/${path}.tsx`,
                import.meta.glob('./Pages/**/*.tsx'),
            ).catch(() => {
                return resolvePageComponent(
                    `./Pages/${name}.tsx`,
                    import.meta.glob('./Pages/**/*.tsx'),
                );
            });
        },
        setup: ({ App, props }) => {
            return <App {...props} />;
        },
    }),
);

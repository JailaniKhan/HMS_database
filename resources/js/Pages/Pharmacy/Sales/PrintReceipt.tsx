import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Head } from '@inertiajs/react';

/**
 * PrintReceipt - A simple redirect page that opens the receipt in print mode
 * This is accessed via /sales/{sale}/print route
 */
export default function PrintReceipt() {
    useEffect(() => {
        // Redirect to the receipt page which has print functionality built-in
        // Get the current URL path and extract the sale ID
        const path = window.location.pathname;
        const saleId = path.split('/').slice(-2)[0];
        
        // Navigate to the receipt page
        router.get(`/pharmacy/sales/${saleId}/receipt`);
    }, []);

    return (
        <>
            <Head title="Redirecting to Print..." />
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Opening receipt for printing...</p>
                </div>
            </div>
        </>
    );
}

import axios from 'axios';

// Set up Axios to include CSRF tokens with every request
window.axios = axios.create({
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
    },
});

// Add CSRF token to requests if available
if (window.Laravel && window.Laravel.csrfToken) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = window.Laravel.csrfToken;
} else {
    // Try to get CSRF token from meta tag
    const csrfToken = document.head.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    if (csrfToken) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken.content;
    }
}

// Configure Axios to include X-Requested-With header
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
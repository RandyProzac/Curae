import { googleLogout } from '@react-oauth/google';

/**
 * Parses URL hash fragments returning an object with the token details.
 * Google's Implicit Flow returns tokens in the hash.
 */
export const getHashParams = () => {
    const hash = window.location.hash.substring(1);
    const params = {};
    if (!hash) return params;

    hash.split('&').forEach(hk => {
        const temp = hk.split('=');
        if (temp.length === 2) {
            params[temp[0]] = temp[1];
        }
    });
    return params;
};

/**
 * Standardize logout process for Google
 */
export const logoutFromGoogle = () => {
    googleLogout();
    // Clear local token representations
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
};

export async function generateDeviceFingerprint() {
    const components = [
        navigator.userAgent,
        navigator.language,
        navigator.hardwareConcurrency,
        navigator.deviceMemory,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        navigator.platform,
        navigator.vendor
    ].join('|');

    // Create a hash of the components
    const encoder = new TextEncoder();
    const data = encoder.encode(components);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
} 
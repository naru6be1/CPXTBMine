/**
 * Network Utilities
 * Functions for checking network connectivity and DNS resolution
 */

/**
 * Check if the device has internet connectivity
 * Uses multiple endpoints to verify connectivity
 */
export const checkConnectivity = async (): Promise<boolean> => {
  try {
    // Create a simple request that should work on most networks
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Try to fetch a common reliable endpoint
    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.type === 'opaque' || response.status === 204;
  } catch (error) {
    console.error('Connectivity check failed:', error);
    return false;
  }
};

/**
 * Check if a domain can be resolved via DNS
 * This helps identify specific network restrictions
 */
export const checkDnsResolution = async (domain: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Try to fetch the root of the domain with cache disabled
    const url = `https://${domain}/favicon.ico?_=${Date.now()}`;
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return true; // If we get here, DNS resolution worked
  } catch (error: any) {
    console.error(`DNS resolution check for ${domain} failed:`, error);
    
    // Try to determine if this is a DNS resolution failure
    // versus other types of network errors
    const errorString = String(error);
    return !(
      errorString.includes('getaddrinfo') || 
      errorString.includes('ENOTFOUND') ||
      errorString.includes('Name not resolved') ||
      errorString.includes('ERR_NAME_NOT_RESOLVED')
    );
  }
};

/**
 * Check if Web3Auth services are accessible
 * Returns true if all required domains are accessible
 */
export const checkWeb3AuthAccessibility = async (): Promise<{
  accessible: boolean;
  failedDomains: string[];
}> => {
  // List of domains required for Web3Auth to function
  const requiredDomains = [
    'app.openlogin.com',
    'auth.web3auth.io',
    'api.web3auth.io'
  ];
  
  const results = await Promise.all(
    requiredDomains.map(async (domain) => {
      const canResolve = await checkDnsResolution(domain);
      return { domain, canResolve };
    })
  );
  
  const failedDomains = results
    .filter(result => !result.canResolve)
    .map(result => result.domain);
  
  return {
    accessible: failedDomains.length === 0,
    failedDomains
  };
};
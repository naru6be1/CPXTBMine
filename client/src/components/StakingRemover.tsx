import React, { useEffect } from 'react';

/**
 * StakingRemover component
 * 
 * This component specifically targets and removes any staking announcement
 * banners that may be present on the client page.
 */
export const StakingRemover: React.FC = () => {
  useEffect(() => {
    // Function to remove staking-related elements
    const removeStakingElements = () => {
      // Check if we're on the /client route
      if (window.location.pathname.includes('/client')) {
        // Find and remove any elements containing staking announcements
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
          // Check text content for staking-related content
          if (element.textContent?.includes('Staking Feature Added') ||
              element.textContent?.includes('Token Staking') ||
              element.textContent?.includes('Staking Plans')) {
            // Found a staking-related element, remove it
            element.remove();
          }
        });
      }
    };

    // Run immediately
    removeStakingElements();

    // Also set up a mutation observer to catch dynamically added content
    const observer = new MutationObserver(() => {
      removeStakingElements();
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });

    // Clean up the observer when component unmounts
    return () => {
      observer.disconnect();
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default StakingRemover;
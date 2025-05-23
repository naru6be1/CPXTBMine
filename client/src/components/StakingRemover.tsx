import React, { useEffect } from 'react';
import '../styles/remove-staking.css';

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
      // Create specific targets for the staking announcement banner
      const targetTexts = [
        'CPXTB Platform - Staking Feature Added',
        'New Feature: Token Staking',
        'Staking Plans',
        'token staking feature',
        'earn passive income by staking',
        'Four staking plans have been implemented',
        'Basic Staking:',
        'Silver Staking:',
        'Gold Staking:',
        'Platinum Staking:',
        'Stake CPXTB Tokens'
      ];
      
      // Direct approach - query all elements
      document.querySelectorAll('*').forEach(element => {
        if (element instanceof HTMLElement) {
          // Check if this element contains any target text
          const textContent = element.textContent || '';
          if (targetTexts.some(target => textContent.includes(target))) {
            // Check if this is the main staking banner container
            if (element.tagName === 'DIV' && 
               (element.children.length > 2 || 
                textContent.includes('CPXTB Platform - Staking'))) {
              console.log('Removing staking element:', element);
              element.style.display = 'none';
              // Try to get the parent if it's a small element
              if (element.parentElement) {
                element.parentElement.style.display = 'none';
              }
            }
          }
        }
      });
      
      // As a backup method, inject a style tag with more aggressive targeting
      const style = document.createElement('style');
      style.textContent = `
        /* Force hide the staking banner */
        body > div > div:nth-child(1):has(h1:contains("Staking Feature Added")),
        body > div > h1:contains("Staking Feature Added"),
        div:has(> div:contains("Token Staking")),
        div:has(> h2:contains("Staking Plans")),
        div:has(> h3:contains("Staking Plans")),
        div:has(> div:contains("Staking Plans")) {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    };

    // Run immediately
    removeStakingElements();

    // Set up a more aggressive approach with a timer
    const timerId = setInterval(removeStakingElements, 500);

    // Also set up a mutation observer to catch dynamically added content
    const observer = new MutationObserver(() => {
      removeStakingElements();
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });

    // Clean up the observer when component unmounts
    return () => {
      observer.disconnect();
      clearInterval(timerId);
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default StakingRemover;
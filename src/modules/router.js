const pageCache = new Map();

async function fetchPage(url) {
    if (pageCache.has(url)) {
        return pageCache.get(url);
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.statusText}`);
    }
    const text = await response.text();
    pageCache.set(url, text);
    return text;
}

export async function loadPage(pageUrl, containerSelector = '#scaled-content') {
    try {
        const pageHtml = await fetchPage(pageUrl);
        const parser = new DOMParser();
        const doc = parser.parseFromString(pageHtml, 'text/html');

        const newContent = doc.querySelector(containerSelector);
        const mainContainer = document.querySelector(containerSelector);

        if (newContent && mainContainer) {
            // Store references to any existing scripts that might be affected
            const existingScripts = Array.from(document.querySelectorAll('script[data-dynamic]'));

            // Clear existing dynamic scripts to avoid conflicts
            existingScripts.forEach(script => {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            });

            mainContainer.innerHTML = newContent.innerHTML;

            // Execute scripts from the loaded page
            const scripts = doc.querySelectorAll('script');

            scripts.forEach(script => {
                if (script.src) {
                    // Handle external scripts
                    const newScript = document.createElement('script');

                    // Properly resolve the script URL relative to the page being loaded
                    // The script.src is relative to the HTML file location, not the current page
                    let resolvedSrc;
                    try {
                        // If the script URL is already absolute (starts with /), use it as-is
                        if (script.src.startsWith('/')) {
                            resolvedSrc = script.src;
                        } else {
                            // For relative paths, resolve relative to the page URL
                            resolvedSrc = new URL(script.src, new URL(pageUrl, window.location.origin)).href;

                            // If the path looks like it's going up from src/ to root, adjust accordingly
                            // For example, if pageUrl is /src/profiles/profile_selector.html and script.src is ../modules/profile_selector.js
                            // The resolved path should be /src/modules/profile_selector.js
                            if (pageUrl.includes('/src/') && script.src.startsWith('../')) {
                                const baseUrl = window.location.origin;
                                const pageDir = pageUrl.substring(0, pageUrl.lastIndexOf('/'));
                                resolvedSrc = new URL(script.src, new URL(pageDir, baseUrl)).href;
                            }
                        }
                    } catch (e) {
                        console.error(`Error resolving script URL: ${script.src} relative to ${pageUrl}`, e);
                        // Fallback to a relative path from the root
                        resolvedSrc = script.src.startsWith('/') ? script.src : `/${script.src}`;
                    }

                    newScript.src = resolvedSrc;
                    newScript.type = script.type || 'text/javascript';
                    newScript.setAttribute('data-dynamic', 'true');

                    // Copy other attributes
                    for (let attr of script.attributes) {
                        if (attr.name !== 'src' && attr.name !== 'type') {
                            newScript.setAttribute(attr.name, attr.value);
                        }
                    }

                    // Add error handling for external scripts
                    newScript.onload = () => {
                        console.log(`External script loaded: ${resolvedSrc}`);
                    };
                    newScript.onerror = (error) => {
                        console.error(`Error loading external script: ${resolvedSrc}`, error);
                    };

                    document.head.appendChild(newScript);
                } else {
                    // Handle inline scripts
                    const newScript = document.createElement('script');
                    newScript.textContent = script.textContent;
                    newScript.type = script.type || 'text/javascript';
                    newScript.setAttribute('data-dynamic', 'true');

                    // Copy other attributes
                    for (let attr of script.attributes) {
                        if (attr.name !== 'src' && attr.name !== 'type') {
                            newScript.setAttribute(attr.name, attr.value);
                        }
                    }

                    // For inline scripts, especially modules, we need to be careful about execution timing
                    if (script.type === 'module') {
                        // Module scripts need to be added to the DOM to execute
                        newScript.onload = () => {
                            console.log('Module script loaded');
                        };
                        newScript.onerror = (error) => {
                            console.error('Error loading module script', error);
                        };
                        document.head.appendChild(newScript);
                    } else {
                        // For regular inline scripts, execute immediately after DOM is updated
                        try {
                            document.head.appendChild(newScript);
                            console.log('Inline script executed');
                        } catch (error) {
                            console.error('Error executing inline script', error);
                        } finally {
                            // Clean up immediately after execution
                            setTimeout(() => {
                                if (newScript.parentNode) {
                                    newScript.parentNode.removeChild(newScript);
                                }
                            }, 0);
                        }
                    }
                }
            });

            // Initialize scaling after content is loaded
            try {
                if (window.initScaling) {
                    window.initScaling();
                } else {
                    // Import and initialize scaling if not already available
                    const { initScaling } = await import('/src/modules/scaling.js');
                    initScaling();
                }
            } catch (e) {
                console.warn('Scaling module not available or failed to initialize:', e);
            }

            // After scripts are loaded, trigger a custom event to notify that content has been loaded
            // This allows dynamically loaded modules to initialize properly
            // Use setTimeout to ensure DOM is fully updated before initialization
            setTimeout(async () => {
                console.log('Router: About to initialize page. Page URL =', pageUrl);
                
                document.dispatchEvent(new CustomEvent('dynamic-content-loaded', {
                    detail: { pageUrl, containerSelector }
                }));

                // Dispatch an event to signal that dynamic content has been loaded
                // This can be listened to by modules that need to initialize after content is loaded

                console.log('Router: Checking for initialization. Page URL =', pageUrl);
                console.log('Contains profile_selector.html?', pageUrl.includes('profile_selector.html'));
                console.log('Ends with profile_selector.html?', pageUrl.endsWith('profile_selector.html'));

                // Check if the loaded page has a specific initialization function
                // For profile selector, try to import and call the initialization function
                if (pageUrl.includes('profile_selector.html') || pageUrl.endsWith('profile_selector.html')) {
                    console.log('Router: Initializing profile selector...');
                    try {
                        // Import the module and call its initialization function
                        // Using absolute path that works in browser environment
                        const { initializeProfileSelector } = await import('/src/modules/profile_selector.js');
                        if (initializeProfileSelector) {
                            await initializeProfileSelector();
                            console.log('Router: Profile selector initialized successfully.');
                        }
                    } catch (e) {
                        console.error('Router: Error initializing profile selector:', e);
                    }
                } else {
                    console.log('Router: Page does not match profile selector pattern, skipping initialization.');
                }
            }, 100); // Small delay to ensure DOM is ready
        } else {
            console.error('Could not find the container or content to load.');
        }
    } catch (error) {
        console.error('Error loading page:', error);
    }
}
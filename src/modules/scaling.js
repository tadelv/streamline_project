export function initScaling() {
    const viewport = document.getElementById('scaling-container');
    const content = document.getElementById('scaled-content');
    const designWidth = 1920;
    const designHeight = 1200;

    function updateScale() {
        if (!viewport || !content) return;

        // Get actual viewport dimensions
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Calculate aspect ratios
        const screenAspectRatio = screenWidth / screenHeight;
        const designAspectRatio = designWidth / designHeight;
        
        let scale;
        if (screenAspectRatio > designAspectRatio) {
            // Screen is wider than design - scale based on height
            scale = screenHeight / designHeight;
        } else {
            // Screen is taller than design - scale based on width
            scale = screenWidth / designWidth;
        }

        // Apply minimum scale to prevent excessive zooming out
        const minScale = 0.5; // Prevent scaling too far out
        scale = Math.max(scale, minScale);

        // Explicitly set content dimensions to original design dimensions
        content.style.width = `${designWidth}px`;
        content.style.height = `${designHeight}px`;

        // Calculate offsets to center the scaled content
        const scaledWidth = designWidth * scale;
        const scaledHeight = designHeight * scale;
        const offsetX = (screenWidth - scaledWidth) / 2;
        const offsetY = (screenHeight - scaledHeight) / 2;

        // Apply transform with center origin
        content.style.transformOrigin = 'top left';
        content.style.transform = `scale(${scale}) translate(${offsetX / scale}px, ${offsetY / scale}px)`;

        // Ensure the viewport itself doesn't cause scrollbars and clips content
        viewport.style.width = `${screenWidth}px`;
        viewport.style.height = `${screenHeight}px`;
        viewport.style.overflow = 'hidden';
        viewport.style.margin = '0'; // Remove any margin that might cause issues
        
        // Additional check to prevent zooming in too much on high-resolution displays
        const maxScale = 1.5; // Limit maximum zoom to 1.5x
        if (scale > maxScale) {
            // Recalculate with max scale applied
            if (screenAspectRatio > designAspectRatio) {
                scale = maxScale;
            } else {
                scale = maxScale;
            }
            
            // Reapply the transform with the limited scale
            content.style.transform = `scale(${scale}) translate(${offsetX / scale}px, ${offsetY / scale}px)`;
        }
    }

    // Initial scaling with a slight delay to ensure the browser has settled the viewport dimensions
    // This is especially important for web views that might adjust dimensions after initial load
    setTimeout(() => {
        updateScale();
        
        // Double-check scaling after a bit more time to handle edge cases where the viewport
        // dimensions might still be adjusting (especially in fullscreen web views)
        setTimeout(updateScale, 300);
    }, 100);
    
    // Add resize listener with debounce to prevent excessive recalculations
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateScale, 100); // Debounce for 100ms
    });
    
    // Also listen for orientation changes which can affect viewport dimensions
    window.addEventListener('orientationchange', () => {
        setTimeout(updateScale, 100); // Slight delay to ensure orientation change is complete
    });
    
    // Listen for fullscreen change events which might affect scaling
    document.addEventListener('fullscreenchange', () => {
        setTimeout(updateScale, 100); // Allow time for fullscreen transition to complete
    });
    
    // Listen for webkit-specific fullscreen change events (Safari)
    document.addEventListener('webkitfullscreenchange', () => {
        setTimeout(updateScale, 100); // Allow time for fullscreen transition to complete
    });
}
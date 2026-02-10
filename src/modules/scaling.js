export function initScaling() {
    const viewport = document.getElementById('scaling-container');
    const content = document.getElementById('scaled-content');
    const designWidth = 1920;
    const designHeight = 1200;

    function updateScale() {
        if (!viewport || !content) return;

        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
                const scaleX = screenWidth / designWidth;
                const scaleY = screenHeight / designHeight;
                let scale = Math.min(scaleX, scaleY);
        
                // Ensure the content never scales up beyond its original size
                if (scale > 1) {
                    scale = 1;
                }
        
                // Calculate offsets to center the scaled content
                const scaledWidth = designWidth * scale;
                const scaledHeight = designHeight * scale;
                const offsetX = (screenWidth - scaledWidth) / 2;
                const offsetY = (screenHeight - scaledHeight) / 2;


        // Apply transform with center origin
        // We use translate to position after scaling, so origin should be top left for consistent scaling
        content.style.transformOrigin = 'top left';
        content.style.transform = `scale(${scale}) translate(${offsetX / scale}px, ${offsetY / scale}px)`;

        // Ensure the viewport itself doesn't cause scrollbars and clips content
        viewport.style.width = `${screenWidth}px`;
        viewport.style.height = `${screenHeight}px`;
        viewport.style.overflow = 'hidden';
        viewport.style.margin = '0'; // Remove any margin that might cause issues
    }

    updateScale();
    window.addEventListener('resize', updateScale);
}
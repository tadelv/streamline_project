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
        const scale = Math.min(scaleX, scaleY);

        // Calculate horizontal offset to center the scaled content
        const scaledWidth = designWidth * scale;
        const offsetX = (screenWidth - scaledWidth) / 2;

        // Apply transform with top-left origin
        content.style.transformOrigin = 'top left';
        content.style.transform = `scale(${scale})`;
        
        // Position the container to center horizontally and align to top
        content.style.position = 'relative';
        content.style.left = `${offsetX}px`;
        content.style.top = `0px`;  // Align to top
        
        // Size the viewport to match the screen
        viewport.style.width = `${screenWidth}px`;
        viewport.style.height = `${screenHeight}px`;
        
        // Center the viewport within the body
        viewport.style.margin = '0 auto';
    }

    updateScale();
    window.addEventListener('resize', updateScale);
}
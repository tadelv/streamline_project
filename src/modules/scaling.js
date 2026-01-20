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

        content.style.transformOrigin = 'top ';
        content.style.transform = `scale(${scale})`;
        
        viewport.style.width = `${designWidth * scale}px`;
        viewport.style.height = `${designHeight * scale}px`;
    }

    updateScale();
    window.addEventListener('resize', updateScale);
}

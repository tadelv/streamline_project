import { migrateDefaultProfilesToRea, loadAvailableProfiles, availableProfiles } from './profileManager.js';
import { openDB } from './idb.js';
import { logger } from './logger.js';

async function renderProfiles() {
    logger.info('Profile Editor: Initializing...');
    try {
        await openDB();
        await migrateDefaultProfilesToRea();
        await loadAvailableProfiles();

        const container = document.getElementById('profile-list');
        if (!container) {
            logger.error('Profile Editor: Profile list container not found.');
            return;
        }

        container.innerHTML = ''; // Clear static content

        const sortedProfiles = Object.entries(availableProfiles).sort(([, a], [, b]) => {
            if (a.title && b.title) {
                return a.title.localeCompare(b.title);
            }
            return 0;
        });

        if (sortedProfiles.length === 0) {
            container.textContent = 'No profiles found.';
            return;
        }

        for (const [key, profile] of sortedProfiles) {
            const div = document.createElement('div');
            
            let classes = 'p-3 text-base-content cursor-pointer hover:bg-base-300';
            // Highlight the 'Default' profile as an example of a selected item
            if (profile.title === 'Default') {
                classes = 'p-3 bg-[var(--mimoja-blue)] text-white';
            }
            
            div.className = classes;
            div.textContent = profile.title || 'Untitled Profile';
            div.dataset.profileKey = key;

            // TODO: Add click event listener to handle profile selection
            // div.addEventListener('click', () => handleProfileSelect(key));

            container.appendChild(div);
        }
        logger.info(`Profile Editor: Rendered ${sortedProfiles.length} profiles.`);

    } catch (error) {
        logger.error('Profile Editor: Failed to initialize and render profiles.', error);
        const container = document.getElementById('profile-list');
        if(container) {
            container.innerHTML = '<div class="p-3 text-error">Error loading profiles. See console for details.</div>';
        }
    }
}

document.addEventListener('DOMContentLoaded', renderProfiles);

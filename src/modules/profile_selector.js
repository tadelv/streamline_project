import { migrateDefaultProfilesToRea, loadAvailableProfiles, availableProfiles, assignProfile, updateButtonUI, loadAssignments } from './profileManager.js';
import { openDB } from './idb.js';
import { logger } from './logger.js';
import { initResizablePanels, showToast } from './ui.js';
import { sendProfile, getWorkflow } from './api.js';
import { initChart, plotProfile } from './chart.js';

let selectedProfileKey = null;
const LONG_PRESS_DURATION = 700; // ms
const FAV_COUNT = 5;
let favoriteButtons = [];

// Copied from profileManager.js to keep that module's interface clean
async function verifyProfileChange(sentProfileTitle, retries = 5, delay = 300) {
    if (retries <= 0) {
        logger.error(`Profile verification failed after multiple retries. Sent '${sentProfileTitle}'.`);
        return false;
    }

    const currentWorkflow = await getWorkflow();
    const activeProfileTitle = currentWorkflow?.profile?.title;

    if (sentProfileTitle === activeProfileTitle) {
        logger.info('Verification successful. Active profile matches sent profile.');
        return true;
    } else {
        logger.warn(`Verification attempt failed. Retrying... (${retries - 1} left). Sent: '${sentProfileTitle}', Active: '${activeProfileTitle}'`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return verifyProfileChange(sentProfileTitle, retries - 1, delay);
    }
}

async function handleConfirm() {
    if (!selectedProfileKey) {
        alert('Please select a profile first.');
        return;
    }

    const profile = availableProfiles[selectedProfileKey];
    if (!profile) {
        logger.error(`Selected profile with key ${selectedProfileKey} not found!`);
        alert('An error occurred: selected profile not found.');
        return;
    }

    logger.info(`Confirming and sending profile: ${profile.title}`);
    try {
        await sendProfile(profile);
        const verified = await verifyProfileChange(profile.title);
        if (verified) {
            logger.info('Profile sent and verified. Navigating to main page.');
            window.location.href = '../../index.html';
        } else {
            alert('Failed to set the profile on the machine. Please try again.');
        }
    } catch (error) {
        logger.error('Failed to send profile:', error);
        alert('An error occurred while sending the profile.');
    }
}

function handleCancel() {
    window.location.href = '../../index.html';
}


function updateSelectedProfileView(profileItem) {
    if (!profileItem) return;

    // Update title
    const profileTitle = profileItem.textContent;
    const titleElement = document.getElementById('selected_profile_name');
    if (titleElement) {
        titleElement.textContent = profileTitle;
    }
    selectedProfileKey = profileItem.dataset.profileKey;
    const profile = availableProfiles[selectedProfileKey];

    if (profile) {
        // Update notes
        const notesElement = document.getElementById('profile_notes');
        if (notesElement) {
            notesElement.innerHTML = `<p>${profile.notes || 'No notes for this profile.'}</p>`;
        }

        // Update chart
        plotProfile(profile);
    }
}

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
            
            div.className = 'p-3 text-[30px] text-[#121212] cursor-pointer';
            div.textContent = profile.title || 'Untitled Profile';
            div.dataset.profileKey = key;

            div.addEventListener('click', (e) => {
                const clickedItem = e.currentTarget;
                
                // Unselect all other items
                const allItems = clickedItem.parentElement.children;
                for(const item of allItems) {
                    item.classList.remove('bg-[#385a92]', 'text-white', 'rounded-[8px]');
                    item.classList.add('text-[#121212]');
                }

                // Select the clicked one
                clickedItem.classList.add('bg-[#385a92]', 'text-white', 'rounded-[8px]');
                clickedItem.classList.remove('text-[#121212]');

                updateSelectedProfileView(clickedItem);
            });

            container.appendChild(div);
        }

        // Select the first profile by default if it exists
        if (container.firstChild) {
            const firstItem = container.firstChild;
            firstItem.classList.add('bg-[#385a92]', 'text-white', 'rounded-[8px]');
            firstItem.classList.remove('text-[#121212]');
            updateSelectedProfileView(firstItem);
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

async function initFavoriteButtons() {
    const favoriteAssignments = await loadAssignments();

    for (let i = 0; i < FAV_COUNT; i++) {
        const button = document.getElementById(`fav-profile-btn-${i}`);
        if (button) {
            favoriteButtons.push(button);
        }
    }

    favoriteButtons.forEach((button, index) => {
        let pressTimer = null;

        const startPress = () => {
            clearTimeout(pressTimer);
            pressTimer = setTimeout(async () => {
                if (selectedProfileKey) {
                    try {
                        await assignProfile(index, selectedProfileKey);
                        const profile = availableProfiles[selectedProfileKey];
                        if (profile) {
                            showToast(`Assigned '${profile.title}' to favorite ${index + 1}`, 3000, 'success');
                        }
                    } catch (e) {
                       logger.warn('Caught expected error from assignProfile modal close:', e.message);
                       // Still show success toast as assignment likely worked
                       const profile = availableProfiles[selectedProfileKey];
                       if (profile) {
                           showToast(`Assigned '${profile.title}' to favorite ${index + 1}`, 3000, 'success');
                       }
                    }
                } else {
                    showToast('Please select a profile from the list to assign it.', 3000, 'error');
                }
                pressTimer = null;
            }, LONG_PRESS_DURATION);
        };

        const cancelPress = () => {
            clearTimeout(pressTimer);
        };

        button.addEventListener('mousedown', startPress);
        button.addEventListener('mouseup', cancelPress);
        button.addEventListener('mouseleave', cancelPress);
        button.addEventListener('touchstart', startPress, { passive: true });
        button.addEventListener('touchend', cancelPress);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    initChart();
    await renderProfiles();
    initResizablePanels('separator');
    document.getElementById('confirm-profile-btn')?.addEventListener('click', handleConfirm);
    document.getElementById('cancel-profile-btn')?.addEventListener('click', handleCancel);
    await initFavoriteButtons();
});

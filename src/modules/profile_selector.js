import { init as initProfileManager, unhideProfile,availableProfiles, assignProfile, deleteOrHideProfile, getHiddenProfiles, loadAssignments } from './profileManager.js';
import { openDB } from './idb.js';
import { logger } from './logger.js';
import { initResizablePanels, showToast } from './ui.js';
import { sendProfile, getWorkflow } from './api.js';
import { initChart, plotProfile } from './chart.js';

let selectedProfileKey = null;
let isShowingHidden = false; // State to track if hidden profiles should be shown
const LONG_PRESS_DURATION = 400; // ms
const FAV_COUNT = 5;
let favoriteButtons = [];

const EYE_ICON_SVG = `<svg class="w-[50px] h-[50px]" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 33C5.5 33 13.75 13.75 33 13.75C52.25 13.75 60.5 33 60.5 33C60.5 33 52.25 52.25 33 52.25C13.75 52.25 5.5 33 5.5 33Z" stroke="#385A92" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 41.25C37.5563 41.25 41.25 37.5563 41.25 33C41.25 28.4437 37.5563 24.75 33 24.75C28.4437 24.75 24.75 28.4437 24.75 33C24.75 37.5563 28.4437 41.25 33 41.25Z" stroke="#385A92" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const EYE_OFF_ICON_SVG = `<svg class="w-[50px] h-[50px]" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M29.5156 13.9596C35.9214 13.1962 42.4011 14.5503 47.965 17.8152C53.529 21.0801 57.8715 26.0763 60.3294 32.0408C60.5586 32.6583 60.5586 33.3374 60.3294 33.9548C59.3172 36.4043 57.9816 38.7072 56.3584 40.8023M38.7309 38.9351C37.1749 40.4379 35.0909 41.2694 32.9278 41.2506C30.7647 41.2319 28.6955 40.3642 27.1659 38.8346C25.6363 37.305 24.7686 35.2358 24.7498 33.0726C24.731 30.9095 25.5626 28.8256 27.0654 27.2696" stroke="#385A92" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M48.0672 48.1223C44.4193 50.2831 40.3492 51.634 36.1332 52.0833C31.9171 52.5326 27.6538 52.0698 23.6324 50.7262C19.611 49.3826 15.9257 47.1897 12.8265 44.2963C9.72731 41.4029 7.28675 37.8767 5.67043 33.957C5.44124 33.3396 5.44124 32.6604 5.67043 32.043C8.10866 26.1301 12.3988 21.1674 17.8969 17.8997M5.49993 5.5L60.4999 60.5" stroke="#385A92" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;


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
    if (!profileItem) {
        // Clear the view if nothing is selected
        document.getElementById('selected_profile_name').textContent = 'No Profile Selected';
        document.getElementById('profile_notes').innerHTML = '';
        plotProfile(null); // Clear chart
        selectedProfileKey = null;
        return;
    }

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

function renderProfiles() {
    logger.info('Profile Editor: Rendering profiles...');
    try {
        const container = document.getElementById('profile-list');
        if (!container) {
            logger.error('Profile Editor: Profile list container not found.');
            return;
        }
        container.innerHTML = ''; // Clear static content

        const hiddenProfiles = getHiddenProfiles();
        
        const profileEntries = Object.entries(availableProfiles);

        const sortedProfiles = profileEntries.sort(([, a], [, b]) => {
            if (a.title && b.title) {
                return a.title.localeCompare(b.title);
            }
            return 0;
        });

        if (sortedProfiles.length === 0) {
            container.textContent = 'No profiles found.';
            updateSelectedProfileView(null); // Clear right panel
            return;
        }

        let visibleProfileCount = 0;
        for (const [key, profile] of sortedProfiles) {
            const isHidden = hiddenProfiles.includes(key);

            if (!isShowingHidden && isHidden) {
                continue; // Skip if we are not showing hidden profiles
            }
            visibleProfileCount++;

            const div = document.createElement('div');
            div.className = 'p-3 text-[30px] cursor-pointer flex justify-between items-center';
            div.dataset.profileKey = key;

            const titleSpan = document.createElement('span');
            titleSpan.textContent = profile.title || 'Untitled Profile';
            div.appendChild(titleSpan);

            if (isHidden) {
                div.classList.add('text-[var(--low-contrast-white)]');
                const unhideButton = document.createElement('button');
                unhideButton.className = 'p-1 hover:bg-gray-200 rounded-full';
                unhideButton.title = 'Show this profile';
                unhideButton.innerHTML = `<svg class="w-6 h-6 text-gray-500" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 33C5.5 33 13.75 13.75 33 13.75C52.25 13.75 60.5 33 60.5 33C60.5 33 52.25 52.25 33 52.25C13.75 52.25 5.5 33 5.5 33Z" stroke="#959595" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 41.25C37.5563 41.25 41.25 37.5563 41.25 33C41.25 28.4437 37.5563 24.75 33 24.75C28.4437 24.75 24.75 28.4437 24.75 33C24.75 37.5563 28.4437 41.25 33 41.25Z" stroke="#959595" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

                unhideButton.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await unhideProfile(key);
                    renderProfiles();
                });
                div.appendChild(unhideButton);
            } else {
                div.classList.add('text-[#121212]');
            }

            div.addEventListener('click', (e) => {
                const clickedItem = e.currentTarget;
                
                const allItems = clickedItem.parentElement.children;
                for(const item of allItems) {
                    item.classList.remove('bg-[#385a92]', 'text-white', 'rounded-[8px]', 'bg-gray-200', 'text-black');
                     if (getHiddenProfiles().includes(item.dataset.profileKey)) {
                        item.classList.add('text-[var(--low-contrast-white)]');
                    } else {
                        item.classList.add('text-[#121212]');
                    }
                }
                
                if (isHidden) {
                    clickedItem.classList.add('bg-gray-200', 'rounded-[8px]');
                    
                } else {
                    clickedItem.classList.add('bg-[#385a92]', 'text-white', 'rounded-[8px]');
                    clickedItem.classList.remove('text-[#121212]');
                }

                updateSelectedProfileView(clickedItem);
            });

            container.appendChild(div);
        }

        if (visibleProfileCount > 0 && !selectedProfileKey) {
             if (container.firstChild) {
                const firstItem = container.firstChild;
                firstItem.dispatchEvent(new MouseEvent('click'));
            }
        }
        
        logger.info(`Profile Editor: Rendered ${visibleProfileCount} profiles.`);

    } catch (error) {
        logger.error('Profile Editor: Failed to render profiles.', error);
        const container = document.getElementById('profile-list');
        if(container) {
            container.innerHTML = '<div class="p-3 text-error">Error loading profiles. See console for details.</div>';
        }
    }
}

async function initFavoriteButtons() {
    await loadAssignments();

    for (let i = 0; i < FAV_COUNT; i++) {
        const button = document.getElementById(`assign-fav-btn-${i}`);
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

function initDeleteButton() {
    const deleteButton = document.getElementById('delete_profile');
    if (!deleteButton) return;

    deleteButton.addEventListener('click', async () => {
        if (!selectedProfileKey) {
            showToast("No profile selected to delete.", 3000, 'error');
            return;
        }
        
        const profile = availableProfiles[selectedProfileKey];
        const isDefault = !profile.hasOwnProperty('author') || profile.author === 'Decent';
        const confirmationText = isDefault
            ? `Are you sure you want to hide '${profile.title}'?`
            : `Are you sure you want to permanently delete '${profile.title}'?`;

        if (!confirm(confirmationText)) {
            return;
        }

        await deleteOrHideProfile(selectedProfileKey);
        
        showToast(`'${profile.title}' has been removed.`, 3000, 'success');
        selectedProfileKey = null; // Clear selection
        renderProfiles();
    });
}

function initViewButton() {
    const viewButton = document.getElementById('view_profile');
    if (!viewButton) return;

    viewButton.addEventListener('click', () => {
        isShowingHidden = !isShowingHidden;
        
        if (isShowingHidden) {
            viewButton.innerHTML = EYE_ICON_SVG;
        } else {
            viewButton.innerHTML = EYE_OFF_ICON_SVG;
        }

        renderProfiles();
    });
}


document.addEventListener('DOMContentLoaded', async () => {
    initChart();
    const profileLoadStatus = await initProfileManager();
    
    if (profileLoadStatus?.profilesfromREA) {
        showToast('Profiles loaded from REA store.', 3000, 'success');
    } else if (profileLoadStatus?.profilesfromIDB) {
        showToast('Profiles loaded from IndexedDB backup.', 3000, 'info');
    } else if (profileLoadStatus?.profilesfromJSON) {
        showToast('User profiles not found, loaded from bundled manifest.', 3000, 'warning');
    }

    renderProfiles();
    initResizablePanels('separator');
    document.getElementById('confirm-profile-btn')?.addEventListener('click', handleConfirm);
    document.getElementById('cancel-profile-btn')?.addEventListener('click', handleCancel);
    initDeleteButton();
    initViewButton();
    await initFavoriteButtons();
});

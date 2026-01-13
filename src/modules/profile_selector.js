import { init as initProfileManager, unhideProfile,availableProfiles, assignProfile, deleteOrHideProfile, loadAssignments, handleProfileUpload , verifyProfileChange } from './profileManager.js';
import { openDB } from './idb.js';
import { logger } from './logger.js';
import { initResizablePanels, showToast } from './ui.js';
import { sendProfile, getWorkflow } from './api.js';
import { initChart, plotProfile } from './chart.js';
import { initI18n } from './i18n.js';

let selectedProfileKey = null;
let isShowingHidden = false; // State to track if hidden profiles should be shown
const LONG_PRESS_DURATION = 400; // ms
const FAV_COUNT = 5;
let favoriteButtons = [];

function getEyeIconSVG(strokeColor) {
    return `<svg class="w-[50px] h-[50px]" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 33C5.5 33 13.75 13.75 33 13.75C52.25 13.75 60.5 33 60.5 33C60.5 33 52.25 52.25 33 52.25C13.75 52.25 5.5 33 5.5 33Z" stroke="${strokeColor}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 41.25C37.5563 41.25 41.25 37.5563 41.25 33C41.25 28.4437 37.5563 24.75 33 24.75C28.4437 24.75 24.75 28.4437 24.75 33C24.75 37.5563 28.4437 41.25 33 41.25Z" stroke="${strokeColor}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}


// Copied from profileManager.js to keep that module's interface clean
// async function verifyProfileChange(sentProfileTitle, retries = 5, delay = 300) {
//     if (retries <= 0) {
//         logger.error(`Profile verification failed after multiple retries. Sent '${sentProfileTitle}'.`);
//         return false;
//     }

//     const currentWorkflow = await getWorkflow();
//     const activeProfileTitle = currentWorkflow?.profile?.title;

//     if (sentProfileTitle === activeProfileTitle) {
//         logger.info('Verification successful. Active profile matches sent profile.');
//         return true;
//     } else {
//         logger.warn(`Verification attempt failed. Retrying... (${retries - 1} left). Sent: '${sentProfileTitle}', Active: '${activeProfileTitle}'`);
//         await new Promise(resolve => setTimeout(resolve, delay));
//         return verifyProfileChange(sentProfileTitle, retries - 1, delay);
//     }
// }

async function handleConfirm() {
    if (!selectedProfileKey) {
        alert('Please select a profile first.');
        return;
    }

    const profileRecord = availableProfiles[selectedProfileKey];
    if (!profileRecord || !profileRecord.profile) {
        logger.error(`Selected profile with key ${selectedProfileKey} not found!`);
        alert('An error occurred: selected profile not found.');
        showToast(`An error occurred: selected profile not found.`, 3000, 'alert');
        return;
    }
    const profile = profileRecord.profile;

    logger.info(`Confirming and sending profile: ${profile.title}`);
    try {
        await sendProfile(profile);
        const verified = await verifyProfileChange(profile.title);
        if (verified) {
            logger.info('Profile sent and verified. Navigating to main page.');
            showToast(`Profile Set`, 3000, 'success');
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
    const profileRecord = availableProfiles[selectedProfileKey];

    if (profileRecord && profileRecord.profile) {
        const profile = profileRecord.profile;
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

        const profileEntries = Object.entries(availableProfiles);

        const sortedProfiles = profileEntries.sort(([, a], [, b]) => {
            if (a.profile && a.profile.title && b.profile && b.profile.title) {
                return a.profile.title.localeCompare(b.profile.title);
            }
            return 0;
        });

        if (sortedProfiles.length === 0) {
            container.textContent = 'No profiles found.';
            updateSelectedProfileView(null); // Clear right panel
            return;
        }

        let visibleProfileCount = 0;
        for (const [key, profileRecord] of sortedProfiles) {
            const profile = profileRecord.profile;
            if (!profile) continue;
            
            const isHidden = profileRecord.visibility === 'hidden';

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
                    const itemKey = item.dataset.profileKey;
                    if (itemKey && availableProfiles[itemKey] && availableProfiles[itemKey].visibility === 'hidden') {
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
            showToast(`Hold to assign profile.`, 1500, 'info');
            pressTimer = setTimeout(async () => {
                if (selectedProfileKey) {
                    try {
                        await assignProfile(index, selectedProfileKey);
                        const profileRecord = availableProfiles[selectedProfileKey];
                        if (profileRecord && profileRecord.profile) {
                            showToast(`Assigned '${profileRecord.profile.title}' to favorite ${index + 1}`, 3000, 'success');
                        }
                    } catch (e) {
                       logger.warn('Caught expected error from assignProfile modal close:', e.message);
                       const profileRecord = availableProfiles[selectedProfileKey];
                       if (profileRecord && profileRecord.profile) {
                           showToast(`Assigned '${profileRecord.profile.title}' to favorite ${index + 1}`, 3000, 'success');
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
        
        const profileRecord = availableProfiles[selectedProfileKey];
        if (!profileRecord || !profileRecord.profile) {
            showToast("Cannot delete profile: data missing.", 3000, 'error');
            return;
        }
        const profile = profileRecord.profile;
        const isDefault = profileRecord.isDefault;
        const confirmationText = isDefault
            ? `Are you sure you want to hide '${profile.title}'?`
            : `Are you sure you want to permanently delete '${profile.title}'?`;

        if (!confirm(confirmationText)) {
            return;
        }

        await deleteOrHideProfile(selectedProfileKey);
        
                const keyToActOn = selectedProfileKey; // Preserve key
        await deleteOrHideProfile(keyToActOn);

        // Re-rendering is handled by the 'profiles-updated' event.
        // Now, find the element and re-establish selection to update the UI state.
        const container = document.getElementById('profile-list');
        if (container) {
            const itemToReselect = container.querySelector(`[data-profile-key="${keyToActOn}"]`);
            if (itemToReselect) {
                // Clicking it will handle selection style and update the right pane view
                itemToReselect.click();
            } else {
                // The item was deleted, not hidden, so clear the view
                updateSelectedProfileView(null);
            }
        }
 
    });
}

function initViewButton() {
    const viewButton = document.getElementById('view_profile');
    const page_title = document.getElementById("page_title" );
    if (!viewButton) return;

    // Set initial state on load, corresponding to isShowingHidden = false (default bg, blue icon)
    viewButton.innerHTML = getEyeIconSVG('#385A92');
    viewButton.classList.remove("bg-[var(--mimoja-blue)]");

    viewButton.addEventListener('click', () => {
        isShowingHidden = !isShowingHidden;
        
        if (isShowingHidden) {
            // State: SHOWING hidden profiles -> blue background, white icon
            viewButton.innerHTML = getEyeIconSVG('#FFFFFF');
            viewButton.classList.remove("bg-white");
            viewButton.classList.add("bg-[var(--mimoja-blue)]");
            page_title.textContent = "All Profiles"
        } else {
            // State: HIDING hidden profiles -> default background, blue icon
            viewButton.innerHTML = getEyeIconSVG('#385A92');
            viewButton.classList.remove("bg-[var(--mimoja-blue)]");
            viewButton.classList.add("bg-white");
            page_title.textContent = "Profiles"
        }

        renderProfiles();
    });
}


document.addEventListener('DOMContentLoaded', async () => {
    await initI18n();
    initChart();
    const profileLoadStatus = await initProfileManager();
    
    if (profileLoadStatus?.profilesFrom === 'API') {
        // Profiles loaded successfully from the primary source, no toast needed for the normal case.
        logger.info('Profiles loaded successfully from API.');
    } else if (profileLoadStatus?.profilesFrom === 'IDB_CACHE') {
        showToast('Offline: Displaying cached profiles.', 3000, 'warning');
    } else { // 'NONE'
        showToast('Error: Could not load any profiles.', 3000, 'error');
    }

    renderProfiles();
    
    // Wire up add profile button
    const addProfileButton = document.getElementById('add_profile');
    const fileInput = document.getElementById('profile-upload-input');
    if (addProfileButton && fileInput) {
        addProfileButton.addEventListener('click', () => {
            fileInput.click();
        });
        fileInput.addEventListener('change', handleProfileUpload);
    }

    // Listen for profile updates from the manager
    document.addEventListener('profiles-updated', () => {
        logger.info('Received profiles-updated event, re-rendering profile list.');
        renderProfiles();
    });

    initResizablePanels('separator');
    document.getElementById('confirm-profile-btn')?.addEventListener('click', handleConfirm);
    document.getElementById('cancel-profile-btn')?.addEventListener('click', handleCancel);
    initDeleteButton();
    initViewButton();
    await initFavoriteButtons();
});

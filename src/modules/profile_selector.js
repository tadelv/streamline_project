import { init as initProfileManager, unhideProfile,availableProfiles, assignProfile, deleteOrHideProfile, loadAssignments, handleProfileUpload , verifyProfileChange } from './profileManager.js';
import { openDB } from './idb.js';
import { logger } from './logger.js';
import { initResizablePanels, showToast, initFullscreenHandler } from './ui.js';
import { sendProfile, getWorkflow, updateWorkflow } from './api.js';
import { initChart, plotProfile } from './chart.js';
import { initI18n } from './i18n.js';
import { loadPage } from './router.js'; // Singular and correctly formatted import

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
        // Check if there's a pending assignment from a long press on the main page
        const pendingAssignmentIndex = sessionStorage.getItem('pendingAssignmentIndex');

        if (pendingAssignmentIndex !== null) {
            // Import the assignProfile function from profileManager
            

            // Assign the profile to the specific favorite button
            await assignProfile(parseInt(pendingAssignmentIndex), selectedProfileKey);

            // Clear the pending assignment
            sessionStorage.removeItem('pendingAssignmentIndex');

            // Show a success message
            setTimeout(() => showToast(`Profile assigned to Favorite ${parseInt(pendingAssignmentIndex) + 1}`, 3000, 'success'), 1000  );
        }

        // Update workflow with profile's target weight before sending the profile
        // This ensures that the target weight from the profile is applied to the workflow
        if (profile.target_weight) {
            const workflowUpdate = {
                profile: profile,
                doseData: {
                    doseIn: profile.dose_weight || 18, // Default to 18g if not specified
                    doseOut: parseFloat(profile.target_weight) // Use the profile's target weight
                }
            };
            await updateWorkflow(workflowUpdate);
        } else {
            // Just update with the profile if no target weight is specified
            await updateWorkflow({ profile: profile });
        }

        await sendProfile(profile);
        const verified = await verifyProfileChange(profile.title);
        if (verified) {
            logger.info('Profile sent and verified. Navigating to main page.');
            showToast(`Profile Set`, 3000, 'success');
            loadPage('../../index.html');
        } else {
            alert('Failed to set the profile on the machine. Please try again.');
        }
    } catch (error) {
        logger.error('Failed to send profile:', error);
        alert('An error occurred while sending the profile.');
    }
}

function handleCancel() {
    loadPage('../../index.html');
}


function updateSelectedProfileView(profileItem) {
    console.log('updateSelectedProfileView: Updating selected profile view');
    if (!profileItem) {
        console.log('updateSelectedProfileView: No profile item, clearing view');
        // Clear the view if nothing is selected
        const titleElement = document.getElementById('selected_profile_name');
        if (titleElement) {
            titleElement.textContent = 'No Profile Selected';
        }
        const notesElement = document.getElementById('profile_notes');
        if (notesElement) {
            notesElement.innerHTML = '';
        }
        plotProfile(null); // Clear chart
        selectedProfileKey = null;
        return;
    }

    console.log('updateSelectedProfileView: Profile item found:', profileItem.textContent);
    // Update title
    const profileTitle = profileItem.textContent;
    const titleElement = document.getElementById('selected_profile_name');
    if (titleElement) {
        titleElement.textContent = profileTitle;
        console.log('updateSelectedProfileView: Updated profile name to', profileTitle);
    }
    selectedProfileKey = profileItem.dataset.profileKey;
    console.log('updateSelectedProfileView: Selected profile key set to', selectedProfileKey);

    const profileRecord = availableProfiles[selectedProfileKey];
    console.log('updateSelectedProfileView: Profile record found:', !!profileRecord);

    if (profileRecord && profileRecord.profile) {
        const profile = profileRecord.profile;
        console.log('updateSelectedProfileView: Updating with profile:', profile.title);
        // Update notes
        const notesElement = document.getElementById('profile_notes');
        if (notesElement) {
            notesElement.innerHTML = `<p>${profile.notes || 'No notes for this profile.'}</p>`;
            console.log('updateSelectedProfileView: Updated profile notes');
        }

        // Update chart
        console.log('updateSelectedProfileView: Calling plotProfile with profile data');
        plotProfile(profile);
    } else {
        console.log('updateSelectedProfileView: Profile record or profile data not found');
    }
}

function renderProfiles() {
    console.log('renderProfiles: Starting to render profiles, isShowingHidden =', isShowingHidden);
    logger.info('Profile Editor: Rendering profiles...');
    try {
        const container = document.getElementById('profile-list');
        if (!container) {
            logger.error('Profile Editor: Profile list container not found.');
            console.error('renderProfiles: Profile list container not found');
            return;
        }
        container.innerHTML = ''; // Clear static content
        console.log('renderProfiles: Container cleared');

        const profileEntries = Object.entries(availableProfiles);
        console.log('renderProfiles: Available profiles count:', profileEntries.length);

        const sortedProfiles = profileEntries.sort(([, a], [, b]) => {
            if (a.profile && a.profile.title && b.profile && b.profile.title) {
                return a.profile.title.localeCompare(b.profile.title);
            }
            return 0;
        });

        if (sortedProfiles.length === 0) {
            console.log('renderProfiles: No profiles to render');
            container.textContent = 'No profiles found.';
            updateSelectedProfileView(null); // Clear right panel
            return;
        }

        let visibleProfileCount = 0;
        for (const [key, profileRecord] of sortedProfiles) {
            const profile = profileRecord.profile;
            if (!profile) continue;

            const isHidden = profileRecord.visibility === 'hidden';
            console.log('renderProfiles: Processing profile', profile.title, 'isHidden:', isHidden);

            if (!isShowingHidden && isHidden) {
                console.log('renderProfiles: Skipping hidden profile', profile.title);
                continue; // Skip if we are not showing hidden profiles
            }
            visibleProfileCount++;
            console.log('renderProfiles: Adding profile to list', profile.title);

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
                unhideButton.innerHTML = `<svg class="w-6 h-6" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 33C5.5 33 13.75 13.75 33 13.75C52.25 13.75 60.5 33 60.5 33C60.5 33 52.25 52.25 33 52.25C13.75 52.25 5.5 33 5.5 33Z" stroke="var(--mimoja-blue)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 41.25C37.5563 41.25 41.25 37.5563 41.25 33C41.25 28.4437 37.5563 24.75 33 24.75C28.4437 24.75 24.75 28.4437 24.75 33C24.75 37.5563 28.4437 41.25 33 41.25Z" stroke="var(--mimoja-blue)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

                unhideButton.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    console.log('renderProfiles: Unhide button clicked for profile', key);
                    await unhideProfile(key);
                    renderProfiles();
                });
                div.appendChild(unhideButton);
            } else {
                div.classList.add('text-[var(--text-primary)]');
            }

            div.addEventListener('click', (e) => {
                console.log('renderProfiles: Profile item clicked:', profile.title);
                const clickedItem = e.currentTarget;

                const allItems = clickedItem.parentElement.children;
                for(const item of allItems) {
                    item.classList.remove('bg-[#385a92]', 'text-white', 'rounded-[8px]', 'bg-gray-200', 'text-black');
                    const itemKey = item.dataset.profileKey;
                    if (itemKey && availableProfiles[itemKey] && availableProfiles[itemKey].visibility === 'hidden') {
                        item.classList.add('text-[var(--low-contrast-white)]');
                    } else {
                        item.classList.add('text-[var(--text-primary)]');
                    }
                }

                if (isHidden) {
                    clickedItem.classList.add('bg-gray-200', 'rounded-[8px]');
                    clickedItem.classList.remove('text-white');

                } else {
                    clickedItem.classList.add('bg-[#385a92]', 'text-white', 'rounded-[8px]');
                    clickedItem.classList.remove('text-[#121212]');
                }

                updateSelectedProfileView(clickedItem);
            });

            container.appendChild(div);
        }

        console.log('renderProfiles: Total visible profiles:', visibleProfileCount);
        if (visibleProfileCount > 0 && !selectedProfileKey) {
            console.log('renderProfiles: No profile selected, selecting first one');
             if (container.firstChild) {
                const firstItem = container.firstChild;
                firstItem.dispatchEvent(new MouseEvent('click'));
            }
        }

        logger.info(`Profile Editor: Rendered ${visibleProfileCount} profiles.`);

    } catch (error) {
        console.error('renderProfiles: Error rendering profiles:', error);
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
    console.log('initDeleteButton: Starting initialization');
    const deleteButton = document.getElementById('delete_profile');
    console.log('initDeleteButton: deleteButton found:', !!deleteButton);
    if (!deleteButton) {
        console.error('initDeleteButton: delete_profile button not found');
        return;
    }

    // Remove any existing click listeners to prevent duplicates
    // Create a new button element to clear all event listeners
    const newDeleteButton = deleteButton.cloneNode(true);
    deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);

    // Use the cloned button (which has no event listeners)
    const button = newDeleteButton;

    button.addEventListener('click', async () => {
        console.log('initDeleteButton: Delete button clicked');
        if (!selectedProfileKey) {
            console.log('initDeleteButton: No profile selected');
            showToast("No profile selected to delete.", 3000, 'error');
            return;
        }

        const profileRecord = availableProfiles[selectedProfileKey];
        if (!profileRecord || !profileRecord.profile) {
            console.log('initDeleteButton: Profile record or data missing');
            showToast("Cannot delete profile: data missing.", 3000, 'error');
            return;
        }
        const profile = profileRecord.profile;
        const isDefault = profileRecord.isDefault;
        const confirmationText = isDefault
            ? `Are you sure you want to hide '${profile.title}'?`
            : `Are you sure you want to permanently delete '${profile.title}'?`;

        console.log('initDeleteButton: Showing confirmation dialog');
        if (!confirm(confirmationText)) {
            console.log('initDeleteButton: Confirmation cancelled');
            return;
        }

        console.log('initDeleteButton: Proceeding with delete/hide operation');
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
                console.log('initDeleteButton: Re-selecting item after delete/hide');
                itemToReselect.click();
            } else {
                // The item was deleted, not hidden, so clear the view
                console.log('initDeleteButton: Item was deleted, clearing view');
                updateSelectedProfileView(null);
            }
        }
    });
    console.log('initDeleteButton: Event listener attached');
}

function initViewButton() {
    console.log('initViewButton: Starting initialization');
    const viewButton = document.getElementById('view_profile');
    const page_title = document.getElementById("page_title");
    console.log('initViewButton: viewButton found:', !!viewButton);
    console.log('initViewButton: page_title found:', !!page_title);

    if (!viewButton) {
        console.error('initViewButton: view_profile button not found');
        return;
    }

    // Remove any existing click listeners to prevent duplicates
    // Create a new button element to clear all event listeners
    const newViewButton = viewButton.cloneNode(true);
    viewButton.parentNode.replaceChild(newViewButton, viewButton);

    // Use the cloned button (which has no event listeners)
    const button = newViewButton;

    // Set initial state on load, corresponding to isShowingHidden = false (default bg, blue icon)
    button.innerHTML = getEyeIconSVG('#385a92'); // Blue icon
    button.classList.remove("bg-[var(--mimoja-blue)]");
    button.classList.add("bg-[var(--button-grey)]"); // Use CSS variable for background
    console.log('initViewButton: Initial state set');

    button.addEventListener('click', () => {
        console.log('initViewButton: View button clicked, toggling isShowingHidden');
        isShowingHidden = !isShowingHidden;

        if (isShowingHidden) {
            // State: SHOWING hidden profiles -> blue background, white icon
            button.innerHTML = getEyeIconSVG('currentColor');
            // Use direct style manipulation instead of Tailwind arbitrary values
            button.style.backgroundColor = 'var(--mimoja-blue)';
            button.classList.remove("bg-[var(--button-grey)]");
            if (page_title) {
                page_title.textContent = "All Profiles";
            }
            console.log('initViewButton: Now showing hidden profiles');
        } else {
            // State: HIDING hidden profiles -> default background, blue icon
            button.innerHTML = getEyeIconSVG('#385a92');
            // Reset to default background
            button.style.backgroundColor = '';
            button.classList.add("bg-[var(--button-grey)]");
            if (page_title) {
                page_title.textContent = "Profiles";
            }
            console.log('initViewButton: Now hiding hidden profiles');
        }

        // Force a reflow to ensure style changes are applied
        button.offsetHeight;

        console.log('initViewButton: Calling renderProfiles');
        renderProfiles();
    });
    console.log('initViewButton: Event listener attached');
}


// Main initialization function that can be called externally
export async function initializeProfileSelector() {
    console.log('initializeProfileSelector: Starting initialization');
    await initI18n();
    console.log('initializeProfileSelector: i18n initialized');

    // Delay chart initialization until the element is available in the DOM
    // Use a small timeout to ensure DOM is fully updated
    setTimeout(() => {
        console.log('initializeProfileSelector: Attempting to initialize chart, checking for plotly-chart element...');
        const chartElement = document.getElementById('plotly-chart');
        console.log('initializeProfileSelector: Chart element found:', !!chartElement);

        if (chartElement) {
            console.log('initializeProfileSelector: Calling initChart');
            initChart();
        } else {
            // If element is not available yet, try again after a short delay
            console.log('initializeProfileSelector: Chart element not found, retrying in 200ms...');
            setTimeout(() => {
                const chartElementRetry = document.getElementById('plotly-chart');
                console.log('initializeProfileSelector: Retry - Chart element found:', !!chartElementRetry);
                if (chartElementRetry) {
                    console.log('initializeProfileSelector: Calling initChart on retry');
                    initChart();
                } else {
                    console.warn('Chart element not found after loading profile selector');
                }
            }, 200);
        }
    }, 100);

    const profileLoadStatus = await initProfileManager();
    console.log('initializeProfileSelector: Profile manager initialized, status:', profileLoadStatus);

    if (profileLoadStatus?.profilesFrom === 'API') {
        // Profiles loaded successfully from the primary source, no toast needed for the normal case.
        logger.info('Profiles loaded successfully from API.');
    } else if (profileLoadStatus?.profilesFrom === 'IDB_CACHE') {
        showToast('Offline: Displaying cached profiles.', 3000, 'warning');
    } else { // 'NONE'
        showToast('Error: Could not load any profiles.', 3000, 'error');
    }

    console.log('initializeProfileSelector: Rendering profiles...');
    renderProfiles();

    // Wire up add profile button
    const originalAddProfileButton = document.getElementById('add_profile');
    const fileInput = document.getElementById('profile-upload-input');
    if (originalAddProfileButton && fileInput) {
        console.log('initializeProfileSelector: Setting up add profile button');
        // Remove any existing click listeners to prevent duplicates
        const newAddProfileButton = originalAddProfileButton.cloneNode(true);
        originalAddProfileButton.parentNode.replaceChild(newAddProfileButton, originalAddProfileButton);

        newAddProfileButton.addEventListener('click', () => {
            fileInput.click();
        });
        // Also handle the file input to prevent duplicate listeners
        const originalFileInput = document.getElementById('profile-upload-input');
        if (originalFileInput) {
            const newFileInput = originalFileInput.cloneNode(true);
            originalFileInput.parentNode.replaceChild(newFileInput, originalFileInput);
            newFileInput.addEventListener('change', handleProfileUpload);
        }
    }

    // Listen for profile updates from the manager
    // We'll handle potential duplicate listeners by checking if one already exists
    // For now, we'll just add the listener - the event system should handle multiple similar listeners gracefully
    document.addEventListener('profiles-updated', () => {
        logger.info('Received profiles-updated event, re-rendering profile list.');
        console.log('initializeProfileSelector: profiles-updated event received, re-rendering profiles');
        renderProfiles();
    });

    console.log('initializeProfileSelector: Initializing resizable panels');
    initResizablePanels('separator');
    console.log('initializeProfileSelector: Setting up confirm button');
    const confirmBtn = document.getElementById('confirm-profile-btn');
    if (confirmBtn) {
        // Remove any existing click listeners to prevent duplicates
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', handleConfirm);
    }

    console.log('initializeProfileSelector: Setting up cancel button');
    const cancelBtn = document.getElementById('cancel-profile-btn');
    if (cancelBtn) {
        // Remove any existing click listeners to prevent duplicates
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.addEventListener('click', handleCancel);
    }
    console.log('initializeProfileSelector: Initializing delete button');
    initDeleteButton();
    console.log('initializeProfileSelector: Initializing view button');
    initViewButton();
    console.log('initializeProfileSelector: Initializing favorite buttons');
    await initFavoriteButtons();
    console.log('initializeProfileSelector: Initializing fullscreen handler');
    initFullscreenHandler();
    console.log('initializeProfileSelector: Initialization complete');
}

// Call initialization when DOM is ready for traditional page loads
document.addEventListener('DOMContentLoaded', initializeProfileSelector);

// Also call initialization when dynamic content is loaded via router
document.addEventListener('dynamic-content-loaded', (event) => {
    // Check if this event is for profile selector
    if (event.detail.pageUrl && (event.detail.pageUrl.includes('profile_selector.html') || event.detail.pageUrl.endsWith('profile_selector.html'))) {
        initializeProfileSelector();
    }
});

import { logger } from './logger.js';
import { updateWorkflow,sendProfile, getWorkflow, getValueFromStore, setValueInStore, getProfiles, deleteProfile, updateProfileVisibility, uploadProfile } from './api.js';
import { updateProfileName, updateTemperatureDisplay, updateDrinkOut, updateDrinkRatio ,showToast} from './ui.js';
import { openDB, getSetting, setSetting } from './idb.js';
import { loadPage } from './router.js'; // Singular and correctly formatted import
import { getTranslation } from './i18n.js';

const FAV_COUNT = 5;
const PROFILES_PATH = '/src/profiles/';
const LONG_PRESS_DURATION = 800; // ms

const SETTINGS_NAMESPACE = 'streamline-app';
const FAVORITES_KEY = 'favorite-profiles';
const UPLOADED_PROFILES_KEY = 'uploaded-profiles';
const DEFAULT_PROFILES_KEY = 'default-profiles';
const DEFAULT_PROFILES_MIGRATED_KEY = 'default-profiles-migrated';
const PROFILES_CACHE_KEY = 'available-profiles-cache';


let favoriteButtons = [];
export let availableProfiles = {};
let favoriteAssignments = {};
let currentButtonIndex = null;

// Global flag to prevent duplicate execution of profile updates
let profileUpdateInProgress = false;

// --- Helper Functions ---

/**
 * Translates a profile title if a translation exists.
 * Looks for a translation key in the format "profile:{title}".
 * If no translation is found, returns the original title.
 * @param {string} title The profile title to translate
 * @returns {string} The translated or original title
 */
export function translateProfileTitle(title) {
    if (!title) return title;
    
    // Try to find a translation for the profile title
    // Translation key format: "profile:{title}"
    
    // Sanitize the title to create a valid translation key
    
    const translatedTitle = getTranslation(title);
    logger.info(`Translating profile title. Original: '${title}', Translation key: '${title}', Translated: '${translatedTitle}'`);
    // If the translation is the same as the key, it means no translation was found
    // Return the original title in that case
    return translatedTitle === title ? title : translatedTitle;
}

export async function loadAvailableProfiles() {
    try {
        logger.info('Attempting to load profiles from API...');
        const profilesFromApi = await getProfiles(); // This is an array of ProfileRecords

        // Process and populate in-memory cache
        availableProfiles = {};
        for (const profileRecord of profilesFromApi) {
            availableProfiles[profileRecord.id] = profileRecord;
        }

        logger.info(`Successfully loaded ${Object.keys(availableProfiles).length} profiles from API.`);

        // Sync to IndexedDB as a fallback
        await setSetting(PROFILES_CACHE_KEY, availableProfiles);
        logger.info('Successfully synced profiles to IndexedDB cache.');

        return { profilesFrom: 'API' };

    } catch (apiError) {
        logger.warn('API failed. Attempting to load profiles from IndexedDB fallback.', apiError);

        try {
            const profilesFromCache = await getSetting(PROFILES_CACHE_KEY);
            if (profilesFromCache && Object.keys(profilesFromCache).length > 0) {
                availableProfiles = profilesFromCache;
                logger.info(`Successfully loaded ${Object.keys(availableProfiles).length} profiles from IndexedDB cache.`);
                return { profilesFrom: 'IDB_CACHE' };
            } else {
                logger.error('API failed and IndexedDB cache is empty. No profiles could be loaded.');
                availableProfiles = {};
                return { profilesFrom: 'NONE' };
            }
        } catch (idbError) {
            logger.error('CRITICAL: API failed and also failed to read from IndexedDB cache.', idbError);
            availableProfiles = {};
            return { profilesFrom: 'NONE' };
        }
    }
}

export async function loadAssignments() {
    logger.info('Loading assignments...');
    try {
        // 1. Try to fetch from the primary source (REA store)
        const reaAssignments = await getValueFromStore(SETTINGS_NAMESPACE, FAVORITES_KEY);

        if (reaAssignments) {
            logger.info('Loaded assignments from REA store.');
            favoriteAssignments = reaAssignments;
            // Asynchronously update the local backup to keep it fresh
            await setSetting(FAVORITES_KEY, reaAssignments);
            return favoriteAssignments;
        }

        // 2. If REA has no data, try the local backup (IndexedDB)
        logger.warn('No assignments in REA store, checking IndexedDB backup...');
        const idbAssignments = await getSetting(FAVORITES_KEY);

        if (idbAssignments) {
            logger.info('Loaded assignments from IndexedDB backup.');
            favoriteAssignments = idbAssignments;
            // Data was found locally but not on the server, so let's sync it back up.
            await saveAssignments();
            return favoriteAssignments;
        }

        // 3. If neither source has data, create and save defaults.
        logger.info('No assignments found anywhere. Creating defaults.');
        favoriteAssignments = {};
        const profileKeys = Object.keys(availableProfiles);
        for (let i = 0; i < FAV_COUNT; i++) {
            favoriteAssignments[i] = profileKeys[i] || null;
        }
        await saveAssignments(); // Saves to both REA and IndexedDB

    } catch (error) {
        // This catch block handles network failures when trying to reach the REA store.
        logger.error('Failed to load from REA store. Falling back to IndexedDB.', error);
        try {
            const idbAssignments = await getSetting(FAVORITES_KEY);
            if (idbAssignments) {
                logger.info('Successfully loaded from IndexedDB backup during fallback.');
                favoriteAssignments = idbAssignments;
            } else {
                 // Even the backup failed, so create defaults (but they will only be saved locally for now)
                 logger.warn('IndexedDB backup is also empty. Creating defaults.');
                 favoriteAssignments = {};
                 const profileKeys = Object.keys(availableProfiles);
                 for (let i = 0; i < FAV_COUNT; i++) {
                     favoriteAssignments[i] = profileKeys[i] || null;
                 }
            }
        } catch (idbError) {
            logger.error('CRITICAL: Failed to load from both REA store and IndexedDB backup.', idbError);
        }
    }
    return favoriteAssignments;
}

async function saveAssignments() {
    logger.info('Saving assignments to REA store and IndexedDB backup...');

    // We use Promise.allSettled to ensure we attempt both saves even if one fails.
    const results = await Promise.allSettled([
        setValueInStore(SETTINGS_NAMESPACE, FAVORITES_KEY, favoriteAssignments),
        setSetting(FAVORITES_KEY, favoriteAssignments)
    ]);

    if (results[0].status === 'fulfilled') {
        logger.info('Assignments saved to REA store successfully.');
    } else {
        logger.error('Failed to save assignments to REA store:', results[0].reason);
    }

    if (results[1].status === 'fulfilled') {
        logger.info('Assignments saved to IndexedDB backup successfully.');
    } else {
        logger.error('Failed to save assignments to IndexedDB backup:', results[1].reason);
    }
}

export function updateButtonUI() {
    for (let i = 0; i < FAV_COUNT; i++) {
        const button = favoriteButtons[i];
        const profileKey = favoriteAssignments[i];
        const profileRecord = availableProfiles[profileKey];

        if (button && profileRecord && profileRecord.profile) {
            const translatedTitle = translateProfileTitle(profileRecord.profile.title);
            button.textContent = translatedTitle || 'Untitled';
        }
        else if (button) {
            button.textContent = '';
        }
    }
}

export async function verifyProfileChange(sentProfileTitle, retries = 5, delay = 300) {
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

async function handleProfileClick(index) {
    // Add a unique identifier to track this specific call
    const callId = Date.now() + Math.random();
    logger.info(`handleProfileClick called with index ${index}, callId: ${callId}`);
    
    // Check the global flag to prevent duplicate execution
    if (profileUpdateInProgress) {
        logger.warn(`Profile update already in progress. Skipping duplicate call with callId: ${callId}`);
        return;
    }
    
    // Set the global flag to indicate a profile update is in progress
    profileUpdateInProgress = true;
    
    const profileKey = favoriteAssignments[index];
    const profileRecord = availableProfiles[profileKey];

    if (!profileRecord || !profileRecord.profile) {
        logger.warn(`Button ${index} has no profile assigned or profile data is missing.`);
        showToast('Hold or double click to open profile selection.');
        // Reset the flag before returning
        profileUpdateInProgress = false;
        return;
    }

    const profile = profileRecord.profile;

    logger.info(`Sending profile '${profile.title}' to REA (callId: ${callId})...`);
    try {
        // Skip the sendProfile call since updateWorkflow can handle sending the profile
        logger.info(`Skipping sendProfile call, using updateWorkflow directly (callId: ${callId})`);

        let workflowResponse;
        if (profile.target_weight) {
            const workflowUpdate = {
                profile: profile,
                doseData: {
                    doseIn: profile.dose_weight || 18, // Default to 18g if not specified
                    doseOut: parseFloat(profile.target_weight) // Use the profile's target weight
                }
            };
            logger.info(`Calling updateWorkflow with dose data (callId: ${callId})`);
            workflowResponse = await updateWorkflow(workflowUpdate);
            updateDrinkOut(profile.target_weight);
            updateDrinkRatio();
        } else {
            // Just update with the profile if no target weight is specified
            logger.info(`Calling updateWorkflow with profile only (callId: ${callId})`);
            workflowResponse = await updateWorkflow({ profile: profile });
        }

        // Use the response from updateWorkflow to confirm the profile was set
        if (workflowResponse && workflowResponse.profile && workflowResponse.profile.title === profile.title) {
            logger.info(`Profile successfully set (callId: ${callId})`);
            const translatedTitle = translateProfileTitle(profile.title);
            updateProfileName(translatedTitle);
            if (profile.steps && profile.steps.length > 0) {
                updateTemperatureDisplay(profile.steps[0].temperature);
            }
            
            favoriteButtons.forEach((btn, i) => {
                const activeBgClass = 'bg-[var(--mimoja-blue-v2)]';
                const activeTextClass = 'text-white';
                const inactiveTextClass = 'text-[var(--mimoja-blue)]';

                if (i === index) {
                    btn.classList.add(activeBgClass, activeTextClass);
                    btn.classList.remove(inactiveTextClass);
                } else {
                    btn.classList.remove(activeBgClass, activeTextClass);
                    btn.classList.add(inactiveTextClass);
                }
            });
        } else {
            logger.warn(`Profile may not have been set correctly (callId: ${callId}). Response did not match expected profile.`);
        }
    }
    catch (error) {
        logger.error(`Failed to update profile (callId: ${callId}):`, error);
    } finally {
        // Always reset the flag in the finally block to ensure it gets reset even if there's an error
        profileUpdateInProgress = false;
        logger.info(`handleProfileClick completed (callId: ${callId}), reset profileUpdateInProgress flag`);
    }
}

export async function assignProfile(buttonIndex, profileKey) {
    logger.info(`Assigning profile '${profileKey}' to button ${buttonIndex}`);
    favoriteAssignments[buttonIndex] = profileKey;
    await saveAssignments();
    updateButtonUI();
    document.getElementById('profile_modal').close();
}

function openProfileSelectionModal(buttonIndex) {
    currentButtonIndex = buttonIndex;
    const modal = document.getElementById('profile_modal');
    const container = document.getElementById('profile-list-container');
    if (!modal || !container) return;

    container.innerHTML = ''; // Clear previous list

    for (const profileKey in availableProfiles) {
        const profileRecord = availableProfiles[profileKey];
        if (profileRecord && profileRecord.profile) {
            const item = document.createElement('button');
            item.className = 'btn btn-ghost justify-start';
            const translatedTitle = translateProfileTitle(profileRecord.profile.title);
            item.textContent = translatedTitle;
            item.addEventListener('click', () => {
                assignProfile(buttonIndex, profileKey);
            });
            container.appendChild(item);
        }
    }

    modal.showModal();
}

async function handleDoubleClick(index) {
    if (favoriteAssignments[index]) {
        logger.info(`Double-click on assigned button ${index}. Clearing assignment.`);
        favoriteAssignments[index] = null;
        await saveAssignments();
        updateButtonUI();
    } else {
        logger.info(`Double-click on unassigned button ${index}. Redirect to profile selector.`);
        handleLongPress(index);
        // await loadPage('src/profiles/profile_selector.html');
    }
}

async function handleLongPress(index) {
    const isAssigned = favoriteAssignments[index];

    if (isAssigned) {
        logger.info(`Clearing assignment for favorite button ${index}`);
        favoriteAssignments[index] = null;
        await saveAssignments();
        updateButtonUI();
    }
    else {
        logger.info(`Long press on unassigned favorite button ${index}, navigating to profile selector.`);
        // Show the toast message before navigating
        setTimeout(() => showToast(`Select a profile and press confirm to assign.`, 2400, 'info'), 500);
        // Store the button index for later use when confirming a profile
        sessionStorage.setItem('pendingAssignmentIndex', index);
        loadPage('src/profiles/profile_selector.html');
    }
}

export async function handleProfileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const fileContent = await file.text();
        const profile = JSON.parse(fileContent);

        // Enhanced client-side validation before sending
        const validationResult = validateProfileStructure(profile);
        if (!validationResult.isValid) {
            throw new Error(validationResult.errorMessage);
        }

        logger.info(`Uploading new profile: ${profile.title}`);

        // Try API, then update local cache on success
        const newProfileRecord = await uploadProfile(profile);

        // API call succeeded, now update local state and cache
        availableProfiles[newProfileRecord.id] = newProfileRecord;
        await setSetting(PROFILES_CACHE_KEY, availableProfiles);

        logger.info(`Profile '${newProfileRecord.profile.title}' uploaded successfully with ID ${newProfileRecord.id}.`);
        showToast(`Profile '${newProfileRecord.profile.title}' uploaded.`, 3000, 'success');

        // Dispatch a custom event to notify the UI that the profile list has been updated.
        // The page-specific JS (e.g., profile_selector.js) should listen for this.
        document.dispatchEvent(new CustomEvent('profiles-updated'));

    } catch (error) {
        logger.error('Failed to upload profile:', error);
        showToast(`Error uploading profile: ${error.message}`,5000,'error');
    } finally {
        // Reset the input so the user can upload the same file again
        event.target.value = '';
    }
}

// Enhanced validation function to check for specific missing fields
export function validateProfileStructure(profile) {
    // Check if profile is a valid object
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
        return {
            isValid: false,
            errorMessage: 'Uploaded file does not contain a valid profile object.'
        };
    }

    // Define required keys for a valid profile
    const requiredKeys = [
        'title',
        'author',
        'notes',
        'beverage_type',
        'steps',
        'version',
        'target_volume',
        'target_weight',
        'target_volume_count_start',
        'tank_temperature'
    ];

    // Find missing keys
    const missingKeys = requiredKeys.filter(key => !Object.prototype.hasOwnProperty.call(profile, key));

    if (missingKeys.length > 0) {
        const missingKeysString = missingKeys.join(', ');
        return {
            isValid: false,
            errorMessage: `Uploaded profile is missing required field(s): ${missingKeysString}.`
        };
    }

    // Validate that 'steps' is an array
    if (!Array.isArray(profile.steps)) {
        return {
            isValid: false,
            errorMessage: "Uploaded profile's 'steps' property is not an array."
        };
    }

    // If all validations pass
    return {
        isValid: true,
        errorMessage: null
    };
}

export async function deleteOrHideProfile(profileId) {
    const profileRecord = availableProfiles[profileId];
    if (!profileRecord) {
        logger.error(`Profile with ID ${profileId} not found in local cache.`);
        showToast(`Error: Profile not found.`, 5000, 'error');
        return;
    }
    const isDefault = profileRecord.isDefault;

    logger.info(`Requesting action for profile ID: ${profileId}. Is default: ${isDefault}`);

    if (isDefault) {
        // HIDE a default profile
        try {
            const updatedProfile = await updateProfileVisibility(profileId, 'hidden');
            availableProfiles[profileId] = updatedProfile;
            await setSetting(PROFILES_CACHE_KEY, availableProfiles);

            logger.info(`Profile ${profileId} successfully hidden.`);
            document.dispatchEvent(new CustomEvent('profiles-updated'));
            showToast('Default profile hidden.', 3000, 'success');
        } catch (error) {
            logger.error(`Failed to hide profile ${profileId}:`, error);
            showToast(`Error hiding profile: ${error.message}`, 5000, 'error');
        }
    } else {
        // DELETE a user-uploaded profile
        try {
            await deleteProfile(profileId);

            delete availableProfiles[profileId];

            await setSetting(PROFILES_CACHE_KEY, availableProfiles);

            logger.info(`Profile ${profileId} successfully deleted from backend and removed from local cache.`);

            document.dispatchEvent(new CustomEvent('profiles-updated'));
            showToast('Profile deleted.', 3000, 'success');

        } catch (error) {
            logger.error(`Failed to delete profile ${profileId}:`, error);
            showToast(`Error deleting profile: ${error.message}`, 5000, 'error');
        }
    }
}

export async function unhideProfile(profileId) {
    logger.info(`Requesting to unhide profile ID: ${profileId}`);
    try {
        // The new record is returned on success
        const updatedProfileRecord = await updateProfileVisibility(profileId, "visible");

        // Update local cache with the returned record
        availableProfiles[profileId] = updatedProfileRecord;

        // Update IndexedDB cache
        await setSetting(PROFILES_CACHE_KEY, availableProfiles);

        logger.info(`Profile ${profileId} successfully unhidden.`);

        // Dispatch event to notify UI
        document.dispatchEvent(new CustomEvent('profiles-updated'));
        showToast('Profile restored.', 3000, 'success');

    } catch (error) {
        logger.error(`Failed to unhide profile ${profileId}:`, error);
        showToast(`Error: ${error.message}`, 5000, 'error');
    }
}

export function getHiddenProfiles() {
    return Object.values(availableProfiles).filter(p => p.visibility === 'hidden');
}

// --- Initialization ---

export async function init() {
    logger.info('Profile Manager init started.');
    let profileLoadStatus = {};

    try {
        // Clear the existing button array to ensure we're working with fresh DOM elements
        favoriteButtons = [];

        for (let i = 0; i < FAV_COUNT; i++) {
            const button = document.getElementById(`fav-profile-btn-${i}`);
            if (button) {
                favoriteButtons.push(button);
            } else {
                logger.warn(`Favorite button fav-profile-btn-${i} not found in DOM`);
            }
        }

        await openDB(); // Still needed for the backup functionality

        profileLoadStatus = await loadAvailableProfiles();
        await loadAssignments();
        updateButtonUI();

        // Only attach event listeners to buttons that were found in the DOM
        favoriteButtons.forEach((originalButton, index) => {
            // Remove any existing listeners first to prevent duplicates by cloning the element
            const clonedButton = originalButton.cloneNode(true);
            originalButton.parentNode.replaceChild(clonedButton, originalButton);

            // Update our reference to point to the cloned button
            favoriteButtons[index] = clonedButton;

            clonedButton.classList.add('no-select');
            let pressTimer = null;
            let clickTimer = null;
            let isProcessing = false; // Flag to prevent duplicate execution
            const DOUBLE_CLICK_THRESHOLD = 300; // ms

            const startPress = (e) => {
                e.preventDefault();
                clearTimeout(pressTimer);
                pressTimer = setTimeout(() => {
                    pressTimer = null; // Long press occurred
                    handleLongPress(index);

                }, LONG_PRESS_DURATION);
            };

            const endPress = async () => {
                if (pressTimer !== null) { // It's a tap/click, not a long press
                    clearTimeout(pressTimer);

                    if (clickTimer) { // This is the second click
                        clearTimeout(clickTimer);
                        clickTimer = null;
                        await handleDoubleClick(index);
                    } else { // This is the first click, wait for a potential second click
                        // Prevent duplicate execution by checking both the timer and processing state
                        if (!isProcessing) {
                            isProcessing = true;
                            clickTimer = setTimeout(async () => {
                                clickTimer = null;
                                await handleProfileClick(index);
                                // Reset the flag after the operation completes
                                isProcessing = false;
                            }, DOUBLE_CLICK_THRESHOLD);
                        }
                    }
                }
            };

            const cancelPress = () => {
                clearTimeout(pressTimer);
            };

            clonedButton.addEventListener('mousedown', startPress);
            clonedButton.addEventListener('mouseup', endPress);
            clonedButton.addEventListener('mouseleave', cancelPress);
            clonedButton.addEventListener('touchstart', startPress, { passive: false });
            clonedButton.addEventListener('touchend', endPress);
            clonedButton.addEventListener('touchcancel', cancelPress);

            clonedButton.addEventListener('contextmenu', e => e.preventDefault());
        });

        // Note: This assumes a specific DOM structure which may not exist on all pages using this module.
        const uploadButton = document.getElementById('upload-profile-btn');
        const fileInput = document.getElementById('profile-upload-input');
        if (uploadButton && fileInput) {
            // Remove existing listeners to prevent duplicates by cloning the element
            const newUploadButton = uploadButton.cloneNode(true);
            uploadButton.parentNode.replaceChild(newUploadButton, uploadButton);

            newUploadButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInput.click();
            });
            fileInput.addEventListener('change', handleProfileUpload);
        }

    } catch (error) {
        logger.error('CRITICAL: Error during Profile Manager initialization:', error);
    }

    logger.info('Profile Manager initialized.');
    return profileLoadStatus;
}
import { logger } from './logger.js';
import { sendProfile, getWorkflow, getValueFromStore, setValueInStore } from './api.js';
import { updateProfileName, updateTemperatureDisplay, updateDrinkOut, updateDrinkRatio } from './ui.js';
import { openDB, getSetting, setSetting } from './idb.js';

const FAV_COUNT = 5;
const PROFILES_PATH = '/src/profiles/';
const LONG_PRESS_DURATION = 700; // ms

const SETTINGS_NAMESPACE = 'streamline-app';
const FAVORITES_KEY = 'favorite-profiles';
const UPLOADED_PROFILES_KEY = 'uploaded-profiles';
const DEFAULT_PROFILES_KEY = 'default-profiles';
const DEFAULT_PROFILES_MIGRATED_KEY = 'default-profiles-migrated';


let favoriteButtons = [];
export let availableProfiles = {};
let favoriteAssignments = {};
let currentButtonIndex = null;

// --- Helper Functions ---

export async function migrateDefaultProfilesToRea() {
    try {
        const migrationDone = await getValueFromStore(SETTINGS_NAMESPACE, DEFAULT_PROFILES_MIGRATED_KEY);
        if (migrationDone) {
            logger.info('Default profiles already migrated to REA store. Skipping.');
            return;
        }

        logger.info('Starting one-time migration of default profiles to REA store...');

        const response = await fetch(`${PROFILES_PATH}profile-manifest.json`);
        if (!response.ok) throw new Error('Failed to fetch profile manifest for migration.');
        
        const profileFiles = [...new Set(await response.json())];
        const defaultProfiles = {};

        for (const fileName of profileFiles) {
            try {
                const res = await fetch(`${PROFILES_PATH}${fileName}`);
                if (!res.ok) throw new Error(`Failed to fetch ${fileName} for migration`);
                const profileJson = await res.json();
                const profileContent = fileName === 'test.json' ? profileJson.profile : profileJson;
                defaultProfiles[fileName] = profileContent;
            } catch (error) {
                logger.error(`Migration: Failed to load profile: ${fileName}`, error);
            }
        }
        
        if (Object.keys(defaultProfiles).length > 0) {
            await setValueInStore(SETTINGS_NAMESPACE, DEFAULT_PROFILES_KEY, defaultProfiles);
            await setValueInStore(SETTINGS_NAMESPACE, DEFAULT_PROFILES_MIGRATED_KEY, true);
            logger.info(`Successfully migrated ${Object.keys(defaultProfiles).length} default profiles to REA store.`);
            // Also save to IndexedDB backup right away
            await setSetting(DEFAULT_PROFILES_KEY, defaultProfiles);
        }

    } catch (error) {
        logger.error('Failed during default profile migration:', error);
    }
}


export async function loadAvailableProfiles() {
    let defaultProfiles = {};
    let uploadedProfiles = {};
    let profilesfromREA = false;
    let profilesfromIDB = false;
    let profilesfromJSON = false;
    try {
        // Try to load default profiles from REA store or fallback to IndexedDB
        const reaDefaults = await getValueFromStore(SETTINGS_NAMESPACE, DEFAULT_PROFILES_KEY);
        if (reaDefaults) {
            logger.info('Loaded default profiles from REA store.');
            defaultProfiles = reaDefaults;
            await setSetting(DEFAULT_PROFILES_KEY, defaultProfiles); // Update backup
            profilesfromREA= true;
        } else {
            logger.warn('No default profiles in REA store, checking IndexedDB backup...');
            const idbDefaults = await getSetting(DEFAULT_PROFILES_KEY);
            if (idbDefaults) {
                logger.info('Loaded default profiles from IndexedDB backup.');
                defaultProfiles = idbDefaults;
                // Attempt to sync back to REA. The migration logic should handle the primary load.
                await setValueInStore(SETTINGS_NAMESPACE, DEFAULT_PROFILES_KEY, defaultProfiles);
            }
        }

        // Try to load user-uploaded profiles from REA store or fallback to IndexedDB
        const reaUploaded = await getValueFromStore(SETTINGS_NAMESPACE, UPLOADED_PROFILES_KEY);
        if (reaUploaded) {
            logger.info('Loaded uploaded profiles from REA store.');
            uploadedProfiles = reaUploaded;
            await setSetting(UPLOADED_PROFILES_KEY, uploadedProfiles); // Update backup
        } else {
            logger.warn('No uploaded profiles in REA store, checking IndexedDB backup...');
            const idbUploaded = await getSetting(UPLOADED_PROFILES_KEY);
            if (idbUploaded) {
                logger.info('Loaded uploaded profiles from IndexedDB backup.');
                uploadedProfiles = idbUploaded;
                await setValueInStore(SETTINGS_NAMESPACE, UPLOADED_PROFILES_KEY, uploadedProfiles); // Sync back to REA
            }
        }
    } catch (error) {
        logger.error('Failed to load profiles from REA store. Falling back to IndexedDB.', error);
        try {
            const idbDefaults = await getSetting(DEFAULT_PROFILES_KEY);
            if (idbDefaults) defaultProfiles = idbDefaults;

            const idbUploaded = await getSetting(UPLOADED_PROFILES_KEY);
            if (idbUploaded) uploadedProfiles = idbUploaded;
            
            if(Object.keys(defaultProfiles).length > 0 || Object.keys(uploadedProfiles).length > 0) {
                logger.info('Loaded profiles from IndexedDB backup during fallback.');
                profilesfromIDB = true;
            } else {
                logger.warn('No profiles found in IndexedDB backup either.');
            }

        } catch (idbError) {
             logger.error('Failed to load profiles from IndexedDB backup as well.', idbError);
        }
    }
    
    // Merge all profiles into the main object
    availableProfiles = { ...defaultProfiles, ...uploadedProfiles };

    // If all sources failed, fall back to bundled profiles from manifest
    if (Object.keys(availableProfiles).length === 0) {
        logger.warn('No profiles found in REA or IndexedDB. Falling back to bundled manifest profiles.');
        try {
            const response = await fetch(`${PROFILES_PATH}profile-manifest.json`);
            if (!response.ok) throw new Error('Failed to fetch profile manifest for fallback.');
            
            const profileFiles = [...new Set(await response.json())];
            const bundledProfiles = {};

            for (const fileName of profileFiles) {
                try {
                    const res = await fetch(`${PROFILES_PATH}${fileName}`);
                    if (!res.ok) throw new Error(`Failed to fetch ${fileName} for fallback`);
                    const profileJson = await res.json();
                    const profileContent = fileName === 'test.json' ? profileJson.profile : profileJson;
                    bundledProfiles[fileName] = profileContent;
                } catch (error) {
                    logger.error(`Fallback: Failed to load profile: ${fileName}`, error);
                }
            }
            
            if (Object.keys(bundledProfiles).length > 0) {
                availableProfiles = bundledProfiles;
                logger.info(`Successfully loaded ${Object.keys(bundledProfiles).length} bundled profiles as a fallback.`);
                profilesfromJSON = true;
            } else {
                logger.error('Fallback failed: Could not load any profiles from the manifest.');
            }
        } catch (manifestError) {
            logger.error('Failed to load profiles from bundled manifest.', manifestError);
        }
    }

    logger.info('All available profiles loaded.', Object.keys(availableProfiles));
    return { profilesfromIDB, profilesfromJSON, profilesfromREA };
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
        const profile = availableProfiles[profileKey];

        if (button && profile) {
            button.textContent = profile.title || 'Untitled';
        }
        else if (button) {
            button.textContent = '';
        }
    }
}

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

async function handleProfileClick(index) {
    const profileKey = favoriteAssignments[index];
    const profile = availableProfiles[profileKey];

    if (!profile) {
        logger.warn(`Button ${index} has no profile assigned.`);
        return;
    }

    logger.info(`Sending profile '${profile.title}' to REA...`);
    try {
        await sendProfile(profile);
        logger.info(`Successfully sent profile. Verifying...`);

        const isVerified = await verifyProfileChange(profile.title);

        if (isVerified) {
            updateProfileName(profile.title);
            if (profile.steps && profile.steps.length > 0) {
                updateTemperatureDisplay(profile.steps[0].temperature);
            }
            if (profile.target_weight) {
                updateDrinkOut(profile.target_weight);
                updateDrinkRatio();
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
        }
    }
    catch (error) {
        logger.error('Failed to send or verify profile:', error);
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
        const profile = availableProfiles[profileKey];
        const item = document.createElement('button');
        item.className = 'btn btn-ghost justify-start';
        item.textContent = profile.title;
        item.addEventListener('click', () => {
            assignProfile(buttonIndex, profileKey);
        });
        container.appendChild(item);
    }

    modal.showModal();
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
        logger.info(`Long press on favorite button ${index}, navigating to profile editor.`);
    window.location.href = 'src/profiles/profile_selector.html';
    }
}

async function handleProfileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const fileContent = await file.text();
        const profile = JSON.parse(fileContent);
        const fileName = file.name;

        if (profile.title && profile.steps) {
            availableProfiles[fileName] = profile;
            logger.info(`Successfully loaded uploaded profile: ${profile.title}`);

            const existingUploaded = await getSetting(UPLOADED_PROFILES_KEY);
            const allUploaded = existingUploaded || {};
            allUploaded[fileName] = profile;
            
            await Promise.allSettled([
                setValueInStore(SETTINGS_NAMESPACE, UPLOADED_PROFILES_KEY, allUploaded),
                setSetting(UPLOADED_PROFILES_KEY, allUploaded)
            ]);
            
            logger.info(`Saved new profile '${fileName}' to REA store and IndexedDB backup.`);

            if (currentButtonIndex !== null) {
                openProfileSelectionModal(currentButtonIndex);
            }
        } else {
            logger.error('Uploaded file is not a valid profile format.');
            alert('Error: Uploaded file is not a valid profile.');
        }
    } catch (error) {
        logger.error('Failed to parse or save uploaded profile:', error);
        alert('Error: Could not process the uploaded file.');
    }
}

// --- Initialization ---

export async function init() {
    logger.info('Profile Manager init started.');
    try {
        for (let i = 0; i < FAV_COUNT; i++) {
            const button = document.getElementById(`fav-profile-btn-${i}`);
            if (button) favoriteButtons.push(button);
        }

        await openDB(); // Still needed for the backup functionality

        await migrateDefaultProfilesToRea();
        await loadAvailableProfiles();
        await loadAssignments();
        updateButtonUI();

        favoriteButtons.forEach((button, index) => {
            button.classList.add('no-select');
            let pressTimer = null;

            const startPress = () => {
                clearTimeout(pressTimer);
                pressTimer = setTimeout(() => {
                    handleLongPress(index);
                    pressTimer = null; 
                }, LONG_PRESS_DURATION);
            };

            const cancelPress = () => {
                clearTimeout(pressTimer);
            };

            button.addEventListener('click', () => {
                if (pressTimer !== null) { // Prevents click firing after long press
                    handleProfileClick(index)
                }
            });
            button.addEventListener('mousedown', startPress);
            button.addEventListener('mouseup', cancelPress);
            button.addEventListener('mouseleave', cancelPress);
            button.addEventListener('touchstart', startPress, { passive: true });
            button.addEventListener('touchend', cancelPress);

            button.addEventListener('contextmenu', e => e.preventDefault());
        });

        const uploadButton = document.getElementById('upload-profile-btn');
        const fileInput = document.getElementById('profile-upload-input');
        if (uploadButton && fileInput) {
            uploadButton.addEventListener('click', (e) => {
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
}

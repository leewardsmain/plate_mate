import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useBlocker } from 'react-router-dom';
import styles from './Settings.module.css';
import { useAppStore } from '../store/useAppStore';
import { Modal } from '../components/ui/Modal';
import FoodTagInput from '../components/ui/FoodTagInput';

const ACCENT_COLORS = [
    { hex: '#f49d25', name: 'Orange' },
    { hex: '#3b82f6', name: 'Blue' },
    { hex: '#22c55e', name: 'Green' },
    { hex: '#a855f7', name: 'Purple' },
    { hex: '#ef4444', name: 'Red' },
    { hex: '#14b8a6', name: 'Teal' },
    { hex: '#f43f5e', name: 'Rose' },
    { hex: '#eab308', name: 'Gold' },
];

export default function Settings() {
    const { currentUser, updateCurrentUser, updateUserAvatar, accentColor, setAccentColor, addToast, deleteAccount } = useAppStore();

    // Local form state
    const [formData, setFormData] = useState({
        name: currentUser.name,
        email: currentUser.email,
        handle: currentUser.handle,
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        favCuisine: currentUser.favCuisine || 'Japanese',
        socialLinks: {
            instagram: currentUser.socialLinks?.instagram || '',
            twitter: currentUser.socialLinks?.twitter || '',
            tiktok: currentUser.socialLinks?.tiktok || '',
            youtube: currentUser.socialLinks?.youtube || '',
            website: currentUser.socialLinks?.website || ''
        },
        foodTags: currentUser.foodTags || []
    });

    // Modals
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);


    // Reset local state if store changes (e.g. from sync)
    useEffect(() => {
        setFormData({
            name: currentUser.name,
            email: currentUser.email,
            handle: currentUser.handle,
            bio: currentUser.bio || '',
            location: currentUser.location || '',
            favCuisine: currentUser.favCuisine || 'Japanese',
            socialLinks: {
                instagram: currentUser.socialLinks?.instagram || '',
                twitter: currentUser.socialLinks?.twitter || '',
                tiktok: currentUser.socialLinks?.tiktok || '',
                youtube: currentUser.socialLinks?.youtube || '',
                website: currentUser.socialLinks?.website || ''
            },
            foodTags: currentUser.foodTags || []
        });
    }, [currentUser]);

    // Dirty state detection
    const isDirty = useMemo(() => {
        return (
            formData.name !== currentUser.name ||
            formData.email !== currentUser.email ||
            formData.handle !== currentUser.handle ||
            formData.bio !== (currentUser.bio || '') ||
            formData.location !== (currentUser.location || '') ||
            formData.favCuisine !== (currentUser.favCuisine || 'Japanese') ||
            formData.socialLinks.instagram !== (currentUser.socialLinks?.instagram || '') ||
            formData.socialLinks.twitter !== (currentUser.socialLinks?.twitter || '') ||
            formData.socialLinks.tiktok !== (currentUser.socialLinks?.tiktok || '') ||
            formData.socialLinks.youtube !== (currentUser.socialLinks?.youtube || '') ||
            formData.socialLinks.website !== (currentUser.socialLinks?.website || '') ||
            JSON.stringify(formData.foodTags) !== JSON.stringify(currentUser.foodTags || [])
        );
    }, [formData, currentUser]);

    // Block in-app navigation when form is dirty
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    // Block browser close/refresh when form is dirty
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            // fake delay
            setTimeout(() => {
                updateUserAvatar(file);
                setIsUploading(false);
                addToast('Avatar updated', 'success');
            }, 800);
        }
    };

    const handleRemoveAvatar = () => {
        setIsUploading(true);
        // fake delay
        setTimeout(() => {
            updateUserAvatar(null);
            setIsUploading(false);
            addToast('Avatar removed', 'success');
        }, 800);
    };

    const handlePasswordReset = () => {
        addToast('Password reset link sent to your email.', 'success');
    };

    const handleDeleteAccount = () => {
        setShowDeleteModal(true);
    };

    const confirmDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await deleteAccount();
            setShowDeleteModal(false);
            addToast('Account deleted. We will miss you!', 'success');
        } catch (error) {
            addToast('Failed to delete account. Please try again.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSave = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        updateCurrentUser(formData);
        addToast('Profile updated successfully!', 'success');
    }, [formData, updateCurrentUser, addToast]);

    const handleCancel = () => {
        // Reset to store values
        setFormData({
            name: currentUser.name,
            email: currentUser.email,
            handle: currentUser.handle,
            bio: currentUser.bio || '',
            location: currentUser.location || '',
            favCuisine: currentUser.favCuisine || 'Japanese',
            socialLinks: {
                instagram: currentUser.socialLinks?.instagram || '',
                twitter: currentUser.socialLinks?.twitter || '',
                tiktok: currentUser.socialLinks?.tiktok || '',
                youtube: currentUser.socialLinks?.youtube || '',
                website: currentUser.socialLinks?.website || ''
            },
            foodTags: currentUser.foodTags || []
        });
    };

    return (
        <div className={styles.settingsLayout}>

            {/* Unsaved changes modal */}
            {blocker.state === 'blocked' && (
                <div className={styles.blockerOverlay}>
                    <div className={styles.blockerModal}>
                        <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)' }}>warning</span>
                        <h3 className={styles.blockerTitle}>Unsaved Changes</h3>
                        <p className={styles.blockerText}>You have unsaved changes. Are you sure you want to leave?</p>
                        <div className={styles.blockerActions}>
                            <button className={styles.blockerBtnStay} onClick={() => blocker.reset?.()}>Stay</button>
                            <button className={styles.blockerBtnLeave} onClick={() => blocker.proceed?.()}>Discard & Leave</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            <Modal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                title="Discard Changes?"
            >
                <p className={styles.modalText}>
                    You have unsaved changes. Are you sure you want to discard them and leave?
                </p>
                <div className={styles.modalActions}>
                    <button className={styles.btnCancel} onClick={() => setShowCancelModal(false)}>Stay</button>
                    <button className={styles.btnSave} onClick={() => {
                        handleCancel(); // resets dirty
                        setShowCancelModal(false);
                        if (blocker.state === 'blocked') {
                            blocker.proceed();
                        }
                    }}>Discard & Leave</button>
                </div>
            </Modal>

            {/* Delete Account Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Account"
            >
                <p className={styles.modalText}>
                    Are you sure you want to delete your account? This action is permanent and cannot be undone. All your reviews, saved restaurants, and profile data will be lost.
                </p>
                <div className={styles.modalActions}>
                    <button className={styles.btnSecondary} onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Cancel</button>
                    <button className={styles.btnDestructive} onClick={confirmDeleteAccount} disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
                    </button>
                </div>
            </Modal>

            {/* Main Content Area */}
            <main className={styles.mainContent}>
                <div className={styles.pageHeader}>
                    <div className={styles.pageHeaderRow}>
                        <div>
                            <h2 className={styles.pageTitle}>Public Profile</h2>
                            <p className={styles.pageSubtitle}>Manage how you appear to other foodies on PlateMate.</p>
                        </div>
                        <Link to="/profile" className={styles.viewProfileLink}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                            View Profile
                        </Link>
                    </div>
                </div>

                <div className={styles.formCard}>
                    {/* Avatar Section */}
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarWrapper}>
                            <div className={styles.avatar} style={currentUser.avatar ? { backgroundImage: `url('${currentUser.avatar}')` } : { backgroundColor: 'var(--slate-200)' }} />
                            <label htmlFor="avatar-upload-settings" className={styles.uploadIconBtn}>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>photo_camera</span>
                                <input
                                    id="avatar-upload-settings"
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleAvatarChange}
                                />
                            </label>
                        </div>
                        <div>
                            <h3 className={styles.avatarInfoTitle}>Profile Picture</h3>
                            <p className={styles.avatarInfoText}>We support PNGs, JPEGs and GIFs under 10MB.</p>
                            <div className={styles.btnGroup}>
                                <label htmlFor="avatar-upload-settings" className={styles.btnUpload} style={{ cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.7 : 1 }}>
                                    {isUploading ? 'Uploading...' : 'Upload New'}
                                </label>
                                <button className={styles.btnRemove} onClick={handleRemoveAvatar} disabled={isUploading}>Remove</button>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <form className={styles.formGroup} onSubmit={handleSave}>
                        <div className={styles.formRow}>
                            <div className={styles.inputField}>
                                <label className={styles.inputLabel}>Display Name</label>
                                <input
                                    className={styles.textInput}
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className={styles.inputField}>
                                <label className={styles.inputLabel}>Username</label>
                                <div className={styles.inputWrap}>
                                    <span className={styles.inputPrefix}>@</span>
                                    <input
                                        className={`${styles.textInput} ${styles.hasPrefix} `}
                                        type="text"
                                        value={formData.handle}
                                        onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                                    />
                                    <span className={`${styles.inputSuffix} material-symbols-outlined`} style={{ color: '#22c55e', fontSize: '18px' }}>check_circle</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.inputField}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <label className={styles.inputLabel}>Bio</label>
                                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                                    {formData.bio.length}/200
                                </span>
                            </div>
                            <textarea
                                className={styles.textInput}
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, 200) })}
                            />
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.inputField}>
                                <label className={styles.inputLabel}>Location</label>
                                <div className={styles.inputWrap}>
                                    <span className={`${styles.inputPrefix} material-symbols-outlined`} style={{ left: '0.75rem', fontSize: '20px' }}>location_on</span>
                                    <input
                                        className={`${styles.textInput} ${styles.hasIconPrefix} `}
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className={styles.inputField}>
                                <label className={styles.inputLabel}>Favorite Cuisine</label>
                                <div className={styles.inputWrap}>
                                    <select
                                        className={styles.textInput}
                                        style={{ appearance: 'none' }}
                                        value={formData.favCuisine}
                                        onChange={(e) => setFormData({ ...formData, favCuisine: e.target.value })}
                                    >
                                        <option value="Japanese">Japanese</option>
                                        <option value="Italian">Italian</option>
                                        <option value="Mexican">Mexican</option>
                                        <option value="Indian">Indian</option>
                                    </select>
                                    <span className={`${styles.inputSuffix} material-symbols-outlined`}>expand_more</span>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className={styles.socialsSection}>
                            <h4 className={styles.socialsTitle}>Social Links</h4>

                            <div className={styles.socialInputGroup}>
                                <span className={styles.socialAddon}>instagram.com/</span>
                                <input
                                    className={styles.socialInput}
                                    type="text"
                                    placeholder="username"
                                    value={formData.socialLinks.instagram}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                                    })}
                                />
                            </div>

                            <div className={styles.socialInputGroup}>
                                <span className={styles.socialAddon}>twitter.com/</span>
                                <input
                                    className={styles.socialInput}
                                    type="text"
                                    placeholder="username"
                                    value={formData.socialLinks.twitter}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                                    })}
                                />
                            </div>

                            <div className={styles.socialInputGroup}>
                                <span className={styles.socialAddon}>tiktok.com/@</span>
                                <input
                                    className={styles.socialInput}
                                    type="text"
                                    placeholder="username"
                                    value={formData.socialLinks.tiktok}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        socialLinks: { ...formData.socialLinks, tiktok: e.target.value }
                                    })}
                                />
                            </div>

                            <div className={styles.socialInputGroup}>
                                <span className={styles.socialAddon}>youtube.com/@</span>
                                <input
                                    className={styles.socialInput}
                                    type="text"
                                    placeholder="channel"
                                    value={formData.socialLinks.youtube}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        socialLinks: { ...formData.socialLinks, youtube: e.target.value }
                                    })}
                                />
                            </div>

                            <div className={styles.socialInputGroup}>
                                <span className={styles.socialAddon}>https://</span>
                                <input
                                    className={styles.socialInput}
                                    type="text"
                                    placeholder="yourwebsite.com"
                                    value={formData.socialLinks.website}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        socialLinks: { ...formData.socialLinks, website: e.target.value }
                                    })}
                                />
                            </div>
                        </div>

                        {/* Food Tags */}
                        <div className={styles.socialsSection}>
                            <h4 className={styles.socialsTitle}>Cuisine Tags</h4>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--slate-400)', marginBottom: '0.5rem' }}>Select cuisines you love — these power your Plates Radar on your profile.</p>
                            <FoodTagInput
                                tags={formData.foodTags}
                                onChange={(tags) => setFormData({ ...formData, foodTags: tags })}
                            />
                        </div>

                        {/* Actions */}
                        <div className={styles.actionsSection}>
                            <button type="button" className={styles.btnCancel} onClick={handleCancel}>Cancel</button>
                            <button type="submit" className={styles.btnSave}>Save Changes</button>
                        </div>
                    </form>
                </div>

                {/* Account Management */}
                <div className={`${styles.formCard} ${styles.accountSection}`}>
                    <div>
                        <h3 className={styles.privacyTitle}>Account Management</h3>
                        <p className={styles.privacyDesc}>Update your credentials or delete your account.</p>
                    </div>

                    <div className={styles.accountGrid}>
                        <div className={styles.inputField} style={{ flex: 1 }}>
                            <label className={styles.inputLabel}>Email Address</label>
                            <input
                                className={styles.textInput}
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <button
                            type="button"
                            className={styles.btnSecondary}
                            onClick={handlePasswordReset}
                            style={{ alignSelf: 'flex-end', height: '44px' }}
                        >
                            Change Password
                        </button>
                    </div>

                    <div className={styles.dangerZone}>
                        <div>
                            <h4 style={{ fontSize: '0.875rem', margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>Delete Account</h4>
                            <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--slate-400)' }}>Once you delete your account, there is no going back. Please be certain.</p>
                        </div>
                        <button
                            type="button"
                            className={styles.btnDestructive}
                            onClick={handleDeleteAccount}
                        >
                            Delete Account
                        </button>
                    </div>
                </div>

                {/* Profile Visibility */}
                <div className={`${styles.formCard} ${styles.privacySection} `}>
                    <div>
                        <h3 className={styles.privacyTitle}>Profile Visibility</h3>
                        <p className={styles.privacyDesc}>Control who can see your dining ledger and reviews.</p>
                    </div>
                    <label className={styles.toggleSwitch}>
                        <div className={styles.toggleBg}>
                            <div className={styles.toggleKnob} />
                        </div>
                        <span className={styles.toggleLabel}>Public</span>
                    </label>
                </div>

                {/* Accent Color */}
                <div className={`${styles.formCard} ${styles.colorSection}`}>
                    <div>
                        <h3 className={styles.privacyTitle}>Accent Color</h3>
                        <p className={styles.privacyDesc}>Choose a color that makes PlateMate yours.</p>
                    </div>
                    <div className={styles.colorGrid}>
                        {ACCENT_COLORS.map((c) => (
                            <button
                                key={c.hex}
                                data-testid={`color-swatch-${c.hex}`}
                                className={`${styles.colorSwatch} ${accentColor === c.hex ? styles.colorSwatchActive : ''}`}
                                style={{ backgroundColor: c.hex }}
                                onClick={() => setAccentColor(c.hex)}
                                title={c.name}
                            >
                                {accentColor === c.hex && (
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#fff' }}>check</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}


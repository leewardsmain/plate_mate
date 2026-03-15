import { useState, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import styles from './Layout.module.css';
import { CreateReviewModal } from '../features/CreateReviewModal';
import { EditReviewModal } from '../features/EditReviewModal';
import { RestaurantSearch } from '../features/RestaurantSearch';

import { useAppStore } from '../../store/useAppStore';

export default function Layout() {
    const { openCreateReviewModal, theme, toggleTheme, currentUser, signOut, initialReviewRestaurantId } = useAppStore();
    const location = useLocation();


    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
    const submenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const toggleMenu = (menuName: string) => {
        setExpandedMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
    };

    const isRouteActive = (path?: string) => {
        if (!path) return false;
        if (path === '/' && location.pathname !== '/') return false;
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { name: 'Feed', path: '/', icon: 'rss_feed' },
        { name: 'Restaurants', path: '/restaurants', icon: 'storefront' },
        { name: 'Profile', path: '/profile', icon: 'person' },
        {
            name: 'Settings',
            icon: 'settings',
            children: [
                { name: 'Profile Details', path: '/settings', icon: 'person' },
                { name: 'Sign Out', path: '#', icon: 'logout' }
            ]
        },
    ];

    return (
        <div className={styles.layoutContainer}>
            <header className={styles.topNav}>
                <div className={styles.logoArea}>
                    <span className={`material-symbols-outlined ${styles.logoIcon}`}>restaurant_menu</span>
                    <span className={styles.logoText}>PlateMate</span>
                </div>

                <div className={styles.searchWrapper}>
                    <RestaurantSearch />
                </div>

                <div className={styles.navActions}>
                    <button className={styles.iconButton} onClick={toggleTheme} title="Toggle Theme">
                        <span className="material-symbols-outlined">
                            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>
                    <button className={styles.iconButton}>
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <button className={`${styles.iconButton} ${styles.hideMobile}`}>
                        <span className="material-symbols-outlined">chat_bubble</span>
                    </button>
                    <button className={`${styles.primaryButton} ${styles.hideMobile}`} onClick={() => openCreateReviewModal()} aria-label="Log Meal">
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
                        <span className={styles.hideMobileText}>Log Meal</span>
                    </button>
                    <Link
                        to="/profile"
                        className={styles.avatar}
                        style={{ backgroundImage: `url(${currentUser.avatar})` }}
                    />

                </div>
            </header>

            <main className={styles.mainContent}>
                <aside className={styles.sidebar}>
                    <nav className={styles.sidebarNav}>
                        {navItems.map((item) => (
                            <div key={item.name} className={styles.navGroup}>
                                {item.children ? (
                                    <>
                                        <button
                                            className={`${styles.sidebarNavItem} ${item.children.some(child => isRouteActive(child.path)) ? styles.activeGroup : ''}`}
                                            onClick={() => toggleMenu(item.name)}
                                        >
                                            <span className="material-symbols-outlined">{item.icon}</span>
                                            <span style={{ flex: 1, textAlign: 'left' }}>{item.name}</span>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                                {expandedMenus[item.name] ? 'remove' : 'add'}
                                            </span>
                                        </button>
                                        <div
                                            className={`${styles.subMenu} ${expandedMenus[item.name] ? styles.expanded : ''}`}
                                            ref={(el) => { submenuRefs.current[item.name] = el; }}
                                            style={{
                                                maxHeight: expandedMenus[item.name] ? `${submenuRefs.current[item.name]?.scrollHeight}px` : '0px'
                                            }}
                                        >
                                            {item.children.map(child => (
                                                child.name === 'Sign Out' ? (
                                                    <button
                                                        key={child.name}
                                                        onClick={() => {
                                                            signOut();
                                                            // Optional: Redirect or show feedback
                                                        }}
                                                        className={`${styles.sidebarNavItem} ${styles.subNavItem}`}
                                                    >
                                                        <span className="material-symbols-outlined">{child.icon}</span>
                                                        {child.name}
                                                    </button>
                                                ) : (
                                                    <Link
                                                        key={child.name}
                                                        to={child.path}
                                                        className={`${styles.sidebarNavItem} ${styles.subNavItem} ${isRouteActive(child.path) ? styles.active : ''}`}
                                                    >
                                                        <span className="material-symbols-outlined">{child.icon}</span>
                                                        {child.name}
                                                    </Link>
                                                )
                                            ))}

                                        </div>
                                    </>
                                ) : (
                                    <Link
                                        to={item.path!}
                                        className={`${styles.sidebarNavItem} ${isRouteActive(item.path) ? styles.active : ''}`}
                                    >
                                        <span className="material-symbols-outlined">{item.icon}</span>
                                        <span style={{ flex: 1, textAlign: 'left' }}>{item.name}</span>
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>
                </aside>

                <section className={styles.contentArea}>
                    <Outlet />
                </section>
            </main>

            <nav className={styles.bottomNav}>
                <Link to="/" className={`${styles.bottomNavItem} ${isRouteActive('/') ? styles.active : ''}`}>
                    <span className="material-symbols-outlined">rss_feed</span>
                    <span>Feed</span>
                </Link>
                <Link to="/restaurants" className={`${styles.bottomNavItem} ${isRouteActive('/restaurants') ? styles.active : ''}`}>
                    <span className="material-symbols-outlined">storefront</span>
                    <span>Restaurants</span>
                </Link>

                <div className={styles.fabContainer}>
                    <button className={styles.fab} onClick={() => openCreateReviewModal()} aria-label="Add Review">
                        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>add</span>
                    </button>
                </div>

                <Link to="/profile" className={`${styles.bottomNavItem} ${isRouteActive('/profile') ? styles.active : ''}`}>
                    <span className="material-symbols-outlined">person</span>
                    <span>Profile</span>
                </Link>
                <Link to="/settings" className={`${styles.bottomNavItem} ${isRouteActive('/settings') ? styles.active : ''}`}>
                    <span className="material-symbols-outlined">settings</span>
                    <span>Settings</span>
                </Link>
            </nav>

            <CreateReviewModal initialRestaurantId={initialReviewRestaurantId || undefined} />
            <EditReviewModal />
        </div>
    );
}

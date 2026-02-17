/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminActivities from './pages/AdminActivities';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminBadges from './pages/AdminBadges';
import AdminDashboard from './pages/AdminDashboard';
import AdminPaths from './pages/AdminPaths';
import AdminUserFix from './pages/AdminUserFix';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import NotificationSettings from './pages/NotificationSettings';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import TeamLeadDashboard from './pages/TeamLeadDashboard';
import AdminOrganization from './pages/AdminOrganization';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminActivities": AdminActivities,
    "AdminAnnouncements": AdminAnnouncements,
    "AdminBadges": AdminBadges,
    "AdminDashboard": AdminDashboard,
    "AdminPaths": AdminPaths,
    "AdminUserFix": AdminUserFix,
    "Dashboard": Dashboard,
    "Leaderboard": Leaderboard,
    "NotificationSettings": NotificationSettings,
    "Notifications": Notifications,
    "Profile": Profile,
    "TeamLeadDashboard": TeamLeadDashboard,
    "AdminOrganization": AdminOrganization,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
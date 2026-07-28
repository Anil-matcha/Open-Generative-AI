'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ImageStudio, VideoStudio, ClippingStudio, VibeMotionStudio, LipSyncStudio, RecastStudio, CinemaStudio, AudioStudio, MarketingStudio, WorkflowStudio, AgentStudio, AppsStudio, AiInfluencerStudio, getUserBalance } from 'studio';

const DesignAgentStudio = dynamic(() => import('studio').then(mod => mod.DesignAgentStudio), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-black flex items-center justify-center text-white/20">Loading Design Studio...</div>
});
import axios from 'axios';
import ApiKeyModal from './ApiKeyModal';

const TABS = [
  {
    id: 'image',
    label: 'Image Studio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    )
  },
  {
    id: 'video',
    label: 'Video Studio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    )
  },
  {
    id: 'audio',
    label: 'Audio Studio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
    )
  },
  {
    id: 'clipping',
    label: 'AI Clipping',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3"/>
        <circle cx="6" cy="18" r="3"/>
        <line x1="20" y1="4" x2="8.12" y2="15.88"/>
        <line x1="14.47" y1="14.47" x2="20" y2="20"/>
        <line x1="8.12" y1="8.12" x2="12" y2="12"/>
      </svg>
    )
  },
  {
    id: 'vibe-motion',
    label: 'Vibe Motion',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    )
  },
  {
    id: 'lipsync',
    label: 'Lip Sync',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
      </svg>
    )
  },
  {
    id: 'body-swap',
    label: 'Body Swap',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="8.5" cy="7" r="4"/>
        <polyline points="17 11 19 13 23 9"/>
        <path d="M23 13v-2"/>
      </svg>
    )
  },
  {
    id: 'cinema',
    label: 'Cinema Studio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
        <line x1="7" y1="2" x2="7" y2="22"/>
        <line x1="17" y1="2" x2="17" y2="22"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <line x1="2" y1="7" x2="7" y2="7"/>
        <line x1="2" y1="17" x2="7" y2="17"/>
        <line x1="17" y1="17" x2="22" y2="17"/>
        <line x1="17" y1="7" x2="22" y2="7"/>
      </svg>
    )
  },
  {
    id: 'marketing',
    label: 'Marketing Studio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <line x1="8" y1="9" x2="16" y2="9"/>
        <line x1="8" y1="13" x2="14" y2="13"/>
      </svg>
    )
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="6" height="6" rx="1"/>
        <rect x="15" y="3" width="6" height="6" rx="1"/>
        <rect x="9" y="15" width="6" height="6" rx="1"/>
        <path d="M6 9v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9"/>
        <path d="M12 13v2"/>
      </svg>
    )
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2"/>
        <circle cx="12" cy="5" r="2"/>
        <path d="M12 7v4"/>
        <line x1="8" y1="16" x2="8.01" y2="16"/>
        <line x1="16" y1="16" x2="16.01" y2="16"/>
      </svg>
    )
  },
  {
    id: 'design-agent',
    label: 'Design Agent',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z"/>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
        <path d="M2 2l7.586 7.586"/>
        <circle cx="11" cy="11" r="2"/>
      </svg>
    )
  },
  {
    id: 'apps',
    label: 'Explore Apps',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    )
  },
  {
    id: 'ai-influencer',
    label: 'AI Influencer Studio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    )
  }
];

const NAVIGATION_CATEGORIES = [
  {
    id: 'images',
    label: 'Images',
    tabIds: ['image', 'cinema', 'design-agent', 'ai-influencer'],
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
    )
  },
  {
    id: 'video',
    label: 'Video',
    tabIds: ['video', 'clipping', 'vibe-motion', 'lipsync', 'body-swap', 'marketing'],
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="15" height="16" rx="2"/>
        <path d="M17 9l5-3v12l-5-3"/>
        <path d="M8 9l4 3-4 3z"/>
      </svg>
    )
  },
  {
    id: 'audio',
    label: 'Audio',
    tabIds: ['audio'],
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
    )
  },
  {
    id: 'agents-automation',
    label: 'Agents & Automation',
    tabIds: ['agents', 'workflows'],
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="6" height="6" rx="1"/>
        <rect x="15" y="3" width="6" height="6" rx="1"/>
        <rect x="9" y="15" width="6" height="6" rx="1"/>
        <path d="M6 9v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"/>
        <path d="M12 13v2"/>
      </svg>
    )
  }
];

const EXPLORE_APPS_TAB = TABS.find((tab) => tab.id === 'apps');

const getNavigationCategory = (tabId) => (
  NAVIGATION_CATEGORIES.find((category) => category.tabIds.includes(tabId))
);

const STORAGE_KEY = 'muapi_key';
const NOTIFICATIONS_STORAGE_KEY = 'open_gen_notifications_v1';
const MAX_VISIBLE_NOTIFICATIONS = 3;

const loadStoredNotifications = () => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = JSON.parse(window.sessionStorage.getItem(NOTIFICATIONS_STORAGE_KEY) || '[]');
    const now = Date.now();
    return Array.isArray(stored)
      ? stored.filter((notification) => notification.expiresAt > now).slice(0, MAX_VISIBLE_NOTIFICATIONS)
      : [];
  } catch {
    return [];
  }
};

const persistNotifications = (notifications) => {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(notifications),
    );
  } catch {
    // Notification persistence is optional; rendering still works without storage.
  }
};

export default function StandaloneShell() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug || []; 
  const idFromParams = params?.id;
  const tabFromParams = params?.tab;

  // Helper to extract workflow details precisely from either route structure
  const getWorkflowInfo = useCallback(() => {
    if (idFromParams) {
        return { id: idFromParams, tab: tabFromParams || null };
    }
    const wfIndex = slug.findIndex(s => s === 'workflows' || s === 'workflow');
    if (wfIndex === -1) return { id: null, tab: null };
    return {
      id: slug[wfIndex + 1] || null,
      tab: slug[wfIndex + 2] || null
    };
  }, [slug, idFromParams, tabFromParams]);

  const { id: urlWorkflowId } = getWorkflowInfo();

  // Initialize activeTab from URL slug/params or default to 'image'
  const getInitialTab = () => {
    if (idFromParams || slug.includes('workflow')) return 'workflows';
    if (slug.includes('agents')) return 'agents';
    if (slug.includes('design-agent')) return 'design-agent';
    if (slug.includes('apps')) return 'apps';
    const firstSegment = slug[0];
    if (firstSegment && TABS.find(t => t.id === firstSegment)) return firstSegment;
    return 'image';
  };
  
  const [apiKey, setApiKey] = useState(null);
  const [activeTab, setActiveTab] = useState(getInitialTab());

  const [balance, setBalance] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [showVadooBanner, setShowVadooBanner] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('vadoo_banner_dismissed') !== '1';
    return true;
  });

  // Sidebar Collapsed & Mobile Drawer State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('sidebar_collapsed') === 'true';
    return false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState(() => (
    getNavigationCategory(getInitialTab())?.id || NAVIGATION_CATEGORIES[0].id
  ));
  const activeCategory = getNavigationCategory(activeTab);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', next ? 'true' : 'false');
      return next;
    });
  }, []);

  const handleCategoryToggle = useCallback((categoryId) => {
    const isCollapsedNavigation = isSidebarCollapsed && !isMobileOpen;

    if (!isCollapsedNavigation) {
      setExpandedCategoryId((currentId) => (
        currentId === categoryId ? null : categoryId
      ));
      return;
    }

    setExpandedCategoryId(categoryId);
    toggleSidebar();
  }, [isMobileOpen, isSidebarCollapsed, toggleSidebar]);

  useEffect(() => {
    if (activeCategory?.id) {
      setExpandedCategoryId(activeCategory.id);
    }
  }, [activeCategory?.id]);

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState(null);

  // Global generation notifications remain mounted while users switch studios.
  const [notifications, setNotifications] = useState([]);
  const [notificationsHydrated, setNotificationsHydrated] = useState(false);
  const [generationCounts, setGenerationCounts] = useState({});

  useEffect(() => {
    setNotifications(loadStoredNotifications());
    setNotificationsHydrated(true);
  }, []);

  const pushNotification = useCallback((notif) => {
    const now = Date.now();
    const id = `notif-${Date.now()}-${Math.random()}`;
    const ttl = 12000;
    const entry = { ...notif, id, expiresAt: now + ttl };
    setNotifications((previous) => {
      const next = [
        ...previous.filter((notification) => notification.expiresAt > now),
        entry,
      ].slice(-MAX_VISIBLE_NOTIFICATIONS);
      persistNotifications(next);
      return next;
    });
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((previous) => {
      const next = previous.filter((notification) => notification.id !== id);
      persistNotifications(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!notificationsHydrated) return;

    persistNotifications(notifications);
  }, [notifications, notificationsHydrated]);

  useEffect(() => {
    if (notifications.length === 0) return undefined;

    const nextExpiry = Math.min(...notifications.map((notification) => notification.expiresAt));
    const timer = window.setTimeout(() => {
      const now = Date.now();
      setNotifications((previous) => previous.filter((notification) => notification.expiresAt > now));
    }, Math.max(0, nextExpiry - Date.now()));

    return () => window.clearTimeout(timer);
  }, [notifications]);

  const makeSuccessCallback = useCallback((tabId) => (data) => {
    const tab = TABS.find(t => t.id === tabId);
    pushNotification({
      type: 'success',
      tabId,
      label: tab?.label || tabId,
      resultUrl: data?.url || null,
    });
  }, [pushNotification]);

  const makeErrorCallback = useCallback((tabId) => (message) => {
    const tab = TABS.find(t => t.id === tabId);
    pushNotification({ type: 'error', tabId, label: tab?.label || tabId, message });
  }, [pushNotification]);

  const makeGenerationStartCallback = useCallback((tabId) => () => {
    setGenerationCounts((previousλΞw¶‰ΛkΊwµη@€€€¤μ(€€€€€€€€€€€€€€€€€€€€€€€€€τ¥τ(€€€€€€€€€€€€€€€€€€€€€€€€π½‘¥Ψψ(€€€€€€€€€€€€€€€€€€€€€€¥τ(€€€€€€€€€€€€€€€€€€€€π½‘¥Ψψ(€€€€€€€€€€€€€€€€€€¤μ(€€€€€€€€€€€€€€€τ¥τ(€€€€€€€€€€€€€€π½‘¥Ψψ((€€€€€€€€€€€€€νaA1=I}AAM}Q€€ (€€€€€€€€€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”τ‰µΠ΄ΜΑΠ΄Μ‰½Ι‘•ΘµΠ‰½Ι‘•Θµέ΅¥Ρ”½lΐΈΐέtψ(€€€€€€€€€€€€€€€€€€ρ„(€€€€€€€€€€€€€€€€€€€΅Ι•υν€½ΝΡΥ‘¥ΌΌ‘νaA1=I}AAM}QΉ¥‘υτ(€€€€€€€€€€€€€€€€€€€½Ή±¥¬υμ΅•Ω•ΉΠ¤€τψ΅…Ή‘±•9…Ω¥…Ρ¥½Ή%Ρ•µ±¥¬΅•Ω•ΉΠ°aA1=I}AAM}QΉ¥¥τ(€€€€€€€€€€€€€€€€€€€…Ι¥„µΥΙΙ•ΉΠυν…Ρ¥Ω•Q…€τττaA1=I}AAM}QΉ¥€ό€Α…”€θΥΉ‘•™¥Ή•‘τ(€€€€€€€€€€€€€€€€€€€…Ι¥„µ±…‰•°υνaA1=I}AAM}QΉ±…‰•±τ(€€€€€€€€€€€€€€€€€€€Ρ¥Ρ±”υν¥ΝM¥‘•‰…Ι½±±…ΑΝ•€€…¥Ν5½‰¥±•=Α•Έ€όaA1=I}AAM}QΉ±…‰•°€θΥΉ‘•™¥Ή•‘τ(€€€€€€€€€€€€€€€€€€€±…ΝΝ9…µ”υν€(€€€€€€€€€€€€€€€€€€€€€Ι½ΥΐΙ•±…Ρ¥Ω”™±•ΰ¥Ρ•µΜµ•ΉΡ•ΘΙ½ΥΉ‘•µα°ΡΙ…ΉΝ¥Ρ¥½Έµ…±°‘ΥΙ…Ρ¥½Έ΄ΔΤΐΡ•αΠµlΔΝΑαt™½ΉΠµΝ•µ¥‰½±(€€€€€€€€€€€€€€€€€€€€€€‘ν¥ΝM¥‘•‰…Ι½±±…ΑΝ•€€…¥Ν5½‰¥±•=Α•Έ€ό€ ΄ΔΔά΄ΔΔ©ΥΝΡ¥™δµ•ΉΡ•Θµΰµ…ΥΡΌ€θ€Αΰ΄ΜΑδ΄ΘΈΤάµ™Υ±°…ΐ΄Μτ(€€€€€€€€€€€€€€€€€€€€€€‘ν…Ρ¥Ω•Q…€τττaA1=I}AAM}QΉ¥(€€€€€€€€€€€€€€€€€€€€€€€€ό€‰µΙ…‘¥•ΉΠµΡΌµΘ™Ι½΄µlΘΙΝ••tΌΔΤΡΌµΑΥΙΑ±”΄ΤΐΐΌΔΐΡ•αΠµlΘΙΝ••t‰½Ι‘•Θ‰½Ι‘•ΘµlΘΙΝ••tΌΘΐ(€€€€€€€€€€€€€€€€€€€€€€€€θ€Ρ•αΠµέ΅¥Ρ”ΌΨΐ΅½Ω•ΘιΡ•αΠµέ΅¥Ρ”΅½Ω•Θι‰µέ΅¥Ρ”½lΐΈΐΡt‰½Ι‘•Θ‰½Ι‘•ΘµΡΙ…ΉΝΑ…Ι•ΉΠ(€€€€€€€€€€€€€€€€€€€€€τ(€€€€€€€€€€€€€€€€€€€τ(€€€€€€€€€€€€€€€€€€ψ(€€€€€€€€€€€€€€€€€€€ν…Ρ¥Ω•Q…€τττaA1=I}AAM}QΉ¥€€ (€€€€€€€€€€€€€€€€€€€€€€ρΝΑ…Έ±…ΝΝ9…µ”τ‰…‰Ν½±ΥΡ”±•™Π΄ΐΡ½ΐ΄Θ‰½ΡΡ½΄΄Θά΄Δ‰µΙ…‘¥•ΉΠµΡΌµ™Ι½΄µlΘΙΝ••tΡΌµl„ΰΤΥέtΙ½ΥΉ‘•µΘµ™Υ±°€Όψ(€€€€€€€€€€€€€€€€€€€€¥τ(€€€€€€€€€€€€€€€€€€€€ρΝΑ…Έ±…ΝΝ9…µ”υν™±•ΰµΝ΅Ι¥Ή¬΄ΐ€‘ν…Ρ¥Ω•Q…€τττaA1=I}AAM}QΉ¥€ό€Ρ•αΠµlΘΙΝ••t€θ€Ρ•αΠµέ΅¥Ρ”ΌΤΐΙ½Υΐµ΅½Ω•ΘιΡ•αΠµέ΅¥Ρ”υτψ(€€€€€€€€€€€€€€€€€€€€€νaA1=I}AAM}QΉ¥½Ήτ(€€€€€€€€€€€€€€€€€€€€π½ΝΑ…Έψ(€€€€€€€€€€€€€€€€€€€μ …¥ΝM¥‘•‰…Ι½±±…ΑΝ•ρπ¥Ν5½‰¥±•=Α•Έ¤€€ (€€€€€€€€€€€€€€€€€€€€€€ρΝΑ…Έ±…ΝΝ9…µ”τ‰ΡΙΥΉ…Ρ”ωνaA1=I}AAM}QΉ±…‰•±τπ½ΝΑ…Έψ(€€€€€€€€€€€€€€€€€€€€¥τ(€€€€€€€€€€€€€€€€€€π½„ψ(€€€€€€€€€€€€€€€€π½‘¥Ψψ(€€€€€€€€€€€€€€¥τ(€€€€€€€€€€€€π½Ή…Ψψ(€€€€€€€€€€π½…Ν¥‘”ψ(€€€€€€€€¥τ((€€€€€€€μΌ¨MΡΥ‘¥Ό½ΉΡ•ΉΠ€¨½τ(€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”τ‰™±•ΰ΄Δµ¥Έµ ΄ΐ µ™Υ±°Ι•±…Ρ¥Ω”½Ω•Ι™±½άµ΅¥‘‘•Έ‰µlΐΜΐΜΐΝtψ(€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”υν…Ρ¥Ω•Q…€τττ€¥µ…”€ό€‰ µ™Υ±°άµ™Υ±°€θ€‰΅¥‘‘•Έ‰τψ(€€€€€€€€€€ρ%µ…•MΡΥ‘¥Ό…Α¥-•δυν…Α¥-•ετ‘Ι½ΑΑ•‘¥±•Μυν‘Ι½ΑΑ•‘¥±•Ντ½Ή¥±•Ν!…Ή‘±•υν΅…Ή‘±•¥±•Ν!…Ή‘±•‘τ½Ή•Ή•Ι…Ρ¥½ΉMΡ…ΙΠυνµ…­••Ή•Ι…Ρ¥½ΉMΡ…ΙΡ…±±‰…¬ ¥µ…”¥τ½Ή•Ή•Ι…Ρ¥½ΉΉυνµ…­••Ή•Ι…Ρ¥½ΉΉ‘…±±‰…¬ ¥µ…”¥τ½Ή•Ή•Ι…Ρ¥½Ή½µΑ±•Ρ”υνµ…­•MΥ•ΝΝ…±±‰…¬ ¥µ…”¥τ½Ή•Ή•Ι…Ρ¥½ΉΙΙ½Θυνµ…­•ΙΙ½Ι…±±‰…¬ ¥µ…”¥τ€Όψ(€€€€€€€€π½‘¥Ψψ(€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”υν…Ρ¥Ω•Q…€τττ€Ω¥‘•Ό€ό€‰ µ™Υ±°άµ™Υ±°€θ€‰΅¥‘‘•Έ‰τψ(€€€€€€€€€€ρY¥‘•½MΡΥ‘¥Ό…Α¥-•δυν…Α¥-•ετ‘Ι½ΑΑ•‘¥±•Μυν‘Ι½ΑΑ•‘¥±•Ντ½Ή¥±•Ν!…Ή‘±•υν΅…Ή‘±•¥±•Ν!…Ή‘±•‘τ½Ή•Ή•Ι…Ρ¥½ΉMΡ…ΙΠυνµ…­••Ή•Ι…Ρ¥½ΉMΡ…ΙΡ…±±‰…¬ Ω¥‘•Ό¥τ½Ή•Ή•Ι…Ρ¥½ΉΉυνµ…­••Ή•Ι…Ρ¥½ΉΉ‘…±±‰…¬ Ω¥‘•Ό¥τ½Ή•Ή•Ι…Ρ¥½Ή½µΑ±•Ρ”υνµ…­•MΥ•ΝΝ…±±‰…¬ Ω¥‘•Ό¥τ½Ή•Ή•Ι…Ρ¥½ΉΙΙ½Θυνµ…­•ΙΙ½Ι…±±‰…¬ Ω¥‘•Ό¥τ€Όψ(€€€€€€€€π½‘¥Ψψ(€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”υν…Ρ¥Ω•Q…€τττ€±¥ΑΑ¥Ή€ό€‰ µ™Υ±°άµ™Υ±°€θ€‰΅¥‘‘•Έ‰τψ(€€€€€€€€€€ρ±¥ΑΑ¥ΉMΡΥ‘¥Ό…Α¥-•δυν…Α¥-•ετ‘Ι½ΑΑ•‘¥±•Μυν‘Ι½ΑΑ•‘¥±•Ντ½Ή¥±•Ν!…Ή‘±•υν΅…Ή‘±•¥±•Ν!…Ή‘±•‘τ½Ή•Ή•Ι…Ρ¥½ΉMΡ…ΙΠυνµ…­••Ή•Ι…Ρ¥½ΉMΡ…ΙΡ…±±‰…¬ ±¥ΑΑ¥Ή¥τ½Ή•Ή•Ι…Ρ¥½ΉΉυνµ…­••Ή•Ι…Ρ¥½ΉΉ‘…±±‰…¬ ±¥ΑΑ¥Ή¥τ½Ή•Ή•Ι…Ρ¥½Ή½µΑ±•Ρ”υνµ…­•MΥ•ΝΝ…±±‰…¬ ±¥ΑΑ¥Ή¥τ½Ή•Ή•Ι…Ρ¥½ΉΙΙ½Θυνµ…­•ΙΙ½Ι…±±‰…¬ ±¥ΑΑ¥Ή¥τ€Όψ(€€€€€€€€π½‘¥Ψψ(€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”υν…Ρ¥Ω•Q…€τττ€Ω¥‰”µµ½Ρ¥½Έ€ό€‰ µ™Υ±°άµ™Υ±°€θ€‰΅¥‘‘•Έ‰τψ(€€€€€€€€€€ρY¥‰•5½Ρ¥½ΉMΡΥ‘¥Ό…Α¥-•δυν…Α¥-•ετ½Ή•Ή•Ι…Ρ¥½ΉMΡ…ΙΠυνµ…­••Ή•Ι…Ρ¥½ΉMΡ…ΙΡ…±±‰…¬ Ω¥‰”µµ½Ρ¥½Έ¥τ½Ή•Ή•Ι…Ρ¥½ΉΉυνµ…­••Ή•Ι…Ρ¥½ΉΉ‘…±±‰…¬ Ω¥‰”µµ½Ρ¥½Έ¥τ½Ή•Ή•Ι…Ρ¥½Ή½µΑ±•Ρ”υνµ…­•MΥ•ΝΝ…±±‰…¬ Ω¥‰”µµ½Ρ¥½Έ¥τ½Ή•Ή•Ι…Ρ¥½ΉΙΙ½Θυνµ…­•ΙΙ½Ι…±±‰…¬ Ω¥‰”µµ½Ρ¥½Έ¥τ€Όψ(€€€€€€€€π½‘¥Ψψ(€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”υν…Ρ¥Ω•Q…€τττ€±¥ΑΝεΉ€ό€‰ µ™Υ±°άµ™Υ±°€θ€‰΅¥‘‘•Έ‰τψ(€€€€€€€€€€ρ1¥ΑMεΉMΡΥ‘¥Ό…Α¥-•δυν…Α¥-•ετ‘Ι½ΑΑ•‘¥±•Μυν‘Ι½ΑΑ•‘¥±•Ντ½Ή¥±•Ν!…Ή‘±•υν΅…Ή‘±•¥±•Ν!…Ή‘±•‘τ½Ή•Ή•Ι…Ρ¥½ΉMΡ…ΙΠυνµ…­••Ή•Ι…Ρ¥½ΉMΡ…ΙΡ…±±‰…¬ ±¥ΑΝεΉ¥τ½Ή•Ή•Ι…Ρ¥½ΉΉυνµ…­••Ή•Ι…Ρ¥½ΉΉ‘…±±‰…¬ ±¥ΑΝεΉ¥τ½Ή•Ή•Ι…Ρ¥½Ή½µΑ±•Ρ”υνµ…­•MΥ•ΝΝ…±±‰…¬ ±¥ΑΝεΉ¥τ½Ή•Ή•Ι…Ρ¥½ΉΙΙ½Θυνµ…­•ΙΙ½Ι…±±‰…¬ ±¥ΑΝεΉ¥τ€Όψ(€€€€€€€€π½‘¥Ψψ(€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”υν…Ρ¥Ω•Q…€τττ€‰½‘δµΝέ…ΐ€ό€‰ µ™Υ±°άµ™Υ±°€θ€‰΅¥‘‘•Έ‰τψ(€€€€€€€€€€ρI•…ΝΡMΡΥ‘¥Ό…Α¥-•δυν…Α¥-•ετ‘Ι½ΑΑ•‘¥±•Μυν‘Ι½ΑΑ•‘¥±•Ντ½Ή¥±•Ν!…Ή‘±•υν΅…Ή‘±•¥±•Ν!…Ή‘±•‘τ½Ή•Ή•Ι…Ρ¥½ΉMΡ…ΙΠυνµ…­••Ή•Ι…Ρ¥½ΉMΡ…ΙΡ…±±‰…¬ ‰½‘δµΝέ…ΐ¥τ½Ή•Ή•Ι…Ρ¥½ΉΉυνµ…­••Ή•Ι…Ρ¥½ΉΉ‘…±±‰…¬ ‰½‘δµΝέ…ΐ¥τ½Ή•Ή•Ι…Ρ¥½Ή½µΑ±•Ρ”υνµ…­•MΥ•ΝΝ…±±‰…¬ ‰½‘δµΝέ…ΐ¥τ½Ή•Ή•Ι…Ρ¥½ΉΙΙ½Θυνµ…­•ΙΙ½Ι…±±‰…¬ ‰½‘δµΝέ…ΐ¥τ€Όψ(€€€€€€€€π½‘¥Ψψ(€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”υν…Ρ¥Ω•Q…€τττ€¥Ή•µ„€ό€‰ µ™Υ±°άµ™Υ±°€θ€‰΅¥‘‘•Έ‰τψ(€€€€€€€€€€ρ¥Ή•µ…MΡΥ‘¥Ό…Α¥-•δυν…Α¥-•ετ½Ή•Ή•Ι…Ρ¥½ΉMΡ…ΙΠυνµ…­••Ή•Ι…Ρ¥½ΉMΡ…ΙΡ…±±‰…¬ ¥Ή•µ„¥τ½Ή•Ή•Ι…Ρ¥½ΉΉυνµ…­••Ή•Ι…Ρ¥½ΉΉ‘…±±‰…¬ ¥Ή•µ„¥τ½Ή•Ή•Ι…Ρ¥½Ή½µΑ±•Ρ”υνµ…­•MΥ•ΝΝ…±±‰…¬ ¥Ή•µ„¥τ½Ή•Ή•Ι…Ρ¥½ΉΙΙ½Θυνµ…­•ΙΙ½Ι…±±‰…¬ ¥Ή•µ„¥τ€Όψ(€€€€€€€€π½‘¥Ψψ(€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”υν…Ρ¥Ω•Q…€τττ€…Υ‘¥Ό€ό€‰ µ™Υ±°άµ™Υ±°€θ€‰΅¥‘‘•Έ‰τψ(€€€€€€€€€€ρΥ‘¥½MΡΥ‘¥Ό…Α¥-•δυν…Α¥-•ετ‘Ι½ΑΑ•‘¥±•Μυν‘Ι½ΑΑ•‘¥±•Ντ½Ή¥±•Ν!…Ή‘±•υν΅…Ή‘±•¥±•Ν!…Ή‘±•‘τ½Ή•Ή•Ι…Ρ¥½ΉMΡ…ΙΠυνµ…­••Ή•Ι…Ρ¥½ΉMΡ…ΙΡ…±±‰…¬ …Υ‘¥Ό¥τ½Ή•Ή•Ι…Ρ¥½ΉΉυνµ…­••Ή•Ι…Ρ¥½ΉΉ‘…±±‰…¬ …Υ‘¥Ό¥τ½Ή•Ή•Ι…Ρ¥½Ή½µΑ±•Ρ”υνµ…­•MΥ•ΝΝ…±±‰…¬ …Υ‘¥Ό¥τ½Ή•Ή•Ι…Ρ¥½ΉΙΙ½Θυνµ…­•ΙΙ½Ι…±±‰…¬ …Υ‘¥Ό¥τ€Όψ(€€€€€€€€π½‘¥Ψψ(€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”υν…Ρ¥Ω•Q…€τττ€µ…Ι­•Ρ¥Ή€ό€‰ µ™Υ±°άµ™Υ±°€θ€‰΅¥‘‘•Έ‰τψ(€€€€€€€€€€ρ5…Ι­•Ρ¥ΉMΡΥ‘¥Ό…Α¥-•δυν…Α¥-•ετ‘Ι½ΑΑ•‘¥±•Μυν‘Ι½ΑΑ•‘¥±•Ντ½Ή¥±•Ν!…Ή‘±•υν΅…Ή‘±•¥±•Ν!…Ή‘±•‘τ½Ή•Ή•Ι…Ρ¥½ΉMΡ…ΙΠυνµ…­••Ή•Ι…Ρ¥½ΉMΡ…ΙΡ…±±‰…¬ µ…Ι­•Ρ¥Ή¥τ½Ή•Ή•Ι…Ρ¥½ΉΉυνµ…­••Ή•Ι…Ρ¥½ΉΉ‘…±±‰…¬ µ…Ι­•Ρ¥Ή¥τ½Ή•Ή•Ι…Ρ¥½Ή½µΑ±•Ρ”υνµ…­•MΥ•ΝΝ…±±‰…¬ µ…Ι­•Ρ¥Ή¥τ½Ή•Ή•Ι…Ρ¥½ΉΙΙ½Θυνµ…­•ΙΙ½Ι…±±‰…¬ µ…Ι­•Ρ¥Ή¥τ€Όψ(€€€€€€€€π½‘¥Ψψ(€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”υν…Ρ¥Ω•Q…€τττ€έ½Ι­™±½έΜ€ό€‰ µ™Υ±°άµ™Υ±°€θ€‰΅¥‘‘•Έ‰τψ(€€€€€€€€€€ρ]½Ι­™±½έMΡΥ‘¥Ό(€€€€€€€€€€€…Α¥-•δυν…Α¥-•ετ(€€€€€€€€€€€¥Ν!•…‘•ΙY¥Ν¥‰±”υν¥Ν!•…‘•ΙY¥Ν¥‰±•τ(€€€€€€€€€€€½ΉQ½±•!•…‘•ΘυνΝ•Ρ%Ν!•…‘•ΙY¥Ν¥‰±•τ(€€€€€€€€€€€½Ή•Ή•Ι…Ρ¥½ΉMΡ…ΙΠυνµ…­••Ή•Ι…Ρ¥½ΉMΡ…ΙΡ…±±‰…¬ έ½Ι­™±½έΜ¥τ(€€€€€€€€€€€½Ή•Ή•Ι…Ρ¥½ΉΉυνµ…­••Ή•Ι…Ρ¥½ΉΉ‘…±±‰…¬ έ½Ι­™±½έΜ¥τ(€€€€€€€€€€€½Ή•Ή•Ι…Ρ¥½Ή½µΑ±•Ρ”υνµ…­•MΥ•ΝΝ…±±‰…¬ έ½Ι­™±½έΜ¥τ(€€€€€€€€€€€½Ή•Ή•Ι…Ρ¥½ΉΙΙ½Θυνµ…­•ΙΙ½Ι…±±‰…¬ έ½Ι­™±½έΜ¥τ(€€€€€€€€€€Όψ(€€€€€€€€π½‘¥Ψψ(€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”υν…Ρ¥Ω•Q…€τττ€…•ΉΡΜ€ό€‰ µ™Υ±°άµ™Υ±°€θ€‰΅¥‘‘•Έ‰τψ(€€€€€€€€€€ρ•ΉΡMΡΥ‘¥Ό…Α¥-•δυν…Α¥-•ετ¥Ν!•…‘•ΙY¥Ν¥‰±”υν¥Ν!•…‘•ΙY¥Ν¥‰±•τ½ΉQ½±•!•…‘•ΘυνΝ•Ρ%Ν!•…‘•ΙY¥Ν¥‰±•τ€Όψ(€€€€€€€€π½‘¥Ψψ(€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”υν…Ρ¥Ω•Q…€τττ€‘•Ν¥Έµ…•ΉΠ€ό€‰ µ™Υ±°άµ™Υ±°€θ€‰΅¥‘‘•Έ‰τψ(€€€€€€€€€ν…Ρ¥Ω•Q…€τττ€‘•Ν¥Έµ…•ΉΠ€€ (€€€€€€€€€€€€ρ•Ν¥Ή•ΉΡMΡΥ‘¥Ό(€€€€€€€€€€€€€…Α¥-•δυν…Α¥-•ετ(€€€€€€€€€€€€€¥Ν!•…‘•ΙY¥Ν¥‰±”υν¥Ν!•…‘•ΙY¥Ν¥‰±•τ(€€€€€€€€€€€€€½ΉQ½±•!•…‘•ΘυνΝ•Ρ%Ν!•…‘•ΙY¥Ν¥‰±•τ(€€€€€€€€€€€€€½Ή•Ή•Ι…Ρ¥½ΉMΡ…ΙΠυνµ…­••Ή•Ι…Ρ¥½ΉMΡ…ΙΡ…±±‰…¬ ‘•Ν¥Έµ…•ΉΠ¥τ(€€€€€€€€€€€€€½Ή•Ή•Ι…Ρ¥½ΉΉυνµ…­••Ή•Ι…Ρ¥½ΉΉ‘…±±‰…¬ ‘•Ν¥Έµ…•ΉΠ¥τ(€€€€€€€€€€€€€½Ή•Ή•Ι…Ρ¥½Ή½µΑ±•Ρ”υνµ…­•MΥ•ΝΝ…±±‰…¬ ‘•Ν¥Έµ…•ΉΠ¥τ(€€€€€€€€€€€€€½Ή•Ή•Ι…Ρ¥½ΉΙΙ½Θυνµ…­•ΙΙ½Ι…±±‰…¬ ‘•Ν¥Έµ…•ΉΠ¥τ(€€€€€€€€€€€€Όψ(€€€€€€€€€€¥τ(€€€€€€€€π½‘¥Ψψ(€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”υν…Ρ¥Ω•Q…€τττ€…ΑΑΜ€ό€‰ µ™Υ±°άµ™Υ±°€θ€‰΅¥‘‘•Έ‰τψ(€€€€€€€€€€ρΑΑΝMΡΥ‘¥Ό…Α¥-•δυν…Α¥-•ετ€Όψ(€€€€€€€€π½‘¥Ψψ(€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”υν…Ρ¥Ω•Q…€τττ€…¤µ¥Ή™±Υ•Ή•Θ€ό€‰ µ™Υ±°άµ™Υ±°€θ€‰΅¥‘‘•Έ‰τψ(€€€€€€€€€€ρ¥%Ή™±Υ•Ή•ΙMΡΥ‘¥Ό(€€€€€€€€€€€…Α¥-•δυν…Α¥-•ετ(€€€€€€€€€€€½Ή•Ή•Ι…Ρ¥½ΉMΡ…ΙΠυνµ…­••Ή•Ι…Ρ¥½ΉMΡ…ΙΡ…±±‰…¬ …¤µ¥Ή™±Υ•Ή•Θ¥τ(€€€€€€€€€€€½Ή•Ή•Ι…Ρ¥½ΉΉυνµ…­••Ή•Ι…Ρ¥½ΉΉ‘…±±‰…¬ …¤µ¥Ή™±Υ•Ή•Θ¥τ(€€€€€€€€€€€½Ή•Ή•Ι…Ρ¥½Ή½µΑ±•Ρ”υνµ…­•MΥ•ΝΝ…±±‰…¬ …¤µ¥Ή™±Υ•Ή•Θ¥τ(€€€€€€€€€€€½Ή•Ή•Ι…Ρ¥½ΉΙΙ½Θυνµ…­•ΙΙ½Ι…±±‰…¬ …¤µ¥Ή™±Υ•Ή•Θ¥τ(€€€€€€€€€€Όψ(€€€€€€€€π½‘¥Ψψ(€€€€€€π½‘¥Ψψ(€€€€π½‘¥Ψψ((€€€€€μΌ¨±½‰…°•Ή•Ι…Ρ¥½Έ…Ρ¥Ω¥Ρδ…ΉΉ½Ρ¥™¥…Ρ¥½ΈΝΡ…¬€¨½τ(€€€€€μ΅…Ρ¥Ω••Ή•Ι…Ρ¥½ΉΜΉ±•ΉΡ €ψ€ΐρπΉ½Ρ¥™¥…Ρ¥½ΉΜΉ±•ΉΡ €ψ€ΐ¤€€ (€€€€€€€€ρ‘¥Ψ(€€€€€€€€€…Ι¥„µ±¥Ω”τ‰Α½±¥Ρ”(€€€€€€€€€…Ι¥„µ±…‰•°τ‰•Ή•Ι…Ρ¥½Έ…Ρ¥Ω¥Ρδ…ΉΉ½Ρ¥™¥…Ρ¥½ΉΜ(€€€€€€€€€±…ΝΝ9…µ”τ‰™¥α•‰½ΡΡ½΄΄ΤΙ¥΅Π΄ΤθµlΘΐΑt™±•ΰµ…ΰµ µm…± ΔΐΑΩ ΄ΜΙΑΰ¥tάµlΜΠΑΑαtµ…ΰµάµm…± ΔΐΑΩά΄ΜΙΑΰ¥t™±•ΰµ½°…ΐ΄Θ½Ω•Ι™±½άµδµ…ΥΡΌΑ½¥ΉΡ•Θµ•Ω•ΉΡΜµΉ½Ή”(€€€€€€€€€‘…Ρ„µΡ•ΝΡ¥τ‰±½‰…°µΉ½Ρ¥™¥…Ρ¥½ΈµΝΡ…¬(€€€€€€€€ψ(€€€€€€€€€ν…Ρ¥Ω••Ή•Ι…Ρ¥½ΉΜΉµ…ΐ ΅•Ή•Ι…Ρ¥½Έ¤€τψ€ (€€€€€€€€€€€€ρ‘¥Ψ(€€€€€€€€€€€€€­•δυν•Ή•Ι…Ρ¥½ΈΉΡ…‰%‘τ(€€€€€€€€€€€€€Ι½±”τ‰ΝΡ…ΡΥΜ(€€€€€€€€€€€€€‘…Ρ„µ•Ή•Ι…Ρ¥½ΈµΡ…υν•Ή•Ι…Ρ¥½ΈΉΡ…‰%‘τ(€€€€€€€€€€€€€±…ΝΝ9…µ”τ‰Α½¥ΉΡ•Θµ•Ω•ΉΡΜµ…ΥΡΌ™±•ΰ¥Ρ•µΜµ•ΉΡ•Θ…ΐ΄ΜΙ½ΥΉ‘•µα°‰½Ι‘•Θ‰½Ι‘•Θµε…Έ΄ΠΐΐΌΜΐ‰µlΑΑΑ™tΑΰ΄ΜΈΤΑδ΄ΜΡ•αΠµlΔΝΑαtΡ•αΠµι¥Ή΄ΔΐΐΝ΅…‘½άµlΑ|ΔΩΑα|ΠαΑα}Ι‰„ ΐ°ΐ°ΐ°ΐΈΨΤ¥t(€€€€€€€€€€€€€‘…Ρ„µΡ•ΝΡ¥τ‰•Ή•Ι…Ρ¥½Έµ…Ρ¥Ω¥Ρδ(€€€€€€€€€€€€ψ(€€€€€€€€€€€€€€ρΝΑ…Έ±…ΝΝ9…µ”τ‰™±•ΰ ΄ΰά΄ΰΝ΅Ι¥Ή¬΄ΐ¥Ρ•µΜµ•ΉΡ•Θ©ΥΝΡ¥™δµ•ΉΡ•ΘΙ½ΥΉ‘•µ±‰½Ι‘•Θ‰½Ι‘•Θµε…Έ΄ΠΐΐΌΜΤ‰µε…Έ΄ΠΐΐΌΔΐψ(€€€€€€€€€€€€€€€€ρΝΑ…Έ(€€€€€€€€€€€€€€€€€±…ΝΝ9…µ”τ‰ ΄ΜΈΤά΄ΜΈΤ…Ή¥µ…Ρ”µΝΑ¥ΈΙ½ΥΉ‘•µ™Υ±°‰½Ι‘•Θ΄Θ‰½Ι‘•Θµε…Έ΄ΜΐΐΌΘΤ‰½Ι‘•ΘµΠµε…Έ΄Μΐΐ(€€€€€€€€€€€€€€€€€…Ι¥„µ΅¥‘‘•Έτ‰ΡΙΥ”(€€€€€€€€€€€€€€€€Όψ(€€€€€€€€€€€€€€π½ΝΑ…Έψ(€€€€€€€€€€€€€€ρΐ±…ΝΝ9…µ”τ‰µ¥Έµά΄ΐ™±•ΰ΄Δ™½ΉΠµΝ•µ¥‰½±±•…‘¥Ή΄ΤΡ•αΠµι¥Ή΄Δΐΐψ(€€€€€€€€€€€€€€€ν•Ή•Ι…Ρ¥½ΈΉ±…‰•±τ¥Μ•Ή•Ι…Ρ¥Ή(€€€€€€€€€€€€€€€ν•Ή•Ι…Ρ¥½ΈΉ½ΥΉΠ€ψ€Δ€ό€€ ‘ν•Ή•Ι…Ρ¥½ΈΉ½ΥΉΡτ¥€€θ€τ(€€€€€€€€€€€€€€π½ΐψ(€€€€€€€€€€€€π½‘¥Ψψ(€€€€€€€€€€¤¥τ((€€€€€€€€€νΉ½Ρ¥™¥…Ρ¥½ΉΜΉµ…ΐ ΅Ή½Ρ¥¤€τψ€ (€€€€€€€€€€€€ρ‘¥Ψ(€€€€€€€€€€€€€­•δυνΉ½Ρ¥Ή¥‘τ(€€€€€€€€€€€€€Ι½±”υνΉ½Ρ¥ΉΡεΑ”€τττ€•ΙΙ½Θ€ό€…±•ΙΠ€θ€ΝΡ…ΡΥΜτ(€€€€€€€€€€€€€‘…Ρ„µΉ½Ρ¥™¥…Ρ¥½ΈµΡεΑ”υνΉ½Ρ¥ΉΡεΑ•τ(€€€€€€€€€€€€€‘…Ρ„µΉ½Ρ¥™¥…Ρ¥½ΈµΡ…υνΉ½Ρ¥ΉΡ…‰%‘τ(€€€€€€€€€€€€€±…ΝΝ9…µ”τ‰Α½¥ΉΡ•Θµ•Ω•ΉΡΜµ…ΥΡΌ™±•ΰ¥Ρ•µΜµΝΡ…ΙΠ…ΐ΄ΜΙ½ΥΉ‘•µα°‰½Ι‘•Θ‰µlΑΑΑ™tΑΰ΄ΜΈΤΑδ΄ΜΡ•αΠµlΔΝΑαtΡ•αΠµι¥Ή΄ΔΐΐΝ΅…‘½άµlΑ|ΔΩΑα|ΠαΑα}Ι‰„ ΐ°ΐ°ΐ°ΐΈΨΤ¥t(€€€€€€€€€€€€€ΝΡε±”υνμ(€€€€€€€€€€€€€€€‰½Ι‘•Ι½±½ΘθΉ½Ρ¥ΉΡεΑ”€τττ€ΝΥ•ΝΜ€ό€Ι‰„ ΜΠ°ΘΔΔ°ΘΜΰ°ΐΈΜΤ¤€θ€Ι‰„ ΘΜδ°Ψΰ°Ψΰ°ΐΈΜΤ¤°(€€€€€€€€€€€€€€€…Ή¥µ…Ρ¥½Έθ€Ν±¥‘•%ΉI¥΅Π€ΘΰΑµΜΥ‰¥µ‰•ι¥•Θ ΐΈΔΨ°Δ°ΐΈΜ°Δ¤™½Ιέ…Ι‘Μ°(€€€€€€€€€€€€€υτ(€€€€€€€€€€€€ψ(€€€€€€€€€€€€€€ρΝΑ…Έ(€€€€€€€€€€€€€€€±…ΝΝ9…µ”υνµΠ΄ΐΈΤ™±•ΰ ΄ΰά΄ΰΝ΅Ι¥Ή¬΄ΐ¥Ρ•µΜµ•ΉΡ•Θ©ΥΝΡ¥™δµ•ΉΡ•ΘΙ½ΥΉ‘•µ±‰½Ι‘•Θ€‘μ(€€€€€€€€€€€€€€€€€Ή½Ρ¥ΉΡεΑ”€τττ€ΝΥ•ΝΜ(€€€€€€€€€€€€€€€€€€€€ό€‰½Ι‘•Θµε…Έ΄ΠΐΐΌΜΤ‰µε…Έ΄ΠΐΐΌΔΐΡ•αΠµε…Έ΄Μΐΐ(€€€€€€€€€€€€€€€€€€€€θ€‰½Ι‘•ΘµΙ•΄ΤΐΐΌΜΤ‰µΙ•΄ΤΐΐΌΔΐΡ•αΠµΙ•΄Πΐΐ(€€€€€€€€€€€€€€€υτ(€€€€€€€€€€€€€€ψ(€€€€€€€€€€€€€€€νΉ½Ρ¥ΉΡεΑ”€τττ€ΝΥ•ΝΜ€ό€ (€€€€€€€€€€€€€€€€€€ρΝΩέ¥‘Ρ τΔά΅•¥΅ΠτΔάΩ¥•έ	½ΰτΐ€ΐ€ΘΠ€ΘΠ™¥±°τ‰Ή½Ή”ΝΡΙ½­”τ‰ΥΙΙ•ΉΡ½±½ΘΝΡΙ½­•]¥‘Ρ τΘΈΤΝΡΙ½­•1¥Ή•…ΐτ‰Ι½ΥΉΝΡΙ½­•1¥Ή•©½¥Έτ‰Ι½ΥΉ…Ι¥„µ΅¥‘‘•Έτ‰ΡΙΥ”ψ(€€€€€€€€€€€€€€€€€€€€ρΑ…Ρ τ‰΄Τ€ΔΘ€Π€Ρ0Δδ€Ψ€Όψ(€€€€€€€€€€€€€€€€€€π½ΝΩψ(€€€€€€€€€€€€€€€€¤€θ€ (€€€€€€€€€€€€€€€€€€ρΝΩέ¥‘Ρ τΔά΅•¥΅ΠτΔάΩ¥•έ	½ΰτΐ€ΐ€ΘΠ€ΘΠ™¥±°τ‰Ή½Ή”ΝΡΙ½­”τ‰ΥΙΙ•ΉΡ½±½ΘΝΡΙ½­•]¥‘Ρ τΘΝΡΙ½­•1¥Ή•…ΐτ‰Ι½ΥΉΝΡΙ½­•1¥Ή•©½¥Έτ‰Ι½ΥΉ…Ι¥„µ΅¥‘‘•Έτ‰ΡΙΥ”ψ(€€€€€€€€€€€€€€€€€€€€ρ¥Ι±”ΰτΔΘδτΔΘΘτδ€Όψ(€€€€€€€€€€€€€€€€€€€€ρΑ…Ρ τ‰4ΔΘ€έΨΨ€Όψ(€€€€€€€€€€€€€€€€€€€€ρΑ…Ρ τ‰4ΔΘ€Δέ ΈΐΔ€Όψ(€€€€€€€€€€€€€€€€€€π½ΝΩψ(€€€€€€€€€€€€€€€€¥τ(€€€€€€€€€€€€€€π½ΝΑ…Έψ((€€€€€€€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”τ‰µ¥Έµά΄ΐ™±•ΰ΄Δψ(€€€€€€€€€€€€€€€€ρΐ±…ΝΝ9…µ”τ‰™½ΉΠµΝ•µ¥‰½±±•…‘¥Ή΄ΤΡ•αΠµι¥Ή΄Δΐΐψ(€€€€€€€€€€€€€€€€€νΉ½Ρ¥Ή±…‰•±τ(€€€€€€€€€€€€€€€€€€ρΝΑ…Έ±…ΝΝ9…µ”τ‰™½ΉΠµΉ½Ιµ…°Ρ•αΠµι¥Ή΄Πΐΐψ(€€€€€€€€€€€€€€€€€€€νΉ½Ρ¥ΉΡεΑ”€τττ€ΝΥ•ΝΜ€ό€€΄•Ή•Ι…Ρ¥½Έ½µΑ±•Ρ”€θ€€΄•Ή•Ι…Ρ¥½Έ™…¥±•τ(€€€€€€€€€€€€€€€€€€π½ΝΑ…Έψ(€€€€€€€€€€€€€€€€π½ΐψ(€€€€€€€€€€€€€€€νΉ½Ρ¥ΉΡεΑ”€τττ€•ΙΙ½Θ€Ή½Ρ¥Ήµ•ΝΝ…”€€ (€€€€€€€€€€€€€€€€€€ρΐ±…ΝΝ9…µ”τ‰µΠ΄ΐΈΤ±¥Ή”µ±…µΐ΄ΘΡ•αΠµlΔΙΑαt™½ΉΠµµ•‘¥Υ΄±•…‘¥Ή΄ΠΡ•αΠµΙ•΄ΜΐΐΌΰΤΡ¥Ρ±”υνΉ½Ρ¥Ήµ•ΝΝ…•τψ(€€€€€€€€€€€€€€€€€€€νΉ½Ρ¥Ήµ•ΝΝ…•τ(€€€€€€€€€€€€€€€€€€π½ΐψ(€€€€€€€€€€€€€€€€¥τ(€€€€€€€€€€€€€€€νΉ½Ρ¥ΉΡεΑ”€τττ€ΝΥ•ΝΜ€€ (€€€€€€€€€€€€€€€€€€ρΐ±…ΝΝ9…µ”τ‰µΠ΄ΐΈΤΡ•αΠµlΔΙΑαt±•…‘¥Ή΄ΠΡ•αΠµι¥Ή΄Πΐΐψ(€€€€€€€€€€€€€€€€€€€e½ΥΘΙ•ΝΥ±Π¥ΜΙ•…‘δΈ(€€€€€€€€€€€€€€€€€€π½ΐψ(€€€€€€€€€€€€€€€€¥τ(€€€€€€€€€€€€€€€νΉ½Ρ¥ΉΡεΑ”€τττ€ΝΥ•ΝΜ€€ (€€€€€€€€€€€€€€€€€€ρ‰ΥΡΡ½Έ(€€€€€€€€€€€€€€€€€€€ΡεΑ”τ‰‰ΥΡΡ½Έ(€€€€€€€€€€€€€€€€€€€½Ή±¥¬υμ ¤€τψ΅…Ή‘±•=Α•Ή9½Ρ¥™¥…Ρ¥½Έ΅Ή½Ρ¥¥τ(€€€€€€€€€€€€€€€€€€€±…ΝΝ9…µ”τ‰µΠ΄ΔΈΤΡ•αΠµlΔΕΑαt™½ΉΠµ‰½±Ρ•αΠµε…Έ΄ΜΐΐΡΙ…ΉΝ¥Ρ¥½Έµ½±½ΙΜ΅½Ω•ΘιΡ•αΠµε…Έ΄Δΐΐ(€€€€€€€€€€€€€€€€€€€…Ι¥„µ±…‰•°υν=Α•Έ€‘νΉ½Ρ¥Ή±…‰•±τΙ•ΝΥ±Ρτ(€€€€€€€€€€€€€€€€€€ψ(€€€€€€€€€€€€€€€€€€€=Α•Έ(€€€€€€€€€€€€€€€€€€π½‰ΥΡΡ½Έψ(€€€€€€€€€€€€€€€€¥τ(€€€€€€€€€€€€€€π½‘¥Ψψ((€€€€€€€€€€€€€€ρ‰ΥΡΡ½Έ(€€€€€€€€€€€€€€€ΡεΑ”τ‰‰ΥΡΡ½Έ(€€€€€€€€€€€€€€€½Ή±¥¬υμ ¤€τψ‘¥Νµ¥ΝΝ9½Ρ¥™¥…Ρ¥½Έ΅Ή½Ρ¥Ή¥¥τ(€€€€€€€€€€€€€€€±…ΝΝ9…µ”τ‰µΠ΄ΐΈΤ™±•ΰ ΄άά΄άΝ΅Ι¥Ή¬΄ΐ¥Ρ•µΜµ•ΉΡ•Θ©ΥΝΡ¥™δµ•ΉΡ•ΘΙ½ΥΉ‘•µµΡ•αΠµι¥Ή΄ΤΐΐΡΙ…ΉΝ¥Ρ¥½Έµ½±½ΙΜ΅½Ω•Θι‰µέ΅¥Ρ”ΌΤ΅½Ω•ΘιΡ•αΠµι¥Ή΄Θΐΐ™½ΥΜι½ΥΡ±¥Ή”µΉ½Ή”™½ΥΜιΙ¥Ή΄Δ™½ΥΜιΙ¥Ήµέ΅¥Ρ”ΌΘΐ(€€€€€€€€€€€€€€€…Ι¥„µ±…‰•°τ‰¥Νµ¥ΝΜΉ½Ρ¥™¥…Ρ¥½Έ(€€€€€€€€€€€€€€ψ(€€€€€€€€€€€€€€€€ρΝΩέ¥‘Ρ τΔΠ΅•¥΅ΠτΔΠΩ¥•έ	½ΰτΐ€ΐ€ΘΠ€ΘΠ™¥±°τ‰Ή½Ή”ΝΡΙ½­”τ‰ΥΙΙ•ΉΡ½±½ΘΝΡΙ½­•]¥‘Ρ τΘΝΡΙ½­•1¥Ή•…ΐτ‰Ι½ΥΉ…Ι¥„µ΅¥‘‘•Έτ‰ΡΙΥ”ψ(€€€€€€€€€€€€€€€€€€ρΑ…Ρ τ‰4Δΰ€Ψ€Ψ€Δα4Ψ€Ω°ΔΘ€ΔΘ€Όψ(€€€€€€€€€€€€€€€€π½ΝΩψ(€€€€€€€€€€€€€€π½‰ΥΡΡ½Έψ(€€€€€€€€€€€€π½‘¥Ψψ(€€€€€€€€€€¤¥τ(€€€€€€€€π½‘¥Ψψ(€€€€€€¥τ((€€€€€μΌ¨-•ε™Ι…µ”™½ΘΡ½…ΝΠΝ±¥‘”µ¥Έ€¨½τ(€€€€€€ρΝΡε±”ων€(€€€€€€€­•ε™Ι…µ•ΜΝ±¥‘•%ΉI¥΅Πμ(€€€€€€€€€™Ι½΄μΡΙ…ΉΝ™½Ι΄θΡΙ…ΉΝ±…Ρ•` ΔΔΐ”¤μ½Α…¥Ρδθ€ΐμτ(€€€€€€€€€ΡΌ€€μΡΙ…ΉΝ™½Ι΄θΡΙ…ΉΝ±…Ρ•` ΐ¤μ€€€½Α…¥Ρδθ€Δμτ(€€€€€€€τ(€€€€€τπ½ΝΡε±”ψ((€€€€€μΌ¨M•ΡΡ¥ΉΜ5½‘…°€¨½τ(€€€€€νΝ΅½έM•ΡΡ¥ΉΜ€€ (€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”τ‰™¥α•¥ΉΝ•Π΄ΐ‰µ‰±…¬ΌΨΐ‰…­‘Ι½ΐµ‰±ΥΘµΝ΄™±•ΰ¥Ρ•µΜµ•ΉΡ•Θ©ΥΝΡ¥™δµ•ΉΡ•Θθ΄Τΐ…Ή¥µ…Ρ”µ™…‘”µ¥ΈµΥΐψ(€€€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”τ‰‰µlΑ„Α„Α…t‰½Ι‘•Θ‰½Ι‘•Θµέ΅¥Ρ”ΌΔΐΙ½ΥΉ‘•µα°ΐ΄ΰάµ™Υ±°µ…ΰµάµΝ΄Ν΅…‘½ά΄Ια°ψ(€€€€€€€€€€€€ρ Θ±…ΝΝ9…µ”τ‰Ρ•αΠµέ΅¥Ρ”™½ΉΠµ‰½±Ρ•αΠµ±µ΄ΘωM•ΡΡ¥ΉΜπ½ Θψ(€€€€€€€€€€€€ρΐ±…ΝΝ9…µ”τ‰Ρ•αΠµέ΅¥Ρ”ΌΠΐΡ•αΠµlΔΝΑαtµ΄ΰψ(€€€€€€€€€€€€€5…Ή…”ε½ΥΘ$ΝΡΥ‘¥ΌΑΙ•™•Ι•Ή•Μ…Ή…ΥΡ΅•ΉΡ¥…Ρ¥½ΈΈ(€€€€€€€€€€€€π½ΐψ(€€€€€€€€€€€€(€€€€€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”τ‰ΝΑ…”µδ΄Πµ΄ΰψ(€€€€€€€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”τ‰‰µέ΅¥Ρ”ΌΤ‰½Ι‘•Θ‰½Ι‘•Θµέ΅¥Ρ”½lΐΈΐΝtΙ½ΥΉ‘•µµΐ΄Πψ(€€€€€€€€€€€€€€€€ρ±…‰•°±…ΝΝ9…µ”τ‰‰±½¬Ρ•αΠµαΜ™½ΉΠµ‰½±Ρ•αΠµέ΅¥Ρ”ΌΜΐµ΄Θψ(€€€€€€€€€€€€€€€€€€Ρ¥Ω”A$-•δ(€€€€€€€€€€€€€€€€π½±…‰•°ψ(€€€€€€€€€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”τ‰Ρ•αΠµlΔΝΑαt™½ΉΠµµ½ΉΌΡ•αΠµέ΅¥Ρ”Όΰΐψ(€€€€€€€€€€€€€€€€€ν…Α¥-•δΉΝ±¥” ΐ°€ΰ¥χ‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹(€€€€€€€€€€€€€€€€π½‘¥Ψψ(€€€€€€€€€€€€€€π½‘¥Ψψ(€€€€€€€€€€€€π½‘¥Ψψ((€€€€€€€€€€€€ρ‘¥Ψ±…ΝΝ9…µ”τ‰™±•ΰ…ΐ΄Μψ(€€€€€€€€€€€€€€ρ‰ΥΡΡ½Έ(€€€€€€€€€€€€€€€½Ή±¥¬υν΅…Ή‘±•-•ε΅…Ή•τ(€€€€€€€€€€€€€€€±…ΝΝ9…µ”τ‰™±•ΰ΄Δ ΄ΔΐΙ½ΥΉ‘•µµ‰µΙ•΄ΤΐΐΌΔΐΡ•αΠµΙ•΄Πΐΐ΅½Ω•Θι‰µΙ•΄ΤΐΐΌΘΐΡ•αΠµαΜ™½ΉΠµΝ•µ¥‰½±ΡΙ…ΉΝ¥Ρ¥½Έµ…±°(€€€€€€€€€€€€€€ψ(€€€€€€€€€€€€€€€΅…Ή”-•δ(€€€€€€€€€€€€€€π½‰ΥΡΡ½Έψ(€€€€€€€€€€€€€€ρ‰ΥΡΡ½Έ(€€€€€€€€€€€€€€€½Ή±¥¬υμ ¤€τψΝ•ΡM΅½έM•ΡΡ¥ΉΜ΅™…±Ν”¥τ(€€€€€€€€€€€€€€€±…ΝΝ9…µ”τ‰™±•ΰ΄Δ ΄ΔΐΙ½ΥΉ‘•µµ‰µέ΅¥Ρ”ΌΤΡ•αΠµέ΅¥Ρ”Όΰΐ΅½Ω•Θι‰µέ΅¥Ρ”ΌΔΐΡ•αΠµαΜ™½ΉΠµΝ•µ¥‰½±ΡΙ…ΉΝ¥Ρ¥½Έµ…±°‰½Ι‘•Θ‰½Ι‘•Θµέ΅¥Ρ”ΌΤ(€€€€€€€€€€€€€€ψ(€€€€€€€€€€€€€€€±½Ν”(€€€€€€€€€€€€€€π½‰ΥΡΡ½Έψ(€€€€€€€€€€€€π½‘¥Ψψ(€€€€€€€€€€π½‘¥Ψψ(€€€€€€€€π½‘¥Ψψ(€€€€€€¥τ(€€€€π½‘¥Ψψ(€€¤μ)τ(
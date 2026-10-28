import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  Menu,
  Search,
  X,
} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { DropdownContent, MobileGroup, MobileSubmenu } from "./NavbarMenus";
import {
  dropdownLabels,
  moreItems,
  type DropdownName,
} from "./navigationData";
import "@/styles/navbar.css";
import { BrandLogo } from "../global/brand-logo/BrandLogo";
import { SignInButton } from "./sign-in-button/SignInButton";
import { useSmoothScroll } from "./SmoothScrollProvider";

const SiteSearch = lazy(() => import('./site-search/SiteSearch').then(module => ({ default: module.SiteSearch })))

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdown, setDropdown] = useState<DropdownName | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const focusPanel = useRef<DropdownName | null>(null);
  const reducedMotion = useReducedMotion();
  const smoothScroll = useSmoothScroll();
  const routeHref = useRouterState({ select: (state) => state.location.href });
  const duration = reducedMotion ? 0 : 0.24;
  const close = () => {
    setMobileOpen(false);
    setDropdown(null);
    setSearchOpen(false);
  };

  useEffect(() => {
    close();
  }, [routeHref]);

  useEffect(() => {
    if (!mobileOpen && !dropdown) return;
    const outside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) close();
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (dropdown) {
          setDropdown(null);
          lastTrigger.current?.focus();
        } else {
          setMobileOpen(false);
          mobileTriggerRef.current?.focus();
        }
      }
      if (event.key !== "Tab" || !mobileOpen) return;
      const scope = headerRef.current;
      const focusable = Array.from(
        scope?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input",
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", keyboard);
    };
  }, [mobileOpen, dropdown]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen && !searchOpen) return;
    smoothScroll.current?.stop();
    return () => smoothScroll.current?.start();
  }, [mobileOpen, searchOpen, smoothScroll]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1100px)");
    const reset = () => {
      setMobileOpen(false);
      setDropdown(null);
      setSearchOpen(false);
    };
    media.addEventListener("change", reset);
    return () => media.removeEventListener("change", reset);
  }, []);

  const dropdownButton = (name: DropdownName, mobile = false) => (
    <button
      type="button"
      className={`portfolio-nav-trigger ${mobile ? "portfolio-nav-mobile-link" : ""}`}
      aria-expanded={dropdown === name}
      aria-controls={`portfolio-nav-${mobile ? "mobile" : "desktop"}-${name}`}
      onClick={(event) => {
        lastTrigger.current = event.currentTarget;
        setSearchOpen(false);
        setDropdown((previous) => (previous === name ? null : name));
      }}
      onKeyDown={(event) => {
        if (event.key !== "ArrowDown" || mobile) return;
        event.preventDefault();
        lastTrigger.current = event.currentTarget;
        focusPanel.current = name;
        setDropdown(name);
      }}
    >
      {dropdownLabels[name]}
      {name === "tools" && !mobile && <sup>Free</sup>}
      <ChevronDown size={9} aria-hidden="true" />
    </button>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="portfolio-nav-backdrop"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <header
        ref={headerRef}
        style={{ viewTransitionName: "site-navigation" }}
        className={`portfolio-nav ${mobileOpen ? "portfolio-nav-open" : ""}`}
        role={mobileOpen && !searchOpen ? "dialog" : undefined}
        aria-modal={mobileOpen && !searchOpen ? true : undefined}
        aria-label={mobileOpen && !searchOpen ? "Navigation" : undefined}
      >
        <div className="portfolio-nav-shell">
          <nav className="portfolio-nav-bar" aria-label="Primary navigation">
            <Link
              to="/"
              className="portfolio-nav-brand"
              aria-label="Adnan Hossain Khan home"
              onClick={close}
            >
              <div className="portfolio-nav-brand-logo" aria-hidden="true">
                <BrandLogo />
              </div>
              <span className="portfolio-nav-brand-copy">
                <span className="portfolio-nav-brand-name">
                  Adnan<span>HK</span>
                </span>
                <span className="portfolio-nav-brand-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </span>
            </Link>
            <div className="portfolio-nav-desktop-links">
              {dropdownButton("services")}
              {dropdownButton("case-studies")}
              {dropdownButton("more")}
              <Link
                to="/projects"
                className="portfolio-nav-trigger"
                activeProps={{ "aria-current": "page" }}
                onClick={close}
              >
                Work
              </Link>
              <Link
                to="/contact"
                className="portfolio-nav-trigger"
                onClick={close}
              >
                Contact
              </Link>
            </div>
            <div className="portfolio-nav-actions">
              <button
                ref={searchTriggerRef}
                type="button"
                className="portfolio-nav-icon"
                aria-label="Search portfolio"
                aria-expanded={searchOpen}
                aria-controls="portfolio-nav-search"
                onClick={() => {
                  setDropdown(null);
                  setMobileOpen(false);
                  setSearchOpen(!searchOpen);
                }}
              >
                <Search size={21} strokeWidth={1.6} aria-hidden="true" />
              </button>
              <Link
                to="/contact"
                className="portfolio-nav-message"
                aria-label="Let’s talk"
                onClick={close}
              >
                <WhatsAppIcon />
                <span>Let’s talk</span>
              </Link>
              <div className="portfolio-nav-mobile-account"><SignInButton /></div>
              <button
                ref={mobileTriggerRef}
                type="button"
                className="portfolio-nav-icon portfolio-nav-mobile-toggle"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="portfolio-nav-mobile"
                onClick={() => {
                  setMobileOpen(!mobileOpen);
                  setDropdown(null);
                  setSearchOpen(false);
                }}
              >
                {mobileOpen ? (
                  <X size={26} strokeWidth={1} aria-hidden="true" />
                ) : (
                  <Menu size={24} strokeWidth={1.2} aria-hidden="true" />
                )}
              </button>
            </div>
          </nav>
          <AnimatePresence initial={false}>
            {mobileOpen && (
              <motion.nav
                id="portfolio-nav-mobile"
                aria-label="Mobile navigation"
                className="portfolio-nav-mobile"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration }}
              >
                <div className="portfolio-nav-mobile-scroll">
                  {(["services", "case-studies"] as const).map(
                    (name) => (
                      <div
                        key={name}
                        className="portfolio-nav-mobile-disclosure"
                      >
                        {dropdownButton(name, true)}
                        <AnimatePresence initial={false}>
                          {dropdown === name && (
                            <motion.div
                              id={`portfolio-nav-mobile-${name}`}
                              className="portfolio-nav-mobile-submenu"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration }}
                            >
                              <MobileSubmenu name={name} onNavigate={close} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ),
                  )}
                  <Link
                    to="/projects"
                    className="portfolio-nav-mobile-link"
                    activeProps={{ "aria-current": "page" }}
                    onClick={close}
                  >
                    Work
                  </Link>
                  <MobileGroup
                    label="More"
                    items={moreItems}
                    onNavigate={close}
                  />
                  <div className="portfolio-nav-mobile-footer">
                    <Link
                      to="/contact"
                      className="portfolio-nav-mobile-link"
                      onClick={close}
                    >
                      Contact
                    </Link>
                    <Link
                      to="/contact"
                      className="portfolio-nav-message"
                      onClick={close}
                    >
                      <WhatsAppIcon />
                      Let’s talk
                    </Link>
                  </div>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          {dropdown && !mobileOpen && (
            <motion.div
              key={dropdown}
              id={`portfolio-nav-desktop-${dropdown}`}
              className={`portfolio-nav-panel portfolio-nav-panel-${dropdown}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration }}
              onAnimationComplete={() => {
                if (focusPanel.current !== dropdown) return;
                headerRef.current
                  ?.querySelector<HTMLElement>(
                    `#portfolio-nav-desktop-${dropdown} a[href]`,
                  )
                  ?.focus();
                focusPanel.current = null;
              }}
            >
              <DropdownContent name={dropdown} onNavigate={close} />
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <div className="portfolio-nav-desktop-account"><SignInButton /></div>
      {searchOpen && <Suspense fallback={<span className="sr-only" role="status">Opening search…</span>}><SiteSearch open onOpenChange={setSearchOpen} triggerRef={searchTriggerRef} /></Suspense>}
    </>
  );
}

function WhatsAppIcon() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.14-1.35A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.08-1.12l-.36-.21-3.05.8.81-2.97-.23-.38A8 8 0 1 1 12 20Z" />
    <path d="M8.4 6.8c-.3 0-.6.1-.8.4-.5.5-.8 1.2-.8 1.9 0 1.2.8 2.6 2.3 4.1 1.5 1.5 3 2.4 4.4 2.7.8.2 1.6.1 2.2-.3.5-.3.9-.9 1-1.5 0-.2 0-.3-.2-.4l-2-1c-.2-.1-.4-.1-.5.1l-.8 1c-.1.1-.3.2-.5.1a7.1 7.1 0 0 1-3.2-2.8c-.1-.2-.1-.3 0-.5l.6-.8c.1-.2.1-.3 0-.5l-.9-2.1c-.1-.3-.3-.4-.5-.4Z" />
  </svg>
}

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Icons } from "../ui/Icons";
import { Avatar } from "../ui/Avatar";
import { BonusPill } from "../ui/BonusPill";
import { ThemeToggle } from "../ui/ThemeToggle";
import { initialsOf } from "../ui/initials";
import { money } from "../ui/money";
import { getRole, removeAuthData } from "../../utils/auth";
import { logoutRequest } from "../../api/authApi";
import { getCurrentUserRequest } from "../../api/userApi";
import { getMyBonusBalanceRequest } from "../../api/bonusesApi";
import { BALANCE_CHANGED } from "../../utils/balanceEvents";

/* Active when the current path matches the link target (exact for "/"). */
function useIsActive() {
  const { pathname } = useLocation();
  return (to) => (to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/"));
}

/* Single row in the user dropdown (hoisted so it isn't recreated per render).
   `icon` is a pre-rendered node so we don't pass a component type as a prop. */
function MenuItem({ icon, label, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left",
        padding: "10px 13px", border: "none", background: "transparent", cursor: "pointer",
        borderRadius: "var(--r-xs)", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
        color: danger ? "var(--danger)" : "var(--text)", transition: "background .12s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon}
      {label}
    </button>
  );
}

/* ---- User dropdown ---- */
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Меню користувача"
        aria-expanded={open}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "3px 8px 3px 3px", border: "1px solid",
          borderColor: open ? "var(--border-strong)" : "transparent", borderRadius: "var(--r-pill)",
          background: open ? "var(--surface)" : "transparent", cursor: "pointer", transition: "all .15s ease",
        }}
      >
        <Avatar initials={user.initials} size={34} />
        <Icons.ChevD size={15} style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s ease" }} />
      </button>
      {open && (
        <div className="card anim-up" style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0, width: 232, padding: 6,
          boxShadow: "var(--shadow-lg)", zIndex: 50, animationDuration: ".18s",
        }}>
          <div style={{ padding: "11px 13px 12px", display: "flex", alignItems: "center", gap: 11, borderBottom: "1px solid var(--border)", marginBottom: 5 }}>
            <Avatar initials={user.initials} size={40} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.fullName}</div>
              <div style={{ fontSize: 12, color: "var(--accent-strong)", fontWeight: 600 }} className="mono">{money(user.bonusBalance)} бонусів</div>
            </div>
          </div>
          <MenuItem
            icon={<Icons.User size={17} style={{ color: "var(--text-muted)" }} />}
            label="Профіль"
            onClick={() => { setOpen(false); navigate("/profile"); }}
          />
          <MenuItem
            icon={<Icons.Logout size={17} style={{ color: "var(--danger)" }} />}
            label="Вийти"
            danger
            onClick={() => { setOpen(false); onLogout(); }}
          />
        </div>
      )}
    </div>
  );
}

/* ---- Notifications (UI stub — no backend yet, see Д4) ---- */
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="icon-btn" onClick={() => setOpen((o) => !o)} aria-label="Сповіщення">
        <Icons.Bell size={18} />
      </button>
      {open && (
        <div className="card anim-up" style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0, width: 320, padding: 0,
          overflow: "hidden", boxShadow: "var(--shadow-lg)", zIndex: 50, animationDuration: ".18s",
        }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 14.5 }}>
            Сповіщення
          </div>
          <div style={{ padding: "26px 16px", textAlign: "center", color: "var(--text-faint)", fontSize: 13.5 }}>
            Немає нових сповіщень
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Mobile drawer ---- */
function MobileNav({ links, isActive, user, onNavigate, onLogout, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "oklch(0.15 0.02 295 / 0.45)", backdropFilter: "blur(4px)", animation: "overlayIn .2s ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(300px, 84%)", background: "var(--bg)", borderLeft: "1px solid var(--border)", boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column", animation: "sheetIn .3s cubic-bezier(0.22,1,0.36,1)" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <Avatar initials={user.initials} size={40} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{user.fullName}</div>
              <div className="mono" style={{ fontSize: 12, color: "var(--accent-strong)", fontWeight: 600 }}>{money(user.bonusBalance)} бонусів</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Закрити"><Icons.Close size={18} /></button>
        </div>
        <nav style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          {links.map((l) => (
            <button key={l.to} onClick={() => { onNavigate(l.to); onClose(); }} style={{
              textAlign: "left", padding: "13px 14px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer", fontSize: 15.5, fontWeight: 600, fontFamily: "inherit",
              background: isActive(l.to) ? "var(--accent-soft)" : "transparent", color: isActive(l.to) ? "var(--accent-strong)" : "var(--text)",
            }}>{l.label}</button>
          ))}
          <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
          <button onClick={() => { onNavigate("/profile"); onClose(); }} style={{ textAlign: "left", padding: "13px 14px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer", fontSize: 15.5, fontWeight: 600, fontFamily: "inherit", background: "transparent", color: "var(--text)" }}>Профіль</button>
          <button onClick={() => { onClose(); onLogout(); }} style={{ textAlign: "left", padding: "13px 14px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer", fontSize: 15.5, fontWeight: 600, fontFamily: "inherit", background: "transparent", color: "var(--danger)" }}>Вийти</button>
        </nav>
      </div>
    </div>
  );
}

/* ---- Navbar ---- */
export default function Navbar() {
  const navigate = useNavigate();
  const isActive = useIsActive();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState({ fullName: "", initials: "", bonusBalance: 0 });

  const role = getRole();

  const links = [
    { to: "/", label: "Авто" },
    { to: "/rentals", label: "Мої оренди" },
  ];
  if (role === "ADMIN") {
    links.push({ to: "/admin/licenses", label: "Посвідчення" }, { to: "/admin/rentals", label: "Усі оренди" });
  }

  useEffect(() => {
    let alive = true;
    const loadProfile = async () => {
      try {
        const [me, balance] = await Promise.all([
          getCurrentUserRequest(),
          getMyBonusBalanceRequest().catch(() => ({ balance: 0 })),
        ]);
        if (!alive) return;
        setUser({
          fullName: me.fullName || "",
          initials: initialsOf(me.fullName || ""),
          bonusBalance: Number(balance?.balance ?? 0),
        });
      } catch {
        /* Navbar is non-blocking: if the profile/balance call fails the shell
           still renders; the axios interceptor handles 401 redirects. */
      }
    };

    void loadProfile();

    // The Navbar stays mounted across navigation, so re-fetch the balance when
    // a rental flow signals it changed (book spends bonus, finish earns +1%) —
    // otherwise the pill is stale until a full page reload.
    const refetch = () => { void loadProfile(); };
    window.addEventListener(BALANCE_CHANGED, refetch);
    return () => { alive = false; window.removeEventListener(BALANCE_CHANGED, refetch); };
  }, []);

  const handleLogout = async () => {
    // FE-3: ask the server to clear the HttpOnly cookie (JS can't), then drop the
    // local {email, role} snapshot. Best-effort: redirect even if the call fails.
    try {
      await logoutRequest();
    } catch {
      /* ignore — clear locally regardless */
    }
    removeAuthData();
    navigate("/login");
  };

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      background: "color-mix(in oklch, var(--bg) 82%, transparent)",
      backdropFilter: "blur(16px) saturate(1.4)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 20 }}>
        {/* Brand */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 8, textDecoration: "none", color: "var(--text)" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--accent)", color: "var(--accent-contrast)", boxShadow: "var(--shadow-accent)" }}>
            <Icons.Bolt size={19} sw={2.2} fill="currentColor" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>Drivo</span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 2 }} className="nav-desktop">
          {links.map((l) => (
            <Link key={l.to} to={l.to} style={{
              padding: "8px 14px", borderRadius: "var(--r-sm)", fontSize: 14.5, fontWeight: 600,
              textDecoration: "none", letterSpacing: "-0.01em",
              color: isActive(l.to) ? "var(--text)" : "var(--text-muted)",
              background: isActive(l.to) ? "var(--surface-2)" : "transparent",
            }}>{l.label}</Link>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <div className="nav-bonus"><BonusPill value={user.bonusBalance} /></div>
        <NotificationBell />
        <ThemeToggle />
        <div className="nav-usermenu"><UserMenu user={user} onLogout={handleLogout} /></div>
        <button className="icon-btn nav-burger" onClick={() => setMobileOpen(true)} aria-label="Меню" style={{ display: "none" }}>
          <Icons.Menu size={20} />
        </button>
      </div>

      {mobileOpen && createPortal(
        <MobileNav
          links={links}
          isActive={isActive}
          user={user}
          onNavigate={(to) => navigate(to)}
          onLogout={handleLogout}
          onClose={() => setMobileOpen(false)}
        />,
        document.body
      )}
    </header>
  );
}

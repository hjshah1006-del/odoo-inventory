import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, ClipboardCheck, Truck, ArrowLeftRight,
  ClipboardList, History, Settings, LogOut, Menu, X, User
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Products", icon: Package, path: "/products" },
  { label: "Receipts", icon: ClipboardCheck, path: "/receipts" },
  { label: "Delivery Orders", icon: Truck, path: "/deliveries" },
  { label: "Internal Transfers", icon: ArrowLeftRight, path: "/transfers" },
  { label: "Stock Adjustments", icon: ClipboardList, path: "/adjustments" },
  { label: "Move History", icon: History, path: "/history" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function AppSidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut, profile } = useAuth();

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const sidebar = (
    <div className="flex flex-col h-full w-64 bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-foreground/10">
        <Package className="h-7 w-7 text-sidebar-active" />
        <span className="text-lg font-bold tracking-tight">CoreInventory</span>
      </div>
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-sidebar-hover border-l-2 border-sidebar-active text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-foreground/10 space-y-1">
        <Link
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
            location.pathname === "/profile"
              ? "bg-sidebar-hover text-sidebar-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground"
          }`}
        >
          <User className="h-4 w-4" />
          <span>{profile?.full_name || "Profile"}</span>
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground w-full transition-all duration-200">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden bg-sidebar text-sidebar-foreground p-2 rounded-md"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-40 lg:hidden transform transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebar}
      </div>
      <div className="hidden lg:flex lg:flex-shrink-0">
        {sidebar}
      </div>
    </>
  );
}

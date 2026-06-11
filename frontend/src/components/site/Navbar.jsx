import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShieldCheck } from "lucide-react";
import { NAV_LINKS, WHATSAPP_NUMBER } from "@/lib/site-data";

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const onClick = (id) => {
    setOpen(false);
    scrollTo(id);
  };

  return (
    <header
      data-testid="navbar"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#1A1A1A]/85 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 h-16 md:h-20 flex items-center justify-between">
        <button
          data-testid="brand-logo"
          onClick={() => onClick("home")}
          className="flex items-center gap-2.5 group"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F4C81] text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="font-semibold tracking-tight text-white">
            Micro Multimedia <span className="text-[#FF6B35]">Grup</span>
          </span>
        </button>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <button
              key={l.id}
              data-testid={`nav-${l.id}`}
              onClick={() => onClick(l.id)}
              className="px-4 py-2 rounded-full text-sm text-white/70 hover:text-white hover:bg-white/5 transition"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <a
          data-testid="navbar-whatsapp-cta"
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            "Halo Micro Multimedia Grup, saya ingin konsultasi CCTV."
          )}`}
          target="_blank"
          rel="noreferrer"
          className="hidden md:inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e65a26] text-white font-semibold rounded-full px-5 py-2.5 text-sm cta-glow transition"
        >
          Konsultasi WhatsApp
        </a>

        <button
          data-testid="mobile-menu-toggle"
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-white/80 hover:bg-white/5"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden bg-[#1A1A1A]/95 border-t border-white/5"
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.id}
                  data-testid={`nav-mobile-${l.id}`}
                  onClick={() => onClick(l.id)}
                  className="text-left py-3 px-3 rounded-md text-white/80 hover:text-white hover:bg-white/5"
                >
                  {l.label}
                </button>
              ))}
              <a
                data-testid="navbar-mobile-whatsapp-cta"
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 text-center bg-[#FF6B35] text-white font-semibold rounded-full py-2.5"
              >
                Konsultasi WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;

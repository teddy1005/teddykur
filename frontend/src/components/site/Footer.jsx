import { ShieldCheck, Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER, NAV_LINKS } from "@/lib/site-data";

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const Footer = () => {
  return (
    <footer
      id="contact"
      data-testid="footer-section"
      className="relative bg-[#0F0F0F] border-t border-white/5"
    >
      {/* CTA Strip */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#0F4C81] via-[#0F4C81]/80 to-[#FF6B35]/30 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-32 -right-20 h-64 w-64 rounded-full bg-[#FF6B35]/40 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white max-w-xl">
                Siap mengamankan properti Anda hari ini?
              </h3>
              <p className="mt-3 text-white/85 max-w-xl">
                Hubungi tim kami langsung via WhatsApp untuk konsultasi gratis.
              </p>
            </div>
            <a
              data-testid="footer-cta-whatsapp"
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                "Halo Micro Multimedia Grup, saya ingin konsultasi CCTV."
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e65a26] text-white font-semibold rounded-full px-7 py-4 text-sm md:text-base cta-glow transition"
            >
              <MessageCircle className="h-5 w-5" />
              Chat WhatsApp Sekarang
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 pb-12">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F4C81] text-white">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="font-semibold text-white">
                Micro Multimedia <span className="text-[#FF6B35]">Grup</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-white/60 max-w-sm">
              Spesialis instalasi CCTV profesional untuk rumah, ruko, dan
              korporat. Pemasangan rapi, bergaransi, dengan tarif transparan.
            </p>
          </div>

          <div>
            <div className="text-white font-semibold text-sm">Navigasi</div>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.map((l) => (
                <li key={l.id}>
                  <button
                    data-testid={`footer-nav-${l.id}`}
                    onClick={() => scrollTo(l.id)}
                    className="text-sm text-white/60 hover:text-white transition"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-white font-semibold text-sm">Kontak</div>
            <ul className="mt-4 space-y-3 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-[#FF6B35]" />
                <a
                  data-testid="footer-phone"
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  className="hover:text-white"
                >
                  +62 821-3601-9744
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-[#FF6B35]" />
                <span>info@micromultimedia.id</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-[#FF6B35]" />
                <span>
                  Melayani Bandung & sekitarnya · Luar kota dengan ketentuan
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/40">
          <div>© {new Date().getFullYear()} Micro Multimedia Grup. All rights reserved.</div>
          <div>Built with security & craftsmanship.</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import { motion } from "framer-motion";
import { Package, Wrench, Check, ArrowRight } from "lucide-react";

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const features = {
  paket: [
    "Kamera & DVR/NVR standar industri",
    "Kabel, conduit, bracket — semua included",
    "Konfigurasi remote access & cloud",
    "Garansi instalasi + alat",
  ],
  jasa: [
    "Pemasangan rapi dengan pipa conduit",
    "Konfigurasi sistem & remote access",
    "Test & training penggunaan",
    "Rp250.000/titik (luar kota)",
  ],
};

const Services = () => {
  return (
    <section
      id="services"
      data-testid="services-section"
      className="relative py-24 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <div className="text-[#FF6B35] text-sm font-semibold tracking-widest uppercase">
            Dua Pilihan Layanan
          </div>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Pilih sesuai kebutuhan Anda — kami flexible.
          </h2>
          <p className="mt-4 text-white/70">
            Mau terima beres tanpa pusing? Atau sudah punya alat dan tinggal
            butuh tangan ahli? Pilih salah satu skema di bawah.
          </p>
        </motion.div>

        <div className="mt-14 grid md:grid-cols-2 gap-6 md:gap-8">
          {/* CARD 1 — Paket Terima Beres */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            data-testid="service-card-paket-lengkap"
            className="group relative rounded-2xl bg-[#242424] border border-white/10 p-8 md:p-10 hover:border-[#FF6B35]/60 transition-all overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[#FF6B35]/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/30 px-3 py-1 text-xs font-semibold text-[#FF6B35]">
                <Package className="h-3.5 w-3.5" /> Paling Populer
              </div>
              <h3 className="mt-5 text-2xl md:text-3xl font-bold text-white">
                Paket Lengkap Alat + Bahan
              </h3>
              <p className="mt-3 text-white/70">
                Terima beres, semua material dan kamera berkualitas standar
                industri dari kami.
              </p>

              <ul className="mt-6 space-y-3">
                {features.paket.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/80">
                    <Check className="h-5 w-5 text-[#FF6B35] flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                data-testid="service-cta-paket-lengkap"
                onClick={() => scrollTo("lead-form")}
                className="mt-8 inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e65a26] text-white font-semibold rounded-full px-6 py-3 text-sm cta-glow transition"
              >
                Dapatkan Penawaran Paket
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

          {/* CARD 2 — Jasa Pasang Saja */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            data-testid="service-card-jasa-pasang"
            className="group relative rounded-2xl bg-[#242424] border border-white/10 p-8 md:p-10 hover:border-[#0F4C81]/80 transition-all overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[#0F4C81]/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0F4C81]/15 border border-[#0F4C81]/40 px-3 py-1 text-xs font-semibold text-[#7CB3E8]">
                <Wrench className="h-3.5 w-3.5" /> Punya Alat Sendiri?
              </div>
              <h3 className="mt-5 text-2xl md:text-3xl font-bold text-white">
                Jasa Instalasi Per Titik
              </h3>
              <p className="mt-3 text-white/70">
                Anda sudah punya alat/kamera sendiri? Kami bantu pasang dan
                rapihkan jalurnya.
              </p>

              <ul className="mt-6 space-y-3">
                {features.jasa.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/80">
                    <Check className="h-5 w-5 text-[#7CB3E8] flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                data-testid="service-cta-jasa-pasang"
                onClick={() => scrollTo("lead-form")}
                className="mt-8 inline-flex items-center gap-2 bg-[#0F4C81] hover:bg-[#0d4071] text-white font-semibold rounded-full px-6 py-3 text-sm transition border border-white/10"
              >
                Cek Tarif Jasa Pasang
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Services;

import { motion } from "framer-motion";
import { ArrowRight, Wrench, ShieldCheck, MapPin } from "lucide-react";

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const Hero = () => {
  return (
    <section
      id="home"
      data-testid="hero-section"
      className="relative isolate overflow-hidden pt-28 md:pt-36 lg:pt-40 pb-20 md:pb-28"
    >
      {/* Background image + gradients */}
      <div className="absolute inset-0 -z-10">
        <img
          alt="CCTV Profesional"
          src="https://images.unsplash.com/photo-1589935447067-5531094415d1?crop=entropy&cs=srgb&fm=jpg&w=2000&q=80"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A] via-[#1A1A1A]/85 to-[#1A1A1A]" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-[#0F4C81]/25 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 mb-6"
              data-testid="hero-badge"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#FF6B35]" />
              Instalasi bergaransi · Standar industri · 6+ tahun pengalaman
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              data-testid="hero-title"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight"
            >
              Solusi Keamanan{" "}
              <span className="text-[#FF6B35]">CCTV Profesional</span> untuk
              Rumah, Ruko & Korporat
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              data-testid="hero-subtitle"
              className="mt-6 max-w-2xl text-base md:text-lg text-white/70 leading-relaxed"
            >
              Instalasi rapi bergaransi. Melayani paket lengkap{" "}
              <span className="text-white">terima beres</span> atau{" "}
              <span className="text-white">jasa pasang saja</span>. Bebas biaya
              transport untuk area lokal.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <button
                data-testid="hero-cta-paket-lengkap"
                onClick={() => scrollTo("services")}
                className="group inline-flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e65a26] active:scale-[0.98] text-white font-semibold rounded-full px-7 py-3.5 text-sm md:text-base cta-glow transition"
              >
                Lihat Paket Lengkap
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                data-testid="hero-cta-jasa-pasang"
                onClick={() => scrollTo("services")}
                className="inline-flex items-center justify-center gap-2 bg-[#0F4C81] hover:bg-[#0d4071] active:scale-[0.98] text-white font-semibold rounded-full px-7 py-3.5 text-sm md:text-base transition border border-white/10"
              >
                <Wrench className="h-4 w-4" />
                Cek Tarif Jasa Pasang
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-10 grid grid-cols-3 gap-6 max-w-lg"
            >
              {[
                { k: "500+", v: "Proyek Selesai" },
                { k: "98%", v: "Klien Puas" },
                { k: "1 Thn", v: "Garansi Instalasi" },
              ].map((s) => (
                <div key={s.k} data-testid={`hero-stat-${s.k}`}>
                  <div className="text-2xl md:text-3xl font-bold text-white">
                    {s.k}
                  </div>
                  <div className="text-xs text-white/60 mt-1">{s.v}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#0F4C81]/30 to-[#FF6B35]/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#242424] mmg-grain">
                <img
                  alt="Kamera CCTV"
                  src="https://images.unsplash.com/photo-1557597774-9d273605dfa9?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80"
                  className="w-full h-[420px] lg:h-[520px] object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 backdrop-blur-md bg-black/40 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[#FF6B35] flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-semibold text-white">
                      Free Survey Area Lokal
                    </div>
                    <div className="text-white/60 text-xs">
                      Bandung · Jakarta · Bogor · Tangerang · Bekasi
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

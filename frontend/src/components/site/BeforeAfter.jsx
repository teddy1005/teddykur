import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

const BeforeAfter = () => {
  return (
    <section
      data-testid="before-after-section"
      className="relative py-24 md:py-32 bg-[#141414]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="text-[#FF6B35] text-sm font-semibold tracking-widest uppercase">
            Quality & Craftsmanship
          </div>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Kabel berantakan? <span className="text-white/40">Bukan gaya kami.</span>
          </h2>
          <p className="mt-4 text-white/70">
            Standar instalasi Micro Multimedia Grup: setiap jalur masuk ke pipa
            conduit, terdokumentasi, dan aman secara jangka panjang.
          </p>
        </motion.div>

        <div className="mt-14 grid md:grid-cols-2 gap-6 md:gap-8">
          {/* BEFORE — Messy */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            data-testid="before-card"
            className="relative rounded-2xl overflow-hidden border border-red-500/20 bg-[#1F1414]"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                alt="Vendor asal pasang"
                src="https://images.unsplash.com/photo-1691435828932-911a7801adfb?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80"
                className="w-full h-full object-cover grayscale contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F1414] via-red-900/30 to-transparent" />
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold px-3 py-1 rounded-full">
                <X className="h-3.5 w-3.5" /> VENDOR ASAL PASANG
              </div>
            </div>
            <div className="p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold text-white">
                Kabel terurai, rapuh, tidak estetis
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-white/60">
                <li>· Tidak ada jalur conduit / pipa pelindung</li>
                <li>· Kabel rentan digigit hewan & korslet</li>
                <li>· Sulit di-maintenance saat ada kendala</li>
                <li>· Merusak estetika interior rumah / ruko</li>
              </ul>
            </div>
          </motion.div>

          {/* AFTER — Neat */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            data-testid="after-card"
            className="relative rounded-2xl overflow-hidden border border-[#0F4C81]/40 bg-[#141C24]"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                alt="Instalasi Micro Multimedia Grup"
                src="https://images.unsplash.com/photo-1680992046626-418f7e910589?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F1A24] via-[#0F4C81]/25 to-transparent" />
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-[#FF6B35]/95 text-white text-xs font-bold px-3 py-1 rounded-full">
                <Check className="h-3.5 w-3.5" /> STANDAR KAMI
              </div>
            </div>
            <div className="p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold text-white">
                Instalasi estetis & aman dengan pipa conduit
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>
                  <span className="text-[#FF6B35] font-semibold">✓</span> Setiap
                  jalur kabel masuk ke conduit / trunking
                </li>
                <li>
                  <span className="text-[#FF6B35] font-semibold">✓</span>{" "}
                  Terminasi rapi di NVR/DVR + label
                </li>
                <li>
                  <span className="text-[#FF6B35] font-semibold">✓</span> Tahan
                  jangka panjang, mudah maintenance
                </li>
                <li>
                  <span className="text-[#FF6B35] font-semibold">✓</span>{" "}
                  Dokumentasi sebelum-sesudah diserahkan ke klien
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfter;

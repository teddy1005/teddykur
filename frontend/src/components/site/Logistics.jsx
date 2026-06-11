import { motion } from "framer-motion";
import { MapPin, Truck, Camera, BadgePercent } from "lucide-react";

const Logistics = () => {
  return (
    <section
      data-testid="logistics-section"
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
            Ketentuan Jarak & Logistik
          </div>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Transparan dari awal — tidak ada biaya tersembunyi.
          </h2>
        </motion.div>

        <div className="mt-14 grid md:grid-cols-2 gap-6 md:gap-8">
          {/* LOCAL */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            data-testid="logistics-local"
            className="relative rounded-2xl bg-gradient-to-br from-[#0F4C81]/30 via-[#242424] to-[#242424] border border-[#0F4C81]/40 p-8 md:p-10"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F4C81]/30 text-[#7CB3E8]">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-2xl md:text-3xl font-bold text-white">
              Area Lokal — <span className="text-[#FF6B35]">Bebas Transport</span>
            </h3>
            <p className="mt-3 text-white/70">
              Untuk klien di area lokal jangkauan kami, biaya transport survey
              maupun instalasi <strong className="text-white">GRATIS</strong>.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Bandung", "Cimahi", "Lembang", "Jatinangor"].map((c) => (
                <span
                  key={c}
                  className="text-xs font-medium text-white/80 bg-white/5 border border-white/10 rounded-full px-3 py-1"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg bg-black/30 p-3 border border-white/5">
                <div className="text-white/50 text-xs">Survey</div>
                <div className="text-white font-semibold mt-1">Gratis</div>
              </div>
              <div className="rounded-lg bg-black/30 p-3 border border-white/5">
                <div className="text-white/50 text-xs">Transport</div>
                <div className="text-white font-semibold mt-1">Rp 0</div>
              </div>
            </div>
          </motion.div>

          {/* LONG DISTANCE */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            data-testid="logistics-longdistance"
            className="relative rounded-2xl bg-gradient-to-br from-[#FF6B35]/15 via-[#242424] to-[#242424] border border-[#FF6B35]/30 p-8 md:p-10"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B35]/20 text-[#FF6B35]">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-2xl md:text-3xl font-bold text-white">
              Luar Kota / Long Distance
            </h3>
            <p className="mt-3 text-white/70">
              Tetap melayani luar kota dengan ketentuan minimal order dan tarif
              flat per titik instalasi.
            </p>
            <div className="mt-6 grid sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-black/30 p-4 border border-white/5">
                <Camera className="h-4 w-4 text-[#FF6B35]" />
                <div className="text-white/50 text-xs mt-2">Min. Order</div>
                <div className="text-white font-semibold text-lg mt-0.5">
                  8 Titik
                </div>
              </div>
              <div className="rounded-lg bg-black/30 p-4 border border-white/5">
                <BadgePercent className="h-4 w-4 text-[#FF6B35]" />
                <div className="text-white/50 text-xs mt-2">Tarif Flat</div>
                <div className="text-white font-semibold text-lg mt-0.5">
                  Rp250rb<span className="text-xs text-white/60">/titik</span>
                </div>
              </div>
              <div className="rounded-lg bg-black/30 p-4 border border-white/5">
                <Truck className="h-4 w-4 text-[#FF6B35]" />
                <div className="text-white/50 text-xs mt-2">Transport</div>
                <div className="text-white font-semibold text-lg mt-0.5">
                  Flat Regional
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-white/50">
              Biaya transport flat ditentukan berdasarkan zona regional.
              Dijelaskan transparan saat survey.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Logistics;

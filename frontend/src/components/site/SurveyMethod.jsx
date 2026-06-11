import { motion } from "framer-motion";
import { Video, FileText, BadgeCheck, AlertCircle, ArrowRight } from "lucide-react";
import BoQPreview from "@/components/site/BoQPreview";

const SurveyMethod = () => {
  return (
    <section
      id="survey"
      data-testid="survey-method-section"
      className="relative py-24 md:py-32 bg-[#141414]"
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
            Metode Survey Transparan
          </div>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Dua opsi survey — pilih yang paling cocok.
          </h2>
          <p className="mt-4 text-white/70">
            Kami percaya estimasi yang akurat lahir dari survey yang baik.
            Berikut dua skema kami:
          </p>
        </motion.div>

        <div className="mt-14 grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Option A — Virtual */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            data-testid="survey-option-virtual"
            className="relative rounded-2xl bg-[#242424] border border-white/10 p-8 md:p-10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-[#FF6B35] text-white text-[10px] font-bold tracking-widest px-3 py-1 rounded-bl-xl">
              GRATIS
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F4C81]/40 text-[#7CB3E8]">
              <Video className="h-6 w-6" />
            </div>
            <div className="mt-5 text-white/60 text-sm font-semibold">OPSI A</div>
            <h3 className="mt-1 text-2xl md:text-3xl font-bold text-white">
              Virtual Survey
            </h3>
            <p className="mt-3 text-white/70">
              Survey lewat <strong className="text-white">WhatsApp Video Call</strong>{" "}
              & review denah / floorplan yang Anda kirim. Cocok untuk klien sibuk
              dan area lokal.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/80">
              {[
                "WhatsApp Video Call 15-30 menit",
                "Kirim foto / video / floorplan lokasi",
                "Estimasi titik & total biaya langsung",
                "100% gratis, no commitment",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <BadgeCheck className="h-5 w-5 text-[#FF6B35] flex-shrink-0 mt-0.5" />
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Option B — On-Site */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            data-testid="survey-option-onsite"
            className="relative rounded-2xl bg-[#242424] border border-[#FF6B35]/30 p-8 md:p-10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-[#0F4C81] text-white text-[10px] font-bold tracking-widest px-3 py-1 rounded-bl-xl">
              LONG DISTANCE
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B35]/15 text-[#FF6B35]">
              <FileText className="h-6 w-6" />
            </div>
            <div className="mt-5 text-white/60 text-sm font-semibold">OPSI B</div>
            <h3 className="mt-1 text-2xl md:text-3xl font-bold text-white">
              Physical On-Site Survey
            </h3>
            <p className="mt-3 text-white/70">
              Tim kami datang langsung ke lokasi. Cocok untuk proyek besar /
              luar kota dengan deposit komitmen{" "}
              <strong className="text-white">Rp 500.000</strong>.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
                <div className="text-emerald-300 text-xs font-bold tracking-widest">
                  JIKA DEAL
                </div>
                <div className="text-white text-sm mt-1">
                  Deposit Rp 500.000{" "}
                  <strong>dipotong dari invoice akhir</strong> — Anda tidak
                  rugi.
                </div>
              </div>
              <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-4">
                <div className="text-[#FF6B35] text-xs font-bold tracking-widest">
                  JIKA NO-DEAL
                </div>
                <div className="text-white text-sm mt-1">
                  Deposit non-refundable, namun Anda menerima{" "}
                  <strong>BoQ Blueprint PDF resmi</strong> (rancangan jalur +
                  estimasi material).
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-white/50">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              Blueprint PDF tetap milik Anda walau tidak jadi closing.
            </div>

            <BoQPreview />
          </motion.div>
        </div>

        <div className="mt-12 flex justify-center">
          <a
            data-testid="scroll-to-form-cta"
            href="#lead-form"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium underline-offset-4 hover:underline"
          >
            Lanjut ke form survey digital{" "}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default SurveyMethod;

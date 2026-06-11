import { useRef, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Upload, Send, Loader2, Camera as CameraIcon, X } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/site-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BUILDING_TYPES = [
  { value: "rumah_1_lantai", label: "Rumah 1 Lantai" },
  { value: "rumah_2_lantai", label: "Rumah 2 Lantai" },
  { value: "ruko", label: "Ruko" },
  { value: "gudang_pabrik", label: "Gudang / Pabrik" },
];

const CEILING_TYPES = [
  { value: "gypsum", label: "Gypsum" },
  { value: "dak_beton", label: "Dak Beton" },
  { value: "terbuka", label: "Terbuka / Ekspos" },
];

const SERVICE_TYPES = [
  { value: "paket_lengkap", label: "Paket Lengkap (Alat + Pasang)" },
  { value: "jasa_pasang", label: "Jasa Pasang Saja" },
];

const initial = {
  name: "",
  phone: "",
  location: "",
  camera_count: "",
  building_type: "",
  ceiling_condition: "",
  service_type: "paket_lengkap",
  notes: "",
};

const inputCls =
  "w-full bg-[#1A1A1A] border border-white/15 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/30 transition";

const labelCls = "block text-sm font-medium text-white/80 mb-2";

const LeadForm = () => {
  const [form, setForm] = useState(initial);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef(null);

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const onPickFiles = (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length === 0) return;
    setFiles((prev) => [...prev, ...list].slice(0, 6));
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const buildWaMessage = (id) => {
    const lines = [
      `Halo Micro Multimedia Grup, saya ingin estimasi CCTV:`,
      ``,
      `• Nama: ${form.name}`,
      `• Lokasi: ${form.location}`,
      `• Jumlah Kamera: ${form.camera_count}`,
      `• Tipe Bangunan: ${BUILDING_TYPES.find((b) => b.value === form.building_type)?.label || "-"}`,
      `• Kondisi Plafon: ${CEILING_TYPES.find((c) => c.value === form.ceiling_condition)?.label || "-"}`,
      `• Layanan: ${SERVICE_TYPES.find((s) => s.value === form.service_type)?.label || "-"}`,
    ];
    if (form.notes) lines.push(`• Catatan: ${form.notes}`);
    if (id) lines.push(``, `Ref ID: ${id}`);
    return encodeURIComponent(lines.join("\n"));
  };

  const validate = () => {
    if (!form.name.trim()) return "Nama wajib diisi.";
    if (!form.location.trim()) return "Lokasi proyek wajib diisi.";
    if (!form.camera_count || Number(form.camera_count) < 1)
      return "Jumlah kamera minimal 1.";
    if (!form.building_type) return "Tipe bangunan wajib dipilih.";
    if (!form.ceiling_condition) return "Kondisi plafon wajib dipilih.";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("location", form.location);
      fd.append("camera_count", String(form.camera_count));
      fd.append("building_type", form.building_type);
      fd.append("ceiling_condition", form.ceiling_condition);
      fd.append("service_type", form.service_type);
      if (form.phone) fd.append("phone", form.phone);
      if (form.notes) fd.append("notes", form.notes);
      files.forEach((f) => fd.append("files", f));

      const res = await axios.post(`${API}/leads`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const id = res?.data?.id;
      toast.success("Data tersimpan! Anda akan diarahkan ke WhatsApp.");
      const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWaMessage(id)}`;
      setTimeout(() => {
        window.open(wa, "_blank", "noopener");
      }, 600);

      setForm(initial);
      setFiles([]);
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengirim. Silakan coba lagi atau hubungi WA langsung.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="lead-form"
      data-testid="lead-form-section"
      className="relative py-24 md:py-32"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 lg:sticky lg:top-28"
          >
            <div className="text-[#FF6B35] text-sm font-semibold tracking-widest uppercase">
              Digital Survey Form
            </div>
            <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              Isi sekali, dapatkan{" "}
              <span className="text-[#FF6B35]">estimasi via WhatsApp</span>.
            </h2>
            <p className="mt-4 text-white/70">
              Lampirkan foto / video / floorplan lokasi (opsional). Tim kami
              akan menghubungi Anda paling lambat 1×24 jam.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#0F4C81]/30 text-[#7CB3E8] flex items-center justify-center">
                  <CameraIcon className="h-4 w-4" />
                </div>
                <div className="text-sm">
                  <div className="text-white font-semibold">
                    Estimasi akurat 90%
                  </div>
                  <div className="text-white/60">
                    Berdasarkan input lokasi & plafon yang Anda berikan.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#FF6B35]/15 text-[#FF6B35] flex items-center justify-center">
                  <Send className="h-4 w-4" />
                </div>
                <div className="text-sm">
                  <div className="text-white font-semibold">
                    Tindak lanjut via WhatsApp
                  </div>
                  <div className="text-white/60">
                    Tanpa spam telepon. Semua dokumen via chat.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            onSubmit={onSubmit}
            data-testid="lead-form"
            className="lg:col-span-7 bg-[#242424] border border-white/10 rounded-2xl p-6 md:p-8"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className={labelCls}>Nama Lengkap *</label>
                <input
                  data-testid="form-name"
                  className={inputCls}
                  placeholder="cth. Budi Santoso"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>No. WhatsApp (opsional)</label>
                <input
                  data-testid="form-phone"
                  className={inputCls}
                  placeholder="08xxxxxxxxxx"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Lokasi Proyek (Kota/Kecamatan) *</label>
                <input
                  data-testid="form-location"
                  className={inputCls}
                  placeholder="cth. Bandung — Cidadap"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Jumlah Kamera *</label>
                <input
                  data-testid="form-camera-count"
                  type="number"
                  min="1"
                  className={inputCls}
                  placeholder="cth. 8"
                  value={form.camera_count}
                  onChange={(e) => setField("camera_count", e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Tipe Bangunan *</label>
                <Select
                  value={form.building_type}
                  onValueChange={(v) => setField("building_type", v)}
                >
                  <SelectTrigger
                    data-testid="form-building-type"
                    className="bg-[#1A1A1A] border-white/15 text-white h-[46px] focus:border-[#FF6B35] focus:ring-[#FF6B35]/30"
                  >
                    <SelectValue placeholder="Pilih tipe bangunan" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242424] border-white/10 text-white">
                    {BUILDING_TYPES.map((b) => (
                      <SelectItem
                        key={b.value}
                        value={b.value}
                        data-testid={`building-option-${b.value}`}
                      >
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={labelCls}>Kondisi Plafon *</label>
                <Select
                  value={form.ceiling_condition}
                  onValueChange={(v) => setField("ceiling_condition", v)}
                >
                  <SelectTrigger
                    data-testid="form-ceiling"
                    className="bg-[#1A1A1A] border-white/15 text-white h-[46px] focus:border-[#FF6B35] focus:ring-[#FF6B35]/30"
                  >
                    <SelectValue placeholder="Pilih kondisi plafon" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242424] border-white/10 text-white">
                    {CEILING_TYPES.map((c) => (
                      <SelectItem
                        key={c.value}
                        value={c.value}
                        data-testid={`ceiling-option-${c.value}`}
                      >
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Skema Layanan *</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {SERVICE_TYPES.map((s) => (
                    <button
                      type="button"
                      key={s.value}
                      data-testid={`service-option-${s.value}`}
                      onClick={() => setField("service_type", s.value)}
                      className={`text-left px-4 py-3 rounded-lg border transition ${
                        form.service_type === s.value
                          ? "border-[#FF6B35] bg-[#FF6B35]/10 text-white"
                          : "border-white/15 bg-[#1A1A1A] text-white/80 hover:border-white/30"
                      }`}
                    >
                      <div className="text-sm font-semibold">{s.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Catatan Tambahan (opsional)</label>
                <textarea
                  data-testid="form-notes"
                  rows={3}
                  className={inputCls}
                  placeholder="Ceritakan kebutuhan spesifik Anda..."
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>
                  Lampirkan Foto / Video Lokasi (opsional, maks 6 file)
                </label>
                <input
                  ref={fileInput}
                  data-testid="form-file-input"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={onPickFiles}
                />
                <button
                  type="button"
                  data-testid="form-file-button"
                  onClick={() => fileInput.current?.click()}
                  className="w-full border-2 border-dashed border-white/15 hover:border-[#FF6B35]/60 hover:bg-[#FF6B35]/5 transition rounded-lg p-6 flex flex-col items-center justify-center text-white/70"
                >
                  <Upload className="h-6 w-6 text-[#FF6B35] mb-2" />
                  <div className="text-sm font-medium text-white">
                    Klik untuk memilih file
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    JPG, PNG, MP4 — maks 6 file
                  </div>
                </button>

                {files.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        data-testid={`file-chip-${i}`}
                        className="flex items-center justify-between bg-[#1A1A1A] border border-white/10 rounded-md px-3 py-2 text-xs text-white/80"
                      >
                        <span className="truncate pr-2">{f.name}</span>
                        <button
                          type="button"
                          aria-label="remove"
                          onClick={() => removeFile(i)}
                          className="text-white/50 hover:text-[#FF6B35]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              data-testid="form-submit"
              disabled={submitting}
              className="mt-7 w-full inline-flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e65a26] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-full px-6 py-4 text-sm md:text-base cta-glow transition"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? "Mengirim..." : "Dapatkan Estimasi Biaya via WhatsApp"}
            </button>

            <p className="mt-3 text-center text-xs text-white/40">
              Dengan mengirim, Anda setuju kami menghubungi via WhatsApp.
            </p>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default LeadForm;

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Download, FileText, Eye, ShieldCheck, X } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const SAMPLE_PDF = `${BACKEND_URL}/api/sample-boq.pdf`;

const BomRow = ({ no, item, spec, qty, unit, price }) => (
  <div className="grid grid-cols-[28px_1fr_120px_44px_44px_92px] gap-2 px-3 py-2 text-[11px] text-white/85 border-b border-white/5 last:border-b-0">
    <div className="text-white/40">{no}</div>
    <div className="font-medium text-white">{item}</div>
    <div className="text-white/60 truncate">{spec}</div>
    <div className="text-center">{qty}</div>
    <div className="text-center text-white/60">{unit}</div>
    <div className="text-right tabular-nums">{price}</div>
  </div>
);

const PlanRow = ({ code, location, type }) => (
  <div className="grid grid-cols-[44px_1fr_88px] gap-2 px-3 py-2 text-[11px] text-white/85 border-b border-white/5 last:border-b-0">
    <div className="font-mono text-[#FF6B35] font-semibold">{code}</div>
    <div className="text-white">{location}</div>
    <div className="text-white/60 text-right">{type}</div>
  </div>
);

const BoQPreview = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          data-testid="boq-preview-trigger"
          className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#FF6B35]/50 text-white text-sm font-semibold rounded-lg px-5 py-3 transition"
        >
          <Eye className="h-4 w-4 text-[#FF6B35]" />
          Lihat Contoh BoQ Blueprint
        </button>
      </DialogTrigger>

      <DialogContent
        data-testid="boq-preview-dialog"
        className="max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden p-0 bg-[#1A1A1A] border border-white/10 text-white sm:rounded-2xl"
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-white/10 bg-gradient-to-r from-[#0F4C81]/40 via-[#1A1A1A] to-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#FF6B35]/15 text-[#FF6B35] inline-flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] tracking-widest font-bold text-[#FF6B35]">
                CONTOH DOKUMEN
              </div>
              <h3 className="text-lg md:text-xl font-bold">
                BoQ Blueprint — Proyek CCTV
              </h3>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            data-testid="boq-preview-close"
            className="absolute right-4 top-4 h-8 w-8 rounded-md hover:bg-white/10 inline-flex items-center justify-center text-white/70"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto max-h-[60vh] px-6 py-5 space-y-6">
          {/* Project info */}
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              ["Klien", "Bpk. Hendra Wijaya"],
              ["Lokasi", "Ruko 3 Lantai — Jakarta Selatan"],
              ["Tipe Bangunan", "Ruko · Plafon Gypsum"],
              ["Skema", "Paket Lengkap (12 titik)"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="rounded-lg bg-[#242424] border border-white/10 px-4 py-3"
              >
                <div className="text-[10px] tracking-widest text-white/50">
                  {k.toUpperCase()}
                </div>
                <div className="text-sm font-semibold mt-1 text-white">{v}</div>
              </div>
            ))}
          </div>

          {/* BoM */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-[#7CB3E8]">
                1. Bill of Materials (BoM)
              </div>
              <div className="text-[10px] text-white/40">Excerpt · 8 baris</div>
            </div>
            <div className="rounded-lg overflow-hidden border border-white/10 bg-[#161616]">
              <div className="grid grid-cols-[28px_1fr_120px_44px_44px_92px] gap-2 px-3 py-2 text-[10px] tracking-widest font-bold bg-[#0F4C81] text-white">
                <div>NO</div>
                <div>ITEM</div>
                <div>SPESIFIKASI</div>
                <div className="text-center">QTY</div>
                <div className="text-center">UNIT</div>
                <div className="text-right">HARGA</div>
              </div>
              <BomRow no="1" item="Kamera IP Dome 4MP" spec="PoE, IR 30m, IP67" qty="10" unit="pcs" price="Rp 4.500.000" />
              <BomRow no="2" item="Kamera IP Bullet 4MP" spec="PoE, IR 50m, IP67" qty="2" unit="pcs" price="Rp 1.100.000" />
              <BomRow no="3" item="NVR 16 Channel" spec="H.265+, HDD 4TB" qty="1" unit="unit" price="Rp 3.800.000" />
              <BomRow no="4" item="Kabel UTP Cat6 Outdoor" spec="305m / roll" qty="2" unit="roll" price="Rp 2.400.000" />
              <BomRow no="5" item="PoE Switch 16 Port" spec="120W, managed" qty="1" unit="unit" price="Rp 1.450.000" />
              <BomRow no="6" item="Pipa Conduit + aksesoris" spec="20mm, klem, T-dus" qty="1" unit="lot" price="Rp 850.000" />
              <BomRow no="7" item="Bracket & Mounting" spec="Alumunium" qty="12" unit="set" price="Rp 360.000" />
              <BomRow no="8" item="Jasa Instalasi" spec="@ standard, rapi" qty="12" unit="titik" price="Rp 3.000.000" />
            </div>

            {/* Totals */}
            <div className="mt-3 ml-auto max-w-xs text-sm">
              <div className="flex justify-between py-1 text-white/70">
                <span>Sub Total</span>
                <span className="tabular-nums">Rp 17.460.000</span>
              </div>
              <div className="flex justify-between py-1 text-white/70">
                <span>PPN (11%)</span>
                <span className="tabular-nums">Rp 1.920.600</span>
              </div>
              <div className="flex justify-between py-2 mt-1 border-t border-white/10 font-bold text-[#FF6B35]">
                <span>Estimasi Total</span>
                <span className="tabular-nums">Rp 19.380.600</span>
              </div>
            </div>
          </div>

          {/* Site plan */}
          <div>
            <div className="text-sm font-bold text-[#7CB3E8] mb-2">
              2. Rancangan Posisi Kamera
            </div>
            <div className="rounded-lg overflow-hidden border border-white/10 bg-[#161616]">
              <div className="grid grid-cols-[44px_1fr_88px] gap-2 px-3 py-2 text-[10px] tracking-widest font-bold bg-[#242424] text-white/70">
                <div>KODE</div>
                <div>LOKASI</div>
                <div className="text-right">TIPE</div>
              </div>
              <PlanRow code="C-01" location="Pintu Masuk Utama (Lt.1)" type="Dome 4MP" />
              <PlanRow code="C-02" location="Kasir / Etalase (Lt.1)" type="Dome 4MP" />
              <PlanRow code="C-03" location="Gudang Belakang (Lt.1)" type="Bullet 4MP" />
              <PlanRow code="C-04" location="Tangga ke Lt.2" type="Dome 4MP" />
              <PlanRow code="C-09" location="Balkon Belakang Lt.3" type="Bullet 4MP" />
              <PlanRow code="C-11" location="Parkir Depan" type="Dome 4MP" />
            </div>
            <div className="text-[10px] text-white/40 mt-2">
              · Versi PDF lengkap berisi 12 titik + ketentuan + lembar tanda
              tangan.
            </div>
          </div>

          {/* SoW preview */}
          <div className="rounded-lg bg-[#FF6B35]/5 border border-[#FF6B35]/20 p-4">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#FF6B35] mt-0.5 flex-shrink-0" />
              <div className="text-xs text-white/80 leading-relaxed">
                Semua dokumen mencakup{" "}
                <strong className="text-white">Scope of Work</strong>,{" "}
                <strong className="text-white">Garansi</strong>, dan{" "}
                <strong className="text-white">Ketentuan Pembayaran</strong>{" "}
                tertulis. Versi penuh tersedia dalam format PDF.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#161616] flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
          <div className="text-[11px] text-white/50">
            Format ini diserahkan kepada klien yang mengambil opsi Survey
            On-Site (deposit Rp 500.000).
          </div>
          <a
            data-testid="boq-preview-download"
            href={SAMPLE_PDF}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e65a26] text-white font-semibold rounded-full px-5 py-2.5 text-sm cta-glow transition"
          >
            <Download className="h-4 w-4" />
            Unduh Contoh PDF
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BoQPreview;

"""Generate a sample BoQ Blueprint PDF for Micro Multimedia Grup.

Used by /api/sample-boq.pdf endpoint. The file is generated once on startup
and cached on disk under static/.
"""
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)


BRAND_DARK = colors.HexColor("#1A1A1A")
BRAND_BLUE = colors.HexColor("#0F4C81")
BRAND_ORANGE = colors.HexColor("#FF6B35")
BRAND_MUTED = colors.HexColor("#6B6B6B")
LIGHT_BG = colors.HexColor("#F4F4F4")


def _header_footer(canvas, doc):
    canvas.saveState()
    # Top bar
    canvas.setFillColor(BRAND_DARK)
    canvas.rect(0, A4[1] - 18 * mm, A4[0], 18 * mm, fill=1, stroke=0)
    canvas.setFillColor(BRAND_ORANGE)
    canvas.rect(0, A4[1] - 20 * mm, A4[0], 2 * mm, fill=1, stroke=0)

    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 12)
    canvas.drawString(18 * mm, A4[1] - 11 * mm, "MICRO MULTIMEDIA GRUP")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#CFCFCF"))
    canvas.drawString(18 * mm, A4[1] - 15 * mm, "BoQ Blueprint — Bill of Quantities & Site Plan")

    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(BRAND_ORANGE)
    canvas.drawRightString(A4[0] - 18 * mm, A4[1] - 13 * mm, "CONTOH / SAMPLE")

    # Footer
    canvas.setFillColor(BRAND_MUTED)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(18 * mm, 10 * mm, "Dokumen ini adalah contoh format BoQ Blueprint. Detail dapat berbeda per proyek.")
    canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, f"Halaman {doc.page}")
    canvas.restoreState()


def build_sample_boq(out_path: Path) -> Path:
    out_path.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(out_path),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=28 * mm,
        bottomMargin=18 * mm,
        title="BoQ Blueprint - Micro Multimedia Grup",
        author="Micro Multimedia Grup",
    )

    styles = getSampleStyleSheet()
    h1 = ParagraphStyle(
        "h1", parent=styles["Heading1"], fontName="Helvetica-Bold",
        fontSize=18, textColor=BRAND_DARK, spaceAfter=4,
    )
    h2 = ParagraphStyle(
        "h2", parent=styles["Heading2"], fontName="Helvetica-Bold",
        fontSize=11, textColor=BRAND_BLUE, spaceBefore=14, spaceAfter=6,
    )
    body = ParagraphStyle(
        "body", parent=styles["BodyText"], fontName="Helvetica",
        fontSize=9.5, leading=14, textColor=colors.HexColor("#222"),
    )
    muted = ParagraphStyle(
        "muted", parent=body, fontSize=8.5, textColor=BRAND_MUTED,
    )

    story = []

    # Title block
    story.append(Paragraph("BoQ Blueprint — Proyek CCTV", h1))
    story.append(Paragraph("Bill of Quantities & Rancangan Jalur Instalasi", muted))
    story.append(Spacer(1, 8))

    # Project info
    info_data = [
        ["No. Dokumen", "MMG/BOQ/2025/001 (CONTOH)", "Tanggal", "10 Desember 2025"],
        ["Klien", "Bpk. Hendra Wijaya", "Lokasi", "Ruko 3 Lantai — Jakarta Selatan"],
        ["Tipe Bangunan", "Ruko", "Plafon", "Gypsum"],
        ["Jumlah Titik", "12 kamera", "Skema", "Paket Lengkap (Alat + Pasang)"],
    ]
    info_tbl = Table(info_data, colWidths=[28 * mm, 60 * mm, 22 * mm, 60 * mm])
    info_tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), BRAND_MUTED),
        ("TEXTCOLOR", (2, 0), (2, -1), BRAND_MUTED),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
        ("FONTNAME", (3, 0), (3, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E5E5")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(info_tbl)

    # BoM section
    story.append(Paragraph("1. Bill of Materials (BoM)", h2))
    bom_data = [
        ["No.", "Item", "Spesifikasi", "Qty", "Satuan", "Harga"],
        ["1", "Kamera IP Dome 4MP", "PoE, IR 30m, IP67", "10", "pcs", "Rp 4.500.000"],
        ["2", "Kamera IP Bullet 4MP", "PoE, IR 50m, IP67", "2", "pcs", "Rp 1.100.000"],
        ["3", "NVR 16 Channel", "H.265+, HDD 4TB", "1", "unit", "Rp 3.800.000"],
        ["4", "Kabel UTP Cat6 Outdoor", "305m / roll, copper", "2", "roll", "Rp 2.400.000"],
        ["5", "PoE Switch 16 Port", "120W budget, managed", "1", "unit", "Rp 1.450.000"],
        ["6", "Pipa Conduit + aksesoris", "20mm, klem, T-dus, dll", "1", "lot", "Rp 850.000"],
        ["7", "Bracket & Mounting", "Wall/ceiling, alumunium", "12", "set", "Rp 360.000"],
        ["8", "Jasa Instalasi & Konfigurasi", "12 titik @ standard", "12", "titik", "Rp 3.000.000"],
    ]
    bom_tbl = Table(bom_data, colWidths=[10 * mm, 38 * mm, 50 * mm, 14 * mm, 16 * mm, 32 * mm])
    bom_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ALIGN", (3, 1), (4, -1), "CENTER"),
        ("ALIGN", (5, 1), (5, -1), "RIGHT"),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E5E5")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(bom_tbl)

    # Totals
    tot_data = [
        ["Sub Total Material + Instalasi", "Rp 17.460.000"],
        ["PPN (11%)", "Rp 1.920.600"],
        ["Estimasi Total", "Rp 19.380.600"],
    ]
    tot_tbl = Table(tot_data, colWidths=[128 * mm, 32 * mm])
    tot_tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -2), "Helvetica"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("TEXTCOLOR", (0, -1), (-1, -1), BRAND_ORANGE),
        ("LINEABOVE", (0, -1), (-1, -1), 0.8, BRAND_DARK),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(Spacer(1, 4))
    story.append(tot_tbl)

    # Site plan section (camera positions)
    story.append(Paragraph("2. Rancangan Posisi Kamera (Site Plan)", h2))
    plan_data = [
        ["Titik", "Lokasi", "Tipe Kamera", "Fungsi"],
        ["C-01", "Pintu Masuk Utama (Lt.1)", "Dome 4MP", "Identifikasi tamu"],
        ["C-02", "Kasir / Etalase (Lt.1)", "Dome 4MP", "Cegah pencurian"],
        ["C-03", "Gudang Belakang (Lt.1)", "Bullet 4MP", "Akses keluar barang"],
        ["C-04", "Tangga ke Lt.2", "Dome 4MP", "Lalu lintas internal"],
        ["C-05", "Lorong Lt.2", "Dome 4MP", "Pengawasan umum"],
        ["C-06", "Ruang Kantor Lt.2", "Dome 4MP", "Aktivitas staf"],
        ["C-07", "Tangga ke Lt.3", "Dome 4MP", "Akses lantai atas"],
        ["C-08", "Ruang Stok Lt.3", "Dome 4MP", "Inventaris"],
        ["C-09", "Balkon Belakang Lt.3", "Bullet 4MP", "Perimeter eksternal"],
        ["C-10", "Ruang Server / NVR", "Dome 4MP", "Pengamanan perangkat"],
        ["C-11", "Parkir Depan", "Dome 4MP", "Identifikasi kendaraan"],
        ["C-12", "Sisi Jalan Samping", "Dome 4MP", "Perimeter eksternal"],
    ]
    plan_tbl = Table(plan_data, colWidths=[16 * mm, 60 * mm, 30 * mm, 54 * mm])
    plan_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E5E5")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(plan_tbl)

    # Notes / SOW
    story.append(Paragraph("3. Scope of Work (SoW)", h2))
    sow_items = [
        "Instalasi 12 titik kamera dengan jalur kabel masuk pipa conduit 20mm.",
        "Konfigurasi NVR + remote access via aplikasi mobile (iOS & Android).",
        "Pengujian setiap titik & training penggunaan kepada klien.",
        "Dokumentasi sebelum & sesudah instalasi diserahkan ke klien.",
        "Garansi alat 1 tahun (sesuai distributor) + garansi instalasi 1 tahun.",
    ]
    for s in sow_items:
        story.append(Paragraph(f"• {s}", body))

    story.append(Paragraph("4. Ketentuan", h2))
    terms = [
        "Estimasi berlaku 14 hari sejak dokumen diterbitkan.",
        "Pembayaran: DP 50% saat order, 50% sisa setelah serah-terima.",
        "Deposit survey on-site Rp 500.000 dipotong dari invoice jika klien lanjut closing.",
    ]
    for t in terms:
        story.append(Paragraph(f"• {t}", body))

    # Signatures
    story.append(Spacer(1, 24))
    sig_data = [
        ["Hormat kami,", "", "Disetujui oleh,"],
        ["Micro Multimedia Grup", "", "Klien"],
        ["", "", ""],
        ["________________________", "", "________________________"],
        ["Tim Survey", "", "Nama & Tanda Tangan"],
    ]
    sig_tbl = Table(sig_data, colWidths=[60 * mm, 40 * mm, 60 * mm])
    sig_tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#333")),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("ALIGN", (2, 0), (2, -1), "LEFT"),
    ]))
    story.append(sig_tbl)

    doc.build(story, onFirstPage=_header_footer, onLaterPages=_header_footer)
    return out_path


if __name__ == "__main__":
    out = Path(__file__).parent / "static" / "sample-boq-blueprint.pdf"
    build_sample_boq(out)
    print(f"Wrote: {out}")

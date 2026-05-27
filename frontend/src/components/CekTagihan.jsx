import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  Receipt,
  ShoppingCart,
  AlertTriangle
} from 'lucide-react';
import { companyInfo } from '../mockData';
import { toast } from 'sonner';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MONTHS = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' }
];

const YEARS = ['2027', '2026', '2025', '2024'];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Status from API can be boolean true/false or string "true"/"false"
const isPaidStatus = (status) => status === true || status === 'true' || status === 1 || status === '1';

const CekTagihan = () => {
  const navigate = useNavigate();
  const [customerNo, setCustomerNo] = useState('');
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(false);

  // result states
  const [billData, setBillData] = useState(null);
  const [errorState, setErrorState] = useState(null); // { type: 'not_found' | 'ambiguous' | 'generic', message }

  const resetResults = () => {
    setBillData(null);
    setErrorState(null);
  };

  const handleCheck = async (e) => {
    e.preventDefault();

    if (!customerNo.trim()) {
      toast.error('Masukkan nomor layanan terlebih dahulu');
      return;
    }

    setLoading(true);
    resetResults();

    try {
      const res = await axios.post(`${API_BASE}/cek-tagihan`, {
        no_services: customerNo.trim(),
        month,
        year
      });

      const body = res.data || {};

      if (body.status === 'success' && body.data) {
        setBillData(body.data);
        toast.success('Tagihan ditemukan');
      } else if (body.status === 'ambiguous') {
        setErrorState({
          type: 'ambiguous',
          message:
            body.message ||
            'Ditemukan lebih dari satu tagihan aktif untuk periode ini. Silakan hubungi admin.'
        });
        toast.warning('Data tagihan ambigu');
      } else {
        setErrorState({
          type: 'not_found',
          message: body.message || 'Tagihan tidak ditemukan.'
        });
        toast.error(body.message || 'Tagihan tidak ditemukan');
      }
    } catch (err) {
      // Backend forwards upstream JSON errors as HTTPException.detail
      const detail = err?.response?.data?.detail;
      let message = 'Terjadi kesalahan saat memeriksa tagihan.';

      if (typeof detail === 'string') {
        message = detail;
      } else if (detail && typeof detail === 'object' && detail.message) {
        message = detail.message;
      }

      setErrorState({ type: 'not_found', message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutClick = () => {
    if (!billData?.no_invoice) return;
    const url = `https://micronet.web.id/front/checkout?invoice=${encodeURIComponent(billData.no_invoice)}`;
    window.open(url, '_blank');
  };

  const isPaid = billData ? isPaidStatus(billData.status_bayar) : false;
  const periodLabel = `${MONTHS.find((m) => m.value === month)?.label || month} ${year}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-600 via-blue-600 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 relative z-10">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 mb-6"
            onClick={() => navigate('/')}
            data-testid="back-to-home-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Button>

          <div className="max-w-3xl">
            <Badge className="mb-4 bg-white/20 text-white border border-white/30 hover:bg-white/30 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              Layanan Pelanggan
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Cek Tagihan
              <span className="block mt-2 bg-gradient-to-r from-cyan-300 to-blue-200 bg-clip-text text-transparent">
                Internet Anda
              </span>
            </h1>
            <p className="text-lg text-blue-100">
              Cek tagihan internet bulanan Anda dengan mudah dan cepat. Masukkan nomor layanan untuk melihat detail tagihan.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8 relative z-20">
        <div className="max-w-3xl mx-auto">
          {/* Form card */}
          <Card className="shadow-2xl border-0 mb-8" data-testid="check-bill-form-card">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                Form Cek Tagihan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleCheck} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="customerNo" className="text-slate-900 font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-600" />
                    No. Layanan
                  </Label>
                  <Input
                    id="customerNo"
                    type="text"
                    placeholder="Contoh: 1040200013"
                    value={customerNo}
                    onChange={(e) => setCustomerNo(e.target.value)}
                    className="h-12 text-base border-slate-200 focus:border-cyan-500 focus:ring-cyan-500"
                    data-testid="customer-no-input"
                  />
                  <p className="text-xs text-slate-500">Nomor layanan terdaftar pada saat berlangganan</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month" className="text-slate-900 font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-600" />
                      Bulan
                    </Label>
                    <Select value={month} onValueChange={setMonth}>
                      <SelectTrigger
                        id="month"
                        className="h-12 border-slate-200 focus:ring-cyan-500"
                        data-testid="month-select"
                      >
                        <SelectValue placeholder="Pilih Bulan" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-slate-900 font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-600" />
                      Tahun
                    </Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger
                        id="year"
                        className="h-12 border-slate-200 focus:ring-cyan-500"
                        data-testid="year-select"
                      >
                        <SelectValue placeholder="Pilih Tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 rounded-xl"
                  disabled={loading}
                  data-testid="check-bill-submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Memeriksa Tagihan...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Cek Tagihan
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Ambiguous result */}
          {errorState?.type === 'ambiguous' && (
            <Card className="border-2 border-amber-200 bg-amber-50 shadow-lg" data-testid="bill-ambiguous-card">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Perlu Verifikasi Manual</h3>
                <p className="text-slate-700 mb-6">{errorState.message}</p>
                <Button
                  variant="outline"
                  className="border-2 border-amber-500 text-amber-700 hover:bg-amber-100 font-semibold"
                  onClick={() => window.open(`https://wa.me/${companyInfo.whatsapp}`, '_blank')}
                  data-testid="contact-admin-btn"
                >
                  Hubungi Admin
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Not found / generic error */}
          {errorState?.type === 'not_found' && (
            <Card className="border-2 border-red-200 bg-red-50 shadow-lg" data-testid="bill-not-found-card">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Tagihan Tidak Ditemukan</h3>
                <p className="text-slate-600 mb-6">{errorState.message}</p>
                <Button
                  variant="outline"
                  className="border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 font-semibold"
                  onClick={() => window.open(`https://wa.me/${companyInfo.whatsapp}`, '_blank')}
                  data-testid="contact-cs-error-btn"
                >
                  Hubungi Customer Service
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Bill result */}
          {billData && (
            <Card className="shadow-2xl border-0 overflow-hidden" data-testid="bill-result-card">
              <div
                className={`p-4 ${
                  isPaid
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                    : 'bg-gradient-to-r from-orange-500 to-red-500'
                }`}
              >
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    {isPaid ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <XCircle className="w-6 h-6" />
                    )}
                    <div>
                      <div className="font-bold text-lg" data-testid="bill-status-label">
                        {isPaid ? 'LUNAS' : 'BELUM DIBAYAR'}
                      </div>
                      <div className="text-sm opacity-90">
                        Invoice: <span data-testid="bill-invoice">{billData.no_invoice}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm opacity-90 hidden sm:block">
                    Periode: {periodLabel}
                  </div>
                </div>
              </div>

              <CardContent className="p-8">
                <div className="mb-8 pb-8 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Informasi Pelanggan
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-slate-600 mb-1">Nama Pelanggan</div>
                      <div className="font-bold text-slate-900" data-testid="bill-customer-name">
                        {billData.nama_pelanggan}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600 mb-1">ID Pelanggan</div>
                      <div className="font-bold text-slate-900" data-testid="bill-customer-id">
                        {billData.id_pelanggan}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600 mb-1">Paket Berlangganan</div>
                      <div className="font-bold text-slate-900" data-testid="bill-package">
                        {billData.paket_pelanggan}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600 mb-1">Periode</div>
                      <div className="font-bold text-slate-900">{periodLabel}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                    Detail Tagihan
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-700">Biaya Berlangganan</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(billData.biaya_berlangganan)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-t-2 border-slate-200">
                      <span className="font-bold text-lg text-slate-900">Total Tagihan</span>
                      <span
                        className="font-bold text-2xl bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent"
                        data-testid="bill-total"
                      >
                        {formatCurrency(billData.biaya_berlangganan)}
                      </span>
                    </div>
                  </div>
                </div>

                {!isPaid && (
                  <Button
                    onClick={handleCheckoutClick}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg transition-all duration-300 rounded-xl"
                    data-testid="checkout-btn"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Checkout
                  </Button>
                )}

                {isPaid && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-700 font-semibold">
                      Tagihan untuk periode ini sudah lunas. Terima kasih!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info section */}
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-600" />
              Butuh Bantuan?
            </h3>
            <p className="text-slate-700 mb-4">
              Tim customer service kami siap membantu Anda jika mengalami kesulitan dalam cek tagihan atau pembayaran.
            </p>
            <Button
              variant="outline"
              className="border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 font-semibold"
              onClick={() => window.open(`https://wa.me/${companyInfo.whatsapp}`, '_blank')}
              data-testid="contact-cs-btn"
            >
              Chat Customer Service
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CekTagihan;

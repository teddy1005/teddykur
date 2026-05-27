import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, Lightbulb, Check, MessageCircle, Zap } from 'lucide-react';
import { companyInfo } from '../mockData';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATES = {
  IDLE: 'idle',
  PING: 'ping',
  DOWNLOAD: 'download',
  UPLOAD: 'upload',
  DONE: 'done'
};

const STAGE_LABEL = {
  idle: 'Klik untuk memulai tes',
  ping: 'Mengukur Ping...',
  download: 'Mengukur Download...',
  upload: 'Mengukur Upload...',
  done: 'Tes Selesai'
};

const Pad = ({ children }) => (
  <span className="text-lg font-bold text-slate-900 sm:text-2xl">{children}</span>
);

const StatBox = ({ label, value, unit, accent }) => (
  <div className="text-center">
    <p className="text-[10px] uppercase tracking-tight text-slate-400">{label}</p>
    <p className={`text-lg font-bold sm:text-2xl ${accent || 'text-slate-900'}`}>
      <Pad>{value}</Pad>{' '}
      <small className="text-xs text-slate-500">{unit}</small>
    </p>
  </div>
);

// Mini sparkline chart that mimics GMDP graphs
const SparkChart = ({ label, current, history, color, gradientId }) => {
  const max = Math.max(1, ...history, current || 0) * 1.1;
  const w = 420;
  const h = 140;
  const stepX = history.length > 1 ? w / (history.length - 1) : w;

  const pts = history.map((v, i) => {
    const x = i * stepX;
    const y = h - 10 - (v / max) * (h - 30);
    return [x, y];
  });

  const linePath = pts.length
    ? pts
        .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
        .join(' ')
    : `M 0 ${h - 10}`;
  const areaPath = pts.length
    ? `${linePath} L ${pts[pts.length - 1][0]} ${h - 10} L 0 ${h - 10} Z`
    : `M 0 ${h - 10} Z`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-3 text-left sm:px-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="text-xs font-bold text-slate-700">
          {Number(current || 0).toFixed(1)} Mbps
        </p>
      </div>
      <div className="relative h-28 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/90 px-1 py-1">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.42" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <line
            x1="0"
            y1={h - 10}
            x2={w}
            y2={h - 10}
            stroke="#a1a1aa"
            strokeWidth="1"
            strokeOpacity="0.7"
            strokeDasharray="4 4"
          />
          <path d={areaPath} fill={`url(#${gradientId})`} />
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

const SpeedTestPage = () => {
  const navigate = useNavigate();
  const workerRef = useRef(null);
  const pollRef = useRef(null);
  const dlHistoryRef = useRef([]);
  const ulHistoryRef = useRef([]);

  const [stage, setStage] = useState(STATES.IDLE);
  const [dl, setDl] = useState(0);
  const [ul, setUl] = useState(0);
  const [ping, setPing] = useState(0);
  const [jitter, setJitter] = useState(0);
  const [dlHistory, setDlHistory] = useState([]);
  const [ulHistory, setUlHistory] = useState([]);
  const [clientIp, setClientIp] = useState('--');
  const [clientIsp, setClientIsp] = useState('--');

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (workerRef.current) {
        try {
          workerRef.current.terminate();
        } catch {}
        workerRef.current = null;
      }
    };
  }, []);

  const resetState = () => {
    dlHistoryRef.current = [];
    ulHistoryRef.current = [];
    setDl(0);
    setUl(0);
    setPing(0);
    setJitter(0);
    setDlHistory([]);
    setUlHistory([]);
  };

  const stateFromInt = (n) => {
    switch (n) {
      case 1:
        return STATES.DOWNLOAD;
      case 2:
        return STATES.PING;
      case 3:
        return STATES.UPLOAD;
      case 4:
        return STATES.DONE;
      default:
        return STATES.IDLE;
    }
  };

  const startTest = () => {
    if (stage !== STATES.IDLE && stage !== STATES.DONE) return;

    resetState();
    // Start with download stage label as first real measurement
    setStage(STATES.DOWNLOAD);

    // Spawn LibreSpeed worker
    const worker = new Worker('/speedtest_worker.js');
    workerRef.current = worker;

    worker.onmessage = (e) => {
      let data;
      try {
        data = JSON.parse(e.data);
      } catch {
        return;
      }

      const tState = Number(data.testState);
      const next = stateFromInt(tState);
      setStage(next);

      const dlVal = parseFloat(data.dlStatus) || 0;
      const ulVal = parseFloat(data.ulStatus) || 0;
      const pingVal = parseFloat(data.pingStatus) || 0;
      const jitterVal = parseFloat(data.jitterStatus) || 0;

      setDl(dlVal);
      setUl(ulVal);
      setPing(pingVal);
      setJitter(jitterVal);

      // Build history
      if (tState === 1 && dlVal > 0) {
        dlHistoryRef.current = [...dlHistoryRef.current, dlVal].slice(-40);
        setDlHistory(dlHistoryRef.current);
      }
      if (tState === 3 && ulVal > 0) {
        ulHistoryRef.current = [...ulHistoryRef.current, ulVal].slice(-40);
        setUlHistory(ulHistoryRef.current);
      }

      if (data.clientIp) {
        const raw = String(data.clientIp);
        const dash = raw.indexOf(' - ');
        if (dash > -1) {
          setClientIp(raw.slice(0, dash));
          setClientIsp(raw.slice(dash + 3));
        } else if (raw && raw !== '') {
          setClientIp(raw);
        }
      }

      if (tState === 4) {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        try {
          worker.terminate();
        } catch {}
        workerRef.current = null;
      }
    };

    // Configure worker
    const settings = {
      url_dl: `${API_BASE}/speedtest/garbage`,
      url_ul: `${API_BASE}/speedtest/empty`,
      url_ping: `${API_BASE}/speedtest/empty`,
      url_getIp: `${API_BASE}/speedtest/getIP`,
      getIp_ispInfo: true,
      getIp_ispInfo_distance: 'km',
      mpot: false,
      test_order: 'I_D_U_P',
      time_dl_max: 8,
      time_ul_max: 8,
      count_ping: 10,
      time_auto: true,
      garbagePhp_chunkSize: 20,
      xhr_dlMultistream: 3,
      xhr_ulMultistream: 3,
      enable_quirks: true
    };

    worker.postMessage('start ' + JSON.stringify(settings));

    // Poll worker for status every 200ms (LibreSpeed requires polling)
    pollRef.current = setInterval(() => {
      if (workerRef.current) {
        try {
          workerRef.current.postMessage('status');
        } catch {}
      }
    }, 200);
  };

  const isRunning =
    stage === STATES.PING || stage === STATES.DOWNLOAD || stage === STATES.UPLOAD;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar (sits below site Header which is fixed) */}
      <div className="pt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            className="text-slate-700 hover:bg-slate-100"
            onClick={() => navigate('/')}
            data-testid="speedtest-back-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden py-10 sm:py-12 lg:py-16">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-transparent"></div>
        <div className="mx-auto max-w-4xl px-4 text-center">
          <Badge className="mb-5 bg-cyan-100 text-cyan-700 hover:bg-cyan-200 px-4 py-2 text-sm font-semibold">
            <Zap className="w-4 h-4 mr-1.5" />
            Powered by LibreSpeed
          </Badge>
          <h1 className="mb-5 text-4xl font-black leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Cek Performa{' '}
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Real-Time
            </span>{' '}
            Internet Anda
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Rasakan performa sesungguhnya dari jaringan fiber Micro NET. Ukur download, upload, latensi, dan jitter secara akurat.
          </p>
        </div>
      </section>

      {/* Speedtest card */}
      <section className="mx-auto -mt-4 mb-16 max-w-5xl px-4 sm:-mt-2 sm:mb-20">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          {/* Window chrome */}
          <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="h-3 w-3 rounded-full bg-red-400"></span>
                <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
                <span className="h-3 w-3 rounded-full bg-green-400"></span>
              </div>
              <span className="ml-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:ml-2 sm:text-xs sm:tracking-widest">
                Alat Diagnostik Jaringan
              </span>
            </div>
          </div>

          <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-slate-50 px-4 py-6 sm:py-8">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(rgb(14, 165, 233) 1px, transparent 0px)',
                backgroundSize: '40px 40px'
              }}
            ></div>

            <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
              {/* GO button */}
              <div className="group relative isolate">
                <span className="pointer-events-none absolute -inset-6 rounded-full bg-[radial-gradient(circle,_rgba(14,165,233,0.22)_0%,_rgba(14,165,233,0.08)_45%,_transparent_72%)] blur-xl"></span>
                <button
                  type="button"
                  onClick={startTest}
                  disabled={isRunning}
                  className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-white shadow-[0_20px_45px_-15px_rgba(14,165,233,0.55)] transition-all duration-300 group-hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 sm:h-32 sm:w-32"
                  data-testid="speedtest-go-btn"
                >
                  <span className="pointer-events-none absolute inset-[2px] rounded-full bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.3),_rgba(255,255,255,0)_60%)]"></span>
                  <span className="text-xl font-black tracking-[0.2em] drop-shadow-[0_2px_6px_rgba(15,23,42,0.3)] sm:text-2xl">
                    {isRunning ? '...' : stage === STATES.DONE ? 'AGAIN' : 'GO'}
                  </span>
                </button>
              </div>
              <p
                className="mt-6 text-sm font-medium text-slate-500 sm:mt-8 sm:text-base"
                data-testid="speedtest-stage"
              >
                {STAGE_LABEL[stage]}
              </p>

              {/* Stats */}
              <div className="mt-4 grid w-full grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-8">
                <StatBox label="Ping" value={ping ? ping.toFixed(1) : '--'} unit="ms" />
                <StatBox
                  label="Download"
                  value={dl ? dl.toFixed(2) : '--'}
                  unit="Mbps"
                  accent="text-amber-600"
                />
                <StatBox
                  label="Upload"
                  value={ul ? ul.toFixed(2) : '--'}
                  unit="Mbps"
                  accent="text-purple-600"
                />
                <StatBox
                  label="Jitter"
                  value={jitter ? jitter.toFixed(1) : '--'}
                  unit="ms"
                />
              </div>

              {/* Graphs */}
              <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
                <SparkChart
                  label="Grafik Download"
                  current={dl}
                  history={dlHistory}
                  color="#f59e0b"
                  gradientId="download-gradient"
                />
                <SparkChart
                  label="Grafik Upload"
                  current={ul}
                  history={ulHistory}
                  color="#a855f7"
                  gradientId="upload-gradient"
                />
              </div>

              {/* IP & ISP */}
              <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-left">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">IP</p>
                  <p className="truncate text-sm font-semibold text-slate-800 sm:text-base" data-testid="speedtest-ip">
                    {clientIp}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-left">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">ISP</p>
                  <p className="truncate text-sm font-semibold text-slate-800 sm:text-base" data-testid="speedtest-isp">
                    {clientIsp}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips + Support */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:gap-12 sm:py-16 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-600">
              <Lightbulb className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Tips Hasil Lebih Akurat</h2>
          </div>
          <ul className="space-y-6">
            {[
              {
                title: 'Gunakan Kabel Ethernet',
                desc: 'Koneksi kabel lebih stabil dibanding Wi-Fi untuk hasil pengukuran yang konsisten.'
              },
              {
                title: 'Tutup Aplikasi Latar Belakang',
                desc: 'Streaming, update game, dan download aktif dapat mempengaruhi hasil speed test.'
              },
              {
                title: 'Periksa Perangkat',
                desc: 'Pastikan perangkat, router, dan kabel mendukung kecepatan paket internet Anda.'
              }
            ].map((tip) => (
              <li key={tip.title} className="flex gap-4">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="w-4 h-4" strokeWidth={3} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{tip.title}</p>
                  <p className="text-sm text-slate-500">{tip.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex flex-col justify-center overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-10">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Butuh Bantuan?</h2>
            <p className="mb-8 text-base text-slate-300 sm:text-lg">
              Jika hasil kecepatan tidak sesuai ekspektasi, tim teknis kami siap membantu optimasi koneksi Anda 24/7.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href={`https://wa.me/${companyInfo.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-green-500 px-8 py-4 font-bold text-white transition-all hover:-translate-y-1 hover:bg-green-600"
                data-testid="speedtest-whatsapp-btn"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp Support
              </a>
            </div>
          </div>
          <div className="relative z-10 mt-12 flex items-center gap-4 text-sm text-slate-400">
            <span className="h-2 w-2 rounded-full bg-green-400"></span>
            Tim support online - rata-rata respon 5 menit
          </div>
        </div>
      </section>
    </div>
  );
};

export default SpeedTestPage;

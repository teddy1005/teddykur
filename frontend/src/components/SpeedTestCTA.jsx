import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Gauge, ArrowRight, Activity, Download, Upload, Zap } from 'lucide-react';

const SpeedTestCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 px-4 py-2 text-sm font-semibold">
            <Zap className="w-4 h-4 mr-1.5" />
            Speed Test
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Test Kecepatan Internet
            <span className="block mt-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Real-Time
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Cek kualitas koneksi internet Anda dengan tool diagnostik profesional powered by LibreSpeed
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-slate-800/50 border border-cyan-500/20 backdrop-blur-sm p-8 sm:p-12 text-center">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>

            <div className="relative z-10">
              {/* Visual */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 blur-2xl opacity-50"></div>
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 flex items-center justify-center shadow-2xl">
                    <Gauge className="w-12 h-12 sm:w-16 sm:h-16 text-white" strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              {/* Metrics preview */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8 max-w-lg mx-auto">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
                  <Download className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Download</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
                  <Upload className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Upload</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
                  <Activity className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Ping</div>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => navigate('/speedtest')}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-7 rounded-2xl font-bold shadow-2xl hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300 group"
                data-testid="home-speedtest-cta-btn"
              >
                <Gauge className="w-5 h-5 mr-2" />
                Mulai Speed Test
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              <p className="text-slate-400 text-sm mt-6">
                Tes server lokal Micro NET · Akurat · Tanpa registrasi
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpeedTestCTA;

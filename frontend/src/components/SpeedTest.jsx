import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Activity, Download, Upload, Gauge } from 'lucide-react';
import { generateSpeedTestResult } from '../mockData';

const SpeedTest = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);

  const runSpeedTest = () => {
    setTesting(true);
    setProgress(0);
    setResult(null);

    // Simulate speed test progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTesting(false);
          setResult(generateSpeedTestResult());
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 px-4 py-2 text-sm font-semibold">
            Speed Test
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Test Kecepatan Internet
            <span className="block mt-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Real-Time
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Cek kualitas koneksi internet Anda secara real-time
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-white text-center">Speed Test Widget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Speed test button */}
              <div className="text-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xl px-12 py-8 rounded-2xl font-bold shadow-2xl hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={runSpeedTest}
                  disabled={testing}
                >
                  <Gauge className="w-6 h-6 mr-3" />
                  {testing ? 'Testing...' : 'Mulai Speed Test'}
                </Button>
              </div>

              {/* Progress bar */}
              {testing && (
                <div className="space-y-3">
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-center text-slate-300 font-semibold">{progress}% Complete</p>
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300">
                    <Download className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-white mb-1">{result.download}</div>
                    <div className="text-slate-300 text-sm font-medium">Mbps Download</div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300">
                    <Upload className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-white mb-1">{result.upload}</div>
                    <div className="text-slate-300 text-sm font-medium">Mbps Upload</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300">
                    <Activity className="w-8 h-8 text-green-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-white mb-1">{result.ping}</div>
                    <div className="text-slate-300 text-sm font-medium">ms Ping</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300">
                    <Gauge className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-white mb-1">{result.jitter}</div>
                    <div className="text-slate-300 text-sm font-medium">ms Jitter</div>
                  </div>
                </div>
              )}

              {result && (
                <div className="text-center pt-6 border-t border-slate-700">
                  <p className="text-green-400 font-semibold text-lg mb-2">✓ Koneksi Anda Sangat Baik!</p>
                  <p className="text-slate-400 text-sm">
                    Hasil ini menunjukkan koneksi internet yang stabil dan cepat
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info note */}
          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              * Hasil speed test dapat bervariasi tergantung lokasi, perangkat, dan waktu pengujian
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpeedTest;
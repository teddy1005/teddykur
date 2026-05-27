import React from 'react';
import { Badge } from './ui/badge';
import { MapPin, Check } from 'lucide-react';
import { coverageAreas } from '../mockData';

const CoverageArea = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-cyan-100 text-cyan-700 hover:bg-cyan-200 px-4 py-2 text-sm font-semibold">
            Area Layanan
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Coverage Area
            <span className="block mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Kabupaten Batang
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Kami melayani berbagai kecamatan di Kabupaten Batang dengan jaringan fiber optic
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Map placeholder with gradient */}
          <div className="relative mb-12 rounded-3xl overflow-hidden shadow-2xl">
            <div className="aspect-video bg-gradient-to-br from-cyan-100 via-blue-100 to-slate-100 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
              <div className="relative z-10 text-center">
                <MapPin className="w-24 h-24 text-cyan-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Kabupaten Batang</h3>
                <p className="text-slate-700">Jawa Tengah, Indonesia</p>
              </div>
            </div>
          </div>

          {/* Coverage list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coverageAreas.map((area, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-cyan-500 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-cyan-600" />
                </div>
                <span className="text-slate-900 font-medium">{area}</span>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mt-12 text-center p-8 rounded-2xl bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200">
            <p className="text-slate-700 text-lg mb-2">
              Area Anda belum tercover?
            </p>
            <p className="text-slate-600">
              Hubungi kami untuk informasi perluasan jaringan di wilayah Anda
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoverageArea;
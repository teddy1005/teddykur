import React from 'react';
import { Button } from './ui/button';
import { ArrowRight, Phone, Mail, MapPin } from 'lucide-react';
import { companyInfo } from '../mockData';

const CTASection = () => {
  const handleWhatsAppClick = () => {
    window.open(
      `https://wa.me/${companyInfo.whatsapp}?text=Halo%20Micro%20NET%2C%20saya%20ingin%20berlangganan%20internet`,
      '_blank'
    );
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-blue-600 to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Siap Upgrade Koneksi Internet Anda?
          </h2>
          <p className="text-xl sm:text-2xl text-blue-50 mb-10 leading-relaxed">
            Bergabunglah dengan ribuan pelanggan yang sudah menikmati internet super cepat dari Micro NET
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-10 py-7 rounded-xl font-bold shadow-2xl hover:shadow-white/30 hover:scale-105 transition-all duration-300 group"
              onClick={handleWhatsAppClick}
            >
              Hubungi Kami Sekarang
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <Phone className="w-8 h-8 text-cyan-300 mx-auto mb-3" />
              <div className="text-white font-semibold mb-1">Telepon</div>
              <div className="text-blue-100 text-sm">{companyInfo.phone}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <Mail className="w-8 h-8 text-cyan-300 mx-auto mb-3" />
              <div className="text-white font-semibold mb-1">Email</div>
              <div className="text-blue-100 text-sm">{companyInfo.email}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <MapPin className="w-8 h-8 text-cyan-300 mx-auto mb-3" />
              <div className="text-white font-semibold mb-1">Lokasi</div>
              <div className="text-blue-100 text-sm">{companyInfo.address}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
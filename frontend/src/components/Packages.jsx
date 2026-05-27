import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { packages, companyInfo } from '../mockData';

const Packages = () => {
  const [selectedType, setSelectedType] = useState('residential');

  const filteredPackages = packages.filter(pkg => pkg.type === selectedType);

  const handleOrderClick = (packageName) => {
    const message = `Halo Micro NET, saya tertarik dengan paket ${packageName}. Bisa dibantu untuk informasi lebih lanjut?`;
    window.open(`https://wa.me/${companyInfo.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <section id="packages" className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-cyan-100 text-cyan-700 hover:bg-cyan-200 px-4 py-2 text-sm font-semibold">
            Paket Internet
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Pilih Paket Yang Sesuai
            <span className="block mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Dengan Kebutuhan Anda
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Dari rumahan hingga enterprise, kami punya solusi internet untuk semua
          </p>
        </div>

        {/* Package type toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-xl bg-slate-200 p-1">
            <button
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                selectedType === 'residential'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setSelectedType('residential')}
            >
              Rumahan
            </button>
            <button
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                selectedType === 'business'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setSelectedType('business')}
            >
              Bisnis & Kantor
            </button>
          </div>
        </div>

        {/* Packages grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {filteredPackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                pkg.popular
                  ? 'border-2 border-cyan-500 shadow-xl scale-105'
                  : 'border border-slate-200'
              }`}
            >
              {pkg.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-1 text-sm font-semibold flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Paling Populer
                </div>
              )}

              <CardHeader className="pt-8">
                <CardTitle className="text-2xl font-bold text-slate-900">{pkg.name}</CardTitle>
                <CardDescription className="text-slate-600 mt-2">
                  {pkg.type === 'residential' ? 'Paket Rumahan' : 'Paket Bisnis'}
                </CardDescription>
                <div className="mt-6">
                  <div className="text-5xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    {pkg.speed}
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900">
                      {pkg.price === 'Custom' ? 'Custom' : `Rp ${pkg.price}`}
                    </span>
                    {pkg.price !== 'Custom' && (
                      <span className="text-slate-600">/bulan</span>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="rounded-full bg-cyan-100 p-1 mt-0.5">
                        <Check className="w-4 h-4 text-cyan-600" />
                      </div>
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className={`w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300 ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-cyan-500/50'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                  onClick={() => handleOrderClick(pkg.name)}
                >
                  {pkg.price === 'Custom' ? 'Hubungi Kami' : 'Pesan Sekarang'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-slate-600 mb-4">Butuh bantuan memilih paket yang tepat?</p>
          <Button
            variant="outline"
            size="lg"
            className="border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 font-semibold px-8 py-6 rounded-xl"
            onClick={() => window.open(`https://wa.me/${companyInfo.whatsapp}`, '_blank')}
          >
            Konsultasi Gratis via WhatsApp
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Packages;
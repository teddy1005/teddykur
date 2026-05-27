import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Wifi, Video, Building2, Briefcase } from 'lucide-react';
import { services } from '../mockData';

const iconMap = {
  wifi: Wifi,
  video: Video,
  building2: Building2,
  briefcase: Briefcase
};

const Services = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 text-sm font-semibold">
            Layanan Kami
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Solusi Lengkap untuk
            <span className="block mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Kebutuhan Digital Anda
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Lebih dari sekedar internet, kami menyediakan solusi digital menyeluruh
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {services.map((service) => {
            const IconComponent = iconMap[service.icon];
            return (
              <Card
                key={service.id}
                className="border border-slate-200 hover:border-cyan-500 hover:shadow-2xl transition-all duration-300 group cursor-pointer overflow-hidden"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
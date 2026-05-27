import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Zap, Activity, Headphones, Wallet, Wrench, Award } from 'lucide-react';
import { whyChooseUs } from '../mockData';

const iconMap = {
  zap: Zap,
  activity: Activity,
  headphones: Headphones,
  wallet: Wallet,
  wrench: Wrench,
  award: Award
};

const WhyChooseUs = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 text-sm font-semibold">
            Keunggulan Kami
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Mengapa Memilih
            <span className="block mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Micro NET?
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Komitmen kami untuk memberikan layanan terbaik kepada Anda
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {whyChooseUs.map((item) => {
            const IconComponent = iconMap[item.icon];
            return (
              <Card
                key={item.id}
                className="border-none bg-gradient-to-br from-slate-50 to-white hover:shadow-2xl transition-all duration-300 group cursor-pointer p-8"
              >
                <div className="w-14 h-14 mb-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <IconComponent className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
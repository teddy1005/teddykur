import React from 'react';
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { companyInfo } from '../mockData';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Paket Internet Rumah', href: '#packages', type: 'scroll' },
      { label: 'Paket Internet Bisnis', href: '#packages', type: 'scroll' },
      { label: 'CCTV Installation', href: '#services', type: 'scroll' },
      { label: 'Internet Kantor', href: '#services', type: 'scroll' }
    ],
    support: [
      { label: 'Cek Tagihan', href: '/cek-tagihan', type: 'route' },
      { label: 'Speed Test', href: '/speedtest', type: 'route' },
      { label: 'Client Area', href: 'https://micronet.web.id/auth', type: 'external' },
      { label: 'FAQ', href: '#', type: 'link' }
    ],
    company: [
      { label: 'Tentang Kami', href: '#', type: 'link' },
      { label: 'Coverage Area', href: '#coverage', type: 'scroll' },
      { label: 'Karir', href: '#', type: 'link' },
      { label: 'Mitra', href: '#', type: 'link' }
    ]
  };

  const handleLinkClick = (link, e) => {
    if (link.type === 'external') {
      e.preventDefault();
      window.open(link.href, '_blank');
    } else if (link.type === 'route') {
      e.preventDefault();
      window.location.href = link.href;
    }
  };

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <img
              src={companyInfo.logoHorizontal}
              alt="Micro NET"
              className="h-10 w-auto mb-6"
            />
            <p className="text-slate-400 mb-6 leading-relaxed">
              Mitra resmi PT. Global Media Data Prima, menyediakan layanan internet fiber optic super cepat dan stabil untuk rumah, kantor, dan kawasan industri di Kabupaten Batang.
            </p>
            {/* Social media */}
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-cyan-600 flex items-center justify-center transition-colors duration-300"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-cyan-600 flex items-center justify-center transition-colors duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links columns */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Produk</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(link, e)}
                    className="text-slate-400 hover:text-cyan-400 transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Bantuan</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(link, e)}
                    className="text-slate-400 hover:text-cyan-400 transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Perusahaan</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(link, e)}
                    className="text-slate-400 hover:text-cyan-400 transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact info */}
        <div className="border-t border-slate-800 pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
              <div>
                <div className="font-semibold mb-1">Alamat</div>
                <div className="text-slate-400 text-sm">{companyInfo.address}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
              <div>
                <div className="font-semibold mb-1">Telepon</div>
                <div className="text-slate-400 text-sm">{companyInfo.phone}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
              <div>
                <div className="font-semibold mb-1">Email</div>
                <div className="text-slate-400 text-sm">{companyInfo.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-400 text-sm">
            © {currentYear} {companyInfo.name}. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors duration-300">
              Syarat & Ketentuan
            </a>
            <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors duration-300">
              Kebijakan Privasi
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Menu, X, Phone } from 'lucide-react';
import { companyInfo } from '../mockData';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Beranda', href: '#home' },
    { label: 'Paket', href: '#packages' },
    { label: 'Layanan', href: '#services' },
    { label: 'Area', href: '#coverage' },
    { label: 'Testimoni', href: '#testimonials' }
  ];

  const scrollToSection = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    } else if (href === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const handleWhatsAppClick = () => {
    window.open(
      `https://wa.me/${companyInfo.whatsapp}?text=Halo%20Micro%20NET%2C%20saya%20ingin%20informasi%20tentang%20layanan%20internet`,
      '_blank'
    );
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src={companyInfo.logo}
              alt="Micro NET"
              className="h-12 w-auto cursor-pointer"
              onClick={() => scrollToSection('#home')}
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.href)}
                className={`font-semibold transition-colors duration-300 hover:text-cyan-600 ${
                  isScrolled ? 'text-slate-900' : 'text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* CTA Button - Desktop */}
          <div className="hidden lg:block">
            <Button
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-6 py-5 rounded-xl shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
              onClick={handleWhatsAppClick}
            >
              <Phone className="w-4 h-4 mr-2" />
              Hubungi Kami
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-lg transition-colors duration-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className={`w-6 h-6 ${isScrolled ? 'text-slate-900' : 'text-white'}`} />
            ) : (
              <Menu className={`w-6 h-6 ${isScrolled ? 'text-slate-900' : 'text-white'}`} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 shadow-xl">
          <div className="container mx-auto px-4 py-6">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className="text-slate-900 font-semibold py-2 hover:text-cyan-600 transition-colors text-left"
                >
                  {link.label}
                </button>
              ))}
              <Button
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-6 rounded-xl shadow-lg mt-4"
                onClick={handleWhatsAppClick}
              >
                <Phone className="w-4 h-4 mr-2" />
                Hubungi Kami
              </Button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
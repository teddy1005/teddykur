import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Menu, X, Phone, UserCircle, Receipt, Gauge } from 'lucide-react';
import { companyInfo } from '../mockData';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Force solid header on non-home pages
  const showSolidHeader = isScrolled || !isHomePage;

  const navLinks = [
    { label: 'Beranda', href: '#home' },
    { label: 'Paket', href: '#packages' },
    { label: 'Layanan', href: '#services' },
    { label: 'Area', href: '#coverage' },
    { label: 'Testimoni', href: '#testimonials' }
  ];

  const scrollToSection = (href) => {
    if (!isHomePage) {
      navigate('/');
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
      setIsMobileMenuOpen(false);
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    } else if (href === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const handleClientAreaClick = () => {
    window.open('https://micronet.web.id/auth', '_blank');
  };

  const handleCekTagihanClick = () => {
    navigate('/cek-tagihan');
    setIsMobileMenuOpen(false);
  };

  const handleSpeedTestClick = () => {
    navigate('/speedtest');
    setIsMobileMenuOpen(false);
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
        showSolidHeader
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
              onClick={() => {
                if (isHomePage) {
                  scrollToSection('#home');
                } else {
                  navigate('/');
                }
              }}
              data-testid="header-logo"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.href)}
                className={`font-semibold transition-colors duration-300 hover:text-cyan-600 ${
                  showSolidHeader ? 'text-slate-900' : 'text-white'
                }`}
                data-testid={`nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={handleCekTagihanClick}
              className={`font-semibold transition-colors duration-300 hover:text-cyan-600 ${
                showSolidHeader ? 'text-slate-900' : 'text-white'
              }`}
              data-testid="nav-cek-tagihan"
            >
              Cek Tagihan
            </button>
            <button
              onClick={handleSpeedTestClick}
              className={`font-semibold transition-colors duration-300 hover:text-cyan-600 ${
                showSolidHeader ? 'text-slate-900' : 'text-white'
              }`}
              data-testid="nav-speedtest"
            >
              Speed Test
            </button>
          </nav>

          {/* CTA Buttons - Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="outline"
              className={`font-semibold px-5 py-5 rounded-xl border-2 transition-all duration-300 ${
                showSolidHeader
                  ? 'border-slate-200 text-slate-900 hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50'
                  : 'border-white/40 text-white bg-transparent hover:bg-white/10 hover:border-white'
              }`}
              onClick={handleClientAreaClick}
              data-testid="client-area-btn"
            >
              <UserCircle className="w-4 h-4 mr-2" />
              Client Area
            </Button>
            <Button
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-5 py-5 rounded-xl shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
              onClick={handleWhatsAppClick}
              data-testid="header-contact-btn"
            >
              <Phone className="w-4 h-4 mr-2" />
              Hubungi Kami
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-lg transition-colors duration-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="mobile-menu-toggle"
          >
            {isMobileMenuOpen ? (
              <X className={`w-6 h-6 ${showSolidHeader ? 'text-slate-900' : 'text-white'}`} />
            ) : (
              <Menu className={`w-6 h-6 ${showSolidHeader ? 'text-slate-900' : 'text-white'}`} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 shadow-xl">
          <div className="container mx-auto px-4 py-6">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className="text-slate-900 font-semibold py-2 hover:text-cyan-600 transition-colors text-left"
                  data-testid={`mobile-nav-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={handleCekTagihanClick}
                className="text-slate-900 font-semibold py-2 hover:text-cyan-600 transition-colors text-left flex items-center gap-2"
                data-testid="mobile-nav-cek-tagihan"
              >
                <Receipt className="w-4 h-4" />
                Cek Tagihan
              </button>
              <button
                onClick={handleSpeedTestClick}
                className="text-slate-900 font-semibold py-2 hover:text-cyan-600 transition-colors text-left flex items-center gap-2"
                data-testid="mobile-nav-speedtest"
              >
                <Gauge className="w-4 h-4" />
                Speed Test
              </button>
              <Button
                variant="outline"
                className="border-2 border-slate-200 text-slate-900 hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50 font-semibold py-6 rounded-xl mt-2"
                onClick={handleClientAreaClick}
                data-testid="mobile-client-area-btn"
              >
                <UserCircle className="w-4 h-4 mr-2" />
                Client Area
              </Button>
              <Button
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-6 rounded-xl shadow-lg"
                onClick={handleWhatsAppClick}
                data-testid="mobile-contact-btn"
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
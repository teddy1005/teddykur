import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Packages from "@/components/Packages";
import Services from "@/components/Services";
import WhyChooseUs from "@/components/WhyChooseUs";
import SpeedTestCTA from "@/components/SpeedTestCTA";
import CoverageArea from "@/components/CoverageArea";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import CekTagihan from "@/components/CekTagihan";
import SpeedTestPage from "@/components/SpeedTestPage";
import { Toaster } from "@/components/ui/sonner";

const Home = () => {
  return (
    <div id="home" className="min-h-screen">
      <Hero />
      <div id="services">
        <Services />
      </div>
      <WhyChooseUs />
      <div id="packages">
        <Packages />
      </div>
      <SpeedTestCTA />
      <div id="coverage">
        <CoverageArea />
      </div>
      <div id="testimonials">
        <Testimonials />
      </div>
      <CTASection />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cek-tagihan" element={<CekTagihan />} />
          <Route path="/speedtest" element={<SpeedTestPage />} />
        </Routes>
        <Footer />
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;

import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import Services from "@/components/site/Services";
import BeforeAfter from "@/components/site/BeforeAfter";
import Logistics from "@/components/site/Logistics";
import SurveyMethod from "@/components/site/SurveyMethod";
import LeadForm from "@/components/site/LeadForm";
import Portfolio from "@/components/site/Portfolio";
import Reviews from "@/components/site/Reviews";
import Footer from "@/components/site/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white" data-testid="landing-root">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <BeforeAfter />
        <Logistics />
        <SurveyMethod />
        <LeadForm />
        <Portfolio />
        <Reviews />
      </main>
      <Footer />
    </div>
  );
}

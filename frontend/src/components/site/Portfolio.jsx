import { useState } from "react";
import { motion } from "framer-motion";
import { PORTFOLIO_ITEMS } from "@/lib/site-data";

const CATEGORIES = ["Semua", "Residential", "Retail / Ruko", "Corporate / Gudang"];

const Portfolio = () => {
  const [cat, setCat] = useState("Semua");
  const items =
    cat === "Semua"
      ? PORTFOLIO_ITEMS
      : PORTFOLIO_ITEMS.filter((i) => i.category === cat);

  return (
    <section
      id="portfolio"
      data-testid="portfolio-section"
      className="relative py-24 md:py-32 bg-[#141414]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div className="max-w-2xl">
            <div className="text-[#FF6B35] text-sm font-semibold tracking-widest uppercase">
              Portofolio
            </div>
            <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              Hasil kerja yang berbicara sendiri.
            </h2>
          </div>

          <div className="flex flex-wrap gap-2" data-testid="portfolio-filters">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                data-testid={`portfolio-filter-${c}`}
                onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                  cat === c
                    ? "bg-[#FF6B35] border-[#FF6B35] text-white"
                    : "bg-transparent border-white/15 text-white/70 hover:border-white/30 hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it, idx) => (
            <motion.article
              key={`${it.title}-${idx}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              data-testid={`portfolio-card-${idx}`}
              className="group rounded-2xl overflow-hidden bg-[#242424] border border-white/10 hover:border-[#FF6B35]/40 transition"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  alt={it.title}
                  src={it.image}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 text-[10px] tracking-widest font-bold bg-black/60 border border-white/10 text-white rounded-full px-3 py-1">
                  {it.category.toUpperCase()}
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-white font-semibold">{it.title}</h3>
                <p className="mt-1 text-sm text-white/60">{it.detail}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;

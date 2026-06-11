import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { REVIEWS } from "@/lib/site-data";

const Reviews = () => {
  return (
    <section
      data-testid="reviews-section"
      className="relative py-24 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <div className="text-[#FF6B35] text-sm font-semibold tracking-widest uppercase">
            Apa Kata Klien
          </div>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Dipercaya 500+ rumah, ruko & korporat.
          </h2>
        </motion.div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {REVIEWS.map((r, idx) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: idx * 0.06 }}
              data-testid={`review-card-${idx}`}
              className="rounded-2xl bg-[#242424] border border-white/10 p-6 hover:border-[#FF6B35]/40 transition"
            >
              <Quote className="h-6 w-6 text-[#FF6B35] mb-3" />
              <p className="text-sm text-white/85 leading-relaxed">
                "{r.text}"
              </p>
              <div className="mt-5 flex items-center gap-1">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-[#FF6B35] text-[#FF6B35]"
                  />
                ))}
              </div>
              <div className="mt-3">
                <div className="text-white font-semibold text-sm">{r.name}</div>
                <div className="text-white/50 text-xs">{r.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;

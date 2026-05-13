"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { FaBolt, FaCoins, FaCheckCircle, FaStar } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState(null);

  const tiers = [
    {
      name: "Starter Session",
      credits: 3800,
      price: 19,
      description: "Perfect for a single high-fidelity headshot refresh.",
      features: [
        "63 Professional Photo Packs",
        "Full Style Selection",
        "Permanent Storage",
        "Standard Processing",
      ],
      highlight: false,
    },
    {
      name: "Professional Studio",
      credits: 9000,
      price: 45,
      description: "Complete portfolio for career transitions.",
      features: [
        "150 Professional Photo Packs",
        "Priority Extraction",
        "Style Consultation",
        "Priority Support",
      ],
      highlight: true,
    },
    {
      name: "Executive Suite",
      credits: 19800,
      price: 99,
      description: "Bulk portraits for teams and emerging leaders.",
      features: [
        "330 Professional Photo Packs",
        "Bulk Generation Support",
        "Direct API Access",
        "24/7 Priority Support",
      ],
      highlight: false,
    },
  ];

  const handleCheckout = async (price, credits, tierName) => {
    if (status !== "authenticated") {
      signIn();
      return;
    }

    try {
      setLoadingTier(tierName);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price, credits }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Stripe error", err);
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="flex-1 bg-transparent overflow-y-auto custom-scrollbar p-4 md:p-12">
      <header className="max-w-7xl mx-auto mb-16 text-center space-y-4 pt-4 md:pt-0">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] font-semibold tracking-[0.4em] uppercase">
          Establish your professional presence
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight text-foreground drop-shadow-sm">
          CREDIT TIERS
        </h1>
        <p className="text-muted font-medium text-xs uppercase tracking-widest max-w-xl mx-auto leading-loose">
          Unlock higher fidelity, faster processing, and permanent archive
          access. <br />
          Choose your portrait session.
        </p>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
        {tiers.map((tier, index) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative p-8 rounded-2xl border transition-all flex flex-col ${
              tier.highlight
                ? "bg-glass-bg backdrop-blur-3xl border-primary-500 shadow-xl"
                : "bg-glass-bg backdrop-blur-3xl border-glass-border shadow-sm"
            }`}
          >
            {tier.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary-500 rounded-full text-[9px] font-semibold uppercase tracking-widest shadow-lg">
                MOST POTENT
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold tracking-tight mb-2 text-foreground drop-shadow-sm">
                {tier.name}
              </h3>
              <p className="text-xs text-muted font-medium leading-relaxed">
                {tier.description}
              </p>
            </div>

            <div className="mb-8 flex items-end gap-1">
              <span className="text-4xl font-semibold tracking-tight text-foreground drop-shadow-sm">
                ${tier.price}
              </span>
              <span className="text-xs font-medium text-muted mb-1.5 uppercase tracking-widest">
                / Month
              </span>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-glass-hover border border-glass-border shadow-inner">
                <FaCoins className="text-yellow-500 text-lg" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-muted uppercase tracking-widest leading-none mb-1">
                    Yields
                  </span>
                  <span className="text-lg font-semibold text-foreground drop-shadow-sm">
                    {tier.credits} CREDITS
                  </span>
                </div>
              </div>

              <ul className="space-y-3 pt-2">
                {tier.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-center gap-3 text-xs font-medium text-muted"
                  >
                    <FaCheckCircle className="text-primary-500 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() =>
                handleCheckout(tier.price, tier.credits, tier.name)
              }
              disabled={loadingTier === tier.name}
              className={`w-full h-12 rounded-xl font-semibold text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                tier.highlight
                  ? "bg-primary-500 text-white hover:bg-primary-600 shadow-primary-500/20"
                  : "bg-[var(--solid-bg)] text-foreground hover:opacity-80 border border-glass-border"
              } disabled:opacity-20`}
            >
              {loadingTier === tier.name ? (
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Book Session{" "}
                  <FaBolt
                    className={
                      tier.highlight ? "text-primary-500" : "text-muted"
                    }
                  />
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Credit Counter Hook */}
      <footer className="max-w-7xl mx-auto py-12 border-t border-glass-border flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2 text-center md:text-left">
          <div className="text-[10px] font-semibold tracking-[0.4em] text-muted uppercase">
            Kinetic Stats
          </div>
          <div className="text-lg font-medium flex items-center gap-3 text-gray-700">
            Currently Holding:{" "}
            <span className="text-foreground font-semibold">
              {session?.user?.credits || 0} Credits
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-muted text-[10px] font-semibold uppercase tracking-widest text-center">
          <FaStar className="text-yellow-500/30 hidden sm:block" /> Secure
          Encryption via Stripe{" "}
          <FaStar className="text-yellow-500/30 hidden sm:block" />
        </div>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
        }
        .custom-scrollbar {
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

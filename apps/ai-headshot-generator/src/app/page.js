"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import {
  FaBolt,
  FaMagic,
  FaChevronDown,
  FaExpand,
  FaPlus,
  FaTrash,
  FaImages,
} from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { downloadImage, headshotsExamples } from "@/lib/utils";

const ASPECT_RATIOS = [
  { label: "1:1 Square", value: "1:1" },
  { label: "4:3 Classic", value: "4:3" },
  { label: "3:4 Portrait", value: "3:4" },
  { label: "16:9 Landscape", value: "16:9" },
  { label: "9:16 Portrait", value: "9:16" },
];

const PHOTO_CATEGORIES = [
  "LinkedIn",
  "Tinder",
  "Bumble",
  "OldMoney",
  "Cyberpunk",
  "CEO",
  "CleanGirl",
  "DarkAcademia",
  "Anime",
  "Doctor",
  "Lawyer",
  "MobWife",
  "Bali",
  "90s",
  "Fitness",
  "Christmas",
  "Halloween",
  "EuropeanElegance",
  "ChampionSportsMoment",
  "JobSwapDaydream",
  "TravelTheWorld",
  "DatingPack",
  "FlashPosePerfection",
  "CapAndGown",
  "CorporateBoss",
  "RocknRollLuxury",
  "TheBigWeddingDay",
  "RusticCharm",
  "DressedToImpress",
  "IdentificationPhoto",
  "DontMissYourProm",
  "GoddessOfNature",
  "BlackAndWhiteMagic",
  "HomelyComforts",
  "BalloonsBalloonsBalloons",
  "BeautyBlooms",
  "SuperheroAdventure",
  "BoldFashionStatements",
  "FantasyOutfits",
  "OnTheCatwalk",
  "HalloweenHorror",
  "CosplayGalore",
  "Ghibli",
  "Pixar",
  "SpiderVerse",
].sort();

const HeadshotCarousel = () => {
  return (
    <div className="w-full overflow-hidden relative py-6">
      <div className="absolute inset-y-0 left-0 w-24 z-10" />
      <div className="absolute inset-y-0 right-0 w-24 z-10" />
      
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 100,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex gap-4 w-max px-4"
      >
        {[...headshotsExamples, ...headshotsExamples].map((example, idx) => (
          <div
            key={idx}
            className="w-40 md:w-52 aspect-[3/4] rounded-2xl overflow-hidden relative group border border-glass-border bg-glass-bg shrink-0"
          >
            <img
              src={example.url}
              alt={example.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 flex items-center gap-1.5 shadow-xl">
              <div className="w-1 h-1 bg-primary-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-white uppercase tracking-widest leading-none">
                AI Generated
              </span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // UI State
  const [isRatioOpen, setIsRatioOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const ratioRef = useRef(null);
  const categoryRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Form State
  const [category, setCategory] = useState(PHOTO_CATEGORIES[0]);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [referenceImage, setReferenceImage] = useState(null); // Single URL string
  const [newImageUrl, setNewImageUrl] = useState("");

  // Generation State
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (ratioRef.current && !ratioRef.current.contains(event.target)) {
        setIsRatioOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload only PNG, JPG, or JPEG images.");
      return;
    }

    if (!session) {
      signIn();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed.");

      const data = await res.json();
      if (data.url) {
        setReferenceImage(data.url);
      }
    } catch (err) {
      setError("Failed to upload image. Try a URL instead.");
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!session) {
      signIn();
      return;
    }

    if (!referenceImage && !newImageUrl) {
      setError("Please provide a reference image.");
      return;
    }

    const finalImageUrl = referenceImage || newImageUrl;

    try {
      setLoading(true);
      setError(null);
      setResultUrl(null);
      setStatusMessage("CALIBRATING SESSION...");

      const res = await fetch("/api/headshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: finalImageUrl,
          category,
          aspect_ratio: aspectRatio.value,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate request.");
      }

      const { request_id } = data;
      await pollStatus(request_id);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const pollStatus = async (requestId) => {
    setStatusMessage("DEVELOPING PORTRAIT...");

    try {
      const res = await fetch("/api/headshot/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Status check failed.");

      if (data.status === "completed") {
        setResultUrl(data.imageUrl);
        setStatusMessage("");
        setLoading(false);
      } else if (data.status === "failed") {
        throw new Error(data.error || "Generation failed.");
      } else {
        setTimeout(() => pollStatus(requestId), 3000);
      }
    } catch (err) {
      setError(err.message || "An error occurred during verification.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row flex-1 h-full w-full overflow-y-auto lg:overflow-hidden">
      <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-r border-glass-border bg-glass-bg backdrop-blur-3xl flex flex-col shrink-0 h-auto lg:h-full lg:overflow-y-auto custom-scrollbar">
        <div className="p-6 border-b border-glass-border space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-black tracking-tight text-foreground drop-shadow-sm">
              PORTRAIT STUDIO
            </h2>
            <p className="text-[10px] text-muted font-medium uppercase tracking-[0.2em]">
              Professional AI Engine
            </p>
          </div>
        </div>

        <div className="flex-1 custom-scrollbar p-6 space-y-6">
          {/* Style Selector */}
          <div className="space-y-3" ref={categoryRef}>
            <label className="text-sm font-medium text-foreground font-semibold flex items-center gap-2">
              <div className="w-1 h-1 bg-primary-500 rounded-full" /> Style
              Category
            </label>
            <div className="relative">
              <button
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="w-full flex items-center justify-between p-3 bg-glass-bg border border-glass-border hover:bg-glass-hover shadow-sm rounded-lg text-sm font-semibold transition-all outline-none text-foreground backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <FaMagic className="text-primary-500" />
                  {category}
                </div>
                <FaChevronDown
                  className={`text-[10px] transition-transform duration-300 ${isCategoryOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isCategoryOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-12 left-0 right-0 max-h-60 bg-[var(--solid-bg)] border border-glass-border rounded-lg overflow-y-auto custom-scrollbar shadow-2xl z-[100] p-1"
                  >
                    {PHOTO_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setCategory(cat);
                          setIsCategoryOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${
                          category === cat
                            ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                            : "text-muted hover:bg-glass-hover hover:text-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Reference Image */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-foreground font-semibold flex items-center gap-2">
              <div className="w-1 h-1 bg-primary-500 rounded-full" /> Reference
              Image
            </label>

            {!referenceImage ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Reference Image URL..."
                    className="flex-1 bg-glass-bg border border-glass-border rounded-lg px-3 py-2 text-[10px] font-bold outline-none focus:border-primary-500/50 text-foreground drop-shadow-sm"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept=".png, .jpg, .jpeg"
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() =>
                      session ? fileInputRef.current?.click() : signIn()
                    }
                    className="w-10 h-10 bg-primary-500/10 border border-primary-500/10 text-primary-500 rounded-lg flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all shadow-sm group"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FaPlus className="group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                </div>
                <div className="p-4 border-2 border-dashed border-glass-border rounded-xl flex flex-col items-center justify-center gap-2 bg-glass-bg/30">
                  <FaImages className="text-muted text-xl opacity-20" />
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest">
                    Single Photo Required
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative aspect-square rounded-2xl bg-glass-bg overflow-hidden group border-2 border-primary-500/20">
                <img
                  src={referenceImage}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setReferenceImage(null)}
                  className="absolute top-2 right-2 bg-red-500 p-2 rounded-xl text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90"
                >
                  <FaTrash className="text-xs" />
                </button>
              </div>
            )}
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-3" ref={ratioRef}>
            <label className="text-sm font-medium text-foreground font-semibold flex items-center gap-2">
              <div className="w-1 h-1 bg-primary-500 rounded-full" /> Aspect
              Ratio
            </label>
            <div className="relative">
              <button
                onClick={() => setIsRatioOpen(!isRatioOpen)}
                className="w-full flex items-center justify-between p-3 bg-glass-bg border border-glass-border hover:bg-glass-hover shadow-sm rounded-lg text-sm font-medium transition-all outline-none text-foreground backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <FaExpand className="text-primary-500" />
                  {aspectRatio.label}
                </div>
                <FaChevronDown
                  className={`text-xs transition-transform duration-300 ${isRatioOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isRatioOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-12 left-0 right-0 max-h-60 bg-[var(--solid-bg)] border border-glass-border rounded-lg overflow-y-auto custom-scrollbar shadow-2xl z-[100] p-1"
                  >
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.value}
                        onClick={() => {
                          setAspectRatio(ratio);
                          setIsRatioOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${
                          aspectRatio.value === ratio.value
                            ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                            : "text-muted hover:bg-glass-hover hover:text-foreground"
                        }`}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-glass-border mt-auto">
          <button
            onClick={handleGenerate}
            disabled={loading || (!referenceImage && !newImageUrl)}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl py-4 font-bold tracking-wider uppercase text-xs flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 shadow-xl shadow-primary-500/30 border border-primary-400/50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
            ) : (
              <FaBolt className="text-yellow-400" />
            )}
            {loading ? "PROCESSING..." : "Generate 60 Credits"}
          </button>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 relative flex flex-col bg-transparent overflow-hidden min-h-[50vh] lg:min-h-0 shrink-0">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-[100%] h-[100%] bg-gradient-to-br from-primary-500/[0.03] to-secondary-500/[0.03]" />
          <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] bg-primary-500/[0.12] rounded-full blur-[140px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] bg-secondary-500/[0.12] rounded-full blur-[120px]" />
        </div>

        <div className="flex-1 relative z-10 p-12 overflow-y-auto flex items-center justify-center custom-scrollbar">
          <AnimatePresence mode="wait">
            {!resultUrl && !loading && !error && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex flex-col items-center justify-center p-4 md:p-12 space-y-12"
              >
                <div className="max-w-md w-full text-center space-y-8">
                  <div className="relative w-28 h-28 mx-auto group">
                    <div className="absolute inset-0 bg-primary-500/10 blur-[30px] rounded-full" />
                    <div className="relative w-full h-full bg-glass-bg border border-glass-border rounded-3xl flex items-center justify-center shadow-sm transition-transform duration-700 group-hover:rotate-12">
                      <FaMagic className="text-3xl text-slate-200" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold tracking-tight uppercase text-foreground drop-shadow-sm">
                      Studio Ready.
                    </h2>
                    <p className="text-muted font-medium text-[10px] uppercase tracking-widest leading-loose">
                      Upload your reference and select a category <br /> to
                      manifest your professional portrait.
                    </p>
                  </div>
                </div>

                <div className="w-full max-w-6xl mx-auto">
                  <HeadshotCarousel />
                </div>
              </motion.div>
            )}

            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center space-y-12"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-48 h-48 border-2 border-primary-500/10 rounded-full border-t-primary-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FaBolt className="text-primary-500 animate-pulse text-2xl" />
                  </div>
                </div>
                <div className="text-center space-y-4">
                  <div className="text-2xl font-black italic uppercase animate-pulse text-foreground drop-shadow-sm">
                    {statusMessage}
                  </div>
                  <div className="inline-block px-4 py-1.5 rounded-full bg-primary-50 text-primary-500 text-[9px] font-black uppercase tracking-widest">
                    SESSION ACTIVE: 60.0s
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-sm w-full p-10 bg-red-500/[0.02] border-2 border-red-500/10 rounded-3xl text-center space-y-4"
              >
                <div className="text-red-500 font-black uppercase tracking-[0.4em] text-[10px]">
                  Processing Error
                </div>
                <p className="text-muted text-xs font-bold leading-loose text-center">
                  {error}
                </p>
              </motion.div>
            )}

            {resultUrl && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl"
              >
                {Array.isArray(resultUrl) ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
                        {category} Pack Generated
                      </h3>
                      <button
                        onClick={async () => {
                          setDownloading(true);
                          for (let i = 0; i < resultUrl.length; i++) {
                            await downloadImage(
                              resultUrl[i],
                              `headshot-${category}-${i + 1}.jpg`,
                            );
                          }
                          setDownloading(false);
                        }}
                        disabled={downloading}
                        className="px-6 py-2 bg-primary-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-primary-600 transition-all shadow-lg"
                      >
                        {downloading
                          ? "Downloading..."
                          : "Download Entire Pack"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {resultUrl.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-2xl overflow-hidden border border-glass-border aspect-[3/4] bg-glass-bg"
                        >
                          <img
                            src={url}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() =>
                                downloadImage(
                                  url,
                                  `headshot-${category}-${idx + 1}.jpg`,
                                )
                              }
                              className="p-3 bg-white text-black rounded-lg transform scale-90 group-hover:scale-100 transition-transform"
                            >
                              <FiDownload />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="relative group rounded-3xl overflow-hidden shadow-2xl border border-glass-border">
                    <img
                      src={resultUrl}
                      className="max-h-[80vh] w-auto h-auto"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-8 flex flex-col justify-end">
                      <div className="flex items-end justify-between">
                        <div className="space-y-3">
                          <h3 className="text-white text-lg font-semibold tracking-tight uppercase">
                            {category} Portrait
                          </h3>
                          <div className="px-3 py-1.5 inline-block rounded-lg bg-glass-bg backdrop-blur-3xl text-[10px] font-semibold text-white">
                            {aspectRatio.label}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            setDownloading(true);
                            await downloadImage(
                              resultUrl,
                              `headshot-${category}-${Date.now()}.jpg`,
                            );
                            setDownloading(false);
                          }}
                          disabled={downloading}
                          className="p-3 bg-white text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                        >
                          {downloading ? (
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiDownload className="text-xl" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
          border-radius: 10px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
      `}</style>
    </div>
  );
}

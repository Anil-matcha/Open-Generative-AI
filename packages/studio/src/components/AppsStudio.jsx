"use client";

import React, { useState, useEffect } from 'react';
import { 
  FaUserTie, FaImage, FaMagic, FaVideo, FaFileAlt, 
  FaBriefcase, FaHome, FaMicrophone, FaHandSparkles, FaBuilding,
  FaUserInjured, FaStethoscope, FaCar, FaPaw, FaBalanceScale, FaTruck, FaMapMarkerAlt,
  FaGithub, FaExternalLinkAlt, FaDollarSign, FaRocket, FaCreditCard 
} from "react-icons/fa";
import { registerAppInterest, getAppInterests } from '../muapi.js';
import toast, { Toaster } from 'react-hot-toast';

const templateApps = [
  {
    name: "AI Headshot Studio",
    description: "Launch a headshot SaaS in minutes. Charge $5–$20 per set, keep all profits. Stripe payments & user accounts included.",
    icon: FaUserTie,
    color: "blue",
    repo: "https://github.com/SamurAIGPT/ai-headshot-generator",
    hosted: "https://ai-headshot-generator-xi.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/d9c39378f60e48098f6b6ce657dc18b5.png",
    isTemplate: true
  },
  {
    name: "Nano Banana Studio",
    description: "Your own AI image generation platform, ready to monetize. Add credit packs or subscriptions and start earning from day one.",
    icon: FaHandSparkles,
    color: "amber",
    repo: "https://github.com/SamurAIGPT/nano-banana-generator",
    hosted: "https://nano-banana-generator-psi.vercel.app",
    thumbnail: "https://cdn.muapi.ai/data/2/874086171651/Screenshot_2026-04-15_103743.png",
    isTemplate: true
  },
  {
    name: "Seedance V2 Studio",
    description: "Deploy a premium AI art studio and sell access to users. Full Stripe integration lets you collect revenue immediately after launch.",
    icon: FaMagic,
    color: "purple",
    repo: "https://github.com/SamurAIGPT/seedance-2-generator",
    hosted: "https://seedance-2-generator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/4cd1f49d48934d448e7f493f9d5e476e.png",
    isTemplate: true
  },
  {
    name: "AI Clipping Studio",
    description: "Launch your own AI-powered video clipping SaaS. Download YouTube videos and extract viral highlights with ease.",
    icon: FaVideo,
    color: "emerald",
    repo: "https://github.com/SamurAIGPT/ai-clipping-generator",
    hosted: "https://ai-clipping-generator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/data/2/883345778103/cca8b5bb-25f1-40fe-928e-53dce2c8c928.png",
    isTemplate: true
  },
  {
    name: "EasyVeo Studio",
    description: "The complete Veo 3.1 video generation suite. Monetize text-to-video, image-to-video, and reference-to-video workflows with ease.",
    icon: FaVideo,
    color: "indigo",
    repo: "https://github.com/SamurAIGPT/veo4-video-generator",
    hosted: "https://veo4-video-generator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/data/2/901343404247/94ac6d86-be4e-4b70-b1e6-96d7e3692604.png",
    isTemplate: true
  }
];

const dummyAppsData = [
  { thumbnail: "https://cdn.muapi.ai/apps/Pet_Product_Studio.jpg", name: "Pet Product Studio", description: "High-end product photography specifically for pet toys and food.", icon: FaPaw, category: "Lifestyle" },
  { thumbnail: "https://cdn.muapi.ai/apps/Resale_Photo_Enhancer.png", name: "Resale Photo Enhancer", description: "Boost sales by elevating low-quality product photos to studio level.", icon: FaImage, category: "Business" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Recruiter.png", name: "AI Recruiter", description: "Smart candidate screening and interview assistant.", icon: FaBriefcase, category: "Business" },
  { thumbnail: "https://cdn.muapi.ai/apps/Talk_to_PDF.png", name: "Talk to PDF", description: "Interactive document chat for deep research and summarization.", icon: FaFileAlt, category: "Productivity" },
  { thumbnail: "https://cdn.muapi.ai/apps/Blogger_CMS.png", name: "Blogger CMS", description: "AI-powered content management for high-velocity SEO blogs.", icon: FaBriefcase, category: "Business" },
  { thumbnail: "https://cdn.muapi.ai/apps/Amazon_Product_Studio.webp", name: "Amazon Product Studio", description: "Perfect Amazon-ready product shots with AI backdrops.", icon: FaImage, category: "Business" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Business_Card.webp", name: "AI Business Card", description: "Digital-first business card generator with AI networking.", icon: FaBriefcase, category: "Business" },
  { thumbnail: "https://cdn.muapi.ai/apps/MailWise.png", name: "MailWise", description: "Intelligent email drafting and scheduling assistant.", icon: FaBriefcase, category: "Business" },
  { thumbnail: "https://cdn.muapi.ai/apps/My_Podcast.webp", name: "My Podcast", description: "Automated podcast editing and show-note generation.", icon: FaMicrophone, category: "Creative" },
  { thumbnail: "https://cdn.muapi.ai/apps/EZScribe.png", name: "EZScribe", description: "Instant transcription and meeting minute automation.", icon: FaFileAlt, category: "Productivity" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Knowledge_Base.png", name: "AI Knowledge Base", description: "Train an AI on your company data for instant support.", icon: FaBriefcase, category: "Business" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Outbound.webp", name: "AI Outbound", description: "Personalized cold outreach at scale for sales teams.", icon: FaBriefcase, category: "Business" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Royal_Portrait.png", name: "AI Royal Portrait", description: "Transform your photos into 18th-century royal oil paintings.", icon: FaHandSparkles, category: "Creative" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_MEME.png", name: "AI MEME", description: "Viral-ready meme generation based on trending topics.", icon: FaMagic, category: "Creative" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Real_Estate_Stager.webp", name: "AI Real Estate Stager", description: "Virtually furnish and stage empty homes for sale.", icon: FaHome, category: "Real Estate" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Logo.png", name: "AI Logo", description: "Dynamic brand identity and logo generator.", icon: FaHandSparkles, category: "Business" },
  { thumbnail: "https://cdn.muapi.ai/apps/OldPhoto.png", name: "OldPhoto", description: "Restore, colorize, and sharpen vintage family photos.", icon: FaImage, category: "Creative" },
  { thumbnail: "https://cdn.muapi.ai/apps/AITryOn.png", name: "AITryOn", description: "Virtual fitting room for fashion brands and enthusiasts.", icon: FaHandSparkles, category: "Lifestyle" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Age_Transformation.webp", name: "AI Age Transformation", description: "Visualize yourself at different stages of life with high fidelity.", icon: FaImage, category: "Lifestyle" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Professional_Makeup_Generator.webp", name: "AI Professional Makeup Generator", description: "Try on hundreds of makeup looks virtually.", icon: FaHandSparkles, category: "Lifestyle" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Flash_Cards.webp", name: "AI Flash Cards", description: "Turn any text or PDF into pedagogical flashcards.", icon: FaFileAlt, category: "Education" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Group_Photo.webp", name: "AI Group Photo", description: "Seamlessly combine individual portraits into a group photo.", icon: FaImage, category: "Creative" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Tattoo_Try_On.webp", name: "AI Tattoo Try-On", description: "Visualize tattoos on your body before getting inked.", icon: FaHandSparkles, category: "Lifestyle" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Hair_Style_Simulator.webp", name: "AI Hair Style Simulator", description: "Try on new haircuts and colors with zero commitment.", icon: FaHandSparkles, category: "Lifestyle" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Kids_to_Adult_Prediction.webp", name: "AI Kids-to-Adult Prediction", description: "Ever wonder what your kid will look like as an adult?", icon: FaImage, category: "Lifestyle" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Room_Declutter.webp", name: "AI Room Declutter", description: "Instantly clean up messy room photos for listings.", icon: FaHome, category: "Real Estate" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Fitness_Body_Simulator.webp", name: "AI Fitness Body Simulator", description: "Visualize your fitness goals on your own body.", icon: FaImage, category: "Lifestyle" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Pet_Portrait.webp", name: "AI Pet Portrait", description: "Elegant, artistic portraits for your beloved pets.", icon: FaPaw, category: "Lifestyle" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Kissing_Video_Generator.webp", name: "AI Kissing Video Generator", description: "Expressive AI video generation for romantic moments.", icon: FaVideo, category: "Creative" },
  { thumbnail: "https://cdn.muapi.ai/apps/Chat_with_PDF.webp", name: "Chat with PDF", description: "Ask questions and extract data from massive PDF files.", icon: FaFileAlt, category: "Productivity" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Travel_Studio.png", name: "AI Travel Studio", description: "Create stunning travel posters and visuals from prompts.", icon: FaMapMarkerAlt, category: "Lifestyle" },
  { thumbnail: "https://cdn.muapi.ai/apps/Prompt_Architect.webp", name: "Prompt Architect", description: "Refine and optimize complex prompts for high-tier AI models.", icon: FaMagic, category: "Creative" },
  { thumbnail: "https://cdn.muapi.ai/apps/ClearMark_AI.webp", name: "ClearMark AI", description: "Automated watermark removal and brand cleanup for assets.", icon: FaImage, category: "Business" },
  { thumbnail: "https://cdn.muapi.ai/apps/PlantVision_AI.webp", name: "PlantVision AI", description: "Identify plants and generate gardening care guides.", icon: FaHandSparkles, category: "Lifestyle" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Wedding_Photo.png", name: "AI Wedding Photo", description: "Cinematic wedding photography enhancements and filters.", icon: FaImage, category: "Lifestyle" },
  { thumbnail: "https://cdn.muapi.ai/apps/User_Account_Registration_Form.webp", name: "User Account Registration Form", description: "Beautiful, conversion-optimized signup flows.", icon: FaBriefcase, category: "Development" },
  { thumbnail: "https://cdn.muapi.ai/apps/Social_Post.webp", name: "Social Post", description: "AI-generated social media scheduling and copy creator.", icon: FaBriefcase, category: "Marketing" },
  { thumbnail: "https://cdn.muapi.ai/apps/MagicSelf_AI.webp", name: "MagicSelf AI", description: "The ultimate AI selfie and avatar generation engine.", icon: FaMagic, category: "Creative" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Resume_Builder.webp", name: "AI Resume Builder", description: "Craft the perfect, ATS-friendly resume in seconds.", icon: FaFileAlt, category: "Productivity" },
  { thumbnail: "https://cdn.muapi.ai/apps/GEO_Checker.webp", name: "GEO Checker", description: "AI-powered location tagging and geodata validation.", icon: FaMapMarkerAlt, category: "Business" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Character_Studio.webp", name: "AI Character Studio", description: "Consistent character design for animators and writers.", icon: FaUserTie, category: "Creative" },
  { thumbnail: "https://cdn.muapi.ai/apps/Luxury_Hair_Studio.webp", name: "Luxury Hair Studio", description: "High-end hair visualization for top-tier salons.", icon: FaHandSparkles, category: "Lifestyle" },
  { thumbnail: "https://cdn.muapi.ai/apps/ProFlow_Plumbing.webp", name: "ProFlow Plumbing", description: "AI scheduling and diagnostics for plumbing services.", icon: FaHome, category: "Services" },
  { thumbnail: "https://cdn.muapi.ai/apps/Solace_AI.webp", name: "Solace AI", description: "Empathetic AI assistant for mental well-being support.", icon: FaHandSparkles, category: "Health" },
  { thumbnail: "https://cdn.muapi.ai/apps/ReLive_AI.webp", name: "ReLive AI", description: "Immersive memory and historical visualization engine.", icon: FaHandSparkles, category: "Creative" },
  { thumbnail: "https://cdn.muapi.ai/apps/AI_Chiropractic_Service.webp", name: "AI Chiropractic Service", description: "Postural analysis and exercise recommendation AI.", icon: FaUserInjured, category: "Health" },
  { thumbnail: "https://cdn.muapi.ai/apps/Tabla___ReserveAI.webp", name: "Tabla - ReserveAI", description: "Intelligent table reservation engine for restaurants.", icon: FaBuilding, category: "Services" },
  { thumbnail: "https://cdn.muapi.ai/apps/Dental_ReserveAI.webp", name: "Dental ReserveAI", description: "Smart dental appointment and follow-up management.", icon: FaStethoscope, category: "Health" },
  { thumbnail: "https://cdn.muapi.ai/apps/CounselMate.webp", name: "CounselMate", description: "Legal research and document drafting aid for lawyers.", icon: FaBalanceScale, category: "Legal" },
  { thumbnail: "https://cdn.muapi.ai/apps/Intelligent_Real_Estate_Agent.webp", name: "Intelligent Real Estate Agent", description: "Automate leads and property matches with AI agents.", icon: FaHome, category: "Real Estate" },
  { thumbnail: "https://cdn.muapi.ai/apps/Fixera.webp", name: "Fixera", description: "Home repair diagnosis and pro-finding ecosystem.", icon: FaHome, category: "Services" },
  { thumbnail: "https://cdn.muapi.ai/apps/Velora___Yoga_AI.webp", name: "Velora - Yoga AI", description: "Personalized AI yoga and posture guidance engine.", icon: FaHandSparkles, category: "Health" },
  { thumbnail: "https://cdn.muapi.ai/apps/Nova_AssuranceAI.webp", name: "Nova AssuranceAI", description: "Smart insurance quote and claim processing assistant.", icon: FaBalanceScale, category: "Legal" },
  { thumbnail: "https://cdn.muapi.ai/apps/TurboGlow_Auto_Spa.webp", name: "TurboGlow Auto Spa", description: "AI booking and customization for luxury auto detailing.", icon: FaCar, category: "Services" },
  { thumbnail: "https://cdn.muapi.ai/apps/Paws___Pals.webp", name: "Paws & Pals", description: "AI-powered pet care and walking coordination hub.", icon: FaPaw, category: "Lifestyle" },
  { thumbnail: "https://cdn.muapi.ai/apps/Vertex_Tax_Strategy.webp", name: "Vertex Tax Strategy", description: "Intelligent tax planning and deduction spotting AI.", icon: FaBalanceScale, category: "Business" },
  { thumbnail: "https://cdn.muapi.ai/apps/LedgerSync.webp", name: "LedgerSync", description: "Automated bookkeeping and financial reconciliations.", icon: FaBriefcase, category: "Business" },
  { thumbnail: "https://cdn.muapi.ai/apps/Nova_Care_Clinic.webp", name: "Nova Care Clinic", description: "Patient scheduling and medical intake automation.", icon: FaStethoscope, category: "Health" },
  { thumbnail: "https://cdn.muapi.ai/apps/Opulent_Drive.webp", name: "Opulent Drive", description: "Luxury car rental and fleet management AI.", icon: FaCar, category: "Services" },
  { thumbnail: "https://cdn.muapi.ai/apps/ProFix_Auto.webp", name: "ProFix Auto", description: "Engine diagnostics and preventive maintenance alerts.", icon: FaCar, category: "Services" },
  { thumbnail: "https://cdn.muapi.ai/apps/TowMate.webp", name: "TowMate", description: "Smart roadside assistance and dispatch coordination.", icon: FaTruck, category: "Services" },
  { thumbnail: "https://cdn.muapi.ai/apps/SwiftLink_Logistics.webp", name: "SwiftLink Logistics", description: "AI route optimization and fleet tracking system.", icon: FaTruck, category: "Services" },
  { thumbnail: "https://cdn.muapi.ai/apps/Lumea_Residence.webp", name: "Lumea Residence", description: "Smart home property management and tenant portal.", icon: FaHome, category: "Real Estate" }
];

export default function AppsStudio({ apiKey }) {
  const [selectedApp, setSelectedApp] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestedApps, setRequestedApps] = useState([]);

  useEffect(() => {
    if (apiKey) {
      getAppInterests(apiKey)
        .then(setRequestedApps)
        .catch(err => console.error("Error fetching interests:", err));
    }
  }, [apiKey]);

  const handleRequestAccess = async () => {
    if (!selectedApp || !apiKey) return;
    
    setIsRequesting(true);
    try {
      await registerAppInterest(apiKey, selectedApp.name);
      setRequestedApps(prev => [...prev, selectedApp.name]);
      toast.success("Got it! We'll send you the template details shortly.");
      setTimeout(() => setSelectedApp(null), 1500);
    } catch (error) {
      console.error(error);
      toast.error("Failed to register interest. Please try again later.");
    } finally {
      setIsRequesting(false);
    }
  };

  const renderAppCard = (app, isDummy = false, index = 0) => {
    // Premium Vibrant Gradients for placeholders
    const gradients = [
      "from-blue-600/20 to-indigo-600/20",
      "from-purple-600/20 to-pink-600/20",
      "from-amber-500/20 to-orange-600/20",
      "from-emerald-500/20 to-teal-600/20",
      "from-rose-500/20 to-red-600/20",
      "from-cyan-500/20 to-blue-600/20",
    ];
    const cardGradient = gradients[index % gradients.length];
    
    return (
      <div 
        key={app.name}
        className="group bg-[#0a0a0a] border border-white/5 rounded-lg flex flex-col overflow-hidden transition-all duration-300 hover:border-white/10 hover:bg-[#0f0f0f] hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1"
      >
        {/* Thumbnail Section */}
        <div className="relative h-44 w-full overflow-hidden bg-white/5">
          {app.thumbnail ? (
            <img
              src={app.thumbnail}
              alt={app.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${cardGradient} transition-colors group-hover:scale-110 duration-700`}>
              <app.icon className={`text-4xl opacity-20 group-hover:opacity-40 transition-opacity text-white`} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        </div>

        {/* Content Section */}
        <div className="p-5 flex flex-col flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg text-[#d9ff00] border border-white/5 group-hover:border-white/10 transition-colors">
              <app.icon />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white uppercase tracking-tight truncate">{app.name}</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{app.category || 'Template'}</p>
            </div>
          </div>
          
          <p className="text-xs text-white/50 leading-relaxed font-medium line-clamp-2 min-h-[2.5rem]">{app.description}</p>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {isDummy ? (
              <>
                <button
                  onClick={() => setSelectedApp(app)}
                  className="flex-1 py-2 bg-white/5 text-white rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 transition-all border border-white/5 active:scale-95"
                >
                  <FaGithub className="text-xs" />
                  Github
                </button>
                <button
                  onClick={() => setSelectedApp(app)}
                  className="flex-1 py-2 bg-[#d9ff00]/10 text-[#d9ff00] rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#d9ff00]/20 transition-all border border-[#d9ff00]/20 active:scale-95"
                >
                  <FaExternalLinkAlt className="text-[9px]" />
                  Demo
                </button>
              </>
            ) : (
              <>
                <a
                  href={app.repo || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-white/5 text-white rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 transition-all border border-white/5 active:scale-95"
                >
                  <FaGithub className="text-xs" />
                  Github
                </a>
                <a
                  href={app.hosted || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-[#d9ff00]/10 text-[#d9ff00] rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#d9ff00]/20 transition-all border border-[#d9ff00]/20 active:scale-95"
                >
                  <FaExternalLinkAlt className="text-[9px]" />
                  Demo
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col items-center bg-[#030303] overflow-y-auto custom-scrollbar relative">
      <Toaster position="bottom-right" reverseOrder={false} />
      
      <div className="flex flex-col gap-10 items-center w-full max-w-7xl pt-12 pb-24 px-6">
        
        {/* Header Section */}
        <div className="text-center space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#d9ff00]/10 border border-[#d9ff00]/20 rounded-full">
            <FaDollarSign className="text-[#d9ff00] text-xs" />
            <span className="text-[10px] font-black text-[#d9ff00] uppercase tracking-widest">Revenue-Ready Templates</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter leading-[0.9]">
            LAUNCH AN AI APP.<br />START EARNING TODAY.
          </h1>
          <p className="text-white/40 text-sm font-medium leading-relaxed max-w-xl mx-auto">
            Each template is a fully-functional, Stripe-integrated AI SaaS you can deploy in minutes.
            Charge your users, keep the revenue — muapi handles the AI infrastructure.
          </p>
        </div>

        {/* Monetization Steps */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: FaRocket,
              step: "01",
              title: "Deploy in Minutes",
              body: "Fork the open-source template, add your muapi key, and push to Vercel. No backend setup needed."
            },
            {
              icon: FaCreditCard,
              step: "02",
              title: "Collect Payments",
              body: "Stripe is pre-wired. Set your own pricing — one-time credits, subscriptions, or pay-per-use."
            },
            {
              icon: FaDollarSign,
              step: "03",
              title: "Keep the Revenue",
              body: "Payments go straight to your Stripe account. You own the product, the brand, and the profits."
            }
          ].map(({ icon: Icon, step, title, body }) => (
            <div key={step} className="flex items-start gap-4 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/5 flex items-center justify-center text-[#d9ff00] border border-white/5">
                <Icon className="text-lg" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Step {step}</p>
                <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
                <p className="text-xs text-white/40 leading-relaxed font-medium">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full pt-8">
          {templateApps.map((app, index) => renderAppCard(app, false, index))}
          {dummyAppsData.map((app, index) => renderAppCard(app, true, index + templateApps.length))}
        </div>

        {/* Footer Accent */}
        <div className="pt-24 pb-12 flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5">
            <span className="block w-1.5 h-1.5 rounded-full bg-[#d9ff00] animate-pulse" />
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Muapi Ecosystem — More templates coming soon</span>
          </div>
        </div>
      </div>

      {/* Get Template Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedApp(null)} />
          <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-2xl p-8 space-y-8 animate-scale-up shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-[28px] bg-[#d9ff00]/10 border border-[#d9ff00]/20 flex items-center justify-center text-4xl text-[#d9ff00] mb-2">
                <selectedApp.icon />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                Deploy {selectedApp.name}
              </h2>
              <p className="text-sm font-medium text-white/40 leading-relaxed px-4">
                Enter your details and we&apos;ll send you the <b>{selectedApp.name}</b> template along with setup instructions so you can deploy and start earning immediately.
              </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleRequestAccess}
                disabled={isRequesting}
                className="w-full py-4 bg-[#d9ff00] text-black rounded-md text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#d9ff00]/90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isRequesting ? 'Sending Details...' : 'Get Template'}
              </button>
              <button 
                onClick={() => setSelectedApp(null)}
                className="w-full py-4 bg-white/5 border border-white/10 text-white/60 rounded-md text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}

---
title: Higgsfield AI Design System
strategy: committed
primary_color: "oklch(30% 25% 270deg)"
secondary_color: "oklch(35% 18% 300deg)"
accent_color: "oklch(35% 18% 300deg)"
background: "oklch(10% 0.005 270deg)"
---

# Overview
Higgsfield AI design system using OKLCH color space with committed color strategy.
Professional cinematic dark theme for video editing applications.

# Colors
- **Primary**: oklch(30% 25% 270deg) - Deep Indigo
- **Secondary**: oklch(35% 18% 300deg) - Complementary Purple  
- **Accent**: oklch(35% 18% 300deg) - Purple Accent
- **Danger**: oklch(55% 25% 20deg) - Red
- **Backgrounds**: oklch(10-22% 0.005-0.01 270deg) - Indigo-tinted dark surfaces
- **Text**: #ffffff (primary), #e4e4e7 (secondary), #71717a (muted)

# Typography
- **Font Family**: Inter, system-ui, -apple-system, sans-serif
- **Scale Ratio**: 1.25 (minor third)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 900 (black)
- **Line Heights**: 1.5 (body), 1.6 (headings)

# Components
- **Buttons**: `.btn-primary` (bg-primary), `.btn-secondary` (bg-white/5)
- **Cards**: `.glass-card` with backdrop-blur and oklch backgrounds
- **Inputs**: bg-black/30, border-white/10, focus: border-primary
- **Modals**: `.modal` with bg-glass and backdrop-blur

# Patterns
- **Spacing**: 0.5rem (8px) base unit, varied multiples for visual rhythm
- **Radius**: 6px (sm), 10px (md), 16px (lg), 24px (xl), 9999px (full)
- **Shadows**: oklch-based glow effects with 0.4 opacity
- **Transitions**: 150ms/300ms with cubic-bezier(0.4, 0, 0.2, 1)
- **Micro-interactions**: hover:scale-105, active:scale-95, translateY(-2px)

# Motion
- **Easing**: cubic-bezier(0.25, 0.46, 0.45, 0.94) - exponential ease-out
- **Reduced Motion**: @media (prefers-reduced-motion: reduce) disables all animations
- **Performance**: will-change: transform, opacity for animated elements
- **Loading**: spin-delight animation, dots animation for messages

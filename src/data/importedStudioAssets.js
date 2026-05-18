// Marketing Studio Asset Manifest
// Source: packages/studio/src/components/MarketingStudio.jsx from Open-Generative-AI

export const MARKETING_STUDIO_ASSETS = {
  avatar: [
    { id: "aa252283-8591-4d14-91a8-41ce54187992", name: "Priya", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Priya.webp" },
    { id: "ba6c9b18-f79c-4dab-9649-88a181d0a038", name: "Elena", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Elena.webp" },
    { id: "30e2cadd-987c-4a7a-81c3-094d4fb3a65e", name: "Kai", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Kai.webp" },
    { id: "fbed59e1-4b8d-4625-9140-ef2044e0be72", name: "Sora", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Sora.webp" },
    { id: "bcd9e6ee-c000-48e6-9f4b-a20fc2a674f7", name: "Minji", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Minji.webp" },
    { id: "1da384ed-3856-45e4-bf4c-a496c7aa95ff", name: "Margot", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Margot.webp" },
    { id: "b799c8f5-fb6e-4905-b33b-cdefac153ec3", name: "Niko", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Niko.webp" },
    { id: "b6971dd4-55fa-4e64-b318-392b16504284", name: "Jin", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Jin.webp" }
  ],
  ugc: [
    { id: 1, name: "UGC", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/ugc.mp4" },
    { id: 2, name: "Tutorial", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/ugc_how_to.mp4" },
    { id: 3, name: "Unboxing", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/ugc_unboxing.mp4" },
    { id: 4, name: "Hyper Motion", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/hyper-motion-mini.mp4" },
    { id: 5, name: "Product Review", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/product_review.mp4" },
    { id: 6, name: "TV Spot", url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/tv-spot-mini.mp4" }
  ]
};

export const MARKETING_STUDIO_OPTIONS = {
  ratio: ["9:16", "3:4", "4:3", "16:9", "1:1"],
  res: ["720p", "1080p"],
  duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
};

export function getDefaultAvatar() {
  return MARKETING_STUDIO_ASSETS.avatar[0];
}

export function getAvatarByName(name) {
  return MARKETING_STUDIO_ASSETS.avatar.find(a => a.name === name) || getDefaultAvatar();
}

export function getVideoFormatByName(name) {
  return MARKETING_STUDIO_ASSETS.ugc.find(u => u.name === name) || MARKETING_STUDIO_ASSETS.ugc[0];
}

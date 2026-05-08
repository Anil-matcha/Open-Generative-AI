import { workflowCategories } from './workflowCategories.js';

const today = '2026-04-28';
const id = 'REPLACE_WITH_MUAPI_WORKFLOW_ID';
const inputSets = {
  product: [
    { key: 'product_image', label: 'Product Image URL', type: 'url', required: true },
    { key: 'prompt', label: 'Prompt', type: 'textarea', required: true },
    { key: 'brand_style', label: 'Brand Style', type: 'text', required: false },
    { key: 'motion_direction', label: 'Motion Direction', type: 'text', required: false },
  ],
  fashion: [
    { key: 'model_image', label: 'Model Image URL', type: 'url', required: true },
    { key: 'product_image', label: 'Clothing/Product Image URL', type: 'url', required: true },
    { key: 'prompt', label: 'Prompt', type: 'textarea', required: true },
    { key: 'style', label: 'Style', type: 'text', required: false },
  ],
  photo: [
    { key: 'source_image', label: 'Source Image URL', type: 'url', required: true },
    { key: 'edit_instructions', label: 'Edit Instructions', type: 'textarea', required: true },
  ],
  interior: [
    { key: 'room_image', label: 'Room Image URL', type: 'url', required: true },
    { key: 'style', label: 'Style', type: 'text', required: true },
    { key: 'design_instructions', label: 'Design Instructions', type: 'textarea', required: true },
  ],
  character: [
    { key: 'source_image', label: 'Source Image URL', type: 'url', required: true },
    { key: 'scene_prompt', label: 'Scene Prompt', type: 'textarea', required: true },
    { key: 'motion_style', label: 'Motion Style', type: 'text', required: false },
  ],
  design: [
    { key: 'source_image', label: 'Source/Logo/Product Image URL', type: 'url', required: true },
    { key: 'design_direction', label: 'Design Direction', type: 'textarea', required: true },
  ]
};

const mk = (title, slug, category, description, type, outputType, inputs) => ({ id, slug, title, category, updatedAt: today, description, type, outputType, access: 'pro', inputs });
export const workflowRegistry = [
mk('Product Video Ad Maker','product-video-ad-maker',workflowCategories[0],'Create cinematic product video ads.','image-to-video','video',inputSets.product),
mk('AI Wig Try-On: Realistic Face Integration for Mannequin Displays','ai-wig-try-on-realistic-face-integration-for-mannequin-displays',workflowCategories[1],'Try wig styles on mannequins with facial realism.','image-edit','image',inputSets.fashion),
mk('AI-Driven Product Showcase Video Creation','ai-driven-product-showcase-video-creation',workflowCategories[0],'Build polished showcase videos from product inputs.','image-to-video','video',inputSets.product),
mk('Jewelry Product Video','jewelry-product-video',workflowCategories[0],'Generate jewelry ad videos with premium visuals.','image-to-video','video',inputSets.product),
mk('Product redesigner','product-redesigner',workflowCategories[0],'Redesign product look and finish from reference assets.','image-edit','image',inputSets.product),
mk('Influencer Content Package Generator','influencer-content-package-generator',workflowCategories[0],'Generate influencer-ready ad asset packages.','multimodal','image/video',inputSets.product),
mk('Product Photoshoot and Video Generation','product-photoshoot-and-video-generation',workflowCategories[0],'Create both product photos and promo clips.','multimodal','image/video',inputSets.product),
mk('Photography Editing','photography-editing',workflowCategories[2],'Apply professional photography retouching edits.','image-edit','image',inputSets.photo),
mk('Protrait Photography in Streets','protrait-photography-in-streets',workflowCategories[2],'Generate stylized street portrait transformations.','image-edit','image',inputSets.photo),
mk('Virtual Try On','virtual-try-on',workflowCategories[1],'Virtual try-on for apparel and products.','image-edit','image',inputSets.fashion),
mk('Virtual Try On','virtual-try-on-2',workflowCategories[1],'Secondary virtual try-on pipeline variant.','image-edit','image',inputSets.fashion),
mk('Fashion Video Generator','fashion-video-generator',workflowCategories[1],'Create runway and social-ready fashion videos.','image-to-video','video',inputSets.fashion),
mk('Professional Fashion Headshots','professional-fashion-headshots',workflowCategories[1],'Produce premium fashion headshots.','image-edit','image',inputSets.fashion),
mk('Virtual Try-On for Indian Ethnic Wear','virtual-try-on-for-indian-ethnic-wear',workflowCategories[1],'Specialized try-on for Indian ethnic wear.','image-edit','image',inputSets.fashion),
mk('Giant Product VFX Advertisement Creation','giant-product-vfx-advertisement-creation',workflowCategories[0],'Create giant-product VFX ad scenes.','image-to-video','video',inputSets.product),
mk('AI-Powered Couple Photo Grid Creator','couple-photo-grid-creator',workflowCategories[2],'Build romantic couple photo grid compositions.','image-edit','image',inputSets.photo),
mk('Multi-Angle Photo Reshoot','multi-angle-photo-reshoot',workflowCategories[2],'Generate multi-angle reshoots from one image.','image-edit','image',inputSets.photo),
mk('AI Interior Designer home-decor','ai-interior-designer-home-decor',workflowCategories[3],'AI home decor redesign and staging.','image-edit','image',inputSets.interior),
mk('AI Interior Makeover','ai-interior-makeover',workflowCategories[3],'Complete interior transformation visualizations.','image-edit','image',inputSets.interior),
mk('AI Home Decor Designer','ai-home-decor-designer',workflowCategories[3],'Generate home decor concepts from room photos.','image-edit','image',inputSets.interior),
mk('AI Room Style Transformation','ai-room-style-transformation',workflowCategories[3],'Apply style transfer to room imagery.','image-edit','image',inputSets.interior),
mk('Virtual Furniture Staging','virtual-furniture-staging',workflowCategories[3],'Stage rooms with virtual furniture sets.','image-edit','image',inputSets.interior),
mk('AI Real Estate Photographer','ai-real-estate-photographer',workflowCategories[3],'Real-estate photo enhancement and stylization.','image-edit','image',inputSets.interior),
mk('Furniture Photography Studio','furniture-photography-studio',workflowCategories[3],'Studio-like furniture product photography generation.','image-edit','image',inputSets.interior),
mk('Furniture campaign Generator','furniture-campaign-generator',workflowCategories[3],'Generate furniture campaign creative packs.','multimodal','image/video',inputSets.interior),
mk('AI-Driven 3D Floor Plan Rendering','ai-driven-3d-floor-plan-rendering',workflowCategories[3],'Render 3D floor-plan visuals from instructions.','image-gen','image',inputSets.interior),
mk('AI Interior Design Visualizer','ai-interior-design-visualizer',workflowCategories[3],'Visualize interior design options quickly.','image-edit','image',inputSets.interior),
mk('AI Action Figure Generator','ai-action-figure-generator',workflowCategories[4],'Generate stylized action figure characters.','image-gen','image',inputSets.character),
mk('AI Product 360° Video - river','ai-product-360-video-river',workflowCategories[0],'Create rotating 360 product videos.','image-to-video','video',inputSets.product),
mk('Indie Anime Maker','indie-anime-maker',workflowCategories[4],'Create indie anime visuals and motion.','image-to-video','video',inputSets.character),
mk('Character story Video','character-story-video',workflowCategories[4],'Generate character-led story videos.','image-to-video','video',inputSets.character),
mk('Monkey video generator','monkey-video-generator',workflowCategories[4],'Generate viral monkey-style character clips.','image-to-video','video',inputSets.character),
mk('Viral Talking Baby AI Video Maker','viral-talking-baby-ai-video-maker',workflowCategories[4],'Create talking baby viral content.','image-to-video','video',inputSets.character),
mk('AI Personalized Soccer Collectable Card Maker','ai-personalized-soccer-collectable-card-maker',workflowCategories[5],'Generate personalized collectible soccer cards.','image-gen','image',inputSets.design),
mk('AI Sculpture Maker','ai-sculpture-maker',workflowCategories[5],'Generate sculpture concepts and variations.','image-gen','image',inputSets.design),
mk('Selfie with Celebrities','selfie-with-celebrities',workflowCategories[4],'Create celebrity selfie composites.','image-edit','image',inputSets.character),
mk('AI-Powered Giant Product Showcase Animation','ai-powered-giant-product-showcase-animation',workflowCategories[0],'Animate giant product showcase scenes.','image-to-video','video',inputSets.product),
mk('Cartoon Style Dance Animation Creation','cartoon-style-dance-animation-creation',workflowCategories[4],'Generate cartoon dance animations.','image-to-video','video',inputSets.character),
mk('Logo transformer','logo-transformer',workflowCategories[5],'Transform logos into branded variations.','image-edit','image',inputSets.design),
mk('AI Book Cover Design','ai-book-cover-design',workflowCategories[5],'Create AI-generated book cover designs.','image-gen','image',inputSets.design),
mk('AI-Driven Product Advertisement Creation','ai-driven-product-advertisement-creation',workflowCategories[0],'End-to-end product ad creative generation.','multimodal','image/video',inputSets.product),
mk('Kinetic Recall Effect','kinetic-recall-effect',workflowCategories[4],'Generate kinetic recall-style effects.','image-to-video','video',inputSets.character),
mk('AI-Driven Product Mockup Creation with Nano Banana Pro','ai-driven-product-mockup-creation-with-nano-banana-pro',workflowCategories[5],'Create polished product mockups.','image-edit','image',inputSets.design),
mk('AI-Powered Couple Photo Grid Creator','couple-photo-grid-creator-2',workflowCategories[2],'Alternate couple photo grid generator variant.','image-edit','image',inputSets.photo),
];

export const workflowRegistryBySlug = Object.fromEntries(workflowRegistry.map(w => [w.slug, w]));

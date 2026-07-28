"use client";

import { useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { generateImage } from "../muapi.js";
import { formatErrorMessage } from "../utils/formatError.js";

const CDN = "https://cdn.muapi.ai/influencer";

// â”€â”€ Default image generation model â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const INFLUENCER_MODEL = "nano-banana-pro";

const TABS_CONFIG = {
  face: {
    label: "Face",
    subcategories: [
      {
        id: "character_type",
        label: "Character Type",
        options: [
          { id: "human",             label: "Human",    img: `${CDN}/character_type_human.webp`,             promptVal: "human features" },
          { id: "elf",               label: "Elf",      img: `${CDN}/character_type_elf.webp`,               promptVal: "elf with pointed ears" },
          { id: "alien",             label: "Alien",    img: `${CDN}/character_type_alien.webp`,             promptVal: "alien creature" },
          { id: "amphibian",         label: "Amphibian",img: `${CDN}/character_type_amphibian.webp`,         promptVal: "amphibian humanoid" },
          { id: "reptile",           label: "Reptile",  img: `${CDN}/character_type_reptile.webp`,           promptVal: "reptilian creature" },
          { id: "mantis",            label: "Mantis",   img: `${CDN}/character_type_mantis.webp`,            promptVal: "mantis hybrid character" },
          { id: "bee",               label: "Bee",      img: `${CDN}/character_type_bee.webp`,               promptVal: "bee insect hybrid character" },
          { id: "octopus",           label: "Octopus",  img: `${CDN}/character_type_octopus.webp`,           promptVal: "aquatic octopus hybrid" },
          { id: "crocodile",         label: "Crocodile",img: `${CDN}/character_type_crocodile.webp`,         promptVal: "crocodile humanoid" },
          { id: "iguana",            label: "Iguana",   img: `${CDN}/character_type_iguana.webp`,            promptVal: "iguana humanoid" },
          { id: "lizard",            label: "Lizard",   img: `${CDN}/character_type_lizard.webp`,            promptVal: "lizard humanoid" },
          { id: "rhinoceros_beetle", label: "Beetle",   img: `${CDN}/character_type_rhinoceros_beetle.webp`, promptVal: "rhinoceros beetle humanoid" },
          { id: "ant",               label: "Ant",      img: `${CDN}/character_type_ant.webp`,               promptVal: "ant hybrid character" },
        ],
      },
      {
        id: "gender",
        label: "Gender",
        options: [
          { id: "female",      label: "Female",      img: `${CDN}/gender_female.webp`,      promptVal: "female" },
          { id: "male",        label: "Male",        img: `${CDN}/gender_male.webp`,        promptVal: "male" },
          { id: "non_binary",  label: "Non-binary",  img: `${CDN}/gender_non_binary.webp`,  promptVal: "non-binary character" },
          { id: "trans_man",   label: "Trans Man",   img: `${CDN}/gender_trans_man.webp`,   promptVal: "transgender man" },
          { id: "trans_woman", label: "Trans Woman", img: `${CDN}/gender_trans_woman.webp`, promptVal: "transgender woman" },
        ],
      },
      {
        id: "ethnicity_origin_base",
        label: "Ethnicity / Origin",
        options: [
          { id: "african",        label: "African",       img: `${CDN}/ethnicity_origin_base_african.webp`,                                  promptVal: "african heritage" },
          { id: "asian",          label: "Asian",         img: `${CDN}/ethnicity_origin_base_recreate_in_east_asian_supermodel__korea.webp`, promptVal: "East Asian supermodel, Korean K-Pop Idol phenotype" },
          { id: "european",       label: "European",      img: `${CDN}/ethnicity_origin_base_scandinavian_supermodel.webp`,                  promptVal: "Scandinavian Supermodel" },
          { id: "indian",         label: "Indian",        img: `${CDN}/ethnicity_origin_base_indian.webp`,                                   promptVal: "south asian indian heritage" },
          { id: "middle_eastern", label: "Middle Eastern",img: `${CDN}/ethnicity_origin_base_middle_eastern.webp`,                           promptVal: "middle eastern heritage" },
          { id: "mixed",          label: "Mixed",         img: `${CDN}/ethnicity_origin_base_mixed.webp`,                                    promptVal: "multiracial mixed heritage" },
        ],
      },
      {
        id: "eye_color",
        label: "Eye Color",
        options: [
          { id: "eye_blue",       label: "Blue",         img: `${CDN}/eye_color_eye_blue.webp`,       promptVal: "striking blue eyes" },
          { id: "eye_brown",      label: "Brown",        img: `${CDN}/eye_color_eye_brown.webp`,      promptVal: "warm brown eyes" },
          { id: "eye_green",      label: "Green",        img: `${CDN}/eye_color_eye_green.webp`,      promptVal: "emerald green eyes" },
          { id: "eye_amber",      label: "Amber",        img: `${CDN}/eye_color_eye_amber.webp`,      promptVal: "amber eyes" },
          { id: "eye_grey",       label: "Grey",         img: `${CDN}/eye_color_eye_grey.webp`,       promptVal: "grey eyes" },
          { id: "eye_red",        label: "Red",          img: `${CDN}/eye_color_eye_red.webp`,        promptVal: "red eyes" },
          { id: "eye_purple",     label: "Purple",       img: `${CDN}/eye_color_eye_purple.webp`,     promptVal: "violet purple eyes" },
          { id: "eye_black",      label: "Black",        img: `${CDN}/eye_color_eye_black.webp`,      promptVal: "black eyes" },
          { id: "eye_deep_brown", label: "Deep Brown",   img: `${CDN}/eye_color_eye_deep_brown.webp`, promptVal: "deep dark brown eyes" },
          { id: "eye_white",      label: "White",        img: `${CDN}/eye_color_eye_white.webp`,      promptVal: "white eyes" },
          { id: "eye_black_void", label: "Solid Black",  img: `${CDN}/eye_color_eye_black_void.webp`, promptVal: "solid black void eyes" },
          { id: "eye_white_void", label: "Blind / Empty",img: `${CDN}/eye_color_eye_white_void.webp`, promptVal: "blind empty white eyes" },
        ],
      },
      {
        id: "eyes_type",
        label: "Eye Type",
        options: [
          { id: "eyes_human",      label: "Human",     img: `${CDN}/eyes_type_eyes_human.webp`,      promptVal: "normal human eyes" },
          { id: "eyes_reptile",    label: "Reptile",   img: `${CDN}/eyes_type_eyes_reptile.webp`,    promptVal: "reptile slit-pupil eyes" },
          { id: "eyes_mechanical", label: "Mechanical",img: `${CDN}/eyes_type_eyes_mechanical.webp`, promptVal: "mechanical cyborg eyes" },
        ],
      },
      {
        id: "eyes_details",
        label: "Eye Features",
        options: [
          { id: "eyes_different_colors", label: "Heterochromia", img: `${CDN}/eyes_details_eyes_different_colors.webp`, promptVal: "heterochromia different eye colors" },
          { id: "eyes_blind",            label: "Blind Eye",     img: `${CDN}/eyes_details_eyes_blind.webp`,            promptVal: "one cloudy blind eye" },
          { id: "eyes_scarred",          label: "Scarred Eye",   img: `${CDN}/eyes_details_eyes_scarred.webp`,          promptVal: "scar running across one eye" },
          { id: "eyes_glowing",          label: "Glowing Eye",   img: `${CDN}/eyes_details_eyes_glowing.webp`,          promptVal: "glowing magical eyes" },
        ],
      },
      {
        id: "mouth",
        label: "Mouth & Teeth",
        options: [
          { id: "mouth_small",           label: "Small Mouth",   img: `${CDN}/mouth_mouth_small.webp`,           promptVal: "small delicate mouth" },
          { id: "mouth_large",           label: "Large Mouth",   img: `${CDN}/mouth_mouth_large.webp`,           promptVal: "wide expressive mouth" },
          { id: "mouth_no_teeth",        label: "No Teeth",      img: `${CDN}/mouth_mouth_no_teeth.webp`,        promptVal: "no visible teeth" },
          { id: "mouth_different_teeth", label: "Unique Teeth",  img: `${CDN}/mouth_mouth_different_teeth.webp`, promptVal: "unusual tooth structure" },
          { id: "mouth_sharp_teeth",     label: "Sharp Teeth",   img: `${CDN}/mouth_mouth_sharp_teeth.webp`,     promptVal: "sharp predatory fangs" },
          { id: "mouth_forked_tongue",   label: "Forked Tongue", img: `${CDN}/mouth_mouth_forked_tongue.webp`,   promptVal: "reptilian forked tongue" },
          { id: "mouth_two_tongues",     label: "Two Tongues",   img: `${CDN}/mouth_mouth_two_tongues.webp`,     promptVal: "two separate tongues" },
        ],
      },
      {
        id: "ears",
        label: "Ears",
        options: [
          { id: "ears_human", label: "Human",     img: `${CDN}/ears_ears_human.webp`, promptVal: "normal human ears" },
          { id: "ears_elf",   label: "Elf Ears",  img: `${CDN}/ears_ears_elf.webp`,   promptVal: "pointed elf ears" },
          { id: "ears_no",    label: "No Ears",   img: `${CDN}/ears_ears_no.webp`,    promptVal: "no visible ears" },
          { id: "ears_wings", label: "Wing Ears", img: `${CDN}/ears_ears_wings.webp`, promptVal: "wing ears" },
        ],
      },
      {
        id: "horns",
        label: "Horns",
        options: [
          { id: "small_horns", label: "Small Horns", img: `${CDN}/horns_small_horns.webp`, promptVal: "small horns on forehead" },
          { id: "big_horns",   label: "Big Horns",   img: `${CDN}/horns_big_horns.webp`,   promptVal: "large curved horns" },
          { id: "antlers",     label: "Antlers",      img: `${CDN}/horns_antlers.webp`,      promptVal: "deer antlers on head" },
        ],
      },
      {
        id: "skin_conditions",
        label: "Skin Conditions",
        options: [
          { id: "condition_vitiligo",     label: "Vitiligo",     img: `${CDN}/skin_conditions_condition_vitiligo.webp`,     promptVal: "vitiligo skin condition" },
          { id: "condition_pigmentation", label: "Pigmentation", img: `${CDN}/skin_conditions_condition_pigmentation.webp`, promptVal: "hyperpigmentation" },
          { id: "condition_freckles",     label: "Freckles",     img: `${CDN}/skin_conditions_condition_freckles.webp`,     promptVal: "freckled skin" },
          { id: "condition_birthmarks",   label: "Birthmarks",   img: `${CDN}/skin_conditions_condition_birthmarks.webp`,   promptVal: "visible birthmarks" },
          { id: "condition_scars",        label: "Scars",        img: `${CDN}/skin_conditions_condition_scars.webp`,        promptVal: "scarred skin" },
          { id: "condition_burns",        label: "Burns",        img: `${CDN}/skin_conditions_condition_burns.webp`,        promptVal: "burn marks on skin" },
          { id: "condition_albinism",     label: "Albinism",     img: `${CDN}/skin_conditions_condition_albinism.webp`,     promptVal: "albinism pale white skin" },
          { id: "condition_cracked",      label: "Cracked Skin", img: `${CDN}/skin_conditions_condition_cracked.webp`,      promptVal: "cracked dry skin texture" },
          { id: "condition_wrinkled",     label: "Wrinkled",     img: `${CDN}/skin_conditions_condition_wrinkled.webp`,     promptVal: "wrinkled aged skin" },
        ],
      },
    ],
  },
  body: {
    label: "Body",
    subcategories: [
      {
        id: "face_skin_material",
        label: "Face Skin Material",
        options: [
          { id: "face_skin_human",     label: "Human Skin",  img: `${CDN}/face_skin_material_face_skin_human.webp`,     promptVal: "smooth human skin" },
          { id: "face_skin_scales",    label: "Scales",      img: `${CDN}/face_skin_material_face_skin_scales.webp`,    promptVal: "shimmering scales" },
          { id: "face_skin_fur",       label: "Fur",         img: `${CDN}/face_skin_material_face_skin_fur.webp`,       promptVal: "soft fur covered face" },
          { id: "face_skin_amphibian", label: "Amphibian",   img: `${CDN}/face_skin_material_face_skin_amphibian.webp`, promptVal: "smooth moist amphibian skin" },
          { id: "face_skin_fish",      label: "Fish Skin",   img: `${CDN}/face_skin_material_face_skin_fish.webp`,      promptVal: "iridescent fish scale skin" },
          { id: "face_skin_metallic",  label: "Metallic",    img: `${CDN}/face_skin_material_face_skin_metallic.webp`,  promptVal: "polished metallic skin" },
        ],
      },
      {
        id: "face_surface_pattern",
        label: "Skin Pattern",
        options: [
          { id: "face_pattern_solid",    label: "Solid",          img: `${CDN}/face_surface_pattern_face_pattern_solid.webp`,    promptVal: "solid color skin" },
          { id: "face_pattern_stripes",  label: "Stripes",        img: `${CDN}/face_surface_pattern_face_pattern_stripes.webp`,  promptVal: "exotic striped skin pattern" },
          { id: "face_pattern_spots",    label: "Spots",          img: `${CDN}/face_surface_pattern_face_pattern_spots.webp`,    promptVal: "dappled spotted skin" },
          { id: "face_pattern_chess",    label: "Chess",          img: `${CDN}/face_surface_pattern_face_pattern_chess.webp`,    promptVal: "checkerboard skin pattern" },
          { id: "face_pattern_veins",    label: "Veins",          img: `${CDN}/face_surface_pattern_face_pattern_veins.webp`,    promptVal: "translucent skin with neon veins" },
          { id: "face_pattern_gradient", label: "Gradient",       img: `${CDN}/face_surface_pattern_face_pattern_gradient.webp`, promptVal: "gradient skin coloring" },
          { id: "face_pattern_giraffe",  label: "Giraffe",        img: `${CDN}/face_surface_pattern_face_pattern_giraffe.webp`,  promptVal: "giraffe print skin markings" },
        ],
      },
      {
        id: "body_type",
        label: "Body Type",
        options: [
          { id: "body_slim",     label: "Slim",     img: `${CDN}/body_type_body_slim.webp`,     promptVal: "slim slender physique" },
          { id: "body_lean",     label: "Lean",     img: `${CDN}/body_type_body_lean.webp`,     promptVal: "lean toned physique" },
          { id: "body_athletic", label: "Athletic", img: `${CDN}/body_type_body_athletic.webp`, promptVal: "fit athletic body" },
          { id: "body_muscular", label: "Muscular", img: `${CDN}/body_type_body_muscular.webp`, promptVal: "strong muscular build" },
          { id: "body_curvy",    label: "Curvy",    img: `${CDN}/body_type_body_curvy.webp`,    promptVal: "curvy body type" },
          { id: "body_heavy",    label: "Heavy",    img: `${CDN}/body_type_body_heavy.webp`,    promptVal: "heavy set build" },
          { id: "body_skinny",   label: "Skinny",   img: `${CDN}/body_type_body_skinny.webp`,   promptVal: "very skinny thin build" },
        ],
      },
      {
        id: "left_arm",
        label: "Left Arm",
        options: [
          { id: "left_arm_normal",     label: "Normal",         img: `${CDN}/left_arm_left_arm_normal.webp`,                          promptVal: "normal left arm" },
          { id: "left_arm_cute",       label: "Cute Prosthetic",img: `${CDN}/left_arm_make_lefç^¸¶‰ËkºwµçCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠV@(€€€€€€€€€1PƒŠP	Õ¥±‘•È€¼=ÁÑ¥½¹ÌA…¹•°(€€€€€ƒŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠV@€¨½ô(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à™±•àµ½°ÜµlÌÈÁÁátÍ¡É¥¹¬´À‰½É‘•ÈµÈ‰½É‘•Èµİ¡¥Ñ”½lÀ¸Àİt‰œµlŒÄÄÄÄÄÅt½Ù•É™±½Üµ¡¥‘‘•¸ˆø((€€€€€€€ì¼¨	Õ¥±‘•È¡•…‘•È€¨½ô(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ‰•Ñİ••¸Áà´ĞÁä´Ì‰½É‘•Èµˆ‰½É‘•Èµİ¡¥Ñ”½lÀ¸ÀİtÍ¡É¥¹¬´Àˆø(€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áĞµlÄÍÁát™½¹Ğµ‰½±Ñ•áĞµİ¡¥Ñ”ÑÉ…­¥¹œµÑ¥¡Ğˆù	Õ¥±‘•Èğ½ÍÁ…¸ø(€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•ÑM•±•Ñ•‘=ÁÑ¥½¹Ì   ¤€ôøì(€€€€€€€€€€€€€½¹ÍĞ¥¹¥Ğ€ôíôì(€€€€€€€€€€€€€=‰©•Ğ¹Ù…±Õ•Ì¡Q	M}=9%¤¹™½É…  ¡Ñ…ˆ¤€ôø(€€€€€€€€€€€€€€€Ñ…ˆ¹ÍÕ‰…Ñ•½É¥•Ì¹™½É…  ¡ÍÕˆ¤€ôøì(€€€€€€€€€€€€€€€€€¥˜€¡ÍÕˆ¹½ÁÑ¥½¹Ìü¹±•¹Ñ €ø€À¤¥¹¥ÑmÍÕˆ¹¥‘t€ôÍÕˆ¹½ÁÑ¥½¹ÍlÁt¹¥ì(€€€€€€€€€€€€€€€ô¤(€€€€€€€€€€€€€€¤ì(€€€€€€€€€€€€€É•ÑÕÉ¸¥¹¥Ğì(€€€€€€€€€€€ô¤ ¤¥ô(€€€€€€€€€€€±…ÍÍ9…µ”ô‰Ñ•áĞµlÄÅÁátÑ•áĞµÉ…ä´ÔÀÀ¡½Ù•ÈéÑ•áĞµİ¡¥Ñ”ÑÉ…¹Í¥Ñ¥½¸µ½±½ÉÌ™½¹Ğµµ•‘¥Õ´ˆ(€€€€€€€€€€ø(€€€€€€€€€€€I•Í•Ğ(€€€€€€€€€€ğ½‰ÕÑÑ½¸ø(€€€€€€€€ğ½‘¥Øø((€€€€€€€ì¼¨Q…ˆÁ¥±±Ì€¨½ô(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à…À´ÄÁà´ÌÁä´È‰½É‘•Èµˆ‰½É‘•Èµİ¡¥Ñ”½lÀ¸ÀİtÍ¡É¥¹¬´Àˆø(€€€€€€€€€í=‰©•Ğ¹­•åÌ¡Q	M}=9%¤¹µ…À ¡­•ä¤€ôø€ (€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€­•äõí­•åô(€€€€€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•ÑÑ¥Ù•Q…ˆ¡­•ä¥ô(€€€€€€€€€€€€€±…ÍÍ9…µ”õí™±•à´ÄÁä´Ä¸ÔÉ½Õ¹‘•µ±œÑ•áĞµlÄÉÁát™½¹ĞµÍ•µ¥‰½±ÑÉ…¹Í¥Ñ¥½¸µ…±°€‘ì(€€€€€€€€€€€€€€€…Ñ¥Ù•Q…ˆ€ôôô­•ä(€€€€€€€€€€€€€€€€€€ü€‰‰œµİ¡¥Ñ”Ñ•áĞµ‰±…¬Í¡…‘½Üˆ(€€€€€€€€€€€€€€€€€€è€‰Ñ•áĞµÉ…ä´ÔÀÀ¡½Ù•ÈéÑ•áĞµİ¡¥Ñ”¡½Ù•Èé‰œµİ¡¥Ñ”½lÀ¸ÀÙtˆ(€€€€€€€€€€€€€õô(€€€€€€€€€€€€ø(€€€€€€€€€€€€€íQ	M}=9%m­•åt¹±…‰•±ô(€€€€€€€€€€€€ğ½‰ÕÑÑ½¸ø(€€€€€€€€€€¤¥ô(€€€€€€€€ğ½‘¥Øø((€€€€€€€ì¼¨MÕ‰…Ñ•½Éä½ÁÑ¥½¹ÌÍÉ½±°…É•„€¨½ô(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à´Ä½Ù•É™±½Üµäµ…ÕÑ¼À´ÌÍÁ…”µä´Ôˆø(€€€€€€€€€íQ	M}=9%m…Ñ¥Ù•Q…‰tü¹ÍÕ‰…Ñ•½É¥•Ìü¹µ…À ¡ÍÕ‰…Ğ¤€ôø€ (€€€€€€€€€€€€ñ‘¥Ø­•äõíÍÕ‰…Ğ¹¥‘ôø(€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áĞµlÄÁÁát™½¹Ğµ‰½±Ñ•áĞµÉ…ä´ÔÀÀÕÁÁ•É…Í”ÑÉ…­¥¹œµİ¥‘•ÍĞµˆ´ÈÁà´À¸Ôˆø(€€€€€€€€€€€€€€€íÍÕ‰…Ğ¹±…‰•±ô(€€€€€€€€€€€€€€ğ½Àø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É¥É¥µ½±Ì´Ì…À´Ä¸Ôˆø(€€€€€€€€€€€€€€€íÍÕ‰…Ğ¹½ÁÑ¥½¹Ìü¹µ…À ¡½ÁĞ¤€ôøì(€€€€€€€€€€€€€€€€€½¹ÍĞÍ•°€ôÍ•±•Ñ•‘=ÁÑ¥½¹ÍmÍÕ‰…Ğ¹¥‘t€ôôô½ÁĞ¹¥ì(€€€€€€€€€€€€€€€€€É•ÑÕÉ¸€ (€€€€€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€€€€€€€­•äõí½ÁĞ¹¥‘ô(€€€€€€€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôø¡…¹‘±•=ÁÑ¥½¹M•±•Ğ¡ÍÕ‰…Ğ¹¥°½ÁĞ¹¥¥ô(€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”õíÉ½ÕÀÉ•±…Ñ¥Ù”…ÍÁ•ĞµÍÅÕ…É”É½Õ¹‘•µá°½Ù•É™±½Üµ¡¥‘‘•¸‰½É‘•ÈÑÉ…¹Í¥Ñ¥½¸µ…±°€‘ì(€€€€€€€€€€€€€€€€€€€€€€€Í•°(€€€€€€€€€€€€€€€€€€€€€€€€€€ü€‰‰½É‘•Èµİ¡¥Ñ”¼àÀÉ¥¹œ´ÄÉ¥¹œµİ¡¥Ñ”¼ÌÀÍ¡…‘½Üµ±œˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€è€‰‰½É‘•Èµİ¡¥Ñ”½lÀ¸Àát¡½Ù•Èé‰½É‘•Èµİ¡¥Ñ”¼ÈÔˆ(€€€€€€€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€€ñ¥µœ(€€€€€€€€€€€€€€€€€€€€€€€ÍÉŒõí½ÁĞ¹¥µô(€€€€€€€€€€€€€€€€€€€€€€€…±Ğõí½ÁĞ¹±…‰•±ô(€€€€€€€€€€€€€€€€€€€€€€€±½…‘¥¹œô‰±…éäˆ(€€€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Üµ™Õ±° µ™Õ±°½‰©•Ğµ½Ù•Èˆ(€€€€€€€€€€€€€€€€€€€€€€€½¹ÉÉ½Èõì¡”¤€ôøì”¹Ñ…É•Ğ¹½¹•ÉÉ½È€ô¹Õ±°ì”¹Ñ…É•Ğ¹ÍÉŒ€ô€‘í9ô½¡…É…Ñ•É}ÑåÁ•}¡Õµ…¸¹İ•‰Á€ìõô(€€€€€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€€€€€€ì¼¨1…‰•°½Ù•É±…ä€¨½ô(€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”¥¹Í•Ğµà´À‰½ÑÑ½´´À‰œµÉ…‘¥•¹ĞµÑ¼µĞ™É½´µ‰±…¬¼àÀÙ¥„µ‰±…¬¼ĞÀÑ¼µÑÉ…¹ÍÁ…É•¹ĞÁĞ´ĞÁˆ´ÄÁà´Äˆø(€€€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áĞµlåÁát™½¹ĞµÍ•µ¥‰½±Ñ•áĞµİ¡¥Ñ”±•…‘¥¹œµ¹½¹”ˆùí½ÁĞ¹±…‰•±ôğ½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€€€€€€€€€ì¼¨M•±•Ñ•¡•¬‰…‘”€¨½ô(€€€€€€€€€€€€€€€€€€€€€íÍ•°€˜˜€ (€€€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”Ñ½À´ÄÉ¥¡Ğ´ÄÜ´Ğ ´ĞÉ½Õ¹‘•µ™Õ±°‰œµİ¡¥Ñ”Ñ•áĞµ‰±…¬™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•Èˆø(€€€€€€€€€€€€€€€€€€€€€€€€€€ñ¡•­%½¸€¼ø(€€€€€€€€€€€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€€€€€€€ğ½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€€€¤ì(€€€€€€€€€€€€€€€ô¥ô(€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€¤¥ô(€€€€€€€€ğ½‘¥Øø(€€€€€€ğ½‘¥Øø((€€€€€ì¼¨ƒŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠV@(€€€€€€€€€9QHƒŠPÕÉÉ•¹Ğ¡…É…Ñ•ÈAÉ•Ù¥•Ü(€€€€€ƒŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠV@€¨½ô(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à™±•àµ½°™±•à´Äµ¥¸µÜ´À½Ù•É™±½Üµ¡¥‘‘•¸‰œµlŒÁ„Á„Á…tˆø((€€€€€€€ì¼¨•¹Ñ•ÈÑ½À‰…Èè…ÍÁ•ĞÉ…Ñ¥¼€¬•¹•É…Ñ”€¨½ô(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ‰•Ñİ••¸Áà´ØÁä´Ì‰½É‘•Èµˆ‰½É‘•Èµİ¡¥Ñ”½lÀ¸ÀİtÍ¡É¥¹¬´Àˆø(€€€€€€€€€ì¼¨ÍÁ•ĞÉ…Ñ¥¼€¨½ô(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à…À´À¸Ô‰œµİ¡¥Ñ”½lÀ¸ÀÕt‰½É‘•È‰½É‘•Èµİ¡¥Ñ”½lÀ¸ÀátÉ½Õ¹‘•µá°À´Äˆø(€€€€€€€€€€€ílˆÌèĞˆ°€ˆÄèÄˆ°€ˆäèÄØˆ°€ˆÄØèä‰t¹µ…À ¡È¤€ôø€ (€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€­•äõíÉô(€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•ÑÍÁ•ÑI…Ñ¥¼¡È¥ô(€€€€€€€€€€€€€€€±…ÍÍ9…µ”õíÁà´ÌÁä´Ä¸ÔÉ½Õ¹‘•µ±œÑ•áĞµlÄÅÁát™½¹Ğµ‰½±ÑÉ…¹Í¥Ñ¥½¸µ…±°€‘ì(€€€€€€€€€€€€€€€€€…ÍÁ•ÑI…Ñ¥¼€ôôôÈ(€€€€€€€€€€€€€€€€€€€€ü€‰‰œµÙ¥½±•Ğ´ØÀÀÑ•áĞµİ¡¥Ñ”Í¡…‘½ÜµµÍ¡…‘½ÜµÙ¥½±•Ğ´ØÀÀ¼ĞÀˆ(€€€€€€€€€€€€€€€€€€€€è€‰Ñ•áĞµÉ…ä´ÔÀÀ¡½Ù•ÈéÑ•áĞµİ¡¥Ñ”ˆ(€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€íÉô(€€€€€€€€€€€€€€ğ½‰ÕÑÑ½¸ø(€€€€€€€€€€€€¤¥ô(€€€€€€€€€€ğ½‘¥Øø((€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È…À´Èˆø(€€€€€€€€€€€ì¼¨M¡Õ™™±”€¨½ô(€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€½¹±¥¬õí¡…¹‘±•M¡Õ™™±•ô(€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È…À´Ä¸ÔÁà´ÌÁä´ÈÉ½Õ¹‘•µá°‰œµİ¡¥Ñ”½lÀ¸ÀÕt‰½É‘•È‰½É‘•Èµİ¡¥Ñ”½lÀ¸ÀátÑ•áĞµÉ…ä´ĞÀÀ¡½Ù•ÈéÑ•áĞµİ¡¥Ñ”¡½Ù•Èé‰œµİ¡¥Ñ”¼ÄÀÑ•áĞµlÄÉÁát™½¹ĞµÍ•µ¥‰½±ÑÉ…¹Í¥Ñ¥½¸µ…±°ˆ(€€€€€€€€€€€€ø(€€€€€€€€€€€€€€ñM¡Õ™™±•%½¸€¼ø(€€€€€€€€€€€€€M¡Õ™™±”(€€€€€€€€€€€€ğ½‰ÕÑÑ½¸ø((€€€€€€€€€€€ì¼¨•¹•É…Ñ”€¨½ô(€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€½¹±¥¬õí¡…¹‘±••¹•É…Ñ•ô(€€€€€€€€€€€€€‘¥Í…‰±•õí¥Í•¹•É…Ñ¥¹ô(€€€€€€€€€€€€€±…ÍÍ9…µ”õí™±•à¥Ñ•µÌµ•¹Ñ•È…À´ÈÁà´ÔÁä´ÈÉ½Õ¹‘•µá°Ñ•áĞµlÄÍÁát™½¹Ğµ‰½±ÑÉ…¹Í¥Ñ¥½¸µ…±°Í¡…‘½Üµ±œ€‘ì(€€€€€€€€€€€€€€€¥Í•¹•É…Ñ¥¹œ(€€€€€€€€€€€€€€€€€€ü€‰‰œµÙ¥½±•Ğ´ØÀÀ¼ĞÀÑ•áĞµİ¡¥Ñ”¼ØÀÕÉÍ½Èµ¹½Ğµ…±±½İ•ˆ(€€€€€€€€€€€€€€€€€€è€‰‰œµÉ…‘¥•¹ĞµÑ¼µÈ™É½´µÙ¥½±•Ğ´ØÀÀÑ¼µ¥¹‘¥¼´ØÀÀ¡½Ù•Èé™É½´µÙ¥½±•Ğ´ÔÀÀ¡½Ù•ÈéÑ¼µ¥¹‘¥¼´ÔÀÀÑ•áĞµİ¡¥Ñ”Í¡…‘½ÜµÙ¥½±•Ğ´ØÀÀ¼ÌÀ¡½Ù•ÈéÍ¡…‘½ÜµÙ¥½±•Ğ´ÔÀÀ¼ĞÀˆ(€€€€€€€€€€€€€õô(€€€€€€€€€€€€ø(€€€€€€€€€€€€€í¥Í•¹•É…Ñ¥¹œ€ü€ (€€€€€€€€€€€€€€€€ğø(€€€€€€€€€€€€€€€€€€ñÍÙœ±…ÍÍ9…µ”ô‰…¹¥µ…Ñ”µÍÁ¥¸ˆİ¥‘Ñ ôˆÄĞˆ¡•¥¡ĞôˆÄĞˆÙ¥•İ	½àôˆÀ€À€ÈĞ€ÈĞˆ™¥±°ô‰¹½¹”ˆÍÑÉ½­”ô‰ÕÉÉ•¹Ñ½±½ÈˆÍÑÉ½­•]¥‘Ñ ôˆÈ¸Ôˆø(€€€€€€€€€€€€€€€€€€€€ñÁ…Ñ ô‰4ÈÄ€ÄÉ„ä€ä€À€ÄÄ´Äà€À€ä€ä€À€ÀÄÄà€ÁèˆÍÑÉ½­•=Á…¥ÑäôˆÀ¸Ìˆ€¼ø(€€€€€€€€€€€€€€€€€€€€ñÁ…Ñ ô‰4ÈÄ€ÄÉ„ä€ä€À€ÀÀ´ä´äˆ€¼ø(€€€€€€€€€€€€€€€€€€ğ½ÍÙœø(€€€€€€€€€€€€€€€€€•¹•É…Ñ¥¹ŸŠ˜(€€€€€€€€€€€€€€€€ğ¼ø(€€€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€€€ğøñ	½±Ñ%½¸€¼ù•¹•É…Ñ”¡…É…Ñ•Èğ¼ø(€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€ğ½‰ÕÑÑ½¸ø(€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€ğ½‘¥Øø((€€€€€€€ì¼¨AÉ•Ù¥•Ü…É•„€¨½ô(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à´Ä™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÀ´Ø½Ù•É™±½Üµ¡¥‘‘•¸ˆø(€€€€€€€€€€ñ‘¥Ø(€€€€€€€€€€€±…ÍÍ9…µ”ô‰É•±…Ñ¥Ù”É½Õ¹‘•´Éá°½Ù•É™±½Üµ¡¥‘‘•¸‰œµlŒÄĞÄĞÄÑt‰½É‘•È‰½É‘•Èµİ¡¥Ñ”½lÀ¸ÀİtÍ¡…‘½Ü´Éá°™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•Èˆ(€€€€€€€€€€€ÍÑå±”õíì…ÍÁ•ÑI…Ñ¥¼è…É5…Ám…ÍÁ•ÑI…Ñ¥½t€üü€ˆÌ¼Ğˆ°µ…á!•¥¡Ğè€ˆÄÀÀ”ˆ°µ…á]¥‘Ñ è€ˆÄÀÀ”ˆõô(€€€€€€€€€€ø(€€€€€€€€€€€í¥Í•¹•É…Ñ¥¹œ€ü€ (€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à™±•àµ½°¥Ñ•µÌµ•¹Ñ•È…À´ĞÑ•áĞµ•¹Ñ•ÈÁà´àÁä´ÄÈˆø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ü´ÄÈ ´ÄÈ‰½É‘•ÈµlÍÁát‰½É‘•ÈµÙ¥½±•Ğ´ÔÀÀ¼ÈÀ‰½É‘•ÈµĞµÙ¥½±•Ğ´ÔÀÀÉ½Õ¹‘•µ™Õ±°…¹¥µ…Ñ”µÍÁ¥¸ˆ€¼ø(€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áĞµÍ´Ñ•áĞµÉ…ä´ĞÀÀ™½¹Ğµµ•‘¥Õ´ˆù•¹•É…Ñ¥¹œå½ÕÈ$¥¹™±Õ•¹•ËŠ˜ğ½Àø(€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€¤€èÁÉ•Ù¥•İUÉ°€ü€ (€€€€€€€€€€€€€€ğø(€€€€€€€€€€€€€€€€ñ¥µœÍÉŒõíÁÉ•Ù¥•İUÉ±ô…±Ğô‰•¹•É…Ñ•$¡…É…Ñ•Èˆ±…ÍÍ9…µ”ô‰Üµ™Õ±° µ™Õ±°½‰©•Ğµ½Ù•Èˆ€¼ø(€€€€€€€€€€€€€€€ì¼¨½İ¹±½…½Ù•É±…ä‰ÕÑÑ½¸€¨½ô(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôø‘½İ¹±½…‘%µœ¡ÁÉ•Ù¥•İUÉ°¥ô(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”‰½ÑÑ½´´ÌÉ¥¡Ğ´Ì™±•à¥Ñ•µÌµ•¹Ñ•È…À´Ä¸ÔÁà´ÌÁä´Ä¸ÔÉ½Õ¹‘•µ±œ‰œµ‰±…¬¼ØÀ‰…­‘É½Àµ‰±ÕÈµÍ´‰½É‘•È‰½É‘•Èµİ¡¥Ñ”¼ÄÀÑ•áĞµİ¡¥Ñ”Ñ•áĞµlÄÅÁát™½¹ĞµÍ•µ¥‰½±¡½Ù•Èé‰œµ‰±…¬¼àÀÑÉ…¹Í¥Ñ¥½¸µ…±°ˆ(€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€ñ½İ¹±½…‘%½¸€¼ø(€€€€€€€€€€€€€€€€€M…Ù”(€€€€€€€€€€€€€€€€ğ½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€ğ¼ø(€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à™±•àµ½°¥Ñ•µÌµ•¹Ñ•È…À´ÌÑ•áĞµ•¹Ñ•ÈÁà´àÁä´ÄÈˆø(€€€€€€€€€€€€€€€€ñÍÙœİ¥‘Ñ ôˆĞàˆ¡•¥¡ĞôˆĞàˆÙ¥•İ	½àôˆÀ€À€ÈĞ€ÈĞˆ™¥±°ô‰¹½¹”ˆÍÑÉ½­”ô‰ÕÉÉ•¹Ñ½±½ÈˆÍÑÉ½­•]¥‘Ñ ôˆÀ¸àˆ±…ÍÍ9…µ”ô‰Ñ•áĞµÉ…ä´ÜÀÀˆø(€€€€€€€€€€€€€€€€€€ñÁ…Ñ ô‰4ÈÀ€ÈÅØ´É„Ğ€Ğ€À€ÀÀ´Ğ´Ñ á„Ğ€Ğ€À€ÀÀ´Ğ€ÑØÈˆ€¼øñ¥É±”àôˆÄÈˆäôˆÜˆÈôˆĞˆ€¼ø(€€€€€€€€€€€€€€€€ğ½ÍÙœø(€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áĞµÍ´Ñ•áĞµÉ…ä´ØÀÀ™½¹Ğµµ•‘¥Õ´ˆùe½ÕÈ$¥¹™±Õ•¹•È±¥Ù•Ì¡•É”¸ğ½Àø(€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áĞµáÌÑ•áĞµÉ…ä´ÜÀÀˆù•Í¥¸…¹‰Õ¥±å½ÕÈ$¥¹™±Õ•¹•Èñ‰È€¼ù™É½´ÍÉ…Ñ ğ½Àø(€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€¥ô(€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€ğ½‘¥Øø((€€€€€€€ì¼¨ƒŠRŠR M•±•Ñ•½ÁÑ¥½¸Á¥±±ÌƒŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠRŠR €¨½ô(€€€€€€€íÍ•±•Ñ•‘Q…Ì¹±•¹Ñ €ø€À€˜˜€ (€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Áà´ØÁˆ´ÌÍ¡É¥¹¬´Àˆø(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à™±•àµİÉ…À…À´Ä¸Ô¥Ñ•µÌµ•¹Ñ•Èˆø(€€€€€€€€€€€€€ì¡Í¡½İ±±Q…Ì€üÍ•±•Ñ•‘Q…Ì€èÍ•±•Ñ•‘Q…Ì¹Í±¥” À°QM}Y%M%	1¤¤¹µ…À ¡Ñ…œ¤€ôø€ (€€€€€€€€€€€€€€€€ñ!½Ù•ÉA¥±°(€€€€€€€€€€€€€€€€€­•äõíÑ…œ¹ÍÕ‰…Ñ%‘ô(€€€€€€€€€€€€€€€€€±…‰•°õíÑ…œ¹±…‰•±ô(€€€€€€€€€€€€€€€€€¥µœõíÑ…œ¹¥µô(€€€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôøì(€€€€€€€€€€€€€€€€€€€€¼¼)ÕµÀ‰Õ¥±‘•ÈÁ…¹•°Ñ¼Ñ¡”Ñ…ˆÑ¡…Ğ½İ¹ÌÑ¡¥ÌÍÕ‰…Ñ•½Éä(€€€€€€€€€€€€€€€€€€€½¹ÍĞ½İ¹•ÉQ…ˆ€ô=‰©•Ğ¹­•åÌ¡Q	M}=9%¤¹™¥¹ ¡Ñ¬¤€ôø(€€€€€€€€€€€€€€€€€€€€€Q	M}=9%mÑ­t¹ÍÕ‰…Ñ•½É¥•Ì¹Í½µ” ¡Ì¤€ôøÌ¹¥€ôôôÑ…œ¹ÍÕ‰…Ñ%¤(€€€€€€€€€€€€€€€€€€€€¤ì(€€€€€€€€€€€€€€€€€€€¥˜€¡½İ¹•ÉQ…ˆ¤Í•ÑÑ¥Ù•Q…ˆ¡½İ¹•ÉQ…ˆ¤ì(€€€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€€€íÍ•±•Ñ•‘Q…Ì¹±•¹Ñ €øQM}Y%M%	1€˜˜€ (€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€€€ÑåÁ”ô‰‰ÕÑÑ½¸ˆ(€€€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•ÑM¡½İ±±Q…Ì ¡Ø¤€ôø€…Ø¥ô(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰ µlÈÉÁátÁà´ÈÉ½Õ¹‘•µµ‰œµİ¡¥Ñ”½lÀ¸ÀÑt¡½Ù•Èé‰œµİ¡¥Ñ”½lÀ¸Àåt‰½É‘•È‰½É‘•Èµİ¡¥Ñ”½lÀ¸ÀátÑ•áĞµlÄÅÁátÑ•áĞµÉ…ä´ÔÀÀ¡½Ù•ÈéÑ•áĞµÉ…ä´ÌÀÀİ¡¥Ñ•ÍÁ…”µ¹½İÉ…ÀÑÉ…¹Í¥Ñ¥½¸µ…±°ˆ(€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€íÍ¡½İ±±Q…Ì€ü€‰¡¥‘”ˆ€èÍ¡½Üµ½É•ô(€€€€€€€€€€€€€€€€ğ½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€¥ô((€€€€€€€ì¼¨ÉÉ½È€¨½ô(€€€€€€€í•ÉÉ½É5Íœ€˜˜€ (€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µà´Øµˆ´ĞÁà´ĞÁä´ÌÉ½Õ¹‘•µá°‰œµÉ•´ÔÀÀ¼ÄÀ‰½É‘•È‰½É‘•ÈµÉ•´ÔÀÀ¼ÈÀÑ•áĞµÉ•´ĞÀÀÑ•áĞµlÄÉÁátÍ¡É¥¹¬´Àˆø(€€€€€€€€€€€í•ÉÉ½É5Íô(€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€¥ô((€€€€€€€ì¼¨ÕÍÑ½´ÁÉ½µÁĞ‰…È…Ğ‰½ÑÑ½´€¨½ô(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Áà´ØÁˆ´ĞÍ¡É¥¹¬´Àˆø(€€€€€€€€€€ñ¥¹ÁÕĞ(€€€€€€€€€€€ÑåÁ”ô‰Ñ•áĞˆ(€€€€€€€€€€€Ù…±Õ”õíÕÍÑ½µAÉ½µÁÑô(€€€€€€€€€€€½¹¡…¹”õì¡”¤€ôøÍ•ÑÕÍÑ½µAÉ½µÁĞ¡”¹Ñ…É•Ğ¹Ù…±Õ”¥ô(€€€€€€€€€€€Á±…•¡½±‘•Èô‰‘•áÑÉ„‘•Ñ…¥±ÏŠ˜”¹œ¸¹•½¸å‰•ÉÁÕ¹¬±¥¡Ñ¥¹œ°‘É…µ…Ñ¥ŒÍ¡…‘½İÌˆ(€€€€€€€€€€€±…ÍÍ9…µ”ô‰Üµ™Õ±° ´ä‰œµlŒÄØÄØÄÙt‰½É‘•È‰½É‘•Èµİ¡¥Ñ”½lÀ¸ÀİtÉ½Õ¹‘•µá°Áà´ÌÑ•áĞµlÄÉÁátÑ•áĞµÉ…ä´ÈÀÀÁ±…•¡½±‘•ÈµÉ…ä´ØÀÀ½ÕÑ±¥¹”µ¹½¹”™½ÕÌé‰½É‘•ÈµÙ¥½±•Ğ´ÔÀÀ¼ĞÀÑÉ…¹Í¥Ñ¥½¸µ½±½ÉÌˆ(€€€€€€€€€€¼ø(€€€€€€€€ğ½‘¥Øø(€€€€€€ğ½‘¥Øø((€€€€€ì¼¨ƒŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠV@(€€€€€€€€€I%!PƒŠP•¹•É…Ñ•¡…É…Ñ•ÉÌ!¥ÍÑ½Éä…±±•Éä(€€€€€ƒŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠVCŠV@€¨½ô(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à™±•àµ½°ÜµlÄØÁÁátÍ¡É¥¹¬´À‰½É‘•Èµ°‰½É‘•Èµİ¡¥Ñ”½lÀ¸Àİt‰œµlŒÄÄÄÄÄÅt½Ù•É™±½Üµ¡¥‘‘•¸ˆø((€€€€€€€ì¼¨…±±•Éä¡•…‘•È€¨½ô(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Áà´ÌÁä´Ì‰½É‘•Èµˆ‰½É‘•Èµİ¡¥Ñ”½lÀ¸ÀİtÍ¡É¥¹¬´Àˆø(€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áĞµlÄÅÁát™½¹Ğµ‰½±Ñ•áĞµİ¡¥Ñ”ÑÉ…­¥¹œµÑ¥¡Ğˆù•¹•É…Ñ•ğ½Àø(€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áĞµlåÁátÑ•áĞµÉ…ä´ØÀÀµĞ´À¸Ôˆùí¡¥ÍÑ½Éä¹±•¹Ñ¡ô¡…É…Ñ•ÉÌğ½Àø(€€€€€€€€ğ½‘¥Øø((€€€€€€€ì¼¨…±±•ÉäÍÉ½±°€¨½ô(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à´Ä½Ù•É™±½Üµäµ…ÕÑ¼À´ÈÍÁ…”µä´Èˆø(€€€€€€€€€í¡¥ÍÑ½Éä¹±•¹Ñ €ôôô€À€ü€ (€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à™±•àµ½°¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•È ´ÌÈÑ•áĞµ•¹Ñ•ÈÁà´Èˆø(€€€€€€€€€€€€€€ñÍÙœİ¥‘Ñ ôˆÈàˆ¡•¥¡ĞôˆÈàˆÙ¥•İ	½àôˆÀ€À€ÈĞ€ÈĞˆ™¥±°ô‰¹½¹”ˆÍÑÉ½­”ô‰ÕÉÉ•¹Ñ½±½ÈˆÍÑÉ½­•]¥‘Ñ ôˆÄˆ±…ÍÍ9…µ”ô‰Ñ•áĞµÉ…ä´ÜÀÀµˆ´Èˆø(€€€€€€€€€€€€€€€€ñÉ•ĞàôˆÌˆäôˆÌˆİ¥‘Ñ ôˆÄàˆ¡•¥¡ĞôˆÄàˆÉàôˆÈˆÉäôˆÈˆ€¼øñ¥É±”àôˆà¸Ôˆäôˆà¸ÔˆÈôˆÄ¸Ôˆ€¼øñÁ½±å±¥¹”Á½¥¹ÑÌôˆÈÄ€ÄÔ€ÄØ€ÄÀ€Ô€ÈÄˆ€¼ø(€€€€€€€€€€€€€€ğ½ÍÙœø(€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áĞµlåÁátÑ•áĞµÉ…ä´ÜÀÀ±•…‘¥¹œµÉ•±…á•ˆù•¹•É…Ñ•¡…É…Ñ•ÉÌñ‰È€¼ù…ÁÁ•…È¡•É”ğ½Àø(€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€¤€è€ (€€€€€€€€€€€¡¥ÍÑ½Éä¹µ…À ¡¥Ñ•´°¥‘à¤€ôø€ (€€€€€€€€€€€€€€ñ‘¥Ø(€€€€€€€€€€€€€€€­•äõí¥Ñ•´¹ÑÍô(€€€€€€€€€€€€€€€É½±”ô‰‰ÕÑÑ½¸ˆ(€€€€€€€€€€€€€€€Ñ…‰%¹‘•àõìÁô(€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•ÑM•±•Ñ•‘!¥ÍÑ½Éå%‘à¡¥‘à¥ô(€€€€€€€€€€€€€€€½¹-•å½İ¸õì¡”¤€ôø”¹­•ä€ôôô€‰¹Ñ•Èˆ€˜˜Í•ÑM•±•Ñ•‘!¥ÍÑ½Éå%‘à¡¥‘à¥ô(€€€€€€€€€€€€€€€±…ÍÍ9…µ”õíÉ½ÕÀÉ•±…Ñ¥Ù”Üµ™Õ±°…ÍÁ•ĞµlÌ¼ÑtÉ½Õ¹‘•µá°½Ù•É™±½Üµ¡¥‘‘•¸‰½É‘•ÈÑÉ…¹Í¥Ñ¥½¸µ…±°ÕÉÍ½ÈµÁ½¥¹Ñ•È€‘ì(€€€€€€€€€€€€€€€€€Í•±•Ñ•‘!¥ÍÑ½Éå%‘à€ôôô¥‘à(€€€€€€€€€€€€€€€€€€€€ü€‰‰½É‘•ÈµÙ¥½±•Ğ´ÔÀÀÉ¥¹œ´ÄÉ¥¹œµÙ¥½±•Ğ´ÔÀÀ¼ĞÀˆ(€€€€€€€€€€€€€€€€€€€€è€‰‰½É‘•Èµİ¡¥Ñ”½lÀ¸Àát¡½Ù•Èé‰½É‘•Èµİ¡¥Ñ”¼ÈÀˆ(€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€ñ¥µœÍÉŒõí¥Ñ•´¹ÕÉ±ô…±Ğõí¡…É…Ñ•È€‘í¥‘à€¬€Åõô±…ÍÍ9…µ”ô‰Üµ™Õ±° µ™Õ±°½‰©•Ğµ½Ù•Èˆ€¼ø(€€€€€€€€€€€€€€€ì¼¨½İ¹±½…½¸¡½Ù•È€¨½ô(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”¥¹Í•Ğ´À‰œµ‰±…¬¼ÔÀ½Á…¥Ñä´ÀÉ½ÕÀµ¡½Ù•Èé½Á…¥Ñä´ÄÀÀÑÉ…¹Í¥Ñ¥½¸µ½Á…¥Ñä™±•à¥Ñ•µÌµ•¹©ÕÍÑ¥™äµ•¹Ñ•ÈÁˆ´Èˆø(€€€€€€€€€€€€€€€€€€ñ‘¥Ø(€€€€€€€€€€€€€€€€€€€É½±”ô‰‰ÕÑÑ½¸ˆ(€€€€€€€€€€€€€€€€€€€Ñ…‰%¹‘•àõìÁô(€€€€€€€€€€€€€€€€€€€½¹±¥¬õì¡”¤€ôøì”¹ÍÑ½ÁAÉ½Á……Ñ¥½¸ ¤ì‘½İ¹±½…‘%µœ¡¥Ñ•´¹ÕÉ°¤ìõô(€€€€€€€€€€€€€€€€€€€½¹-•å½İ¸õì¡”¤€ôøì¥˜€¡”¹­•ä€ôôô€‰¹Ñ•Èˆ¤ì”¹ÍÑ½ÁAÉ½Á……Ñ¥½¸ ¤ì‘½İ¹±½…‘%µœ¡¥Ñ•´¹ÕÉ°¤ìôõô(€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰À´Ä¸ÔÉ½Õ¹‘•µ±œ‰œµİ¡¥Ñ”¼ÄÀ‰…­‘É½Àµ‰±ÕÈµÍ´‰½É‘•È‰½É‘•Èµİ¡¥Ñ”¼ÈÀÑ•áĞµİ¡¥Ñ”¡½Ù•Èé‰œµİ¡¥Ñ”¼ÈÀÑÉ…¹Í¥Ñ¥½¸µ…±°ÕÉÍ½ÈµÁ½¥¹Ñ•Èˆ(€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€ñ½İ¹±½…‘%½¸€¼ø(€€€€€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€€€ì¼¨%¹‘•à‰…‘”€¨½ô(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”Ñ½À´Ä±•™Ğ´ÄÁà´Ä¸ÔÁä´À¸ÔÉ½Õ¹‘•µµ‰œµ‰±…¬¼ØÀ‰…­‘É½Àµ‰±ÕÈµÍ´Ñ•áĞµláÁátÑ•áĞµÉ…ä´ÌÀÀ™½¹Ğµ‰½±ˆø(€€€€€€€€€€€€€€€€€€í¡¥ÍÑ½Éä¹±•¹Ñ €´¥‘áô(€€€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€€€ğ½‘¥Øø(€€€€€€€€€€€€¤¤(€€€€€€€€€€¥ô(€€€€€€€€ğ½‘¥Øø(€€€€€€ğ½‘¥Øø(€€€€€€ñQ½…ÍÑ•ÈÁ½Í¥Ñ¥½¸ô‰Ñ½ÀµÉ¥¡Ğˆ½¹Ñ…¥¹•ÉMÑå±”õíìé%¹‘•àè€äääääõôÑ½…ÍÑ=ÁÑ¥½¹Ìõíì‘ÕÉ…Ñ¥½¸è€ÔÀÀÀ°ÍÑå±”èì‰…­É½Õ¹è€œŒÄàÄàÅˆœ°½±½Èè€œ™™™™™˜œ°‰½É‘•Èè€œÅÁàÍ½±¥É‰„ ÈÔÔ°ÈÔÔ°ÈÔÔ°À¸ÄÔ¤œ°™½¹ÑM¥é”è€œÄÍÁàœ°‰½É‘•ÉI…‘¥ÕÌè€œÄÉÁàœ°‰½áM¡…‘½Üè€œÀ€ÄÁÁà€ÌÁÁàÉ‰„ À°À°À°À¸Ø¤œ°µ…á]¥‘Ñ è€œĞĞÁÁàœ°İ½É‘	É•…¬è€‰É•…¬µİ½Éœ°İ¡¥Ñ•MÁ…”è€ÁÉ”µİÉ…Àœ°Á…‘‘¥¹œè€œÄÉÁà€ÄÙÁàœôõô€¼ø(€€€€ğ½‘¥Øø(€€¤ì)ô
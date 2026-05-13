/**
 * Utility to download a remote image using fetch.
 * This converts the image to a blob and triggers a browser download.
 */
export async function downloadImage(url, filename = "ai-headshot-portrait.jpg") {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image");
    
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Download failed:", error);
    // Fallback: target blank if fetch fails
    window.open(url, "_blank");
  }
}

export const headshotsExamples = [
  {
    "name": "LinkedIn",
    "url": "https://cdn.muapi.ai/outputs/d09a771a8b2a45f1b0b5e6aba5955f1b.jpg"
  },
  {
    "name": "Tinder",
    "url": "https://cdn.muapi.ai/outputs/23a2914038de40d3b3bc8c8b3a5a108a.jpg"
  },
  {
    "name": "Bumble",
    "url": "https://cdn.muapi.ai/outputs/67b9e5df060a4ec08c8a0d6244370781.jpg"
  },
  {
    "name": "OldMoney",
    "url": "https://cdn.muapi.ai/outputs/00436b9b658a474aa337380c6850cd5d.jpg"
  },
  {
    "name": "Cyberpunk",
    "url": "https://cdn.muapi.ai/outputs/e297958d8a9b4f5c9937435a87b8fff2.jpg"
  },
  {
    "name": "CEO",
    "url": "https://cdn.muapi.ai/outputs/1f6f689a5338409f984d4bc705a6fdd9.jpg"
  },
  {
    "name": "CleanGirl",
    "url": "https://cdn.muapi.ai/outputs/ab5400bef83548198f3cad252abd9f49.jpg"
  },
  {
    "name": "DarkAcademia",
    "url": "https://cdn.muapi.ai/outputs/79258cd108ea42bd9418f08286623827.jpg"
  },
  {
    "name": "Anime",
    "url": "https://cdn.muapi.ai/outputs/1343723e9655485e95a71ba55b652732.jpg"
  },
  {
    "name": "Doctor",
    "url": "https://cdn.muapi.ai/outputs/a462e75109b840d999b61f2345b82707.jpg"
  },
  {
    "name": "Lawyer",
    "url": "https://cdn.muapi.ai/outputs/64c27c401766492982daa19924ff8de6.jpg"
  },
  {
    "name": "MobWife",
    "url": "https://cdn.muapi.ai/outputs/1f986889ebcd418994fd924db9bde486.jpg"
  },
  {
    "name": "Bali",
    "url": "https://cdn.muapi.ai/outputs/bf8ee4e0f6cb48bdac8dede04faf9eaf.jpg"
  },
  {
    "name": "90s",
    "url": "https://cdn.muapi.ai/outputs/90c7378f358f4d4693ab27e8914137b1.jpg"
  },
  {
    "name": "Fitness",
    "url": "https://cdn.muapi.ai/outputs/29bbbbdee7fb4e17a229f3222a63b46f.jpg"
  },
  {
    "name": "Christmas",
    "url": "https://cdn.muapi.ai/outputs/882282c4e3034301b86ac42db2f4d8ac.jpg"
  },
  {
    "name": "Halloween",
    "url": "https://cdn.muapi.ai/outputs/71566fb951b145f89baec601a4b72330.jpg"
  },
  {
    "name": "EuropeanElegance",
    "url": "https://cdn.muapi.ai/outputs/31cadd8a2fca4a738b37af30fc3af869.jpg"
  },
  {
    "name": "ChampionSportsMoment",
    "url": "https://cdn.muapi.ai/outputs/699a944dec0f4be194c929ae9c6e30fc.jpg"
  },
  {
    "name": "JobSwapDaydream",
    "url": "https://cdn.muapi.ai/outputs/5f54966658b24288b6a5779c8839f000.jpg"
  },
  {
    "name": "TravelTheWorld",
    "url": "https://cdn.muapi.ai/outputs/ef12fb4afcba4947aebc2a15cce4d643.jpg"
  },
  {
    "name": "DatingPack",
    "url": "https://cdn.muapi.ai/outputs/2b243dccee68482ca92a1310b4cfd9b4.jpg"
  },
  {
    "name": "FlashPosePerfection",
    "url": "https://cdn.muapi.ai/outputs/3ed0f6e9f2b74897b39c4161a21b2467.jpg"
  },
  {
    "name": "CapAndGown",
    "url": "https://cdn.muapi.ai/outputs/af3729fd8a2d44ab8a59225d88f38b01.jpg"
  },
  {
    "name": "CorporateBoss",
    "url": "https://cdn.muapi.ai/outputs/ce4a7ea97c96466bbaecc9a78653f64b.jpg"
  },
  {
    "name": "RocknRollLuxury",
    "url": "https://cdn.muapi.ai/outputs/42cb61124d6243fca8cc2802628dc908.jpg"
  },
  {
    "name": "TheBigWeddingDay",
    "url": "https://cdn.muapi.ai/outputs/20f20a2a827a4f0399e5b68a6f3f110c.jpg"
  },
  {
    "name": "RusticCharm",
    "url": "https://cdn.muapi.ai/outputs/54e862934a354d12a696b1e66d4376ab.jpg"
  },
  {
    "name": "DressedToImpress",
    "url": "https://cdn.muapi.ai/outputs/191f0a8fe8084aa89fee23091624b413.jpg"
  },
  {
    "name": "IdentificationPhoto",
    "url": "https://cdn.muapi.ai/outputs/67481217ae404c468dec7e66e4006eda.jpg"
  },
  {
    "name": "DontMissYourProm",
    "url": "https://cdn.muapi.ai/outputs/8a0899769c604d9c9cb4123a98f65a73.jpg"
  },
  {
    "name": "GoddessOfNature",
    "url": "https://cdn.muapi.ai/outputs/de5b23abfe2a4de4a70dde6f68ab2f0a.jpg"
  },
  {
    "name": "BlackAndWhiteMagic",
    "url": "https://cdn.muapi.ai/outputs/6d608b9a2f704fd0b838abacb86b1bfe.jpg"
  },
  {
    "name": "HomelyComforts",
    "url": "https://cdn.muapi.ai/outputs/1246c25531794393be3522b44b02e539.jpg"
  },
  {
    "name": "BalloonsBalloonsBalloons",
    "url": "https://cdn.muapi.ai/outputs/ff07089729954a4290c92b7e7b7fc913.jpg"
  },
  {
    "name": "BeautyBlooms",
    "url": "https://cdn.muapi.ai/outputs/c148257850ab4eada3718faa36ec217e.jpg"
  },
  {
    "name": "SuperheroAdventure",
    "url": "https://cdn.muapi.ai/outputs/68d4dcd0386b42ef823e9ff87740921a.jpg"
  },
  {
    "name": "BoldFashionStatements",
    "url": "https://cdn.muapi.ai/outputs/547a4b9e5b3d4530ae30074c3cf8455f.jpg"
  },
  {
    "name": "FantasyOutfits",
    "url": "https://cdn.muapi.ai/outputs/10f7a2fe209b4742b4abab13af91e3fb.jpg"
  },
  {
    "name": "OnTheCatwalk",
    "url": "https://cdn.muapi.ai/outputs/f5126fd4ccf444b49215c7e4cdf63d17.jpg"
  },
  {
    "name": "HalloweenHorror",
    "url": "https://cdn.muapi.ai/outputs/b10e9bb9909b414c9086f95febf5d13e.jpg"
  },
  {
    "name": "CosplayGalore",
    "url": "https://cdn.muapi.ai/outputs/dd7e06831bfc4df18ad16c24fed622be.jpg"
  },
  {
    "name": "Ghibli",
    "url": "https://cdn.muapi.ai/outputs/0f65ed91d9ee45808e5688333c75a2fa.jpg"
  },
  {
    "name": "Pixar",
    "url": "https://cdn.muapi.ai/outputs/eee5f7fd1e144548ba2783c9f60c5c72.jpg"
  },
  {
    "name": "SpiderVerse",
    "url": "https://cdn.muapi.ai/outputs/efa8c22dcb05465d9a8b4859f82aca15.jpg"
  }
]
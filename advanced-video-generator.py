"""
Advanced Video Generation System
Integrates AI for thumbnail generation, music matching, and script optimization
"""

import json
import os
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict, field
from enum import Enum


class Platform(Enum):
    """Supported platforms"""
    TIKTOK = "tiktok"
    YOUTUBE_SHORTS = "youtube_shorts"
    INSTAGRAM_REELS = "instagram_reels"
    YOUTUBE = "youtube"
    DISCORD = "discord"


class ContentCategory(Enum):
    """Content categories"""
    EDUCATIONAL = "educational"
    ENTERTAINMENT = "entertainment"
    DIY_CRAFTS = "diy_crafts"
    CHALLENGES = "challenges"
    STORYTELLING = "storytelling"
    ANIMALS = "animals"
    SCIENCE = "science"
    GAMING = "gaming"


@dataclass
class AIThumbnailPrompt:
    """AI prompt for thumbnail generation"""
    topic: str
    style: str
    colors: List[str]
    text_overlay: str
    mood: str
    target_age: tuple
    
    def to_prompt_string(self) -> str:
        """Convert to AI image generation prompt"""
        return f"""
        Create a viral YouTube/TikTok thumbnail:
        - Topic: {self.topic}
        - Style: {self.style}
        - Colors: {', '.join(self.colors)}
        - Text overlay: "{self.text_overlay}"
        - Mood: {self.mood}
        - Target audience: Kids ages {self.target_age[0]}-{self.target_age[1]}
        - Must be: Attention-grabbing, high-contrast, professional
        - Include: Surprised face expressions, bold text, vibrant colors
        - Avoid: Scary content, violence, inappropriate imagery
        """.strip()


@dataclass
class AIVoiceoverSpec:
    """Voiceover specifications"""
    tone: str  # "excited", "calm", "enthusiastic", "mysterious"
    pace: str  # "fast", "normal", "slow"
    accent: str = "american"  # "american", "british", "neutral"
    gender: str = "can_vary"  # "male", "female", "can_vary"
    age_representation: str = "young"  # How the voice should sound


@dataclass
class MusicRecommendation:
    """AI-recommended music"""
    tempo: int  # BPM
    genre: str
    mood: str
    energy_level: str  # "low", "medium", "high"
    duration: int  # seconds
    suggested_artists: List[str] = field(default_factory=list)
    keywords: List[str] = field(default_factory=list)


@dataclass
class OptimizedScript:
    """AI-optimized script"""
    title: str
    hook: str
    body: str
    cta: str
    timing: Dict[str, float]  # {"hook": 2.0, "body": 15.0, "cta": 3.0}
    emphasis_points: List[str]
    suggested_b_roll: List[str]
    viral_score: float  # 0-1


class AdvancedVideoGenerator:
    """Advanced video generation with AI optimization"""
    
    def __init__(self):
        self.platform_specs = self._init_platform_specs()
        self.content_guidelines = self._init_content_guidelines()
    
    def _init_platform_specs(self) -> Dict[str, Dict]:
        """Platform-specific specifications"""
        return {
            Platform.TIKTOK.value: {
                "max_duration": 600,
                "min_duration": 15,
                "aspect_ratio": "9:16",
                "recommended_duration": 30,
                "max_hashtags": 30,
                "optimal_posting_hours": [14, 15, 16, 19, 20, 21],
                "max_text_overlays": 12,
            },
            Platform.YOUTUBE_SHORTS.value: {
                "max_duration": 60,
                "min_duration": 15,
                "aspect_ratio": "9:16",
                "recommended_duration": 45,
                "optimal_posting_hours": [11, 12, 13, 19, 20],
                "thumbnail_resolution": "1280x720",
            },
            Platform.INSTAGRAM_REELS.value: {
                "max_duration": 90,
                "min_duration": 15,
                "aspect_ratio": "9:16",
                "recommended_duration": 30,
                "optimal_posting_hours": [11, 12, 19, 20],
                "max_hashtags": 30,
            },
            Platform.YOUTUBE.value: {
                "max_duration": 3600,
                "min_duration": 60,
                "aspect_ratio": "16:9",
                "recommended_duration": 480,  # 8 minutes
                "thumbnail_resolution": "1280x720",
                "optimal_posting_hours": [15, 16, 17],
            },
        }
    
    def _init_content_guidelines(self) -> Dict[str, Dict]:
        """Content safety and engagement guidelines"""
        return {
            "3_5": {
                "max_scene_duration": 5,  # seconds
                "required_colors": True,
                "animation_required": True,
                "music_style": "playful",
                "content_speed": "fast",
                "violence_allowed": False,
                "scary_content": False,
            },
            "6_8": {
                "max_scene_duration": 8,
                "animation_recommended": True,
                "music_style": "upbeat_pop",
                "learning_value": True,
                "humor_style": "silly",
            },
            "9_12": {
                "max_scene_duration": 10,
                "humor_style": "witty_relatable",
                "trends": True,
                "challenges_ok": True,
            },
            "13_16": {
                "max_scene_duration": 15,
                "trends_important": True,
                "peer_engagement": True,
                "challenges_ok": True,
            },
        }
    
    def generate_thumbnail_prompt(
        self,
        topic: str,
        category: ContentCategory,
        target_age: tuple,
        style: str = "vibrant"
    ) -> AIThumbnailPrompt:
        """Generate AI prompt for thumbnail creation"""
        
        color_schemes = {
            ContentCategory.EDUCATIONAL: ["#FF6B35", "#F7931E", "#4ECDC4"],
            ContentCategory.ENTERTAINMENT: ["#FF1493", "#FFD700", "#00CED1"],
            ContentCategory.DIY_CRAFTS: ["#FF6B9D", "#C06C84", "#355C7D"],
            ContentCategory.CHALLENGES: ["#FF6B35", "#00FF00", "#FFD700"],
            ContentCategory.ANIMALS: ["#FFB6C1", "#FFDAB9", "#FFE4B5"],
            ContentCategory.SCIENCE: ["#00CED1", "#9370DB", "#00FF00"],
            ContentCategory.GAMING: ["#FF00FF", "#00FFFF", "#FFD700"],
        }
        
        moods = {
            ContentCategory.EDUCATIONAL: "surprised, amazed",
            ContentCategory.ENTERTAINMENT: "excited, thrilled",
            ContentCategory.DIY_CRAFTS: "creative, inspired",
            ContentCategory.CHALLENGES: "determined, competitive",
            ContentCategory.ANIMALS: "cute, happy",
            ContentCategory.SCIENCE: "curious, wonder",
            ContentCategory.GAMING: "excited, focused",
        }
        
        return AIThumbnailPrompt(
            topic=topic,
            style=style,
            colors=color_schemes.get(category, ["#FF6B35", "#4ECDC4", "#FFD700"]),
            text_overlay=self._generate_thumbnail_text(topic),
            mood=moods.get(category, "excited"),
            target_age=target_age
        )
    
    def _generate_thumbnail_text(self, topic: str) -> str:
        """Generate attention-grabbing thumbnail text"""
        templates = [
            f"WOW!",
            f"OMG!",
            f"YOU WON'T BELIEVE!",
            f"INSANE!",
            f"SHOCKING!",
            f"🤯",
        ]
        return templates[hash(topic) % len(templates)]
    
    def generate_music_recommendation(
        self,
        category: ContentCategory,
        duration_seconds: int,
        target_age: tuple
    ) -> MusicRecommendation:
        """Generate AI-recommended music"""
        
        music_profiles = {
            ContentCategory.EDUCATIONAL: {
                "tempo": 120,
                "genre": "modern_electronic",
                "mood": "inspirational",
                "energy_level": "high",
                "keywords": ["uplifting", "modern", "trendy", "engaging"],
            },
            ContentCategory.ENTERTAINMENT: {
                "tempo": 130,
                "genre": "pop_dance",
                "mood": "energetic",
                "energy_level": "high",
                "keywords": ["fun", "exciting", "party", "upbeat"],
            },
            ContentCategory.DIY_CRAFTS: {
                "tempo": 110,
                "genre": "indie_pop",
                "mood": "creative",
                "energy_level": "medium",
                "keywords": ["playful", "creative", "inspiring"],
            },
            ContentCategory.ANIMALS: {
                "tempo": 100,
                "genre": "acoustic_pop",
                "mood": "cute",
                "energy_level": "medium",
                "keywords": ["cute", "playful", "sweet", "joyful"],
            },
            ContentCategory.CHALLENGES: {
                "tempo": 140,
                "genre": "electronic_dance",
                "mood": "competitive",
                "energy_level": "high",
                "keywords": ["intense", "competitive", "powerful"],
            },
        }
        
        profile = music_profiles.get(
            category,
            {
                "tempo": 120,
                "genre": "pop",
                "mood": "upbeat",
                "energy_level": "high",
                "keywords": ["engaging"],
            }
        )
        
        return MusicRecommendation(
            tempo=profile["tempo"],
            genre=profile["genre"],
            mood=profile["mood"],
            energy_level=profile["energy_level"],
            duration=duration_seconds,
            keywords=profile["keywords"],
            suggested_artists=self._get_trending_artists(category, target_age)
        )
    
    def _get_trending_artists(
        self,
        category: ContentCategory,
        target_age: tuple
    ) -> List[str]:
        """Get trending artists for category"""
        trending_artists = {
            ContentCategory.EDUCATIONAL: [
                "Electric Youth",
                "Syn Cole",
                "Kevin MacLeod",
                "Audio Library Gems"
            ],
            ContentCategory.ENTERTAINMENT: [
                "Dua Lipa",
                "The Weeknd",
                "Ariana Grande",
                "Billie Eilish"
            ],
            ContentCategory.DIY_CRAFTS: [
                "Conan Gray",
                "Girl in Red",
                "Clairo",
                "Cavetown"
            ],
            ContentCategory.ANIMALS: [
                "Dodie Clark",
                "Boy Pablo",
                "Chloe Moriondo",
                "The Wombats"
            ],
            ContentCategory.CHALLENGES: [
                "Dua Lipa",
                "The Chainsmokers",
                "Marshmello",
                "Calvin Harris"
            ],
        }
        return trending_artists.get(category, ["Various Artists"])
    
    def generate_optimized_script(
        self,
        topic: str,
        category: ContentCategory,
        platform: Platform,
        target_age: tuple
    ) -> OptimizedScript:
        """Generate AI-optimized script"""
        
        platform_specs = self.platform_specs[platform.value]
        recommended_duration = platform_specs["recommended_duration"]
        
        # Script templates by category
        hooks = {
            ContentCategory.EDUCATIONAL: [
                f"Wait until you see THIS {topic}!",
                f"This {topic} fact will BLOW YOUR MIND!",
                f"Nobody knows about this {topic}!",
            ],
            ContentCategory.ENTERTAINMENT: [
                f"I can't believe this {topic} just happened!",
                f"This {topic} challenge went WRONG!",
                f"Watch until the end!",
            ],
            ContentCategory.DIY_CRAFTS: [
                f"Make this AMAZING {topic} in 5 minutes!",
                f"This {topic} DIY is INSANE!",
                f"You can make this {topic}!",
            ],
            ContentCategory.ANIMALS: [
                f"This {topic} is the CUTEST thing ever!",
                f"I didn't know {topic} could do this!",
                f"This {topic} just melted my heart! 🥰",
            ],
            ContentCategory.CHALLENGES: [
                f"Can YOU do this {topic} challenge?",
                f"I bet you can't do this {topic}!",
                f"This {topic} challenge went WRONG!",
            ],
        }
        
        hook_list = hooks.get(category, [f"Check out this {topic}!"])
        selected_hook = hook_list[hash(topic) % len(hook_list)]
        
        # Timing based on duration
        timings = {
            15: {"hook": 2.0, "body": 10.0, "cta": 3.0},
            30: {"hook": 3.0, "body": 22.0, "cta": 5.0},
            45: {"hook": 3.0, "body": 37.0, "cta": 5.0},
            60: {"hook": 4.0, "body": 50.0, "cta": 6.0},
        }
        
        timing = timings.get(
            recommended_duration,
            {"hook": 2.0, "body": float(recommended_duration - 5), "cta": 3.0}
        )
        
        return OptimizedScript(
            title=self._generate_title(topic, category),
            hook=selected_hook,
            body=f"[Main content about {topic} - engaging and fast-paced]",
            cta="Like, subscribe, and comment your thoughts!",
            timing=timing,
            emphasis_points=self._generate_emphasis_points(topic, category),
            suggested_b_roll=self._get_broll_suggestions(topic, category),
            viral_score=self._calculate_viral_potential(category, target_age)
        )
    
    def _generate_title(self, topic: str, category: ContentCategory) -> str:
        """Generate attention-grabbing title"""
        templates = {
            ContentCategory.EDUCATIONAL: f"{topic}: This Will BLOW YOUR MIND! 🤯",
            ContentCategory.ENTERTAINMENT: f"I Tried {topic} And... WOW!",
            ContentCategory.DIY_CRAFTS: f"Make {topic} - DIY HACK!",
            ContentCategory.ANIMALS: f"{topic} - The CUTEST Thing Ever! 🥰",
            ContentCategory.CHALLENGES: f"{topic} CHALLENGE - GONE WRONG!",
        }
        return templates.get(category, f"{topic} - AMAZING!")
    
    def _generate_emphasis_points(
        self,
        topic: str,
        category: ContentCategory
    ) -> List[str]:
        """Generate points to emphasize for viral potential"""
        base_points = [
            "Use all caps for key words",
            "Add emojis strategically",
            "Include surprising statistics",
            "Show close-up reactions",
        ]
        
        category_specific = {
            ContentCategory.EDUCATIONAL: [
                "Highlight the most shocking fact first",
                "Use comparison to relatable things",
                "Include 'did you know?' moments",
            ],
            ContentCategory.ENTERTAINMENT: [
                "Exaggerate reactions authentically",
                "Build tension before payoff",
                "End with unexpected twist",
            ],
            ContentCategory.DIY_CRAFTS: [
                "Show before/after dramatically",
                "Highlight the 'wow' moment",
                "Make it look achievable",
            ],
            ContentCategory.ANIMALS: [
                "Capture the cutest moment clearly",
                "Include surprising behavior",
                "Create emotional connection",
            ],
            ContentCategory.CHALLENGES: [
                "Show genuine reactions",
                "Build anticipation",
                "Encourage participation",
            ],
        }
        
        return base_points + category_specific.get(category, [])
    
    def _get_broll_suggestions(
        self,
        topic: str,
        category: ContentCategory
    ) -> List[str]:
        """Get B-roll suggestions"""
        suggestions = {
            ContentCategory.EDUCATIONAL: [
                "Animated graphics",
                "Close-ups of phenomena",
                "Comparison visuals",
                "Statistics displays",
            ],
            ContentCategory.ENTERTAINMENT: [
                "Reaction shots",
                "Action sequences",
                "Transition effects",
                "Split screens",
            ],
            ContentCategory.DIY_CRAFTS: [
                "Closeup of hands working",
                "Materials showcase",
                "Time-lapse of process",
                "Final product showcase",
            ],
            ContentCategory.ANIMALS: [
                "Cute behavioral shots",
                "Close-ups of face",
                "Playing footage",
                "Funny moments",
            ],
            ContentCategory.CHALLENGES: [
                "Attempt footage",
                "Reaction shots",
                "Slow-motion moments",
                "Comparison clips",
            ],
        }
        return suggestions.get(category, ["Action footage", "Transition effects"])
    
    def _calculate_viral_potential(
        self,
        category: ContentCategory,
        target_age: tuple
    ) -> float:
        """Calculate viral potential score (0-1)"""
        base_scores = {
            ContentCategory.EDUCATIONAL: 0.82,
            ContentCategory.ENTERTAINMENT: 0.88,
            ContentCategory.DIY_CRAFTS: 0.85,
            ContentCategory.ANIMALS: 0.91,
            ContentCategory.CHALLENGES: 0.89,
            ContentCategory.SCIENCE: 0.87,
            ContentCategory.GAMING: 0.84,
        }
        
        score = base_scores.get(category, 0.85)
        
        # Adjust based on age group
        age_multipliers = {
            (3, 5): 0.88,
            (6, 8): 0.92,
            (9, 12): 0.90,
            (13, 16): 0.87,
        }
        
        for age_range, multiplier in age_multipliers.items():
            if age_range[0] <= target_age[0] and target_age[1] <= age_range[1]:
                score *= multiplier
                break
        
        return min(score, 1.0)
    
    def generate_complete_video_spec(
        self,
        topic: str,
        category: ContentCategory,
        platform: Platform,
        target_age: tuple
    ) -> Dict:
        """Generate complete video specification"""
        
        script = self.generate_optimized_script(topic, category, platform, target_age)
        music = self.generate_music_recommendation(category, int(sum(script.timing.values())), target_age)
        thumbnail = self.generate_thumbnail_prompt(topic, category, target_age)
        
        return {
            "topic": topic,
            "category": category.value,
            "platform": platform.value,
            "target_age": target_age,
            "script": asdict(script),
            "music": asdict(music),
            "thumbnail_prompt": thumbnail.to_prompt_string(),
            "platform_specs": self.platform_specs[platform.value],
            "viral_score": script.viral_score,
            "recommendations": self._get_recommendations(category, platform),
        }
    
    def _get_recommendations(
        self,
        category: ContentCategory,
        platform: Platform
    ) -> List[str]:
        """Get platform-specific recommendations"""
        
        base_recommendations = [
            "Post consistently 3-5 times per week",
            "Reply to comments within the first hour",
            "Use trending sounds and music",
            "Create multiple variations of same content",
        ]
        
        category_recommendations = {
            ContentCategory.EDUCATIONAL: [
                "Include surprising statistics",
                "Make it relatable to daily life",
                "Use clear visuals for concepts",
            ],
            ContentCategory.ENTERTAINMENT: [
                "Keep people watching until end",
                "Build anticipation and suspense",
                "End with unexpected twist",
            ],
            ContentCategory.DIY_CRAFTS: [
                "Show all materials upfront",
                "Use closeup shots of details",
                "Include final reveal moment",
            ],
            ContentCategory.ANIMALS: [
                "Capture genuine cute moments",
                "Include surprising facts",
                "Encourage sharing and engagement",
            ],
            ContentCategory.CHALLENGES: [
                "Encourage duets and stitches",
                "Show authentic reactions",
                "Make it safe and achievable",
            ],
        }
        
        platform_recommendations = {
            Platform.TIKTOK.value: [
                "Use trending TikTok sounds in first 3 seconds",
                "Keep under 30 seconds for maximum reach",
                "Enable duets and stitches",
                "Post at 2-4 PM or 7-9 PM",
            ],
            Platform.YOUTUBE_SHORTS.value: [
                "Create engaging thumbnail",
                "Use YouTube trending audio",
                "Optimize for YouTube's algorithm",
            ],
            Platform.INSTAGRAM_REELS.value: [
                "Use platform's trending audio",
                "Engage in comments section actively",
                "Post during peak hours (11 AM - 2 PM)",
            ],
        }
        
        recommendations = base_recommendations
        recommendations.extend(category_recommendations.get(category, []))
        recommendations.extend(platform_recommendations.get(platform.value, []))
        
        return recommendations


def main():
    """Example usage of advanced generator"""
    
    generator = AdvancedVideoGenerator()
    
    print("=" * 70)
    print("ADVANCED VIDEO GENERATION SYSTEM")
    print("=" * 70)
    
    # Generate complete spec for a video
    print("\n📝 Generating Complete Video Specification...\n")
    
    spec = generator.generate_complete_video_spec(
        topic="Amazing Animal Facts",
        category=ContentCategory.ANIMALS,
        platform=Platform.TIKTOK,
        target_age=(6, 12)
    )
    
    print(f"✅ Video Topic: {spec['topic']}")
    print(f"📱 Platform: {spec['platform'].upper()}")
    print(f"👥 Target Age: {spec['target_age'][0]}-{spec['target_age'][1]} years")
    print(f"🔥 Viral Score: {spec['viral_score']:.2%}")
    
    print("\n" + "=" * 70)
    print("SCRIPT")
    print("=" * 70)
    script = spec['script']
    print(f"📌 Hook: {script['hook']}")
    print(f"📄 Title: {script['title']}")
    print(f"⏱️  Timing: Hook {script['timing']['hook']}s, Body {script['timing']['body']}s, CTA {script['timing']['cta']}s")
    print(f"\n🎬 B-Roll Suggestions: {', '.join(script['suggested_b_roll'])}")
    print(f"\n💡 Emphasis Points:")
    for point in script['emphasis_points'][:3]:
        print(f"  • {point}")
    
    print("\n" + "=" * 70)
    print("MUSIC RECOMMENDATION")
    print("=" * 70)
    music = spec['music']
    print(f"🎵 Genre: {music['genre']}")
    print(f"🎼 Tempo: {music['tempo']} BPM")
    print(f"⚡ Energy Level: {music['energy_level'].upper()}")
    print(f"🎙️  Suggested Artists: {', '.join(music['suggested_artists'][:3])}")
    print(f"🏷️  Keywords: {', '.join(music['keywords'])}")
    
    print("\n" + "=" * 70)
    print("THUMBNAIL SPECIFICATION")
    print("=" * 70)
    print(spec['thumbnail_prompt'][:200] + "...")
    
    print("\n" + "=" * 70)
    print("PLATFORM SPECIFICATIONS")
    print("=" * 70)
    platform_spec = spec['platform_specs']
    print(f"⏱️  Duration: {platform_spec['min_duration']}-{platform_spec['max_duration']}s (Recommended: {platform_spec['recommended_duration']}s)")
    print(f"📐 Aspect Ratio: {platform_spec['aspect_ratio']}")
    print(f"🕐 Best Posting Hours: {platform_spec['optimal_posting_hours']}")
    
    print("\n" + "=" * 70)
    print("RECOMMENDATIONS")
    print("=" * 70)
    for i, rec in enumerate(spec['recommendations'][:5], 1):
        print(f"{i}. {rec}")
    
    # Save to JSON
    print("\n" + "=" * 70)
    with open("video_spec.json", "w") as f:
        json.dump(spec, f, indent=2)
    print("✅ Saved to: video_spec.json")


if __name__ == "__main__":
    main()

"""
Kids Video Generator - AI-Powered Viral Content Creator
Generate engaging, age-appropriate viral videos for children using AI
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from trending import TrendingFetcher


@dataclass
class VideoTemplate:
    """Template for viral kids video content"""
    id: str
    name: str
    category: str
    duration: int  # seconds
    target_age: tuple  # (min, max)
    script: str
    hooks: List[str]  # Viral engagement hooks
    music_style: str
    color_scheme: List[str]
    animation_style: str
    engagement_factor: float  # 0-1 probability of going viral


@dataclass
class GeneratedVideo:
    """Generated video metadata"""
    id: str
    template_id: str
    title: str
    description: str
    script: str
    thumbnail_prompt: str
    music_keywords: List[str]
    hashtags: List[str]
    target_platform: str  # TikTok, YouTube, Instagram, etc.
    created_at: str


class KidsVideoGenerator:
    """Main video generation engine"""
    
    def __init__(self):
        self.templates = self._load_templates()
        self.viral_hooks = self._init_viral_hooks()
        self.music_library = self._init_music_library()
        
    def _load_templates(self) -> Dict[str, VideoTemplate]:
        """Load viral video templates optimized for kids"""
        templates = {
            "learn-facts": VideoTemplate(
                id="learn-facts-001",
                name="Amazing Facts",
                category="educational",
                duration=15,
                target_age=(5, 12),
                script="""
                [HOOK: 0-2s] "Wait until you see THIS! 🤯"
                [CONTENT: 2-10s] Interesting fact with visuals and animations
                [TWIST: 10-13s] "You probably didn't know this!"
                [CTA: 13-15s] "Like + Subscribe for more mind-blowing facts!"
                """,
                hooks=[
                    "Wait until you see THIS!",
                    "This blew my mind!",
                    "You won't believe what happens next!",
                    "Nobody talks about THIS!",
                    "This is absolutely insane!"
                ],
                music_style="upbeat-modern-electronic",
                color_scheme=["#FF6B35", "#F7931E", "#FBB040", "#4ECDC4"],
                animation_style="motion-graphics-vibrant",
                engagement_factor=0.87
            ),
            "challenge": VideoTemplate(
                id="challenge-001",
                name="Fun Challenge",
                category="entertainment",
                duration=20,
                target_age=(6, 15),
                script="""
                [INTRO: 0-2s] "Can YOU do this challenge?"
                [CHALLENGE: 2-16s] Step-by-step challenge demonstration
                [REACTION: 16-18s] Funny or surprising outcome
                [OUTRO: 18-20s] "Tag someone who needs to try this!"
                """,
                hooks=[
                    "Can YOU do this challenge?",
                    "I bet you can't do this!",
                    "Challenge: ACCEPTED",
                    "This challenge went WRONG!",
                    "Let's see who can do this!"
                ],
                music_style="upbeat-pop",
                color_scheme=["#FF1493", "#FFD700", "#00FF00", "#00CED1"],
                animation_style="dynamic-cuts-transitions",
                engagement_factor=0.92
            ),
            "storytelling": VideoTemplate(
                id="story-001",
                name="Quick Story",
                category="storytelling",
                duration=30,
                target_age=(4, 14),
                script="""
                [HOOK: 0-2s] Intriguing question or statement
                [SETUP: 2-8s] Establish characters and situation
                [CONFLICT: 8-20s] Problem or interesting twist
                [RESOLUTION: 20-28s] Surprising or satisfying ending
                [MORAL: 28-30s] Simple lesson or reflection
                """,
                hooks=[
                    "This story taught me something important...",
                    "I never expected THIS ending!",
                    "Wait... did that really just happen?",
                    "This made me think...",
                    "The twist at the end though! 😱"
                ],
                music_style="emotional-cinematic",
                color_scheme=["#2C3E50", "#E74C3C", "#ECF0F1", "#3498DB"],
                animation_style="cinematic-narrative",
                engagement_factor=0.85
            ),
            "DIY-craft": VideoTemplate(
                id="diy-001",
                name="Easy DIY Project",
                category="educational-creative",
                duration=45,
                target_age=(7, 16),
                script="""
                [INTRO: 0-3s] "Make this awesome DIY project!"
                [MATERIALS: 3-8s] Quick materials overview
                [STEPS: 8-40s] Step-by-step instructions with closeups
                [RESULT: 40-43s] Showcase final amazing result
                [INSPIRE: 43-45s] "Share your creation! #DIYKids"
                """,
                hooks=[
                    "This DIY is INSANE and so easy!",
                    "Watch me make something AMAZING!",
                    "I can't believe this actually works!",
                    "You can make this in 5 minutes!",
                    "This is the coolest DIY ever!"
                ],
                music_style="creative-upbeat",
                color_scheme=["#FF6B9D", "#C06C84", "#6C5B7B", "#355C7D"],
                animation_style="split-screen-focus",
                engagement_factor=0.89
            ),
            "animals": VideoTemplate(
                id="animals-001",
                name="Cute Animal Facts",
                category="educational",
                duration=15,
                target_age=(3, 10),
                script="""
                [HOOK: 0-2s] "This animal is SO cute!"
                [FACT1: 2-5s] Interesting fact about the animal
                [FACT2: 5-8s] Another surprising fact
                [BEHAVIOR: 8-12s] Show cute behavior or animation
                [OUTRO: 12-15s] "Tag your favorite animal!"
                """,
                hooks=[
                    "This animal is the CUTEST thing ever!",
                    "I didn't know animals could do THIS!",
                    "This just melted my heart! 🥰",
                    "The cutest animals in the world!",
                    "You've NEVER seen this animal fact!"
                ],
                music_style="sweet-playful",
                color_scheme=["#FFB6C1", "#FFDAB9", "#FFE4B5", "#FFE4E1"],
                animation_style="cute-illustrations",
                engagement_factor=0.90
            )
        }
        return templates
    
    def _init_viral_hooks(self) -> List[str]:
        """Initialize proven viral engagement hooks"""
        return [
            "Wait until you see THIS!",
            "This is INSANE!",
            "I can't believe this is real!",
            "You won't BELIEVE what happens!",
            "This made me cry!",
            "Nobody talks about this!",
            "EVERYONE is doing this now!",
            "This broke the INTERNET!",
            "I'm SHOOK!",
            "This is LEGENDARY!",
            "Watch until the END!",
            "Tag someone who NEEDS to see this!",
            "This is actually CRAZY!",
            "I tried this and WOW!",
            "The ending though! 🤯"
        ]
    
    def _init_music_library(self) -> Dict[str, List[str]]:
        """Initialize music recommendations by style"""
        return {
            "upbeat-modern-electronic": [
                "trendy-synth-pop",
                "modern-disco",
                "digital-uplifting",
                "synth-wave"
            ],
            "upbeat-pop": [
                "pop-dance",
                "feel-good-pop",
                "party-pop",
                "mainstream-pop"
            ],
            "emotional-cinematic": [
                "orchestral-emotional",
                "cinematic-strings",
                "touching-piano",
                "motivational-epic"
            ],
            "creative-upbeat": [
                "playful-acoustic",
                "creative-indie",
                "upbeat-indie",
                "fun-creative"
            ],
            "sweet-playful": [
                "cute-ukulele",
                "playful-strings",
                "sweet-bells",
                "joyful-acoustic"
            ]
        }
    
    def generate_video(
        self,
        template_id: str,
        topic: str,
        target_platform: str = "TikTok",
        custom_hooks: Optional[List[str]] = None
    ) -> GeneratedVideo:
        """Generate a complete video concept"""
        
        if template_id not in self.templates:
            # Try to find by category if full ID not found
            for key in self.templates.keys():
                if template_id in key or key in template_id:
                    template_id = key
                    break
            else:
                raise ValueError(f"Template {template_id} not found")
        
        template = self.templates[template_id]
        
        # Generate title
        title = self._generate_title(template, topic)
        
        # Generate description
        description = self._generate_description(template, topic)
        
        # Customize script
        script = self._customize_script(template, topic, custom_hooks or [])
        
        # Generate thumbnail prompt
        thumbnail_prompt = self._generate_thumbnail_prompt(template, topic)
        
        # Get music keywords
        music_keywords = self.music_library.get(template.music_style, [])
        
        # Generate hashtags
        hashtags = self._generate_hashtags(topic, template.category)
        
        # Create video object
        video = GeneratedVideo(
            id=f"video-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            template_id=template_id,
            title=title,
            description=description,
            script=script,
            thumbnail_prompt=thumbnail_prompt,
            music_keywords=music_keywords,
            hashtags=hashtags,
            target_platform=target_platform,
            created_at=datetime.now().isoformat()
        )
        
        return video
    
    def _generate_title(self, template: VideoTemplate, topic: str) -> str:
        """Generate engaging title"""
        templates_titles = [
            f"{topic} - You WON'T BELIEVE THIS!",
            f"The MOST AMAZING {topic}!",
            f"{topic} CHALLENGE - GONE WRONG!",
            f"I Tried {topic} And... WOW!",
            f"NOBODY Knows About This {topic}!",
            f"This {topic} Blew My MIND! 🤯"
        ]
        return templates_titles[hash(topic) % len(templates_titles)]
    
    def _generate_description(self, template: VideoTemplate, topic: str) -> str:
        """Generate video description"""
        return f"""
🎬 Get ready for an AMAZING {template.category.upper()} video about {topic}!

👕 Perfect for kids ages {template.target_age[0]}-{template.target_age[1]}
⏱️ {template.duration} seconds of pure entertainment

Don't forget to:
✅ LIKE this video
✅ SUBSCRIBE for more amazing content
✅ COMMENT your thoughts
✅ SHARE with your friends

#Kids #Viral #{topic.replace(' ', '')}
        """.strip()
    
    def _customize_script(
        self,
        template: VideoTemplate,
        topic: str,
        custom_hooks: List[str]
    ) -> str:
        """Customize script with topic and hooks"""
        hooks = custom_hooks or template.hooks
        selected_hook = hooks[hash(topic) % len(hooks)]
        
        script = template.script.replace("[TOPIC]", topic)
        script = script.replace("[HOOK_MESSAGE]", selected_hook)
        
        return script
    
    def _generate_thumbnail_prompt(self, template: VideoTemplate, topic: str) -> str:
        """Generate AI thumbnail prompt"""
        return f"""
Create a vibrant, eye-catching thumbnail for kids video content:
- Topic: {topic}
- Style: {template.animation_style}
- Colors: {', '.join(template.color_scheme)}
- Must be: Attention-grabbing, age-appropriate, high-contrast
- Include: Surprised/excited expression, large text overlay
- Target: Kids ages {template.target_age[0]}-{template.target_age[1]}
        """.strip()
    
    def _generate_hashtags(self, topic: str, category: str) -> List[str]:
        """Generate trending hashtags"""
        base_hashtags = [
            "#FYP", "#ForYou", "#Viral", "#Kids", "#Trending",
            f"#{topic.replace(' ', '')}", f"#Kids{category.title().replace('-', '')}",
            "#MustWatch", "#OMG", "#Wow", "#Amazing", "#BlowsMyMind"
        ]
        return base_hashtags[:15]
    
    def generate_batch(
        self,
        topics: Optional[List[str]] = None,
        template_ids: Optional[List[str]] = None,
        use_trending: bool = False,
        trending_source: Optional[str] = None,
        max_topics: int = 10,
        safe_filter: bool = True
    ) -> List[GeneratedVideo]:
        """Generate multiple videos at once.

        Parameters:
        - topics: optional list of topic strings. If omitted and use_trending=True, topics
          will be seeded from trending sources.
        - template_ids: optional list of template keys to choose from.
        - use_trending: when True and topics is None or empty, seed topics from trending.
        - trending_source: path to a local JSON/CSV file or 'pytrends' to use pytrends (optional).
        - max_topics: maximum number of topics to fetch from trending sources.
        - safe_filter: basic safe-filtering to remove obviously adult/unsafe topics.
        """
        if template_ids is None:
            template_ids = list(self.templates.keys())

        # If no topics provided and trending requested, try to fetch
        if (not topics or len(topics) == 0) and use_trending:
            fetcher = TrendingFetcher()
            fetched: List[str] = []
            if trending_source == "pytrends":
                fetched = fetcher.get_from_pytrends()
            elif trending_source and os.path.exists(trending_source):
                if trending_source.lower().endswith(".json"):
                    fetched = fetcher.get_from_local_json(trending_source)
                else:
                    fetched = fetcher.get_from_local_csv(trending_source)
            else:
                # default fallback to local sample file
                fetched = fetcher.get_from_local_json("trending_sample.json")

            topics = fetched[:max_topics] if fetched else []

        if not topics:
            return []

        # Basic safety filter
        if safe_filter:
            blacklist = [
                "adult", "nsfw", "sex", "violence", "gambling", "drugs", "kill", "murder"
            ]
            filtered = []
            for t in topics:
                low = t.lower()
                if any(b in low for b in blacklist):
                    continue
                filtered.append(t)
            topics = filtered

        videos: List[GeneratedVideo] = []
        for topic in topics:
            template_id = template_ids[hash(topic) % len(template_ids)]
            video = self.generate_video(template_id, topic)
            videos.append(video)

        return videos
    
    def export_video_plan(self, videos: List[GeneratedVideo]) -> str:
        """Export videos as JSON plan"""
        return json.dumps(
            [asdict(v) for v in videos],
            indent=2
        )
    
    def get_viral_metrics(self, template_id: str) -> Dict:
        """Get predicted viral metrics for a template"""
        if template_id not in self.templates:
            # Try to find by category if full ID not found
            for key in self.templates.keys():
                if template_id in key or key in template_id:
                    template_id = key
                    break
            else:
                raise ValueError(f"Template {template_id} not found")
        
        template = self.templates[template_id]
        
        return {
            "template_id": template_id,
            "template_name": template.name,
            "viral_potential": f"{template.engagement_factor * 100:.1f}%",
            "estimated_views": int(10000 * template.engagement_factor),
            "estimated_engagement_rate": f"{(15 + template.engagement_factor * 10):.1f}%",
            "best_time_to_post": "2-4 PM or 7-9 PM (Peak hours)",
            "recommended_platforms": ["TikTok", "YouTube Shorts", "Instagram Reels"],
            "average_watch_time": f"{template.duration * 0.75:.0f}s",
            "predicted_shares": int(100 * template.engagement_factor)
        }


def main():
    """Example usage"""
    generator = KidsVideoGenerator()
    
    # Example: Generate single video
    print("=" * 60)
    print("KIDS VIDEO GENERATOR - Viral Content Creator")
    print("=" * 60)
    
    # Generate a video about animals
    video = generator.generate_video(
        template_id="animals-001",
        topic="Cute Puppies",
        target_platform="TikTok"
    )
    
    print(f"\n📱 Generated Video: {video.title}")
    print(f"📝 Description:\n{video.description}")
    print(f"\n🎬 Script:\n{video.script}")
    print(f"\n🎵 Music: {', '.join(video.music_keywords)}")
    print(f"\n#️⃣ Hashtags: {' '.join(video.hashtags)}")
    
    # Show viral metrics
    print("\n" + "=" * 60)
    print("VIRAL POTENTIAL METRICS")
    print("=" * 60)
    metrics = generator.get_viral_metrics("animals-001")
    for key, value in metrics.items():
        print(f"{key.replace('_', ' ').title()}: {value}")
    
    # Generate batch of videos
    print("\n" + "=" * 60)
    print("BATCH GENERATION")
    print("=" * 60)
    topics = [
        "Funny Cats",
        "Amazing DIY Project",
        "Science Experiment",
        "Magic Trick",
        "Animal Facts"
    ]
    
    batch_videos = generator.generate_batch(topics)
    print(f"\n✅ Generated {len(batch_videos)} video concepts!")
    for i, v in enumerate(batch_videos, 1):
        print(f"{i}. {v.title}")
    
    # Export to JSON
    print("\n" + "=" * 60)
    print("SAVING VIDEO PLAN")
    print("=" * 60)
    json_plan = generator.export_video_plan(batch_videos)
    with open("video_plan.json", "w") as f:
        f.write(json_plan)
    print("✅ Saved to: video_plan.json")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Manim animation for "Twinkle, Twinkle, Little Star" nursery rhyme video
1-minute animation with 60 FPS output
"""

from manim import *
from manim.utils.color.core import randomColor
import numpy as np

class TwinkleTwinkleAnimation(Scene):
    def construct(self):
        self.camera.background_color = "#0a0e27"  # Dark night sky
        
        # 0:00–0:05 Opening: Night sky with smiling moon and sparkling stars
        self.opening_scene()
        
        # 0:05–0:10 "Twinkle, twinkle, little star"
        self.star_appears()
        
        # 0:10–0:15 "How I wonder what you are"
        self.child_wonders()
        
        # 0:15–0:20 "Up above the world so high"
        self.fly_upward()
        
        # 0:20–0:25 "Like a diamond in the sky"
        self.star_diamond()
        
        # 0:25–0:35 Instrumental Break: Animals dance
        self.animals_dance()
        
        # 0:35–0:45 Repeat Verse: Star leads dance
        self.star_leads_dance()
        
        # 0:45–0:55 Finale: Fireflies and child
        self.finale_scene()
        
        # 0:55–1:00 Ending: Good Night text and fade
        self.ending_scene()

    def opening_scene(self):
        """0:00–0:05 Opening with moon and sparkling stars"""
        # Create moon
        moon = Circle(radius=0.6, color=YELLOW_A, fill_opacity=1)
        moon.shift(UP * 2 + RIGHT * 2.5)
        
        # Moon face
        left_eye = Circle(radius=0.12, color=BLACK, fill_opacity=1).shift(LEFT * 0.2)
        right_eye = Circle(radius=0.12, color=BLACK, fill_opacity=1).shift(RIGHT * 0.2)
        mouth = Arc(radius=0.2, angle=PI, color=BLACK, stroke_width=2).shift(DOWN * 0.15)
        
        moon_face = VGroup(moon, left_eye, right_eye, mouth).move_to(moon.get_center())
        
        # Sparkling stars background
        stars = VGroup()
        np.random.seed(42)
        for i in range(12):
            x = np.random.uniform(-6, 6)
            y = np.random.uniform(1, 3.5)
            star = Star(outer_radius=0.15, inner_radius=0.08, color=YELLOW, fill_opacity=0.8)
            star.move_to(np.array([x, y, 0]))
            stars.add(star)
        
        # Child at window
        window = Rectangle(width=2, height=2.5, color=BLUE_E, fill_opacity=0.3)
        window.to_edge(DOWN).to_edge(LEFT)
        
        child_head = Circle(radius=0.35, color=ORANGE, fill_opacity=1).move_to(DOWN * 2 + LEFT * 4)
        child_body = Rectangle(width=0.5, height=0.8, color=RED_C, fill_opacity=1).next_to(child_head, DOWN, buff=0)
        
        child = VGroup(child_head, child_body)
        
        # Animations
        self.add(window)
        self.play(FadeIn(moon_face), run_time=1)
        self.play(LaggedStartMap(FadeIn, stars, lag_ratio=0.1), run_time=1.5)
        self.play(LaggedStartMap(Flash, stars, lag_ratio=0.2, run_time=0.5), run_time=2)
        self.play(FadeIn(child), run_time=1)
        self.wait(1)

    def star_appears(self):
        """0:05–0:10 Cute golden star appears and waves"""
        main_star = Star(outer_radius=0.5, inner_radius=0.25, color=YELLOW_D, fill_opacity=1)
        main_star.move_to(UP * 1.5 + RIGHT * 2)
        
        # Star expression (eyes)
        left_eye = Dot(radius=0.08, color=BLACK).move_to(main_star.get_center() + LEFT * 0.15 + UP * 0.2)
        right_eye = Dot(radius=0.08, color=BLACK).move_to(main_star.get_center() + RIGHT * 0.15 + UP * 0.2)
        mouth = Arc(radius=0.12, angle=PI/2, color=BLACK, stroke_width=2).move_to(main_star.get_center() + DOWN * 0.1)
        
        star_face = VGroup(main_star, left_eye, right_eye, mouth)
        
        self.play(FadeIn(star_face), run_time=1)
        self.play(Rotate(star_face, angle=PI/6, run_time=0.5), Rotate(star_face, angle=-PI/3, run_time=1))
        
        # Sparkle effect
        sparkles = VGroup()
        for angle in [0, PI/2, PI, 3*PI/2]:
            sparkle = Star(outer_radius=0.15, inner_radius=0.07, color=YELLOW_A, fill_opacity=0.6)
            sparkle.move_to(star_face.get_center() + 0.8 * np.array([np.cos(angle), np.sin(angle), 0]))
            sparkles.add(sparkle)
        
        self.play(LaggedStartMap(FadeIn, sparkles, lag_ratio=0.1), run_time=1)
        self.wait(1)

    def child_wonders(self):
        """0:10–0:15 Child points and thinks, thought bubbles appear"""
        # Child pointing (arm up)
        arm = Line(start=DOWN * 1.5 + LEFT * 3.7, end=DOWN * 0.5 + LEFT * 3, color=ORANGE, stroke_width=3)
        
        self.play(FadeIn(arm), run_time=0.5)
        
        # Thought bubbles
        thought_positions = [UP * 0.5, UP * 1.5 + RIGHT * 0.5, UP * 0.5 + RIGHT * 1.5]
        thought_items = ["⭐", "🪐", "🚀"]  # Star, Planet, Rocket (represented as text)
        
        bubbles = VGroup()
        for i, pos in enumerate(thought_positions):
            bubble = Circle(radius=0.3, color=LIGHT_BLUE, fill_opacity=0.5, stroke_width=2)
            bubble.move_to(pos)
            text = Text(thought_items[i], font_size=24, color=BLUE)
            text.move_to(bubble.get_center())
            bubbles.add(VGroup(bubble, text))
        
        self.play(LaggedStartMap(FadeIn, bubbles, lag_ratio=0.3), run_time=1.5)
        self.wait(1.5)

    def fly_upward(self):
        """0:15–0:20 Camera rises through clouds toward the star"""
        # Clear previous objects
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)
        
        # Redraw background
        stars = VGroup()
        np.random.seed(42)
        for i in range(8):
            x = np.random.uniform(-6, 6)
            y = np.random.uniform(-2, 3)
            star = Star(outer_radius=0.12, inner_radius=0.06, color=YELLOW, fill_opacity=0.6)
            star.move_to(np.array([x, y, 0]))
            stars.add(star)
        
        self.add(stars)
        
        # Main star in distance
        distant_star = Star(outer_radius=0.3, inner_radius=0.15, color=YELLOW_D, fill_opacity=1)
        distant_star.move_to(UP * 3.5)
        self.add(distant_star)
        
        # Flying birds
        for i in range(3):
            bird_x = -5 + i * 3
            bird = Text("🐦", font_size=20)
            bird.move_to(np.array([bird_x, 0, 0]))
            self.add(bird)
            self.play(bird.animate.shift(RIGHT * 3), run_time=1.5)
        
        # Upward camera movement (zoom in on main star)
        self.play(self.camera.frame.animate.scale(1.3).move_to(distant_star.get_center()), run_time=2)
        self.wait(1)

    def star_diamond(self):
        """0:20–0:25 Star transforms into diamond with sparkles"""
        # Create diamond shape
        diamond = Polygon(
            np.array([0, 0.8, 0]), np.array([0.8, 0, 0]),
            np.array([0, -0.8, 0]), np.array([-0.8, 0, 0]),
            color=YELLOW_D, fill_opacity=1, stroke_width=2
        )
        diamond.move_to(UP * 2.5)
        
        # Sparkle particles around diamond
        sparkles = VGroup()
        for angle in np.linspace(0, 2*PI, 8, endpoint=False):
            sparkle = Star(outer_radius=0.1, inner_radius=0.05, color=YELLOW_A, fill_opacity=0.8)
            pos = diamond.get_center() + 1.2 * np.array([np.cos(angle), np.sin(angle), 0])
            sparkle.move_to(pos)
            sparkles.add(sparkle)
        
        self.play(FadeIn(diamond), run_time=0.5)
        self.play(LaggedStartMap(FadeIn, sparkles, lag_ratio=0.1), run_time=1)
        self.play(
            LaggedStartMap(lambda m: m.animate.scale(1.3).set_opacity(0.5), sparkles, lag_ratio=0.05),
            run_time=2
        )
        self.wait(1)

    def animals_dance(self):
        """0:25–0:35 Friendly animals dance beneath the stars"""
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)
        self.camera.frame.scale(0.8).move_to(ORIGIN)
        self.add(*self.mobjects)
        
        # Draw stars again
        stars = VGroup()
        np.random.seed(42)
        for i in range(10):
            x = np.random.uniform(-6, 6)
            y = np.random.uniform(0.5, 3)
            star = Star(outer_radius=0.1, inner_radius=0.05, color=YELLOW, fill_opacity=0.5)
            star.move_to(np.array([x, y, 0]))
            stars.add(star)
        
        self.add(stars)
        
        # Animals: owl, bunny, fox, hedgehog
        animals_text = ["🦉", "🐰", "🦊", "🦔"]
        positions = [LEFT * 3.5 + DOWN * 1.5, LEFT + DOWN * 1.5, RIGHT * 1.5 + DOWN * 1.5, RIGHT * 3.5 + DOWN * 1.5]
        
        animals = VGroup()
        for animal, pos in zip(animals_text, positions):
            animal_mob = Text(animal, font_size=40)
            animal_mob.move_to(pos)
            animals.add(animal_mob)
            self.add(animal_mob)
        
        # Bouncing animation
        for _ in range(2):
            self.play(
                LaggedStartMap(lambda m: m.animate.shift(UP * 0.5), animals, lag_ratio=0.1),
                run_time=0.8
            )
            self.play(
                LaggedStartMap(lambda m: m.animate.shift(DOWN * 0.5), animals, lag_ratio=0.1),
                run_time=0.8
            )
        
        self.wait(1)

    def star_leads_dance(self):
        """0:35–0:45 Star leads animals in joyful dance with glitter trail"""
        # Main star returns
        main_star = Star(outer_radius=0.35, inner_radius=0.18, color=YELLOW_D, fill_opacity=1)
        main_star.move_to(UP * 2 + RIGHT * 2)
        
        self.play(FadeIn(main_star), run_time=0.5)
        
        # Glitter trail following star
        path_points = [UP * 2 + RIGHT * 2, UP * 2.5, UP * 2.5 + LEFT * 2, DOWN * 0.5 + LEFT * 2.5]
        
        trail = VGroup()
        for pt in path_points:
            sparkle = Star(outer_radius=0.08, inner_radius=0.04, color=YELLOW_A, fill_opacity=0.6)
            sparkle.move_to(pt)
            trail.add(sparkle)
        
        # Animate star following path with trail
        self.play(
            main_star.animate.move_to(path_points[-1]),
            LaggedStartMap(FadeIn, trail, lag_ratio=0.1),
            run_time=3
        )
        
        self.wait(1.5)

    def finale_scene(self):
        """0:45–0:55 Fireflies glow and swirl, child waves goodnight"""
        # Fireflies
        fireflies = VGroup()
        for _ in range(8):
            x = np.random.uniform(-5, 5)
            y = np.random.uniform(-2, 3)
            firefly = Dot(radius=0.1, color=YELLOW_D, fill_opacity=1)
            firefly.move_to(np.array([x, y, 0]))
            fireflies.add(firefly)
            self.add(firefly)
        
        # Fireflies glow and move
        for _ in range(2):
            self.play(
                LaggedStartMap(lambda m: m.animate.scale(1.5).set_opacity(0.8), fireflies, lag_ratio=0.1),
                run_time=1
            )
            self.play(
                LaggedStartMap(lambda m: m.animate.shift(np.random.uniform(-0.5, 0.5) * np.array([1, 1, 0])), fireflies, lag_ratio=0.05),
                run_time=1
            )
        
        # Child waves from window
        child_wave_pos = DOWN * 2.5 + LEFT * 4.5
        child_text = Text("👋", font_size=50)
        child_text.move_to(child_wave_pos)
        
        self.play(FadeIn(child_text), run_time=1)
        self.play(Rotate(child_text, angle=PI/6, run_time=0.5), Rotate(child_text, angle=-PI/3, run_time=1))
        
        self.wait(1)

    def ending_scene(self):
        """0:55–1:00 Good Night text, star blinks, fade out"""
        # Good Night text
        goodbye_text = Text("Good Night!", font_size=50, color=YELLOW)
        goodbye_text.move_to(ORIGIN)
        
        self.play(FadeOut(Group(*[m for m in self.mobjects if m != goodbye_text])), run_time=0.5)
        self.play(FadeIn(goodbye_text), run_time=1)
        
        # Twinkling star
        star_final = Star(outer_radius=0.3, inner_radius=0.15, color=YELLOW_D, fill_opacity=1)
        star_final.next_to(goodbye_text, DOWN, buff=0.5)
        
        self.play(FadeIn(star_final), run_time=0.5)
        
        # Blink animation
        for _ in range(2):
            self.play(star_final.animate.set_opacity(0.2), run_time=0.3)
            self.play(star_final.animate.set_opacity(1), run_time=0.3)
        
        # Final fade out
        self.play(FadeOut(VGroup(goodbye_text, star_final)), run_time=1.5)
        self.wait(0.5)


if __name__ == "__main__":
    # Render command: manim -p -ql twinkle_star_animation.py TwinkleTwinkleAnimation
    # For higher quality: manim -p -qh twinkle_star_animation.py TwinkleTwinkleAnimation
    # For 1-minute video (60 FPS): manim -p -qh --fps 60 twinkle_star_animation.py TwinkleTwinkleAnimation
    pass

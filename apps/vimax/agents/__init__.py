# Lazy/optional imports for agent classes
# Some agents have heavy dependencies; only import when available
try:
    from .screenwriter import Screenwriter
except ImportError:
    Screenwriter = None

try:
    from .storyboard_artist import StoryboardArtist
except ImportError:
    StoryboardArtist = None

try:
    from .camera_image_generator import CameraImageGenerator
except ImportError:
    CameraImageGenerator = None

try:
    from .character_extractor import CharacterExtractor
except ImportError:
    CharacterExtractor = None

try:
    from .character_portraits_generator import CharacterPortraitsGenerator
except ImportError:
    CharacterPortraitsGenerator = None

try:
    from .reference_image_selector import ReferenceImageSelector
except ImportError:
    ReferenceImageSelector = None

__all__ = [
    "Screenwriter",
    "StoryboardArtist",
    "CameraImageGenerator",
    "CharacterExtractor",
    "CharacterPortraitsGenerator",
    "ReferenceImageSelector",
]
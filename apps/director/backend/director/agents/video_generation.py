import logging
import os
import uuid

from typing import Optional

from director.agents.base import BaseAgent, AgentResponse, AgentStatus
from director.core.session import Session, VideoContent, VideoData, MsgStatus
from director.tools.videodb_tool import VideoDBTool
from director.tools.muapi import (
    MuapiVideoTool,
    PARAMS_CONFIG as MUAPI_PARAMS_CONFIG,
)
from director.constants import DOWNLOADS_PATH

logger = logging.getLogger(__name__)

SUPPORTED_ENGINES = ["muapi"]

VIDEO_GENERATION_AGENT_PARAMETERS = {
    "type": "object",
    "properties": {
        "collection_id": {
            "type": "string",
            "description": "Collection ID to store the video",
        },
        "engine": {
            "type": "string",
            "description": "The video generation engine to use. Only MuAPI is supported, which includes Fal, LTX-Desktop, and Gemini models.",
            "default": "muapi",
            "enum": SUPPORTED_ENGINES,
        },
        "job_type": {
            "type": "string",
            "enum": ["text_to_video", "image_to_video"],
            "description": """
            The type of video generation to perform
            Possible values:
                - text_to_video: generates a video from a text prompt
                - image_to_video: generates a video using an image as a base. The feature is only available in fal engine. Stability AI or VideoDB does not support this feature.
            """,
        },
        "text_to_video": {
            "type": "object",
            "properties": {
                "prompt": {
                    "type": "string",
                    "description": "The text prompt to generate the video",
                },
                "name": {
                    "type": "string",
                    "description": "Description of the video generation run in two lines. Keep the engine name and parameter configuration of the engine in separate lines. Keep it short, but show the prompt in full. Here's an example: [Tokyo Sunset - Luma - Prompt: 'An aerial shot of a quiet sunset at Tokyo', Duration: 5s, Luma Dream Machine]",
                },
                "duration": {
                    "type": "number",
                    "description": "The duration of the video in seconds",
                    "default": 5,
                },
        "muapi_config": {
            "type": "object",
            "properties": MUAPI_PARAMS_CONFIG["text_to_video"],
            "description": "Config to use with MuAPI engine",
        },
            },
            "required": ["prompt", "name"],
        },
        "image_to_video": {
            "type": "object",
            "properties": {
                "image_id": {
                    "type": "string",
                    "description": "The ID of the image in VideoDB to use for video generation",
                },
                "name": {
                    "type": "string",
                    "description": "Description of the video generation run",
                },
                "prompt": {
                    "type": "string",
                    "description": "Text prompt to guide the video generation",
                },
                "duration": {
                    "type": "number",
                    "description": "The duration of the video in seconds",
                    "default": 5,
                },
                "muapi_config": {
                    "type": "object",
                    "properties": MUAPI_PARAMS_CONFIG["image_to_video"],
                    "description": "Config to use with MuAPI engine",
                },
            },
            "required": ["prompt", "image_id", "name"],
        },
    },
    "required": ["job_type", "collection_id", "engine"],
}


class VideoGenerationAgent(BaseAgent):
    def __init__(self, session: Session, **kwargs):
        self.agent_name = "video_generation"
        self.description = "Creates videos using ONE specific model/engine. Only use this agent when the request mentions exactly ONE model/engine, without any comparison words like 'compare', 'test', 'versus', 'vs' and no connecting words (and/&/,) between model names. If the request mentions wanting to compare models or try multiple engines, do not use this agent - use the comparison agent instead."
        self.parameters = VIDEO_GENERATION_AGENT_PARAMETERS
        super().__init__(session=session, **kwargs)

    def run(
        self,
        collection_id: str,
        job_type: str,
        engine: str,
        text_to_video: Optional[dict] = None,
        image_to_video: Optional[dict] = None,
        *args,
        **kwargs,
    ) -> AgentResponse:
        """
        Generates video using MuAPI based on input text prompt or image.
        :param collection_id: The collection ID to store the generated video
        :param job_type: The type of video generation job to perform
        :param engine: The engine to use for video generation (only 'muapi' supported)
        :param text_to_video: The text to convert to video
        :param image_to_video: The image to convert to video
        :param args: Additional positional arguments
        :param kwargs: Additional keyword arguments
        :return: Response containing the generated video ID
        """
        video_content = None
        output_path = None
        try:
            media = None
            stealth_mode = kwargs.get("stealth_mode", False)

            # Initialize video_content early for error handling
            video_content = VideoContent(
                agent_name=self.agent_name,
                status=MsgStatus.progress,
                status_message="Processing...",
            )
            if not stealth_mode:
                self.output_message.content.append(video_content)

            if engine not in SUPPORTED_ENGINES:
                raise Exception(f"{engine} not supported")

            # Initialize VideoDB tool for storage operations
            self.videodb_tool = VideoDBTool(collection_id=collection_id)

            if engine == "muapi":
                # MuAPI uses Supabase proxy, no direct API key needed
                video_gen_tool = MuapiVideoTool()
                config_key = "muapi_config"
            else:
                raise Exception(f"{engine} not supported")

            os.makedirs(DOWNLOADS_PATH, exist_ok=True)
            if not os.access(DOWNLOADS_PATH, os.W_OK):
                raise PermissionError(
                    f"No write permission for output directory: {DOWNLOADS_PATH}"
                )
            output_file_name = f"video_{job_type}_{str(uuid.uuid4())}.mp4"
            output_path = f"{DOWNLOADS_PATH}/{output_file_name}"

            if job_type == "text_to_video":
                prompt = text_to_video.get("prompt")
                video_name = text_to_video.get("name")
                duration = text_to_video.get("duration", 5)
                config = text_to_video.get(config_key, {})
                if prompt is None:
                    raise Exception("Prompt is required for video generation")
                self.output_message.actions.append(
                    f"Generating video using <b>{engine}</b> for prompt <i>{prompt}</i>"
                )
                self.output_message.push_update()
                response = video_gen_tool.text_to_video(
                    prompt=prompt,
                    save_at=output_path,
                    duration=duration,
                    config=config,
                )

                if response:
                    media = response
            elif job_type == "image_to_video":
                image_id = image_to_video.get("image_id")
                video_name = image_to_video.get("name")
                duration = image_to_video.get("duration", 5)
                config = image_to_video.get(config_key, {})
                prompt = image_to_video.get("prompt")

                # Validate duration bounds
                if (
                    not isinstance(duration, (int, float))
                    or duration <= 0
                    or duration > 60
                ):
                    raise ValueError(
                        "Duration must be a positive number between 1 and 60 seconds"
                    )

                if not image_id:
                    raise ValueError(
                        "Missing required parameter: 'image_id' for image-to-video generation"
                    )

                image_data = self.videodb_tool.get_image(image_id)
                if not image_data:
                    raise ValueError(
                        f"Image with ID '{image_id}' not found in collection "
                        f"'{collection_id}'. Please verify the image ID."
                    )

                image_url = None
                if isinstance(image_data.get("url"), str) and image_data.get("url"):
                    image_url = image_data["url"]
                else:
                    image_url = self.videodb_tool.generate_image_url(image_id)

                if not image_url:
                    raise ValueError(
                        f"Image with ID '{image_id}' exists but has no "
                        f"associated URL. This might indicate data corruption."
                    )

                self.output_message.actions.append(
                    f"Generating video using <b>{engine}</b> for <a href='{image_url}'>url</a>"
                )
                if not stealth_mode:
                    self.output_message.push_update()

                video_gen_tool.image_to_video(
                    image_url=image_url,
                    save_at=output_path,
                    duration=duration,
                    config=config,
                    prompt=prompt,
                )
            else:
                raise Exception(f"{job_type} not supported")

            if media is None:
                self.output_message.actions.append(
                    f"Generated video saved at <i>{output_path}</i>"
                )
                self.output_message.push_update()
                media = self.videodb_tool.upload(
                    output_path,
                    source_type="file_path",
                    media_type="video",
                    name=video_name,
                )
                self.output_message.actions.append(
                    f"Uploaded generated video to VideoDB with Video ID {media['id']}"
                )

            stream_url = media["stream_url"]
            id = media["id"]
            collection_id = media["collection_id"]
            name = media["name"]
            video_content.video = VideoData(
                stream_url=stream_url,
                id=id,
                collection_id=collection_id,
                name=name,
            )
            video_content.status = MsgStatus.success
            video_content.status_message = "Here is your generated video"
            self.output_message.push_update()
            self.output_message.publish()

        except Exception as e:
            logger.exception(f"Error in {self.agent_name} agent: {e}")
            if video_content:
                video_content.status = MsgStatus.error
                video_content.status_message = "Failed to generate video"
                self.output_message.push_update()
            self.output_message.publish()
            return AgentResponse(status=AgentStatus.ERROR, message=str(e))

        finally:
            if output_path and os.path.exists(output_path):
                os.remove(output_path)

        return AgentResponse(
            status=AgentStatus.SUCCESS,
            message=f"Generated video ID {media['id']}",
            data={
                "video_id": media["id"],
                "video_stream_url": stream_url,
                "video_content": video_content,
            },
        )

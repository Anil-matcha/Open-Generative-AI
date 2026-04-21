import os
import requests
import time
from typing import Optional, Dict, Any


PARAMS_CONFIG = {
    "text_to_video": {
        "model": {
            "type": "string",
            "description": "The model to use for video generation",
            "default": "fal-ai/minimax-video",
            "enum": [
                "fal-ai/minimax-video",
                "fal-ai/mochi-v1",
                "fal-ai/hunyuan-video",
                "fal-ai/luma-dream-machine",
                "fal-ai/kling-video/v1/standard/text-to-video",
                "fal-ai/kling-video/v1.5/pro/text-to-video",
                "fal-ai/cogvideox-5b",
                "fal-ai/ltx-video",
                "fal-ai/fast-svd/text-to-video",
                "fal-ai/fast-svd-lcm/text-to-video",
                "fal-ai/t2v-turbo",
                "fal-ai/fast-animatediff/text-to-video",
                "fal-ai/fast-animatediff/turbo/text-to-video",
                "ltx-video/text-to-video",
                "gemini-video/text-to-video"
            ],
        },
        "aspect_ratio": {
            "type": "string",
            "description": "Aspect ratio for the video",
            "enum": ["16:9", "9:16", "1:1", "4:3", "3:4"],
            "default": "16:9"
        },
        "duration": {
            "type": "number",
            "description": "Duration of the video in seconds",
            "default": 5,
            "minimum": 1,
            "maximum": 60
        },
        "resolution": {
            "type": "string",
            "description": "Resolution of the video",
            "enum": ["480p", "720p", "1080p"],
            "default": "720p"
        }
    },
    "image_to_video": {
        "model": {
            "type": "string",
            "description": "The model to use for image-to-video generation",
            "default": "fal-ai/fast-svd-lcm",
            "enum": [
                "fal-ai/haiper-video/v2/image-to-video",
                "fal-ai/luma-dream-machine/image-to-video",
                "fal-ai/cogvideox-5b/image-to-video",
                "fal-ai/ltx-video/image-to-video",
                "fal-ai/stable-video",
                "fal-ai/fast-svd-lcm",
                "ltx-video/image-to-video",
                "gemini-video/image-to-video"
            ],
        },
        "aspect_ratio": {
            "type": "string",
            "description": "Aspect ratio for the video",
            "enum": ["16:9", "9:16", "1:1", "4:3", "3:4"],
            "default": "16:9"
        },
        "duration": {
            "type": "number",
            "description": "Duration of the video in seconds",
            "default": 5,
            "minimum": 1,
            "maximum": 60
        },
        "resolution": {
            "type": "string",
            "description": "Resolution of the video",
            "enum": ["480p", "720p", "1080p"],
            "default": "720p"
        }
    },
}


class MuapiVideoTool:
    def __init__(self, api_url: Optional[str] = None):
        self.api_url = api_url or os.getenv("VITE_MUAPI_URL", "https://api.muapi.ai")
        self.supabase_url = os.getenv("VITE_SUPABASE_URL")
        self.supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")

        if not self.supabase_url or not self.supabase_key:
            raise Exception("Supabase URL and key are required for MuAPI proxy")

        self.proxy_url = f"{self.supabase_url}/functions/v1/muapi-proxy"
        self.max_polling_time = 300  # 5 minutes
        self.polling_interval = 2  # seconds

    def _make_request(self, endpoint: str, params: Dict[str, Any], generation_type: str) -> Dict[str, Any]:
        """Make a request to MuAPI through the Supabase proxy"""
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.supabase_key}'
        }

        payload = {
            'endpoint': endpoint,
            'params': params,
            'generationType': generation_type,
            'studioType': 'video'
        }

        response = requests.post(self.proxy_url, json=payload, headers=headers)
        response.raise_for_status()

        result = response.json()
        self._validate_response(result, 'submit')

        return result

    def _poll_for_result(self, request_id: str) -> Dict[str, Any]:
        """Poll for the generation result"""
        start_time = time.time()

        while time.time() - start_time < self.max_polling_time:
            try:
                # Check status through proxy
                headers = {
                    'Authorization': f'Bearer {self.supabase_key}'
                }

                status_response = requests.get(
                    f"{self.proxy_url}/status/{request_id}",
                    headers=headers
                )

                if status_response.status_code == 200:
                    status_data = status_response.json()
                    if status_data.get('status') == 'completed':
                        return status_data
                    elif status_data.get('status') == 'failed':
                        raise Exception(f"Generation failed: {status_data.get('error', 'Unknown error')}")

                time.sleep(self.polling_interval)

            except requests.RequestException as e:
                raise Exception(f"Error polling for result: {str(e)}")

        raise Exception(f"Generation timed out after {self.max_polling_time} seconds")

    def _validate_response(self, response: Dict[str, Any], expected_type: str):
        """Validate the API response"""
        if not isinstance(response, dict):
            raise Exception(f"Invalid response format: expected dict, got {type(response)}")

        if expected_type == 'submit' and 'request_id' not in response and 'id' not in response:
            raise Exception("Response missing request_id or id field")

    def _download_video(self, video_url: str, save_path: str):
        """Download the generated video"""
        response = requests.get(video_url)
        response.raise_for_status()

        with open(save_path, 'wb') as f:
            f.write(response.content)

    def text_to_video(
        self, prompt: str, save_at: str, duration: float, config: dict
    ):
        """
        Generates a video from text prompt using MuAPI.
        """
        try:
            model = config.get("model", "fal-ai/minimax-video")
            params = {
                "prompt": prompt,
                "duration": duration,
            }

            # Add optional parameters
            if "aspect_ratio" in config:
                params["aspect_ratio"] = config["aspect_ratio"]
            if "resolution" in config:
                params["resolution"] = config["resolution"]
            if "quality" in config:
                params["quality"] = config["quality"]

            # Submit generation request
            submit_result = self._make_request(model, params, 'video')

            # Get request ID
            request_id = submit_result.get('request_id') or submit_result.get('id')
            if not request_id:
                # If no request_id, assume the result is already complete
                video_url = submit_result.get('outputs', [None])[0] or submit_result.get('url')
                if video_url:
                    self._download_video(video_url, save_at)
                    return {"status": "success", "video_path": save_at}
                else:
                    raise Exception("No video URL in response")

            # Poll for completion
            result = self._poll_for_result(request_id)

            # Get video URL and download
            video_url = result.get('outputs', [None])[0] or result.get('url') or result.get('output', {}).get('url')
            if not video_url:
                raise Exception("No video URL in completed result")

            self._download_video(video_url, save_at)

        except Exception as e:
            raise Exception(f"Error generating video: {type(e).__name__}: {str(e)}")

        return {"status": "success", "video_path": save_at}

    def image_to_video(
        self,
        image_url: str,
        save_at: str,
        duration: float,
        config: dict,
        prompt: Optional[str] = None,
    ):
        """
        Generate video from an image URL using MuAPI.
        """
        try:
            model = config.get("model", "fal-ai/fast-svd-lcm")
            params = {
                "image_url": image_url,
                "duration": duration,
            }

            if prompt:
                params["prompt"] = prompt

            # Add optional parameters
            if "aspect_ratio" in config:
                params["aspect_ratio"] = config["aspect_ratio"]
            if "resolution" in config:
                params["resolution"] = config["resolution"]
            if "quality" in config:
                params["quality"] = config["quality"]

            # Submit generation request
            submit_result = self._make_request(model, params, 'i2v')

            # Get request ID
            request_id = submit_result.get('request_id') or submit_result.get('id')
            if not request_id:
                # If no request_id, assume the result is already complete
                video_url = submit_result.get('outputs', [None])[0] or submit_result.get('url')
                if video_url:
                    self._download_video(video_url, save_at)
                    return {"status": "success", "video_path": save_at}
                else:
                    raise Exception("No video URL in response")

            # Poll for completion
            result = self._poll_for_result(request_id)

            # Get video URL and download
            video_url = result.get('outputs', [None])[0] or result.get('url') or result.get('output', {}).get('url')
            if not video_url:
                raise Exception("No video URL in completed result")

            self._download_video(video_url, save_at)

        except Exception as e:
            raise Exception(f"Error generating video: {type(e).__name__}: {str(e)}")

        return {"status": "success", "video_path": save_at}
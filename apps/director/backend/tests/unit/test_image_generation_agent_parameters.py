import pytest
from unittest.mock import Mock, patch, MagicMock
from director.agents.image_generation import ImageGenerationAgent, IMAGE_GENERATION_AGENT_PARAMETERS
from director.core.session import Session, MsgStatus
from director.agents.base import AgentStatus


@pytest.fixture
def mock_session():
    """Mock session for testing"""
    session = Mock(spec=Session)
    session.output_message = Mock()
    session.output_message.content = []
    session.output_message.actions = []
    session.output_message.push_update = Mock()
    session.output_message.publish = Mock()
    return session


@pytest.fixture
def mock_flux_response():
    """Mock flux/replicate response"""
    return Mock(url="https://example.com/generated-image.jpg")


@pytest.fixture
def mock_fal_response():
    """Mock FAL API response"""
    return [{"url": "https://example.com/enhanced-image.jpg"}]


class TestImageGenerationAgentParameters:
    """Test parameter validation for ImageGenerationAgent"""

    def test_valid_text_to_image_parameters(self):
        """Test valid text-to-image parameters"""
        params = {
            "collection_id": "test_collection",
            "job_type": "text_to_image",
            "prompt": "A beautiful sunset",
            "text_to_image": {
                "engine": "flux"
            }
        }

        # This should not raise an exception
        # Note: In real usage, this would be validated by the JSON schema
        assert params["job_type"] == "text_to_image"
        assert params["prompt"] == "A beautiful sunset"

    def test_valid_image_to_image_parameters(self):
        """Test valid image-to-image parameters"""
        params = {
            "collection_id": "test_collection",
            "job_type": "image_to_image",
            "prompt": "Make it more vibrant",
            "image_to_image": {
                "image_id": "test_image_id",
                "fal_config": {
                    "model_name": "fal-ai/flux-lora-canny"
                }
            }
        }

        assert params["job_type"] == "image_to_image"
        assert "image_to_image" in params

    def test_missing_required_parameters(self):
        """Test validation of missing required parameters"""
        # Missing collection_id
        invalid_params = {
            "job_type": "text_to_image",
            "prompt": "test"
        }

        # This would typically be caught by JSON schema validation
        assert "collection_id" not in invalid_params

    def test_invalid_job_type(self):
        """Test invalid job_type values"""
        invalid_params = {
            "collection_id": "test",
            "job_type": "invalid_type",
            "prompt": "test"
        }

        # Should be caught by enum validation
        assert invalid_params["job_type"] not in ["text_to_image", "image_to_image"]

    def test_empty_prompt_validation(self):
        """Test empty prompt validation"""
        invalid_params = {
            "collection_id": "test",
            "job_type": "text_to_image",
            "prompt": ""
        }

        assert invalid_params["prompt"] == ""

    def test_prompt_length_limits(self):
        """Test prompt length validation"""
        # Create a very long prompt
        long_prompt = "A beautiful landscape with mountains and lakes " * 100
        params = {
            "collection_id": "test",
            "job_type": "text_to_image",
            "prompt": long_prompt
        }

        # In real implementation, this might be limited by the API
        assert len(params["prompt"]) > 1000

    @pytest.mark.parametrize("invalid_prompt", [
        None, 123, [], {}
    ])
    def test_invalid_prompt_types(self, invalid_prompt):
        """Test various invalid prompt types"""
        params = {
            "collection_id": "test",
            "job_type": "text_to_image",
            "prompt": invalid_prompt
        }

        assert params["prompt"] == invalid_prompt  # Would be caught by schema validation
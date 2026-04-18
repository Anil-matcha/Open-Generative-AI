import pytest
from unittest.mock import Mock, patch, MagicMock
from director.agents.image_generation import ImageGenerationAgent
from director.agents.base import AgentStatus
from director.core.session import MsgStatus


class TestFalTool:
    """Test FAL tool functionality for image-to-image"""

    @patch('director.tools.fal_video.FalVideoGenerationTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_fal_key'})
    def test_fal_image_to_image_success(self, mock_fal_class, mock_session):
        """Test successful FAL image-to-image transformation"""
        # Mock VideoDB tool for getting image data
        mock_videodb = Mock()
        mock_videodb.get_image.return_value = {"url": "https://example.com/source-image.jpg"}
        mock_videodb.generate_image_url.return_value = "https://example.com/source-image.jpg"

        # Mock FAL tool
        mock_fal_instance = Mock()
        mock_fal_instance.image_to_image.return_value = [{"url": "https://example.com/enhanced-image.jpg"}]
        mock_fal_class.return_value = mock_fal_instance

        with patch('director.agents.image_generation.VideoDBTool', return_value=mock_videodb):
            agent = ImageGenerationAgent(mock_session)
            result = agent.run(
                collection_id="test_collection",
                job_type="image_to_image",
                prompt="Make this image more vibrant",
                image_to_image={
                    "image_id": "test_image_id",
                    "fal_config": {"model_name": "fal-ai/flux-lora-canny"}
                }
            )

        assert result.status == AgentStatus.SUCCESS
        mock_fal_instance.image_to_image.assert_called_once()
        call_args = mock_fal_instance.image_to_image.call_args
        assert call_args[1]["image_url"] == "https://example.com/source-image.jpg"
        assert call_args[1]["prompt"] == "Make this image more vibrant"
        assert call_args[1]["config"] == {"model_name": "fal-ai/flux-lora-canny"}

    @patch('director.tools.fal_video.FalVideoGenerationTool')
    def test_fal_missing_api_key(self, mock_fal_class, mock_session):
        """Test FAL image-to-image without API key"""
        with patch.dict('os.environ', {}, clear=True):
            # Mock VideoDB tool
            mock_videodb = Mock()
            mock_videodb.get_image.return_value = {"url": "https://example.com/source-image.jpg"}

            with patch('director.agents.image_generation.VideoDBTool', return_value=mock_videodb):
                agent = ImageGenerationAgent(mock_session)
                result = agent.run(
                    collection_id="test_collection",
                    job_type="image_to_image",
                    prompt="enhance this",
                    image_to_image={"image_id": "test_image_id"}
                )

        assert result.status == AgentStatus.ERROR
        # FAL tool should not be instantiated without API key
        mock_fal_class.assert_not_called()

    @patch('director.tools.fal_video.FalVideoGenerationTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_fal_key'})
    def test_fal_missing_image_id(self, mock_fal_class, mock_session):
        """Test FAL image-to-image with missing image_id"""
        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="image_to_image",
            prompt="enhance this",
            image_to_image={}  # Missing image_id
        )

        assert result.status == AgentStatus.ERROR
        assert "Missing required parameter: 'image_id'" in result.message
        mock_fal_class.assert_not_called()

    @patch('director.tools.fal_video.FalVideoGenerationTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_fal_key'})
    def test_fal_image_not_found(self, mock_fal_class, mock_session):
        """Test FAL image-to-image with non-existent image"""
        # Mock VideoDB tool to return None (image not found)
        mock_videodb = Mock()
        mock_videodb.get_image.return_value = None

        with patch('director.agents.image_generation.VideoDBTool', return_value=mock_videodb):
            agent = ImageGenerationAgent(mock_session)
            result = agent.run(
                collection_id="test_collection",
                job_type="image_to_image",
                prompt="enhance this",
                image_to_image={"image_id": "nonexistent"}
            )

        assert result.status == AgentStatus.ERROR
        assert "not found in collection" in result.message
        mock_fal_class.assert_not_called()

    @patch('director.tools.fal_video.FalVideoGenerationTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_fal_key'})
    def test_fal_api_failure(self, mock_fal_class, mock_session):
        """Test FAL image-to-image with API failure"""
        # Mock VideoDB tool
        mock_videodb = Mock()
        mock_videodb.get_image.return_value = {"url": "https://example.com/source-image.jpg"}

        # Mock FAL tool to raise exception
        mock_fal_instance = Mock()
        mock_fal_instance.image_to_image.side_effect = Exception("FAL API Error")
        mock_fal_class.return_value = mock_fal_instance

        with patch('director.agents.image_generation.VideoDBTool', return_value=mock_videodb):
            agent = ImageGenerationAgent(mock_session)
            result = agent.run(
                collection_id="test_collection",
                job_type="image_to_image",
                prompt="enhance this",
                image_to_image={"image_id": "test_image_id"}
            )

        assert result.status == AgentStatus.ERROR
        assert "FAL API Error" in result.message

    @patch('director.tools.fal_video.FalVideoGenerationTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_fal_key'})
    def test_fal_default_config(self, mock_fal_class, mock_session):
        """Test FAL image-to-image with default config"""
        # Mock VideoDB tool
        mock_videodb = Mock()
        mock_videodb.get_image.return_value = {"url": "https://example.com/source-image.jpg"}

        # Mock FAL tool
        mock_fal_instance = Mock()
        mock_fal_instance.image_to_image.return_value = [{"url": "https://example.com/enhanced-image.jpg"}]
        mock_fal_class.return_value = mock_fal_instance

        with patch('director.agents.image_generation.VideoDBTool', return_value=mock_videodb):
            agent = ImageGenerationAgent(mock_session)
            result = agent.run(
                collection_id="test_collection",
                job_type="image_to_image",
                prompt="enhance this",
                image_to_image={"image_id": "test_image_id"}  # No fal_config provided
            )

        assert result.status == AgentStatus.SUCCESS
        mock_fal_instance.image_to_image.assert_called_once()
        call_args = mock_fal_instance.image_to_image.call_args
        assert call_args[1]["config"] == {}  # Empty config should be passed

    @pytest.mark.parametrize("model", [
        "fal-ai/flux-pro/v1.1-ultra/redux",
        "fal-ai/flux-lora-canny",
        "fal-ai/flux-lora-depth",
        "fal-ai/ideogram/v2/turbo/remix",
        "fal-ai/iclight-v2"
    ])
    @patch('director.tools.fal_video.FalVideoGenerationTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_fal_key'})
    def test_fal_supported_models(self, mock_fal_class, model, mock_session):
        """Test FAL image-to-image with various supported models"""
        # Mock VideoDB tool
        mock_videodb = Mock()
        mock_videodb.get_image.return_value = {"url": "https://example.com/source-image.jpg"}

        # Mock FAL tool
        mock_fal_instance = Mock()
        mock_fal_instance.image_to_image.return_value = [{"url": "https://example.com/enhanced-image.jpg"}]
        mock_fal_class.return_value = mock_fal_instance

        with patch('director.agents.image_generation.VideoDBTool', return_value=mock_videodb):
            agent = ImageGenerationAgent(mock_session)
            result = agent.run(
                collection_id="test_collection",
                job_type="image_to_image",
                prompt="enhance this",
                image_to_image={
                    "image_id": "test_image_id",
                    "fal_config": {"model_name": model}
                }
            )

        assert result.status == AgentStatus.SUCCESS
        call_args = mock_fal_instance.image_to_image.call_args
        assert call_args[1]["config"]["model_name"] == model</content>
<parameter name="filePath">/workspaces/Open-Higgsfield-AI/apps/director/backend/tests/unit/test_fal_tool.py
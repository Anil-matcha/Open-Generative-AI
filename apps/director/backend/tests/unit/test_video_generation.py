import pytest
import os
import uuid
from unittest.mock import Mock, patch, MagicMock
from director.agents.video_generation import VideoGenerationAgent, SUPPORTED_ENGINES
from director.agents.base import AgentStatus
from director.core.session import MsgStatus, Session


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


class TestVideoGenerationAgent:
    """Comprehensive tests for VideoGenerationAgent"""

    # Basic Initialization Tests
    def test_agent_initialization(self, mock_session):
        """Test agent initializes correctly"""
        agent = VideoGenerationAgent(mock_session)
        assert agent.agent_name == "video_generation"
        assert agent.parameters is not None
        assert "job_type" in agent.parameters["required"]

    # Parameter Validation Tests
    def test_missing_required_parameters(self, mock_session):
        """Test missing required parameters raise appropriate errors"""
        agent = VideoGenerationAgent(mock_session)

        # Missing job_type
        with pytest.raises(Exception):
            agent.run(collection_id="test", engine="stabilityai")

        # Missing collection_id
        with pytest.raises(Exception):
            agent.run(job_type="text_to_video", engine="stabilityai")

        # Missing engine
        with pytest.raises(Exception):
            agent.run(collection_id="test", job_type="text_to_video")

    @patch('director.agents.video_generation.VideoDBTool')
    def test_invalid_engine(self, mock_videodb_class, mock_session):
        """Test unsupported engine raises error"""
        mock_videodb_instance = Mock()
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test",
            job_type="text_to_video",
            engine="invalid_engine",
            text_to_video={"prompt": "test", "name": "test"}
        )
        assert result.status == AgentStatus.ERROR
        assert "not supported" in result.message

    @patch('director.agents.video_generation.VideoDBTool')
    @patch('director.tools.videodb_tool.VDBVideoGenerationTool')
    def test_invalid_job_type(self, mock_videodb_tool_class, mock_videodb_class, mock_session):
        """Test unsupported job type raises error"""
        mock_videodb_instance = Mock()
        mock_videodb_class.return_value = mock_videodb_instance

        mock_videodb_tool_instance = Mock()
        mock_videodb_tool_class.return_value = mock_videodb_tool_instance

        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test",
            job_type="invalid_job",
            engine="videodb",
            text_to_video={"prompt": "test", "name": "test"}
        )
        assert result.status == AgentStatus.ERROR
        assert "not supported" in result.message

    # API Key Validation Tests
    @patch('director.agents.video_generation.VideoDBTool')
    @patch.dict('os.environ', {}, clear=True)
    def test_stabilityai_missing_api_key(self, mock_videodb_class, mock_session):
        """Test Stability AI without API key fails"""
        mock_videodb_instance = Mock()
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test",
            job_type="text_to_video",
            engine="stabilityai",
            text_to_video={"prompt": "test", "name": "test"}
        )
        assert result.status == AgentStatus.ERROR
        assert "Stability AI API key not found" in result.message

    @patch('director.agents.video_generation.VideoDBTool')
    @patch.dict('os.environ', {}, clear=True)
    def test_fal_missing_api_key(self, mock_videodb_class, mock_session):
        """Test FAL without API key fails"""
        mock_videodb_instance = Mock()
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test",
            job_type="text_to_video",
            engine="fal",
            text_to_video={"prompt": "test", "name": "test"}
        )
        assert result.status == AgentStatus.ERROR
        assert "FAL API key not found" in result.message

    # Text-to-Video Tests
    @patch('director.agents.video_generation.VideoDBTool')
    @patch('director.agents.video_generation.StabilityAITool')
    @patch.dict('os.environ', {'STABILITYAI_API_KEY': 'test_key'})
    def test_stabilityai_text_to_video_success(self, mock_stability_class, mock_videodb_class, mock_session):
        """Test successful Stability AI text-to-video generation"""
        # Mock Stability AI tool
        mock_stability_instance = Mock()
        mock_stability_instance.text_to_video.return_value = None
        mock_stability_class.return_value = mock_stability_instance

        # Mock VideoDB tool
        mock_videodb_instance = Mock()
        mock_videodb_instance.upload.return_value = {
            "id": "video_123",
            "stream_url": "https://example.com/video.mp4",
            "collection_id": "test_collection",
            "name": "Test Video"
        }
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_video",
            engine="stabilityai",
            text_to_video={
                "prompt": "A beautiful sunset",
                "name": "Sunset Video",
                "duration": 5,
                "stabilityai_config": {"aspect_ratio": "16:9"}
            }
        )

        assert result.status == AgentStatus.SUCCESS
        assert "video_123" in result.message
        assert result.data["video_id"] == "video_123"
        mock_stability_instance.text_to_video.assert_called_once()
        call_args = mock_stability_instance.text_to_video.call_args
        assert call_args[1]["prompt"] == "A beautiful sunset"
        assert call_args[1]["duration"] == 5
        assert call_args[1]["config"] == {"aspect_ratio": "16:9"}

    @patch('director.agents.video_generation.VideoDBTool')
    @patch('director.agents.video_generation.FalVideoGenerationTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_key'})
    def test_fal_text_to_video_success(self, mock_fal_class, mock_videodb_class, mock_session):
        """Test successful FAL text-to-video generation"""
        # Mock FAL tool
        mock_fal_instance = Mock()
        mock_fal_instance.text_to_video.return_value = None
        mock_fal_class.return_value = mock_fal_instance

        # Mock VideoDB tool
        mock_videodb_instance = Mock()
        mock_videodb_instance.upload.return_value = {
            "id": "video_456",
            "stream_url": "https://example.com/video.mp4",
            "collection_id": "test_collection",
            "name": "Test Video"
        }
        mock_videodb_class.return_value = mock_videodb_instance
        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
                collection_id="test_collection",
                job_type="text_to_video",
                engine="fal",
                text_to_video={
                    "prompt": "A futuristic city",
                    "name": "City Video",
                    "duration": 10,
                    "fal_config": {"model_name": "fal-ai/kling-video/v1.0"}
                }
            )

        assert result.status == AgentStatus.SUCCESS
        assert result.data["video_id"] == "video_456"
        mock_fal_instance.text_to_video.assert_called_once()
        call_args = mock_fal_instance.text_to_video.call_args
        assert call_args[1]["prompt"] == "A futuristic city"
        assert call_args[1]["duration"] == 10

    @patch('director.agents.video_generation.VideoDBTool')
    @patch('director.agents.video_generation.VDBVideoGenerationTool')
    def test_videodb_text_to_video_success(self, mock_videodb_tool_class, mock_videodb_class, mock_session):
        """Test successful VideoDB text-to-video generation"""
        # Mock VideoDB tool
        mock_videodb_tool_instance = Mock()
        mock_videodb_tool_instance.text_to_video.return_value = None
        mock_videodb_tool_class.return_value = mock_videodb_tool_instance

        # Mock VideoDB upload tool
        mock_videodb_instance = Mock()
        mock_videodb_instance.upload.return_value = {
            "id": "video_789",
            "stream_url": "https://example.com/video.mp4",
            "collection_id": "test_collection",
            "name": "Test Video"
        }
        mock_videodb_class.return_value = mock_videodb_instance
        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
                collection_id="test_collection",
                job_type="text_to_video",
                engine="videodb",
                text_to_video={
                    "prompt": "A serene lake",
                    "name": "Lake Video",
                    "duration": 8
                }
            )

        assert result.status == AgentStatus.SUCCESS
        assert result.data["video_id"] == "video_789"
        mock_videodb_tool_instance.text_to_video.assert_called_once()

    @patch('director.agents.video_generation.VideoDBTool')
    @patch.dict('os.environ', {'STABILITYAI_API_KEY': 'test_key'})
    def test_text_to_video_missing_prompt(self, mock_videodb_class, mock_session):
        """Test text-to-video without prompt fails"""
        mock_videodb_instance = Mock()
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test",
            job_type="text_to_video",
            engine="stabilityai",
            text_to_video={"name": "test"}
        )
        assert result.status == AgentStatus.ERROR
        assert "Prompt is required" in result.message

    # Image-to-Video Tests
    @patch('director.agents.video_generation.VideoDBTool')
    @patch('director.agents.video_generation.FalVideoGenerationTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_key'})
    def test_fal_image_to_video_success(self, mock_fal_class, mock_videodb_class, mock_session):
        """Test successful FAL image-to-video generation"""
        # Mock FAL tool
        mock_fal_instance = Mock()
        mock_fal_instance.image_to_video.return_value = None  # No return value for image_to_video
        mock_fal_class.return_value = mock_fal_instance

        # Mock VideoDB tool for image retrieval and upload
        mock_videodb_instance = Mock()
        mock_videodb_instance.get_image.return_value = {"url": "https://example.com/source-image.jpg"}
        mock_videodb_instance.upload.return_value = {
            "id": "video_img_123",
            "stream_url": "https://example.com/video.mp4",
            "collection_id": "test_collection",
            "name": "Image to Video"
        }
        mock_videodb_class.return_value = mock_videodb_instance
        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
                collection_id="test_collection",
                job_type="image_to_video",
                engine="fal",
                image_to_video={
                    "image_id": "img_123",
                    "name": "Image Video",
                    "prompt": "Make this image move",
                    "duration": 5,
                    "fal_config": {"model_name": "fal-ai/kling-video/v1.5"}
                }
            )

        assert result.status == AgentStatus.SUCCESS
        assert result.data["video_id"] == "video_img_123"
        mock_fal_instance.image_to_video.assert_called_once()
        call_args = mock_fal_instance.image_to_video.call_args
        assert call_args[1]["image_url"] == "https://example.com/source-image.jpg"
        assert call_args[1]["prompt"] == "Make this image move"
        assert call_args[1]["duration"] == 5

    @patch('director.agents.video_generation.VideoDBTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_key'})
    def test_image_to_video_missing_image_id(self, mock_videodb_class, mock_session):
        """Test image-to-video without image_id fails"""
        mock_videodb_instance = Mock()
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test",
            job_type="image_to_video",
            engine="fal",
            image_to_video={"name": "test", "prompt": "test"}
        )
        assert result.status == AgentStatus.ERROR
        assert "Missing required parameter: 'image_id'" in result.message

    @patch('director.agents.video_generation.VideoDBTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_key'})
    def test_image_to_video_invalid_duration(self, mock_videodb_class, mock_session):
        """Test image-to-video with invalid duration fails"""
        mock_videodb_instance = Mock()
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test",
            job_type="image_to_video",
            engine="fal",
            image_to_video={
                "image_id": "img_123",
                "name": "test",
                "prompt": "test",
                "duration": 70  # Over 60 seconds limit
            }
        )
        assert result.status == AgentStatus.ERROR
        assert "must be a positive number between 1 and 60 seconds" in result.message

    @patch('director.agents.video_generation.VideoDBTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_key'})
    def test_image_to_video_zero_duration(self, mock_videodb_class, mock_session):
        """Test image-to-video with zero duration fails"""
        mock_videodb_instance = Mock()
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test",
            job_type="image_to_video",
            engine="fal",
            image_to_video={
                "image_id": "img_123",
                "name": "test",
                "prompt": "test",
                "duration": 0
            }
        )
        assert result.status == AgentStatus.ERROR
        assert "must be a positive number between 1 and 60 seconds" in result.message

    @patch('director.agents.video_generation.VideoDBTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_key'})
    def test_image_to_video_image_not_found(self, mock_videodb_class, mock_session):
        """Test image-to-video with non-existent image fails"""
        mock_videodb_instance = Mock()
        mock_videodb_instance.get_image.return_value = None
        mock_videodb_class.return_value = mock_videodb_instance
        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
                collection_id="test",
                job_type="image_to_video",
                engine="fal",
                image_to_video={
                    "image_id": "nonexistent",
                    "name": "test",
                    "prompt": "test"
                }
            )

        assert result.status == AgentStatus.ERROR
        assert "not found in collection" in result.message

    @patch('director.agents.video_generation.VideoDBTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_key'})
    def test_image_to_video_no_url(self, mock_videodb_class, mock_session):
        """Test image-to-video with image having no URL fails"""
        mock_videodb_instance = Mock()
        mock_videodb_instance.get_image.return_value = {"url": None}
        mock_videodb_instance.generate_image_url.return_value = None
        mock_videodb_class.return_value = mock_videodb_instance
        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
                collection_id="test",
                job_type="image_to_video",
                engine="fal",
                image_to_video={
                    "image_id": "img_123",
                    "name": "test",
                    "prompt": "test"
                }
            )

        assert result.status == AgentStatus.ERROR
        assert "has no associated URL" in result.message

    # Engine-specific restrictions
    @patch('director.agents.video_generation.VideoDBTool')
    @patch.dict('os.environ', {'STABILITYAI_API_KEY': 'test_key'})
    def test_image_to_video_stabilityai_not_supported(self, mock_videodb_class, mock_session):
        """Test image-to-video with Stability AI fails"""
        mock_videodb_instance = Mock()
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test",
            job_type="image_to_video",
            engine="stabilityai",
            image_to_video={
                "image_id": "img_123",
                "name": "test",
                "prompt": "test"
            }
        )

        assert result.status == AgentStatus.ERROR
        assert "has no attribute 'image_to_video'" in result.message

    @patch('director.agents.video_generation.VideoDBTool')
    def test_image_to_video_videodb_not_supported(self, mock_videodb_class, mock_session):
        """Test image-to-video with VideoDB fails"""
        mock_videodb_instance = Mock()
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test",
            job_type="image_to_video",
            engine="videodb",
            image_to_video={
                "image_id": "img_123",
                "name": "test",
                "prompt": "test"
            }
        )
        assert result.status == AgentStatus.ERROR
        assert "has no attribute 'image_to_video'" in result.message

    # Edge Cases and Error Handling
    @patch('director.agents.video_generation.VideoDBTool')
    @patch('director.agents.video_generation.StabilityAITool')
    @patch.dict('os.environ', {'STABILITYAI_API_KEY': 'test_key'})
    def test_api_call_failure(self, mock_stability_class, mock_videodb_class, mock_session):
        """Test API call failure handling"""
        # Mock Stability AI tool to raise exception
        mock_stability_instance = Mock()
        mock_stability_instance.text_to_video.side_effect = Exception("API Error")
        mock_stability_class.return_value = mock_stability_instance

        mock_videodb_instance = Mock()
        mock_videodb_class.return_value = mock_videodb_instance
        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
                collection_id="test",
                job_type="text_to_video",
                engine="stabilityai",
                text_to_video={"prompt": "test", "name": "test"}
            )

        assert result.status == AgentStatus.ERROR
        assert "API Error" in result.message

    @patch('os.makedirs')
    @patch('director.agents.video_generation.VideoDBTool')
    @patch.dict('os.environ', {'STABILITYAI_API_KEY': 'test_key'})
    def test_no_write_permission(self, mock_videodb_class, mock_makedirs, mock_session):
        """Test handling of no write permission"""
        mock_makedirs.side_effect = PermissionError("No write permission")

        mock_videodb_instance = Mock()
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test",
            job_type="text_to_video",
            engine="stabilityai",
            text_to_video={"prompt": "test", "name": "test"}
        )
        assert result.status == AgentStatus.ERROR

    # Default Values Tests
    @patch('director.agents.video_generation.VideoDBTool')
    @patch('director.agents.video_generation.StabilityAITool')
    @patch.dict('os.environ', {'STABILITYAI_API_KEY': 'test_key'})
    def test_default_duration(self, mock_stability_class, mock_videodb_class, mock_session):
        """Test default duration is used when not specified"""
        mock_stability_instance = Mock()
        mock_stability_instance.text_to_video.return_value = None
        mock_stability_class.return_value = mock_stability_instance

        mock_videodb_instance = Mock()
        mock_videodb_instance.upload.return_value = {
            "id": "video_123",
            "stream_url": "https://example.com/video.mp4",
            "collection_id": "test_collection",
            "name": "Test Video"
        }
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        agent.run(
            collection_id="test_collection",
            job_type="text_to_video",
            engine="stabilityai",
            text_to_video={"prompt": "test", "name": "test"}  # No duration specified
        )

        call_args = mock_stability_instance.text_to_video.call_args
        assert call_args[1]["duration"] == 5  # Default duration

    @patch('director.agents.video_generation.VideoDBTool')
    @patch('director.agents.video_generation.FalVideoGenerationTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_key'})
    def test_default_config_empty(self, mock_fal_class, mock_videodb_class, mock_session):
        """Test default empty config when not specified"""
        mock_fal_instance = Mock()
        mock_fal_instance.text_to_video.return_value = None
        mock_fal_class.return_value = mock_fal_instance

        mock_videodb_instance = Mock()
        mock_videodb_instance.upload.return_value = {
            "id": "video_123",
            "stream_url": "https://example.com/video.mp4",
            "collection_id": "test_collection",
            "name": "Test Video"
        }
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        agent.run(
            collection_id="test_collection",
            job_type="text_to_video",
            engine="fal",
            text_to_video={"prompt": "test", "name": "test"}  # No config specified
        )

        call_args = mock_fal_instance.text_to_video.call_args
        assert call_args[1]["config"] == {}  # Empty config

    # Session Message Tests
    @patch('director.agents.video_generation.VideoDBTool')
    @patch('director.agents.video_generation.StabilityAITool')
    @patch.dict('os.environ', {'STABILITYAI_API_KEY': 'test_key'})
    def test_session_message_updates(self, mock_stability_class, mock_videodb_class, mock_session):
        """Test session message updates during generation"""
        mock_stability_instance = Mock()
        mock_stability_instance.text_to_video.return_value = None
        mock_stability_class.return_value = mock_stability_instance

        mock_videodb_instance = Mock()
        mock_videodb_instance.upload.return_value = {
            "id": "video_123",
            "stream_url": "https://example.com/video.mp4",
            "collection_id": "test_collection",
            "name": "Test Video"
        }
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_video",
            engine="stabilityai",
            text_to_video={"prompt": "A sunset", "name": "Sunset Video"}
        )

        # Check that actions were added
        assert len(mock_session.output_message.actions) >= 2
        assert any("stabilityai" in action for action in mock_session.output_message.actions)
        assert any("Generated video" in action or "Uploaded" in action for action in mock_session.output_message.actions)

        # Check content was added
        assert len(mock_session.output_message.content) == 1
        content = mock_session.output_message.content[0]
        assert content.status == MsgStatus.success
        assert content.video.id == "video_123"

    # File Cleanup Tests
    @patch('os.path.exists', return_value=True)
    @patch('os.remove')
    @patch('director.agents.video_generation.VideoDBTool')
    @patch('director.agents.video_generation.StabilityAITool')
    @patch.dict('os.environ', {'STABILITYAI_API_KEY': 'test_key'})
    def test_file_cleanup_on_success(self, mock_stability_class, mock_videodb_class, mock_remove, mock_exists, mock_session):
        """Test temporary file is cleaned up on success"""
        mock_stability_instance = Mock()
        mock_stability_instance.text_to_video.return_value = None
        mock_stability_class.return_value = mock_stability_instance

        mock_videodb_instance = Mock()
        mock_videodb_instance.upload.return_value = {
            "id": "video_123",
            "stream_url": "https://example.com/video.mp4",
            "collection_id": "test_collection",
            "name": "Test Video"
        }
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        agent.run(
            collection_id="test_collection",
            job_type="text_to_video",
            engine="stabilityai",
            text_to_video={"prompt": "test", "name": "test"}
        )

        # File should be removed
        mock_remove.assert_called_once()

    @patch('os.path.exists', return_value=True)
    @patch('os.remove')
    @patch('director.agents.video_generation.VideoDBTool')
    @patch('director.agents.video_generation.StabilityAITool')
    @patch.dict('os.environ', {'STABILITYAI_API_KEY': 'test_key'})
    def test_file_cleanup_on_error(self, mock_stability_class, mock_videodb_class, mock_remove, mock_exists, mock_session):
        """Test temporary file is cleaned up on error"""
        mock_stability_instance = Mock()
        mock_stability_instance.text_to_video.side_effect = Exception("API Error")
        mock_stability_class.return_value = mock_stability_instance

        mock_videodb_instance = Mock()
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        agent.run(
            collection_id="test_collection",
            job_type="text_to_video",
            engine="stabilityai",
            text_to_video={"prompt": "test", "name": "test"}
        )

        # File should still be removed even on error
        mock_remove.assert_called_once()

    # Parameter Validation Edge Cases
    @pytest.mark.parametrize("engine", SUPPORTED_ENGINES)
    @patch('director.agents.video_generation.VideoDBTool')
    def test_all_supported_engines_accepted(self, mock_videodb_class, engine, mock_session):
        """Test all supported engines are accepted"""
        mock_videodb_instance = Mock()
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)

        # Should not fail on engine validation (will fail later on API key, but that's expected)
        if engine == "stabilityai":
            with patch.dict('os.environ', {}, clear=True):
                result = agent.run(
                    collection_id="test",
                    job_type="text_to_video",
                    engine=engine,
                    text_to_video={"prompt": "test", "name": "test"}
                )
                assert "API key not found" in result.message
        elif engine == "fal":
            with patch.dict('os.environ', {}, clear=True):
                result = agent.run(
                    collection_id="test",
                    job_type="text_to_video",
                    engine=engine,
                    text_to_video={"prompt": "test", "name": "test"}
                )
                assert "API key not found" in result.message
        else:  # videodb
            result = agent.run(
                collection_id="test",
                job_type="text_to_video",
                engine=engine,
                text_to_video={"prompt": "test", "name": "test"}
            )
            # Will fail later but engine validation passes
            assert result.status == AgentStatus.ERROR

    # Integration-like tests
    @patch('director.agents.video_generation.VideoDBTool')
    @patch('director.agents.video_generation.FalVideoGenerationTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_key'})
    def test_stealth_mode(self, mock_fal_class, mock_videodb_class, mock_session):
        """Test stealth mode doesn't update session messages"""
        mock_fal_instance = Mock()
        mock_fal_instance.text_to_video.return_value = None
        mock_fal_class.return_value = mock_fal_instance

        mock_videodb_instance = Mock()
        mock_videodb_instance.upload.return_value = {
            "id": "video_123",
            "stream_url": "https://example.com/video.mp4",
            "collection_id": "test_collection",
            "name": "Test Video"
        }
        mock_videodb_class.return_value = mock_videodb_instance

        agent = VideoGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_video",
            engine="fal",
            text_to_video={"prompt": "test", "name": "test"},
            stealth_mode=True
        )

        assert result.status == AgentStatus.SUCCESS
        # In stealth mode, content should not be appended to session
        assert len(mock_session.output_message.content) == 0
        # But actions might still be called (implementation detail)
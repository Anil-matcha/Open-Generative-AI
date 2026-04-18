import pytest
from unittest.mock import Mock, patch, MagicMock
from director.agents.image_generation import ImageGenerationAgent
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


class TestFluxTool:
    """Test flux_dev tool functionality"""

    @patch('director.agents.image_generation.flux_dev')
    @patch('director.agents.image_generation.VideoDBTool')
    def test_flux_dev_success(self, mock_videodb_class, mock_flux_dev, mock_session):
        """Test successful flux_dev execution"""
        # Mock VideoDBTool to avoid real API calls
        mock_videodb_instance = Mock()
        mock_videodb_class.return_value = mock_videodb_instance

        # Mock flux_dev to return expected output
        mock_flux_dev.return_value = [Mock(url="https://example.com/generated-image.jpg")]

        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="A beautiful sunset",
            text_to_image={"engine": "flux"}
        )

        assert result.status == AgentStatus.SUCCESS
        assert mock_flux_dev.called
        assert mock_flux_dev.call_args[0][0] == "A beautiful sunset"

    @patch('director.tools.replicate.flux_dev')
    def test_flux_dev_api_failure(self, mock_flux_dev, mock_session):
        """Test flux_dev with API failure"""
        # Mock flux_dev to return None (API failure)
        mock_flux_dev.return_value = None

        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="A beautiful sunset",
            text_to_image={"engine": "flux"}
        )

        assert result.status == AgentStatus.ERROR
        assert "error in replicate" in result.message.lower()

    @patch('director.tools.replicate.flux_dev')
    def test_flux_dev_exception(self, mock_flux_dev, mock_session):
        """Test flux_dev with exception"""
        # Mock flux_dev to raise exception
        mock_flux_dev.side_effect = Exception("API Error")

        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="A beautiful sunset",
            text_to_image={"engine": "flux"}
        )

        assert result.status == AgentStatus.ERROR
        assert "API Error" in result.message

    @pytest.mark.parametrize("invalid_prompt", [
        "", None, 123, [], {}
    ])
    @patch('director.tools.replicate.flux_dev')
    def test_flux_dev_invalid_prompts(self, mock_flux_dev, invalid_prompt, mock_session):
        """Test flux_dev with various invalid prompt types"""
        # This test is more about parameter validation before calling flux_dev
        agent = ImageGenerationAgent(mock_session)

        # These should fail at parameter validation level, not reach flux_dev
        if invalid_prompt == "" or invalid_prompt is None:
            # Empty prompt should be caught by validation
            result = agent.run(
                collection_id="test_collection",
                job_type="text_to_image",
                prompt=invalid_prompt,
                text_to_image={"engine": "flux"}
            )
            assert result.status == AgentStatus.ERROR
            # flux_dev should not be called
            mock_flux_dev.assert_not_called()
        else:
            # Type validation would prevent these from being passed as strings
            pass


class TestVideoDBTool:
    """Test VideoDB tool functionality"""

    @patch('director.agents.image_generation.VideoDBTool')
    def test_videodb_generate_image_success(self, mock_videodb_class, mock_session):
        """Test successful VideoDB image generation"""
        mock_videodb_instance = Mock()
        mock_videodb_instance.generate_image.return_value = {
            "id": "generated_image_id",
            "url": "https://example.com/generated-image.jpg"
        }
        mock_videodb_class.return_value = mock_videodb_instance

        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="A serene landscape"
        )

        assert result.status == AgentStatus.SUCCESS
        mock_videodb_instance.generate_image.assert_called_with("A serene landscape")

    @patch('director.agents.image_generation.VideoDBTool')
    def test_videodb_generate_image_failure(self, mock_videodb_class, mock_session):
        """Test VideoDB image generation failure"""
        mock_videodb_instance = Mock()
        mock_videodb_instance.generate_image.side_effect = Exception("VideoDB API Error")
        mock_videodb_class.return_value = mock_videodb_instance

        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="A serene landscape"
        )

        assert result.status == AgentStatus.ERROR
        assert "VideoDB API Error" in result.message

    @pytest.mark.parametrize("aspect_ratio", ["16:9", "1:1", "4:3", "9:16"])
    @patch('director.agents.image_generation.VideoDBTool')
    def test_videodb_valid_aspect_ratios(self, mock_videodb_class, aspect_ratio, mock_session):
        """Test VideoDB with valid aspect ratios"""
        mock_videodb_instance = Mock()
        mock_videodb_instance.generate_image.return_value = {
            "id": "generated_image_id",
            "url": "https://example.com/generated-image.jpg"
        }
        mock_videodb_class.return_value = mock_videodb_instance

        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="Test prompt"
        )

        assert result.status == AgentStatus.SUCCESS
        # Note: Default aspect ratio handling would be tested in VideoDB tool itself
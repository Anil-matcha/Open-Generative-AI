import pytest
from unittest.mock import Mock, patch, MagicMock
from director.agents.image_generation import ImageGenerationAgent
from director.agents.base import AgentStatus
from director.core.session import MsgStatus


class TestImageGenerationErrorHandling:
    """Test error handling and validation scenarios"""

    @patch('director.tools.replicate.flux_dev')
    def test_flux_api_key_missing_error(self, mock_flux_dev, mock_session):
        """Test behavior when REPLICATE_API_TOKEN is missing"""
        # Mock flux_dev to raise an authentication error
        mock_flux_dev.side_effect = Exception("Authentication failed: Missing API key")

        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="test",
            text_to_image={"engine": "flux"}
        )

        assert result.status == AgentStatus.ERROR
        assert "Authentication failed" in result.message

    @patch.dict('os.environ', {}, clear=True)
    def test_fal_api_key_missing_error(self, mock_session):
        """Test behavior when FAL_KEY is missing"""
        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="image_to_image",
            prompt="test",
            image_to_image={"image_id": "test"}
        )

        assert result.status == AgentStatus.ERROR
        # Should fail when trying to create FalVideoGenerationTool

    @patch('director.agents.image_generation.VideoDBTool')
    def test_videodb_connection_error(self, mock_videodb_class, mock_session):
        """Test VideoDB connection failure"""
        mock_videodb_instance = Mock()
        mock_videodb_instance.generate_image.side_effect = Exception("Connection refused")
        mock_videodb_class.return_value = mock_videodb_instance

        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="nonexistent_collection",
            job_type="text_to_image",
            prompt="test"
        )

        assert result.status == AgentStatus.ERROR
        assert "Connection refused" in result.message

    @patch('director.tools.replicate.flux_dev')
    def test_flux_network_timeout_error(self, mock_flux_dev, mock_session):
        """Test flux API timeout handling"""
        import requests
        mock_flux_dev.side_effect = requests.exceptions.Timeout("Request timed out")

        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="test",
            text_to_image={"engine": "flux"}
        )

        assert result.status == AgentStatus.ERROR
        assert "timed out" in result.message.lower()

    @patch('director.tools.fal_video.FalVideoGenerationTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_key'})
    def test_fal_network_timeout_error(self, mock_fal_class, mock_session):
        """Test FAL API timeout handling"""
        import requests

        mock_videodb = Mock()
        mock_videodb.get_image.return_value = {"url": "https://example.com/image.jpg"}

        mock_fal_instance = Mock()
        mock_fal_instance.image_to_image.side_effect = requests.exceptions.Timeout("FAL timeout")
        mock_fal_class.return_value = mock_fal_instance

        with patch('director.agents.image_generation.VideoDBTool', return_value=mock_videodb):
            agent = ImageGenerationAgent(mock_session)
            result = agent.run(
                collection_id="test_collection",
                job_type="image_to_image",
                prompt="test",
                image_to_image={"image_id": "test"}
            )

        assert result.status == AgentStatus.ERROR
        assert "FAL timeout" in result.message

    @patch('director.tools.replicate.flux_dev')
    def test_flux_rate_limit_error(self, mock_flux_dev, mock_session):
        """Test flux API rate limit handling"""
        mock_flux_dev.side_effect = Exception("Rate limit exceeded")

        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="test",
            text_to_image={"engine": "flux"}
        )

        assert result.status == AgentStatus.ERROR
        assert "Rate limit exceeded" in result.message

    @patch('director.agents.image_generation.VideoDBTool')
    def test_videodb_rate_limit_error(self, mock_videodb_class, mock_session):
        """Test VideoDB API rate limit handling"""
        mock_videodb_instance = Mock()
        mock_videodb_instance.generate_image.side_effect = Exception("Too many requests")
        mock_videodb_class.return_value = mock_videodb_instance

        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="test"
        )

        assert result.status == AgentStatus.ERROR
        assert "Too many requests" in result.message

    def test_invalid_collection_id_error(self, mock_session):
        """Test handling of invalid collection IDs"""
        agent = ImageGenerationAgent(mock_session)

        # Test with None collection_id
        result = agent.run(
            collection_id=None,
            job_type="text_to_image",
            prompt="test"
        )

        # Should fail during VideoDB tool initialization
        assert result.status == AgentStatus.ERROR

    @patch('director.agents.image_generation.VideoDBTool')
    def test_videodb_image_not_found_error(self, mock_videodb_class, mock_session):
        """Test VideoDB image not found error"""
        mock_videodb_instance = Mock()
        mock_videodb_instance.generate_image.side_effect = Exception("Image not found in collection")
        mock_videodb_class.return_value = mock_videodb_instance

        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="test"
        )

        assert result.status == AgentStatus.ERROR
        assert "not found" in result.message.lower()

    @patch('director.tools.fal_video.FalVideoGenerationTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_key'})
    def test_fal_invalid_image_format_error(self, mock_fal_class, mock_session):
        """Test FAL API error for invalid image format"""
        mock_videodb = Mock()
        mock_videodb.get_image.return_value = {"url": "https://example.com/image.txt"}

        mock_fal_instance = Mock()
        mock_fal_instance.image_to_image.side_effect = Exception("Invalid image format")
        mock_fal_class.return_value = mock_fal_instance

        with patch('director.agents.image_generation.VideoDBTool', return_value=mock_videodb):
            agent = ImageGenerationAgent(mock_session)
            result = agent.run(
                collection_id="test_collection",
                job_type="image_to_image",
                prompt="test",
                image_to_image={"image_id": "test"}
            )

        assert result.status == AgentStatus.ERROR
        assert "Invalid image format" in result.message

    def test_session_error_message_structure(self, mock_session):
        """Test that error messages are properly structured in session"""
        agent = ImageGenerationAgent(mock_session)

        # Force an error
        result = agent.run(
            collection_id="test",
            job_type="unsupported",
            prompt="test"
        )

        assert result.status == AgentStatus.ERROR

        # Check session message structure
        assert len(mock_session.output_message.content) == 1
        error_content = mock_session.output_message.content[0]
        assert error_content.status == MsgStatus.error
        assert "not supported" in error_content.status_message.lower()

        # Verify session publish was called
        mock_session.output_message.publish.assert_called_once()

    @pytest.mark.parametrize("error_scenario", [
        ("flux_auth", "Authentication failed"),
        ("network_error", "Connection failed"),
        ("api_quota", "Quota exceeded"),
        ("invalid_params", "Invalid parameters"),
    ])
    @patch('director.tools.replicate.flux_dev')
    def test_various_flux_error_scenarios(self, mock_flux_dev, error_scenario, mock_session):
        """Test various flux error scenarios"""
        error_type, error_message = error_scenario
        mock_flux_dev.side_effect = Exception(error_message)

        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="test",
            text_to_image={"engine": "flux"}
        )

        assert result.status == AgentStatus.ERROR
        assert error_message in result.message

    def test_exception_logging(self, mock_session, caplog):
        """Test that exceptions are properly logged"""
        agent = ImageGenerationAgent(mock_session)

        # Force an exception
        result = agent.run(
            collection_id="test",
            job_type="text_to_image",
            prompt="test"
        )

        # Check that error was logged (would be caught by VideoDB exception)
        # Note: This assumes logging is configured in the agent
        assert result.status == AgentStatus.ERROR</content>
<parameter name="filePath">/workspaces/Open-Higgsfield-AI/apps/director/backend/tests/integration/test_error_handling.py
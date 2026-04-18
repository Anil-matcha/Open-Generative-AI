import pytest
from unittest.mock import Mock, patch, MagicMock
from director.agents.image_generation import ImageGenerationAgent
from director.agents.base import AgentStatus
from director.core.session import MsgStatus


class TestImageGenerationAgentIntegration:
    """Integration tests for complete ImageGenerationAgent workflows"""

    @patch('director.tools.replicate.flux_dev')
    def test_text_to_image_flux_complete_workflow(self, mock_flux_dev, mock_session):
        """Test complete text-to-image workflow with flux engine"""
        # Mock successful flux response
        mock_flux_dev.return_value = [Mock(url="https://example.com/generated-image.jpg")]

        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="A beautiful sunset over mountains",
            text_to_image={"engine": "flux"}
        )

        # Verify result
        assert result.status == AgentStatus.SUCCESS
        assert result.message == "Agent image_generation completed successfully."
        assert result.data["image_content"].image.url == "https://example.com/generated-image.jpg"

        # Verify session message updates
        assert len(mock_session.output_message.content) == 1
        image_content = mock_session.output_message.content[0]
        assert image_content.agent_name == "image_generation"
        assert image_content.status == MsgStatus.success
        assert image_content.status_message == "Here is your generated image"
        assert image_content.image.url == "https://example.com/generated-image.jpg"

        # Verify session methods called
        mock_session.output_message.push_update.assert_called_once()
        mock_session.output_message.publish.assert_called_once()

    @patch('director.tools.replicate.flux_dev')
    def test_text_to_image_flux_with_progress_updates(self, mock_flux_dev, mock_session):
        """Test text-to-image with proper progress message updates"""
        mock_flux_dev.return_value = [Mock(url="https://example.com/generated-image.jpg")]

        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="A serene lake landscape",
            text_to_image={"engine": "flux"}
        )

        # Check that progress message was set
        assert "Processing prompt.." in mock_session.output_message.actions

        # Check final state
        assert result.status == AgentStatus.SUCCESS

    @patch('director.agents.image_generation.VideoDBTool')
    def test_text_to_image_videodb_complete_workflow(self, mock_videodb_class, mock_session):
        """Test complete text-to-image workflow with VideoDB engine (default)"""
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
            prompt="A futuristic city"
        )

        # Verify result
        assert result.status == AgentStatus.SUCCESS
        assert result.data["image_content"].image.url == "https://example.com/generated-image.jpg"

        # Verify VideoDB was called correctly
        mock_videodb_instance.generate_image.assert_called_once_with("A futuristic city")

        # Verify session updates
        mock_session.output_message.push_update.assert_called_once()
        mock_session.output_message.publish.assert_called_once()

    @patch('director.tools.fal_video.FalVideoGenerationTool')
    @patch.dict('os.environ', {'FAL_KEY': 'test_fal_key'})
    def test_image_to_image_complete_workflow(self, mock_fal_class, mock_session):
        """Test complete image-to-image workflow"""
        # Mock VideoDB for image retrieval
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
                prompt="Make this more vibrant and colorful",
                image_to_image={
                    "image_id": "source_image_id",
                    "fal_config": {"model_name": "fal-ai/flux-lora-canny"}
                }
            )

        # Verify result
        assert result.status == AgentStatus.SUCCESS
        assert result.data["image_content"].image.url == "https://example.com/enhanced-image.jpg"

        # Verify VideoDB calls
        mock_videodb.get_image.assert_called_once_with("source_image_id")

        # Verify FAL calls
        mock_fal_instance.image_to_image.assert_called_once()
        call_args = mock_fal_instance.image_to_image.call_args
        assert call_args[1]["image_url"] == "https://example.com/source-image.jpg"
        assert call_args[1]["prompt"] == "Make this more vibrant and colorful"

        # Verify session updates
        mock_session.output_message.push_update.assert_called_once()
        mock_session.output_message.publish.assert_called_once()

    @patch('director.tools.replicate.flux_dev')
    def test_agent_reuse_multiple_generations(self, mock_flux_dev, mock_session):
        """Test that agent can be reused for multiple generations"""
        mock_flux_dev.return_value = [Mock(url="https://example.com/image-1.jpg")]

        agent = ImageGenerationAgent(mock_session)

        # First generation
        result1 = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="First image",
            text_to_image={"engine": "flux"}
        )
        assert result1.status == AgentStatus.SUCCESS

        # Mock different response for second call
        mock_flux_dev.return_value = [Mock(url="https://example.com/image-2.jpg")]

        # Second generation
        result2 = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="Second image",
            text_to_image={"engine": "flux"}
        )
        assert result2.status == AgentStatus.SUCCESS

        # Verify both calls were made with different prompts
        assert mock_flux_dev.call_count == 2
        calls = mock_flux_dev.call_args_list
        assert calls[0][0][0] == "First image"
        assert calls[1][0][0] == "Second image"

    def test_unsupported_job_type(self, mock_session):
        """Test handling of unsupported job types"""
        agent = ImageGenerationAgent(mock_session)
        result = agent.run(
            collection_id="test_collection",
            job_type="unsupported_type",
            prompt="test prompt"
        )

        assert result.status == AgentStatus.ERROR
        assert "not supported" in result.message.lower()

    @patch('director.tools.replicate.flux_dev')
    def test_flux_generation_with_error_recovery(self, mock_flux_dev, mock_session):
        """Test error handling and recovery in flux generation"""
        # First call fails, second succeeds
        mock_flux_dev.side_effect = [
            Exception("Temporary API error"),
            [Mock(url="https://example.com/recovered-image.jpg")]
        ]

        agent = ImageGenerationAgent(mock_session)

        # This would typically be handled by retry logic, but testing basic error handling
        result = agent.run(
            collection_id="test_collection",
            job_type="text_to_image",
            prompt="Test with error",
            text_to_image={"engine": "flux"}
        )

        # Should fail on first attempt
        assert result.status == AgentStatus.ERROR
        assert "Temporary API error" in result.message

    def test_session_message_structure(self, mock_session):
        """Test that session messages have correct structure"""
        agent = ImageGenerationAgent(mock_session)

        # Trigger any execution to set up messages
        result = agent.run(
            collection_id="test_collection",
            job_type="unsupported_type",
            prompt="test"
        )

        # Verify message structure
        assert hasattr(mock_session.output_message, 'content')
        assert hasattr(mock_session.output_message, 'actions')
        assert hasattr(mock_session.output_message, 'push_update')
        assert hasattr(mock_session.output_message, 'publish')

        # Verify error message structure
        assert len(mock_session.output_message.content) >= 1
        error_content = mock_session.output_message.content[0]
        assert hasattr(error_content, 'status')
        assert hasattr(error_content, 'status_message')
        assert error_content.status == MsgStatus.error</content>
<parameter name="filePath">/workspaces/Open-Higgsfield-AI/apps/director/backend/tests/integration/test_image_generation_workflow.py
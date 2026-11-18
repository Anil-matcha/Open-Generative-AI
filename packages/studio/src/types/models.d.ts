/**
 * Core type definitions for the Open Generative AI model catalog and API.
 * These types document the structure of model definitions, inputs, and API
 * interactions. They are used for documentation and JSDoc type checking;
 * full TypeScript migration is tracked as a future milestone.
 *
 * @module types/models
 */

/**
 * Supported model input types.
 */
export type ModelInputType = 'string' | 'int' | 'integer' | 'boolean' | 'array' | 'number';

/**
 * A single model input parameter definition.
 *
 * @typedef {Object} ModelInput
 * @property {ModelInputType} type - The data type of the input
 * @property {string} title - Human-readable title
 * @property {string} name - Parameter name sent to API
 * @property {string} [description] - Help text for the parameter
 * @property {*} [default] - Default value
 * @property {string[]|Object[]} [enum] - Allowed values (flat or object array)
 * @property {number} [minValue] - Minimum value for numeric inputs
 * @property {number} [maxValue] - Maximum value for numeric inputs
 * @property {number} [step] - Step increment for numeric inputs
 * @property {number} [minItems] - Minimum items for array inputs
 * @property {number} [maxItems] - Maximum items for array inputs
 * @property {string} [field] - Field type hint (e.g., 'image', 'video', 'audio')
 * @property {boolean} [isEdit] - Whether this is an edit-only parameter
 * @property {boolean} [configurable] - Whether this can be user-configured
 */

/**
 * A single AI model definition in the catalog.
 *
 * @typedef {Object} ModelDefinition
 * @property {string} id - Unique model identifier (kebab-case slug)
 * @property {string} name - Human-readable model name
 * @property {string} [endpoint] - API endpoint path segment
 * @property {Object<string, ModelInput>} [inputs] - Input parameter schema
 * @property {string} [provider] - Provider identifier (e.g., 'google', 'openai')
 * @property {string} [provider_name] - Human-readable provider name
 * @property {string} [family] - Model family grouping
 * @property {boolean} [hasPrompt] - Whether the model accepts text prompts
 * @property {boolean} [promptRequired] - Whether a prompt is mandatory
 * @property {string} [imageField] - Image input field name (for image-conditioned models)
 * @property {string} [videoField] - Video input field name (for video-conditioned models)
 * @property {string} [audioField] - Audio input field name (for audio-conditioned models)
 * @property {string} [category] - Sub-category (e.g., 'lipsync', 'video')
 * @property {number} [maxImages] - Maximum number of reference images
 * @property {string[]} [required] - List of required parameter names
 */

/**
 * Model category identifiers.
 *
 * @typedef {'t2i'|'t2v'|'i2i'|'i2v'|'v2v'|'lipsync'|'recast'|'audio'|'motionControl'} ModelCategory
 */

/**
 * Generation request parameters passed by studio components.
 *
 * @typedef {Object} GenerationParams
 * @property {string} model - Model ID to use
 * @property {string} [prompt] - Text prompt
 * @property {string} [aspect_ratio] - Output aspect ratio (e.g., '16:9')
 * @property {string} [resolution] - Output resolution (e.g., '1k', '2k', '4k')
 * @property {string} [quality] - Quality preset (e.g., 'basic', 'high')
 * @property {number} [duration] - Video duration in seconds
 * @property {string} [image_url] - Reference image URL
 * @property {string[]} [images_list] - Multiple reference image URLs
 * @property {string} [video_url] - Reference video URL
 * @property {string} [audio_url] - Reference audio URL
 * @property {number} [seed] - Random seed (-1 for random)
 * @property {number} [strength] - Transformation strength (0-1)
 * @property {boolean} [generate_audio] - Whether to generate audio for video
 * @property {string} [mode] - Style mode (e.g., 'normal', 'fun', 'spicy')
 * @property {Function} [onRequestId] - Callback receiving the request ID
 */

/**
 * Polling result from the Muapi API.
 *
 * @typedef {Object} PollResult
 * @property {string} status - Generation status ('pending'|'processing'|'completed'|'succeeded'|'failed')
 * @property {string} [request_id] - Unique request identifier
 * @property {string} [url] - Output media URL
 * @property {Object} [output] - Raw API output object
 * @property {string} [error] - Error message (on failure)
 */

/**
 * File upload result from the Muapi API.
 *
 * @typedef {Object} UploadResult
 * @property {string} url - Hosted file URL
 * @property {string} [file_url] - Alternative URL field
 * @property {Object} [data] - Nested data object with URL
 */

/**
 * User balance information.
 *
 * @typedef {Object} UserBalance
 * @property {number} balance - Account credit balance
 * @property {string} [email] - Account email address
 */

/**
 * Error boundary crash report.
 *
 * @typedef {Object} CrashReport
 * @property {string} studio - Studio identifier that crashed
 * @property {string} error - Error message
 * @property {string} componentStack - React component stack trace
 * @property {number} timestamp - Unix timestamp of crash
 */

// Export empty object to make this a module
export {};

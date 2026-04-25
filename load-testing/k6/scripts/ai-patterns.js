import http from 'k6/http';
import { check, sleep } from 'k6';
import { authManager } from './auth.js';

// AI query patterns for different agents
export class AIPatterns {
    constructor(baseUrl = 'https://api.muapi.ai') {
        this.baseUrl = baseUrl;
    }

    // Director agent: Video generation and scene creation
    async directorOperations(userId, timelineData) {
        const headers = authManager.getAuthHeaders(userId);

        // Generate video scene
        const generatePayload = {
            operation: 'generate_video',
            prompt: `Create a cinematic scene: ${timelineData.prompt}`,
            duration: Math.floor(Math.random() * 30) + 10, // 10-40 seconds
            style: ['cinematic', 'documentary', 'commercial'][Math.floor(Math.random() * 3)],
            resolution: '1080p'
        };

        const generateResponse = http.post(
            `${this.baseUrl}/director/generate`,
            JSON.stringify(generatePayload),
            { headers }
        );

        check(generateResponse, {
            'director generate successful': (r) => r.status === 200,
            'director generate response time < 5000ms': (r) => r.timings.duration < 5000,
        });

        sleep(Math.random() * 2 + 1); // 1-3 second pause

        // Scene composition
        const composePayload = {
            operation: 'compose_scene',
            elements: timelineData.elements || ['character', 'background', 'lighting'],
            transitions: ['fade', 'cut', 'dissolve'][Math.floor(Math.random() * 3)]
        };

        const composeResponse = http.post(
            `${this.baseUrl}/director/compose`,
            JSON.stringify(composePayload),
            { headers }
        );

        check(composeResponse, {
            'director compose successful': (r) => r.status === 200,
        });

        return { generate: generateResponse, compose: composeResponse };
    }

    // Screenwriter agent: Script writing and dialogue
    async screenwriterOperations(userId, scriptData) {
        const headers = authManager.getAuthHeaders(userId);

        // Generate dialogue
        const dialoguePayload = {
            operation: 'generate_dialogue',
            characters: scriptData.characters || ['Hero', 'Villain', 'Sidekick'],
            scene_type: ['action', 'drama', 'comedy'][Math.floor(Math.random() * 3)],
            length: Math.floor(Math.random() * 200) + 50 // 50-250 words
        };

        const dialogueResponse = http.post(
            `${this.baseUrl}/screenwriter/dialogue`,
            JSON.stringify(dialoguePayload),
            { headers }
        );

        check(dialogueResponse, {
            'screenwriter dialogue successful': (r) => r.status === 200,
            'screenwriter response time < 3000ms': (r) => r.timings.duration < 3000,
        });

        sleep(Math.random() * 1.5 + 0.5); // 0.5-2 second pause

        // Script revision
        const revisionPayload = {
            operation: 'revise_script',
            original_script: 'Sample script content...',
            feedback: 'Make it more engaging',
            tone: ['formal', 'casual', 'poetic'][Math.floor(Math.random() * 3)]
        };

        const revisionResponse = http.post(
            `${this.baseUrl}/screenwriter/revise`,
            JSON.stringify(revisionPayload),
            { headers }
        );

        check(revisionResponse, {
            'screenwriter revision successful': (r) => r.status === 200,
        });

        return { dialogue: dialogueResponse, revision: revisionResponse };
    }

    // CharacterExtractor agent: Character analysis
    async characterExtractorOperations(userId, mediaData) {
        const headers = authManager.getAuthHeaders(userId);

        // Extract characters from video/frame
        const extractPayload = {
            operation: 'extract_characters',
            media_url: mediaData.url || 'https://example.com/video.mp4',
            frame_timestamp: Math.floor(Math.random() * 300), // 0-300 seconds
            detection_mode: ['automatic', 'manual', 'hybrid'][Math.floor(Math.random() * 3)]
        };

        const extractResponse = http.post(
            `${this.baseUrl}/character-extractor/extract`,
            JSON.stringify(extractPayload),
            { headers }
        );

        check(extractResponse, {
            'character extract successful': (r) => r.status === 200,
            'character extract time < 4000ms': (r) => r.timings.duration < 4000,
        });

        sleep(Math.random() * 2 + 1);

        // Character analysis
        const analyzePayload = {
            operation: 'analyze_character',
            character_id: 'char_' + Math.floor(Math.random() * 100),
            analysis_type: ['emotion', 'action', 'relationship'][Math.floor(Math.random() * 3)]
        };

        const analyzeResponse = http.post(
            `${this.baseUrl}/character-extractor/analyze`,
            JSON.stringify(analyzePayload),
            { headers }
        );

        check(analyzeResponse, {
            'character analyze successful': (r) => r.status === 200,
        });

        return { extract: extractResponse, analyze: analyzeResponse };
    }

    // CameraOperator agent: Camera work and cinematography
    async cameraOperatorOperations(userId, shotData) {
        const headers = authManager.getAuthHeaders(userId);

        // Generate camera movement
        const movementPayload = {
            operation: 'camera_movement',
            shot_type: ['pan', 'tilt', 'dolly', 'crane'][Math.floor(Math.random() * 4)],
            duration: Math.floor(Math.random() * 20) + 5, // 5-25 seconds
            intensity: ['subtle', 'moderate', 'dramatic'][Math.floor(Math.random() * 3)]
        };

        const movementResponse = http.post(
            `${this.baseUrl}/camera-operator/movement`,
            JSON.stringify(movementPayload),
            { headers }
        );

        check(movementResponse, {
            'camera movement successful': (r) => r.status === 200,
            'camera movement time < 2000ms': (r) => r.timings.duration < 2000,
        });

        sleep(Math.random() * 1 + 0.5);

        // Framing optimization
        const framingPayload = {
            operation: 'optimize_framing',
            subject_position: { x: Math.random(), y: Math.random() },
            rule_of_thirds: Math.random() > 0.5,
            aspect_ratio: ['16:9', '4:3', '21:9'][Math.floor(Math.random() * 3)]
        };

        const framingResponse = http.post(
            `${this.baseUrl}/camera-operator/framing`,
            JSON.stringify(framingPayload),
            { headers }
        );

        check(framingResponse, {
            'camera framing successful': (r) => r.status === 200,
        });

        return { movement: movementResponse, framing: framingResponse };
    }

    // Editor agent: Timeline editing and post-production
    async editorOperations(userId, editData) {
        const headers = authManager.getAuthHeaders(userId);

        // Timeline editing
        const editPayload = {
            operation: 'edit_timeline',
            clips: editData.clips || Array.from({length: Math.floor(Math.random() * 5) + 1}, () => ({
                id: 'clip_' + Math.floor(Math.random() * 1000),
                duration: Math.floor(Math.random() * 30) + 5
            })),
            transitions: ['cut', 'fade', 'wipe'][Math.floor(Math.random() * 3)],
            pacing: ['slow', 'medium', 'fast'][Math.floor(Math.random() * 3)]
        };

        const editResponse = http.post(
            `${this.baseUrl}/editor/timeline`,
            JSON.stringify(editPayload),
            { headers }
        );

        check(editResponse, {
            'editor timeline successful': (r) => r.status === 200,
            'editor timeline time < 3000ms': (r) => r.timings.duration < 3000,
        });

        sleep(Math.random() * 1.5 + 0.5);

        // Effects application
        const effectsPayload = {
            operation: 'apply_effects',
            effect_type: ['color_grading', 'blur', 'sharpen', 'stabilize'][Math.floor(Math.random() * 4)],
            intensity: Math.random(),
            clip_id: 'clip_' + Math.floor(Math.random() * 1000)
        };

        const effectsResponse = http.post(
            `${this.baseUrl}/editor/effects`,
            JSON.stringify(effectsPayload),
            { headers }
        );

        check(effectsResponse, {
            'editor effects successful': (r) => r.status === 200,
        });

        return { timeline: editResponse, effects: effectsResponse };
    }
}

// User behavior patterns
export const USER_BEHAVIORS = {
    creator: {
        director: 0.4,
        screenwriter: 0.2,
        characterExtractor: 0.1,
        cameraOperator: 0.2,
        editor: 0.4,
        sessionLength: 1800 // 30 minutes
    },
    collaborator: {
        director: 0.1,
        screenwriter: 0.5,
        characterExtractor: 0.2,
        cameraOperator: 0.1,
        editor: 0.3,
        sessionLength: 1200 // 20 minutes
    },
    reviewer: {
        director: 0.2,
        screenwriter: 0.1,
        characterExtractor: 0.4,
        cameraOperator: 0.2,
        editor: 0.4,
        sessionLength: 900 // 15 minutes
    },
    casual: {
        director: 0.3,
        screenwriter: 0.2,
        characterExtractor: 0.1,
        cameraOperator: 0.1,
        editor: 0.3,
        sessionLength: 600 // 10 minutes
    }
};

export const aiPatterns = new AIPatterns();
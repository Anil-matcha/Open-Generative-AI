import { getModelById, getVideoModelById, getI2IModelById, getI2VModelById, getV2VModelById, getLipSyncModelById } from './models.js';

const BASE_URL = 'https://api.muapi.ai';
export const MUAPI_PROXY_PATHS = Object.freeze({
    apiV1: '/api/api/v1',
    workflow: '/api/workflow',
    agents: '/api/agents',
    app: '/api/app'
});
const normalizeApiKey = (apiKey) => {
    if (typeof apiKey !== 'string') return apiKey || null;
    const trimmed = apiKey.trim();
    return trimmed && trimmed !== 'null' && trimmed !== 'undefined' ? trimmed : null;
};

const jsonHeaders = (apiKey) => {
    const headers = { 'Content-Type': 'application/json' };
    const normalizedKey = normalizeApiKey(apiKey);
    if (normalizedKey) headers['x-api-key'] = normalizedKey;
    return headers;
};

async function pollForResult(requestId, key, maxAttempts = 900, interval = 2000) {
    const pollUrl = `${MUAPI_PROXY_PATHS.apiV1}/predictions/${requestId}/result`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const response = await fetch(pollUrl, {
                headers: jsonHeaders(key)
            });
            if (!response.ok) {
                const errText = await response.text();
                if (response.status >= 500) continue;
                throw new Error(`轮询失败：${response.status} - ${errText.slice(0, 100)}`);
            }
            const data = await response.json();
            const status = data.status?.toLowerCase();
            if (status === 'completed' || status === 'succeeded' || status === 'success') return data;
            if (status === 'failed' || status === 'error') throw new Error(`生成失败：${data.error || '未知错误'}`);
        } catch (error) {
            if (attempt === maxAttempts) throw error;
        }
    }
    throw new Error('轮询超时。');
}

async function submitAndPoll(endpoint, payload, key, onRequestId, maxAttempts = 60) {
    const url = `${MUAPI_PROXY_PATHS.apiV1}/${endpoint}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: jsonHeaders(key),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API 请求失败：${response.status} ${response.statusText} - ${errText.slice(0, 100)}`);
    }
    const submitData = await response.json();
    const requestId = submitData.request_id || submitData.id;
    if (!requestId) return submitData;
    if (onRequestId) onRequestId(requestId);
    const result = await pollForResult(requestId, key, maxAttempts);
    const outputUrl = result.outputs?.[0] || result.url || result.output?.url;
    return { ...result, url: outputUrl };
}

export async function generateImage(apiKey, params) {
    const modelInfo = getModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = { prompt: params.prompt };
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.quality) payload.quality = params.quality;
    if (params.image_url) { 
        payload.image_url = params.image_url; 
        payload.strength = params.strength || 0.6; 
    } else if (params.images_list) {
        payload.images_list = params.images_list;
    } else {
        payload.image_url = null;
    }
    if (params.seed && params.seed !== -1) payload.seed = params.seed;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 60);
}

export async function generateI2I(apiKey, params) {
    const modelInfo = getI2IModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = {};
    if (params.prompt) payload.prompt = params.prompt;
    const imageField = modelInfo?.imageField || 'image_url';
    const imagesList = params.images_list?.length > 0 ? params.images_list : (params.image_url ? [params.image_url] : null);
    if (imagesList) {
        if (imageField === 'images_list') payload.images_list = imagesList;
        else payload[imageField] = imagesList[0];
    }
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.quality) payload.quality = params.quality;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 60);
}

export async function generateVideo(apiKey, params) {
    const modelInfo = getVideoModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = {};
    if (params.prompt) payload.prompt = params.prompt;
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.duration) payload.duration = params.duration;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.quality) payload.quality = params.quality;
    if (params.mode) payload.mode = params.mode;
    if (params.image_url) payload.image_url = params.image_url;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900);
}

export async function generateI2V(apiKey, params) {
    const modelInfo = getI2VModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = {};
    if (params.prompt) payload.prompt = params.prompt;
    const imageField = modelInfo?.imageField || 'image_url';
    if (params.image_url) {
        if (imageField === 'images_list') payload.images_list = [params.image_url];
        else payload[imageField] = params.image_url;
    }
    const lastImageField = modelInfo?.lastImageField;
    if (lastImageField && params.last_image) {
        payload[lastImageField] = params.last_image;
    }
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.duration) payload.duration = params.duration;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.quality) payload.quality = params.quality;
    if (params.mode) payload.mode = params.mode;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900);
}

export async function generateMarketingStudioAd(apiKey, params) {
    const endpoint = params.resolution === '1080p' ? 'sd-2-vip-omni-reference-1080p' : 'seedance-2-vip-omni-reference';
    const payload = {
        prompt: params.prompt,
        aspect_ratio: params.aspect_ratio || '16:9',
        duration: params.duration || 5,
        images_list: params.images_list || [],
        video_files: params.video_files || []
    };
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900);
}

export async function processV2V(apiKey, params) {
    const modelInfo = getV2VModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const videoField = modelInfo?.videoField || 'video_url';
    const payload = { [videoField]: params.video_url };
    if (modelInfo?.imageField && params.image_url) {
        payload[modelInfo.imageField] = params.image_url;
    }
    if (modelInfo?.hasPrompt && params.prompt) {
        payload.prompt = params.prompt;
    }
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900);
}

export async function processLipSync(apiKey, params) {
    const modelInfo = getLipSyncModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = {};
    if (params.audio_url) payload.audio_url = params.audio_url;
    if (params.image_url) payload.image_url = params.image_url;
    if (params.video_url) payload.video_url = params.video_url;
    if (modelInfo?.hasPrompt) payload.prompt = params.prompt || '';
    if (params.resolution) payload.resolution = params.resolution;
    if (params.seed !== undefined && params.seed !== -1) payload.seed = params.seed;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900);
}

export function uploadFile(apiKey, file, onProgress) {
    return new Promise((resolve, reject) => {
        const url = `${MUAPI_PROXY_PATHS.apiV1}/upload_file`;
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        const normalizedKey = normalizeApiKey(apiKey);
        if (normalizedKey) xhr.setRequestHeader('x-api-key', normalizedKey);

        if (onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    onProgress(percentComplete);
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    const fileUrl = data.url || data.file_url || data.data?.url;
                    if (!fileUrl) {
                        reject(new Error('文件上传未返回 URL'));
                    } else {
                        resolve(fileUrl);
                    }
                } catch (e) {
                    reject(new Error('上传响应解析失败'));
                }
            } else {
                let detail = xhr.statusText;
                try {
                    const errObj = JSON.parse(xhr.responseText);
                    detail = errObj.detail || detail;
                } catch (e) {
                    // fallback to statusText
                }
                reject(new Error(`文件上传失败：${xhr.status} - ${detail}`));
            }
        };

        xhr.onerror = () => reject(new Error('文件上传过程中出现网络错误'));
        xhr.send(formData);
    });
}

export async function getUserBalance(apiKey) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.apiV1}/account/balance`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取余额失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function getTemplateWorkflows(apiKey) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/get-template-workflows`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取模板工作流失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function getUserWorkflows(apiKey) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/get-workflow-defs`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取我的工作流失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function getPublishedWorkflows(apiKey) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/get-published-workflows`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取已发布工作流失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function getTemplateAgents(apiKey) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.agents}/templates/agents`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取模板智能体失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.agents || data.items || []);
};

export async function getUserAgents(apiKey) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.agents}/user/agents`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取我的智能体失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.agents || data.items || []);
};

export async function getPublishedAgents(apiKey) {
    // MuAPI: GET /agents/featured/agents
    const response = await fetch(`${MUAPI_PROXY_PATHS.agents}/featured/agents`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取精选智能体失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.agents || data.items || []);
};

// GET /agents/user/conversations — returns the user's chat history across all agents
export async function getUserConversations(apiKey) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.agents}/user/conversations`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取对话失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
};

export async function createWorkflow(apiKey, payload) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/create`, {
        method: 'POST',
        headers: jsonHeaders(apiKey),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`创建工作流失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function updateWorkflowName(apiKey, workflowId, name) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/update-name/${workflowId}`, {
        method: 'POST',
        headers: jsonHeaders(apiKey),
        body: JSON.stringify({ name })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`重命名工作流失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function deleteWorkflow(apiKey, workflowId) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/delete-workflow-def/${workflowId}`, {
        method: 'DELETE',
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`删除工作流失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function getWorkflowInputs(apiKey, workflowId) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/${workflowId}/api-inputs`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取工作流输入失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function executeWorkflow(apiKey, workflowId, inputs) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/${workflowId}/api-execute`, {
        method: 'POST',
        headers: jsonHeaders(apiKey),
        body: JSON.stringify({ inputs })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`执行工作流失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    const submitData = await response.json();
    const runId = submitData.run_id || submitData.id;
    if (!runId) return submitData;
    
    // Poll for results
    return await pollWorkflowResult(runId, apiKey);
};

async function pollWorkflowResult(runId, apiKey, maxAttempts = 900, interval = 2000) {
    const pollUrl = `${MUAPI_PROXY_PATHS.workflow}/run/${runId}/api-outputs`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const response = await fetch(pollUrl, {
                headers: jsonHeaders(apiKey)
            });
            if (!response.ok) {
                if (response.status >= 500) continue;
                throw new Error(`轮询失败：${response.status}`);
            }
            const data = await response.json();
            const status = data.status?.toLowerCase();
            if (status === 'completed' || status === 'succeeded' || status === 'success') return data;
            if (status === 'failed' || status === 'error') throw new Error(`工作流运行失败：${data.error || '未知错误'}`);
        } catch (error) {
            if (attempt === maxAttempts) throw error;
        }
    }
    throw new Error('工作流轮询超时。');
};

export async function getAllNodeSchemas(apiKey, workflowId) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/${workflowId}/node-schemas`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取节点 schema 失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function getWorkflowData(apiKey, workflowId) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/get-workflow-def/${workflowId}`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取工作流数据失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
};

export async function getNodeSchemas(apiKey, workflowId) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/${workflowId}/api-node-schemas`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取节点 schema 失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function runSingleNode(apiKey, workflowId, nodeId, payload) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/${workflowId}/node/${nodeId}/run`, {
        method: 'POST',
        headers: jsonHeaders(apiKey),
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`运行单个节点失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function deleteNodeRun(apiKey, nodeRunId) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/node-run/${nodeRunId}`, {
        method: 'DELETE',
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`删除节点运行记录失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function getNodeStatus(apiKey, runId) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.workflow}/run/${runId}/status`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取节点状态失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

/**
 * Handle proxy requests centralizing communication logic with MuAPI.
 * This is used by the server-side entry points.
 */
export async function handleProxyRequest(prefix, path, method, headers, body, apiKey) {
    const url = `${BASE_URL}/${prefix}/${path}`;
    
    const finalHeaders = new Headers(headers);
    finalHeaders.delete('host');
    finalHeaders.delete('connection');
    finalHeaders.delete('content-length'); // Let fetch recalculate this for safety

    const normalizedKey = normalizeApiKey(apiKey);
    if (normalizedKey) {
        finalHeaders.set('x-api-key', normalizedKey);
    }

    try {
        const response = await fetch(url, {
            method,
            headers: finalHeaders,
            body: (method !== 'GET' && method !== 'HEAD') ? body : undefined,
            redirect: 'follow',
        });

        const contentType = response.headers.get('Content-Type') || 'application/json';
        const buffer = await response.arrayBuffer();
        
        return {
            status: response.status,
            contentType,
            data: buffer
        };
    } catch (error) {
        console.error(`MuAPI Proxy error for ${url}:`, error);
        throw error;
    }
}

/**
 * A centralized handler for Next.js API routes or middleware.
 */
export async function handleServerSideProxy(prefix, request, params, apiKey) {
    try {
        const slug = await params;
        const pathSegments = slug.path || [];
        const path = pathSegments.join('/');
        
        const method = request.method;
        let body = null;
        if (method !== 'GET' && method !== 'HEAD') {
            body = await request.arrayBuffer();
        }

        const { search } = new URL(request.url);
        const pathWithSearch = search ? `${path}${search}` : path;

        return await handleProxyRequest(
            prefix, 
            pathWithSearch, 
            method, 
            request.headers, 
            body, 
            apiKey
        );
    } catch (error) {
        console.error(`Server proxy failed:`, error);
        throw error;
    }
}

export async function calculateDynamicCost(apiKey, taskName, payload) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.apiV1}/app/calculate_dynamic_cost`, {
        method: 'POST',
        headers: jsonHeaders(apiKey),
        body: JSON.stringify({ task_name: taskName, payload })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to calculate dynamic cost: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function registerAppInterest(apiKey, appName) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.app}/interest`, {
        method: 'POST',
        headers: jsonHeaders(apiKey),
        body: JSON.stringify({ app_name: appName })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to register interest: ${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

export async function getAppInterests(apiKey) {
    const response = await fetch(`${MUAPI_PROXY_PATHS.app}/interests`, {
        headers: jsonHeaders(apiKey)
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取兴趣登记失败：${response.status} - ${errText.slice(0, 100)}`);
    }
    return await response.json();
}

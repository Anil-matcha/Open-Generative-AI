import { authenticateCreatorRequest } from './creatorAuth.js';
import { authorizeCreatorRequest, creatorJson } from './creatorProviderGateway.js';
import { muapiConfiguration } from './muapiCreatorProvider.js';
import { proxyMuapi } from './muapiProxy.js';

export function creatorMuapiProxyCredential(request, {
    env = process.env,
    action = 'creative-canvas',
    statusRequest = false,
} = {}) {
    const authentication = authenticateCreatorRequest(request, { env });
    if (!authentication.valid) return { creatorSession: false };
    const auth = authorizeCreatorRequest(request, { env, action, statusRequest });
    if (auth.response) return { creatorSession: true, response: auth.response };
    const configuration = muapiConfiguration(env);
    if (!configuration.configured) {
        return {
            creatorSession: true,
            response: creatorJson({
                error: 'Creative Canvas requires the safe active MuAPI configuration.',
                missing: configuration.missing,
            }, 503),
        };
    }
    return {
        creatorSession: true,
        user: auth.user,
        apiKey: configuration.apiKey,
        keyMode: configuration.keyMode,
    };
}

export async function proxyCreatorCreativeCanvas(request, {
    prefix = 'api/v1/creative-agent',
    pathSegments = [],
    method = request.method,
    env = process.env,
    fetchImpl = fetch,
} = {}) {
    const credential = creatorMuapiProxyCredential(request, {
        env,
        action: `creative-canvas-${String(method).toLowerCase()}`,
        statusRequest: ['GET', 'HEAD'].includes(String(method).toUpperCase()),
    });
    if (credential.response) return credential.response;
    if (!credential.creatorSession) {
        // Preserve standalone/desktop BYOK behavior outside the Creator shell.
        return proxyMuapi(request, { prefix, pathSegments, method, env, fetchImpl });
    }
    return proxyMuapi(request, {
        prefix,
        pathSegments,
        method,
        env,
        requireApiKey: false,
        apiKeyOverride: credential.apiKey,
        fetchImpl,
    });
}

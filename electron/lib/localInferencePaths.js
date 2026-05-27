const path = require('path');

const LOCAL_AI_DIR_ENV = 'OPEN_GENERATIVE_AI_LOCAL_AI_DIR';

function normalizeDirOverride(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function resolveLocalAiPaths({ userDataPath, env = process.env } = {}) {
    const customDir = normalizeDirOverride(env[LOCAL_AI_DIR_ENV]);

    if (!customDir && !userDataPath) {
        throw new Error(`userDataPath is required when ${LOCAL_AI_DIR_ENV} is not set`);
    }

    const dataDir = path.resolve(customDir || path.join(userDataPath, 'local-ai'));

    return {
        dataDir,
        binDir: path.join(dataDir, 'bin'),
        modelsDir: path.join(dataDir, 'models'),
        tmpDir: path.join(dataDir, 'tmp'),
    };
}

module.exports = {
    LOCAL_AI_DIR_ENV,
    resolveLocalAiPaths,
};

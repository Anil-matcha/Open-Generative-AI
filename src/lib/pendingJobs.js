const PENDING_KEY = 'muapi_pending_jobs';

export function savePendingJob(job) {
    try {
        const jobs = getAllPendingJobs().filter(j => j.requestId !== job.requestId);
        jobs.push(job);
        localStorage.setItem(PENDING_KEY, JSON.stringify(jobs));
    } catch (e) {
        console.warn('[PendingJobs] Failed to save:', e);
    }
}

export function removePendingJob(requestId) {
    try {
        const jobs = getAllPendingJobs().filter(j => j.requestId !== requestId);
        localStorage.setItem(PENDING_KEY, JSON.stringify(jobs));
    } catch (e) {
        console.warn('[PendingJobs] Failed to remove:', e);
    }
}

export function getPendingJobs(studioType) {
    const all = getAllPendingJobs();
    return studioType ? all.filter(j => j.studioType === studioType) : all;
}

function getAllPendingJobs() {
    try {
        return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    } catch {
        return [];
    }
}

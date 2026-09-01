"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  Link2,
  LoaderCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Unlink,
  Video,
} from "lucide-react";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: ImageIcon, accepts: ["image", "video"] },
  { id: "tiktok", label: "TikTok", icon: Video, accepts: ["video"] },
];
const POLL_DELAY_MS = 3000;
const MAX_POLL_ATTEMPTS = 40;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function responseError(response) {
  try {
    const value = await response.json();
    return value.error || value.detail || `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}

function assetType(asset) {
  return asset?.type === "image" ? "image" : asset?.type === "video" ? "video" : "";
}

function safePreviewUrl(value) {
  if (typeof value !== "string" || value.length > 4096) return "";
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const allowed = hostname === "cdn.muapi.ai" ||
      hostname.endsWith(".muapi.ai") ||
      hostname.endsWith(".vercel-storage.com") ||
      hostname.endsWith(".heygen.ai") ||
      hostname.endsWith(".heygen.com");
    if (url.protocol !== "https:" || url.username || url.password || url.hash || !allowed) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function Preview({ mediaUrl, mediaType }) {
  const trustedMediaUrl = safePreviewUrl(mediaUrl);
  if (!trustedMediaUrl) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-black/30 text-center">
        <div><Send className="mx-auto text-white/15" size={30} /><p className="mt-3 text-xs text-white/25">Choose a Creator Asset or enter its public URL.</p></div>
      </div>
    );
  }
  if (mediaType === "video") {
    return <video src={trustedMediaUrl} controls preload="metadata" className="aspect-video w-full rounded-2xl bg-black object-contain" />;
  }
  return <img src={trustedMediaUrl} alt="Selected social asset" className="aspect-video w-full rounded-2xl bg-black object-contain" />;
}

function StatusBadge({ status }) {
  const ready = status?.configured;
  return (
    <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-wider ${ready ? "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200" : "border-amber-300/20 bg-amber-300/[0.08] text-amber-200"}`}>
      {status?.status || "Checking configuration"}
    </span>
  );
}

export default function SocialPublishStudio({ initialAsset = null, initialDraft = null, youtubeWorkspace = null }) {
  const [mode, setMode] = useState("social");
  const [status, setStatus] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [platform, setPlatform] = useState(assetType(initialAsset) === "image" ? "instagram" : "tiktok");
  const [accountId, setAccountId] = useState("");
  const [mediaUrl, setMediaUrl] = useState(initialAsset?.url || "");
  const [mediaType, setMediaType] = useState(assetType(initialAsset) || "video");
  const [caption, setCaption] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState("SELF_ONLY");
  const [placement, setPlacement] = useState("reels");
  const [shareToFeed, setShareToFeed] = useState(true);
  const [disableComment, setDisableComment] = useState(false);
  const [disableDuet, setDisableDuet] = useState(false);
  const [disableStitch, setDisableStitch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState("");
  const [post, setPost] = useState(null);
  const operationToken = useRef(0);
  const publishInFlightRef = useRef(false);

  const platformAccounts = useMemo(
    () => accounts.filter((account) => account.platform === platform && account.connected),
    [accounts, platform],
  );
  const selectedAccount = useMemo(
    () => platformAccounts.find((account) => String(account.id) === String(accountId)) || null,
    [accountId, platformAccounts],
  );

  useEffect(() => {
    const type = assetType(initialAsset);
    if (!type || typeof initialAsset?.url !== "string" || !initialAsset.url.startsWith("https://")) return;
    setMediaUrl(initialAsset.url);
    setMediaType(type);
    if (type === "image") setPlatform("instagram");
  }, [initialAsset]);

  useEffect(() => {
    if (!initialDraft || typeof initialDraft !== "object") return;
    if (["instagram", "tiktok"].includes(initialDraft.platform)) setPlatform(initialDraft.platform);
    if (typeof initialDraft.caption === "string") setCaption(initialDraft.caption.slice(0, initialDraft.platform === "tiktok" ? 150 : 2200));
  }, [initialDraft]);

  async function loadSocial() {
    setLoading(true);
    setError("");
    try {
      const [statusResponse, accountsResponse] = await Promise.all([
        fetch("/api/social/muapi/status", { credentials: "same-origin", cache: "no-store" }),
        fetch("/api/social/muapi/accounts", { credentials: "same-origin", cache: "no-store" }),
      ]);
      const statusValue = await statusResponse.json();
      setStatus(statusValue);
      if (accountsResponse.ok) {
        const accountValue = await accountsResponse.json();
        setAccounts(Array.isArray(accountValue.accounts) ? accountValue.accounts : []);
      } else if (statusValue.configured) {
        throw new Error(await responseError(accountsResponse));
      }
    } catch (loadError) {
      setError(loadError.message || "Social account status is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSocial(); }, []);

  useEffect(() => {
    if (!platformAccounts.some((account) => String(account.id) === String(accountId))) {
      setAccountId(platformAccounts[0] ? String(platformAccounts[0].id) : "");
    }
  }, [accountId, platformAccounts]);

  useEffect(() => {
    if (status && !status.tiktokPublicApproved) setPrivacyLevel("SELF_ONLY");
  }, [status]);

  async function connectPlatform() {
    if (working) return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch("/api/social/muapi/connect", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ platform, returnTo: "/studio/publish" }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const value = await response.json();
      if (typeof value.url !== "string" || !value.url.startsWith("https://")) throw new Error("No valid connection URL was returned.");
      window.location.assign(value.url);
    } catch (connectError) {
      setError(connectError.message || "Social connection could not start.");
      setWorking(false);
    }
  }

  async function disconnectAccount(account) {
    if (working || !window.confirm(`Disconnect ${account.accountName}? Creator Studio will no longer be able to publish to it.`)) return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch("/api/social/muapi/disconnect", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accountId: account.id, approved: true }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      await loadSocial();
    } catch (disconnectError) {
      setError(disconnectError.message || "Social account could not be disconnected.");
    } finally {
      setWorking(false);
    }
  }

  function beginReview() {
    setError("");
    if (!selectedAccount) return setError(`Connect and select a ${platform === "instagram" ? "Instagram" : "TikTok"} account first.`);
    if (!safePreviewUrl(mediaUrl)) return setError("Choose a permitted public HTTPS Creator Asset first.");
    if (platform === "tiktok" && mediaType !== "video") return setError("TikTok publishing currently requires a video Asset.");
    setApproved(false);
    setReviewing(true);
  }

  async function pollPost(jobId, token) {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      await sleep(POLL_DELAY_MS);
      if (operationToken.current !== token) return;
      const response = await fetch(`/api/social/muapi/posts/${encodeURIComponent(jobId)}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) throw new Error(await responseError(response));
      const value = await response.json();
      if (value.post?.status === "published") return setPost(value.post);
      if (value.post?.status === "failed") throw new Error(value.post.error || "Social publishing failed.");
      setPost(value.post || { jobId, status: "publishing", platform });
    }
    throw new Error("Social publishing is still processing. Keep the job ID and check again later.");
  }

  async function confirmPublish() {
    // A React-state check alone is not synchronous: a very fast double-click can invoke this
    // handler twice before the "working" state re-render commits, dispatching two publish
    // requests. Guard with a ref that is set synchronously on the first call.
    if (publishInFlightRef.current || working || !approved) return;
    publishInFlightRef.current = true;
    const token = operationToken.current + 1;
    operationToken.current = token;
    setWorking(true);
    setReviewing(false);
    setError("");
    setPost(null);
    try {
      const response = await fetch("/api/social/muapi/publish", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          platform,
          accountId: selectedAccount.id,
          mediaUrl,
          mediaType: mediaType.toUpperCase(),
          caption,
          privacyLevel,
          placement,
          shareToFeed,
          disableComment,
          disableDuet,
          disableStitch,
          approved: true,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const value = await response.json();
      setPost(value.post);
      await pollPost(value.post.jobId, token);
    } catch (publishError) {
      if (operationToken.current === token) setError(publishError.message || "Social publishing failed.");
    } finally {
      publishInFlightRef.current = false;
      if (operationToken.current === token) setWorking(false);
    }
  }

  if (mode === "youtube" && youtubeWorkspace) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-[#050506] text-white">
        <div className="flex shrink-0 gap-2 border-b border-white/[0.07] px-5 py-3">
          <button type="button" onClick={() => setMode("social")} className="rounded-xl px-4 py-2 text-xs font-bold text-white/40">Instagram &amp; TikTok</button>
          <button type="button" className="rounded-xl bg-white/[0.08] px-4 py-2 text-xs font-bold text-white"><Video size={14} className="mr-2 inline" /> YouTube</button>
        </div>
        <div className="min-h-0 flex-1">{youtubeWorkspace}</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#050506] px-4 py-6 text-white sm:px-7">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">Unified Publish</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Review once. Publish deliberately.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/35">Instagram and TikTok use the secure MuAPI social adapter. YouTube keeps its existing direct private OAuth workflow.</p>
          </div>
          <StatusBadge status={status} />
        </header>

        <div className="mt-6 flex gap-2 border-b border-white/[0.07] pb-3">
          <button type="button" className="rounded-xl bg-white/[0.08] px-4 py-2 text-xs font-bold text-white">Instagram &amp; TikTok</button>
          <button type="button" onClick={() => setMode("youtube")} className="rounded-xl px-4 py-2 text-xs font-bold text-white/40 hover:text-white"><Video size={14} className="mr-2 inline" /> YouTube</button>
        </div>

        {error && <div role="alert" className="mt-5 rounded-2xl border border-red-300/20 bg-red-300/[0.07] px-4 py-3 text-sm text-red-100">{error}</div>}
        {post && <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${post.status === "published" ? "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100" : "border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-100"}`}>
          <div className="flex items-center gap-2">{post.status === "published" ? <CheckCircle2 size={16} /> : <LoaderCircle size={16} className="animate-spin" />}<strong>{post.status === "published" ? "Provider confirmed Published" : "Publishing in progress"}</strong></div>
          <p className="mt-1 text-xs opacity-60">Job {post.jobId}</p>
          {post.url && <a href={post.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold">Open post <ExternalLink size={12} /></a>}
        </div>}

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5">
            <Preview mediaUrl={mediaUrl} mediaType={mediaType} />
            <label className="mt-5 block text-[10px] font-black uppercase tracking-wider text-white/35">Creator Asset URL</label>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/[0.09] bg-black/30 px-3"><Link2 size={14} className="text-white/25" /><input value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="https://cdn.muapi.ai/..." className="min-w-0 flex-1 bg-transparent py-3 text-xs outline-none placeholder:text-white/15" /></div>
            <div className="mt-3 flex gap-2">
              {["image", "video"].map((type) => <button key={type} type="button" disabled={platform === "tiktok" && type === "image"} onClick={() => setMediaType(type)} className={`rounded-lg px-3 py-2 text-[10px] font-bold uppercase ${mediaType === type ? "bg-cyan-300 text-black" : "border border-white/[0.09] text-white/40 disabled:opacity-20"}`}>{type}</button>)}
            </div>
          </section>

          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5">
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => { setPlatform(item.id); if (item.id === "tiktok") setMediaType("video"); }} className={`rounded-xl border px-3 py-3 text-xs font-bold ${platform === item.id ? "border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-100" : "border-white/[0.08] text-white/40"}`}><Icon size={15} className="mr-2 inline" />{item.label}</button>; })}
            </div>

            <div className="mt-5 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-wider text-white/35">Connected accounts</p><button type="button" onClick={loadSocial} disabled={loading} aria-label="Refresh social accounts"><RefreshCw size={13} className={loading ? "animate-spin text-white/20" : "text-white/40"} /></button></div>
            <div className="mt-2 space-y-2">
              {platformAccounts.map((account) => <label key={account.id} className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-3 ${String(account.id) === String(accountId) ? "border-emerald-300/25 bg-emerald-300/[0.06]" : "border-white/[0.07]"}`}><span className="flex items-center gap-2 text-xs"><input type="radio" checked={String(account.id) === String(accountId)} onChange={() => setAccountId(String(account.id))} />{account.accountName}</span><button type="button" onClick={(event) => { event.preventDefault(); disconnectAccount(account); }} aria-label={`Disconnect ${account.accountName}`} className="text-white/20 hover:text-red-200"><Unlink size={13} /></button></label>)}
              {!loading && platformAccounts.length === 0 && <p className="rounded-xl border border-dashed border-white/[0.08] px-3 py-4 text-center text-xs text-white/25">No connected {platform} account.</p>}
            </div>
            <button type="button" onClick={connectPlatform} disabled={working || !status?.configured} className="mt-3 w-full rounded-xl border border-white/[0.1] px-4 py-3 text-xs font-bold text-white/60 disabled:cursor-not-allowed disabled:opacity-30"><Link2 size={14} className="mr-2 inline" /> Connect {platform === "instagram" ? "Instagram" : "TikTok"}</button>

            <label className="mt-5 block text-[10px] font-black uppercase tracking-wider text-white/35">Caption</label>
            <textarea value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={platform === "tiktok" ? 150 : 2200} rows={5} className="mt-2 w-full resize-none rounded-xl border border-white/[0.09] bg-black/30 p-3 text-xs outline-none" placeholder="Caption, hashtags, and call to action" />
            <p className="mt-1 text-right text-[9px] text-white/20">{caption.length}/{platform === "tiktok" ? 150 : 2200}</p>

            {platform === "instagram" ? <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-[10px] text-white/40">Placement<select value={placement} onChange={(event) => setPlacement(event.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.09] bg-[#0c0c0f] p-2 text-xs"><option value="reels">Reels</option><option value="stories">Stories</option><option value="timeline">Timeline</option></select></label><label className="flex items-end gap-2 pb-2 text-xs text-white/50"><input type="checkbox" checked={shareToFeed} onChange={(event) => setShareToFeed(event.target.checked)} />Share to feed</label></div>
              : <div className="mt-4 space-y-3"><label className="block text-[10px] text-white/40">Privacy<select value={privacyLevel} onChange={(event) => setPrivacyLevel(event.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.09] bg-[#0c0c0f] p-2 text-xs"><option value="SELF_ONLY">Only me</option><option value="MUTUAL_FOLLOW_FRIENDS" disabled={!status?.tiktokPublicApproved}>Friends</option><option value="FOLLOWER_OF_CREATOR" disabled={!status?.tiktokPublicApproved}>Followers</option><option value="PUBLIC_TO_EVERYONE" disabled={!status?.tiktokPublicApproved}>Everyone (requires platform approval)</option></select></label>{!status?.tiktokPublicApproved && <p className="text-[10px] text-amber-200/55">TikTok is locked to Only me until the application is approved for public Direct Post.</p>}<div className="grid grid-cols-3 gap-2 text-[10px] text-white/45">{[["Comments", disableComment, setDisableComment], ["Duets", disableDuet, setDisableDuet], ["Stitches", disableStitch, setDisableStitch]].map(([label, checked, setter]) => <label key={label} className="rounded-lg border border-white/[0.07] p-2"><input type="checkbox" checked={checked} onChange={(event) => setter(event.target.checked)} className="mr-1" />Disable {label}</label>)}</div></div>}

            <div className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[0.045] p-3 text-[10px] leading-5 text-amber-100/65"><strong>Cost and approval:</strong> a successful MuAPI social publish costs $0.01. Nothing posts until the Review screen is confirmed. Scheduling is not available because the verified REST contract does not document it.</div>
            <button type="button" onClick={beginReview} disabled={working || !status?.configured} className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-3 text-xs font-black text-black disabled:cursor-not-allowed disabled:opacity-30">Review Publish</button>
            {!status?.publishingEnabled && status?.configured && <p className="mt-2 text-center text-[10px] text-amber-200/60">Publishing is locked by server configuration. Connections and review setup remain safe.</p>}
          </section>
        </div>

        {reviewing && <div role="dialog" aria-modal="true" aria-labelledby="social-publish-review-title" tabIndex={-1} onKeyDown={(event) => { if (event.key === "Escape") setReviewing(false); }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-3xl border border-white/[0.1] bg-[#0c0c0f] p-6 shadow-2xl"><div className="flex items-center gap-2 text-cyan-200"><ShieldCheck size={18} /><p className="text-[10px] font-black uppercase tracking-[0.2em]">Review Publish</p></div><h2 id="social-publish-review-title" className="mt-4 text-xl font-semibold">Confirm the external side effect</h2><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-white/35">Platform</dt><dd className="capitalize">{platform}</dd></div><div className="flex justify-between gap-4"><dt className="text-white/35">Account</dt><dd>{selectedAccount?.accountName}</dd></div><div className="flex justify-between gap-4"><dt className="text-white/35">Asset</dt><dd className="max-w-[65%] truncate">{mediaUrl}</dd></div><div className="flex justify-between gap-4"><dt className="text-white/35">Privacy</dt><dd>{platform === "tiktok" ? privacyLevel : placement}</dd></div><div className="flex justify-between gap-4"><dt className="text-white/35">Provider charge</dt><dd>$0.01 on success</dd></div></dl><label className="mt-6 flex gap-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-xs leading-5 text-amber-100/75"><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} className="mt-1" />I approve publishing this Asset to the selected external account and the stated MuAPI charge.</label>{!status?.publishingEnabled && <p className="mt-3 text-xs text-amber-200/65">Review is available, but the final publish remains locked by server configuration.</p>}<div className="mt-6 flex gap-3"><button type="button" onClick={() => setReviewing(false)} className="flex-1 rounded-xl border border-white/[0.1] px-4 py-3 text-xs font-bold text-white/55">Cancel</button><button type="button" onClick={confirmPublish} disabled={!approved || !status?.publishingEnabled} className="flex-1 rounded-xl bg-cyan-300 px-4 py-3 text-xs font-black text-black disabled:opacity-30">Confirm &amp; Publish</button></div></div></div>}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  POSITIONS,
  SIZES,
  ALIGNS,
  defaultLayout,
  type Layout,
  type Position,
  type Size,
  type Align,
  type TextBlock,
} from "@/lib/layout";

const SIZE_PX: Record<Size, string> = {
  small: "clamp(10px, 1.4cqw, 18px)",
  medium: "clamp(14px, 2.2cqw, 26px)",
  large: "clamp(20px, 3.4cqw, 44px)",
  huge: "clamp(28px, 5.5cqw, 80px)",
};

const POS_CLASSES: Record<Position, string> = {
  "top-left": "items-start justify-start text-left",
  "top-center": "items-start justify-center text-center",
  "top-right": "items-start justify-end text-right",
  "middle-left": "items-center justify-start text-left",
  "middle-center": "items-center justify-center text-center",
  "middle-right": "items-center justify-end text-right",
  "bottom-left": "items-end justify-start text-left",
  "bottom-center": "items-end justify-center text-center",
  "bottom-right": "items-end justify-end text-right",
};

export type EditorProps = {
  assetId: string;
  campaignId: string;
  aspect: string;
  imageUrl: string | null;
  initial: Layout;
  brandFonts: string[];
  paletteColors: string[];
};

export function CanvasEditor(props: EditorProps) {
  const [layout, setLayout] = useState<Layout>(props.initial);
  const [imageUrl, setImageUrl] = useState<string | null>(props.imageUrl);
  const [active, setActive] = useState<keyof Layout>("headline");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<null | "regen" | "regenClean" | "upload">(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const block = layout[active];

  function update(kind: keyof Layout, patch: Partial<TextBlock>) {
    setLayout((prev) => ({ ...prev, [kind]: { ...prev[kind], ...patch } }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/asset/${props.assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: layout.headline.text,
          body: layout.body.text,
          cta: layout.cta.text,
          imageUrl,
          layout,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ? JSON.stringify(json.error) : `HTTP ${res.status}`);
      setSavedAt(Date.now());
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function regenerate(noText: boolean) {
    setBusy(noText ? "regenClean" : "regen");
    setError(null);
    try {
      const res = await fetch(`/api/asset/${props.assetId}/regenerate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noText }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ? JSON.stringify(json.error) : `HTTP ${res.status}`);
      setImageUrl(json.imageUrl);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  }

  async function upload(file: File) {
    setBusy("upload");
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/asset/${props.assetId}/upload-image`, {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ? JSON.stringify(json.error) : `HTTP ${res.status}`);
      setImageUrl(json.imageUrl);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[1fr_22rem]">
      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link
            href={`/campaign/${props.campaignId}`}
            className="text-sm text-neutral-400 hover:text-white"
          >
            ← Back to campaign
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => regenerate(false)}
              disabled={busy !== null}
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs hover:border-neutral-500 disabled:opacity-50"
            >
              {busy === "regen" ? "Regenerating…" : "Swap image"}
            </button>
            <button
              onClick={() => regenerate(true)}
              disabled={busy !== null}
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs hover:border-neutral-500 disabled:opacity-50"
              title="Generate a clean background with no baked-in text"
            >
              {busy === "regenClean" ? "Regenerating…" : "Clean background"}
            </button>
            <label className="cursor-pointer rounded-lg border border-neutral-700 px-3 py-1.5 text-xs hover:border-neutral-500">
              {busy === "upload" ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f);
                  e.currentTarget.value = "";
                }}
                disabled={busy !== null}
              />
            </label>
            {imageUrl && (
              <Link
                href={`/animate?image=${encodeURIComponent(imageUrl)}&sourceType=asset&sourceId=${props.assetId}`}
                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs hover:border-neutral-500"
              >
                Animate →
              </Link>
            )}
          </div>
        </div>

        <Canvas aspect={props.aspect} imageUrl={imageUrl} layout={layout} active={active} setActive={setActive} />
      </div>

      <aside className="space-y-4">
        <BlockTabs active={active} onChange={setActive} />

        <Section title="Text">
          <textarea
            value={block.text}
            onChange={(e) => update(active, { text: e.target.value })}
            rows={2}
            className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </Section>

        <Section title="Position">
          <div className="grid grid-cols-3 gap-1">
            {POSITIONS.map((p) => (
              <button
                key={p}
                onClick={() => update(active, { position: p })}
                className={`rounded border px-2 py-2 text-[10px] ${
                  block.position === p
                    ? "border-white bg-neutral-900"
                    : "border-neutral-800 bg-neutral-950 hover:border-neutral-700"
                }`}
              >
                {p.replace("-", " ")}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Size">
          <div className="grid grid-cols-4 gap-1">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => update(active, { size: s })}
                className={`rounded border px-2 py-1.5 text-xs ${
                  block.size === s
                    ? "border-white bg-neutral-900"
                    : "border-neutral-800 bg-neutral-950 hover:border-neutral-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Align">
          <div className="grid grid-cols-3 gap-1">
            {ALIGNS.map((a) => (
              <button
                key={a}
                onClick={() => update(active, { align: a })}
                className={`rounded border px-2 py-1.5 text-xs ${
                  block.align === a
                    ? "border-white bg-neutral-900"
                    : "border-neutral-800 bg-neutral-950 hover:border-neutral-700"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Color">
          <ColorRow
            value={block.color}
            onChange={(c) => update(active, { color: c })}
            palette={["#ffffff", "#000000", ...props.paletteColors]}
          />
        </Section>

        <Section title="Background">
          <ColorRow
            value={block.bg ?? ""}
            onChange={(c) => update(active, { bg: c || null })}
            palette={["", "#ffffff", "#000000", ...props.paletteColors]}
            allowEmpty
          />
        </Section>

        <Section title="Font">
          <select
            value={block.fontFamily}
            onChange={(e) => update(active, { fontFamily: e.target.value })}
            className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          >
            {fontOptions(props.brandFonts).map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.label}
              </option>
            ))}
          </select>
        </Section>

        <div className="sticky bottom-4 flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/95 p-3 backdrop-blur">
          <div className="text-xs">
            {error ? (
              <span className="text-red-400">{error}</span>
            ) : savedAt ? (
              <span className="text-emerald-400">Saved</span>
            ) : (
              <span className="text-neutral-500">Edit, then save.</span>
            )}
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </aside>
    </main>
  );
}

function Canvas({
  aspect,
  imageUrl,
  layout,
  active,
  setActive,
}: {
  aspect: string;
  imageUrl: string | null;
  layout: Layout;
  active: keyof Layout;
  setActive: (k: keyof Layout) => void;
}) {
  const [w, h] = aspect.split(":").map(Number);
  const ratio = w && h ? `${w} / ${h}` : "1 / 1";

  const blocks: { kind: keyof Layout; block: TextBlock }[] = [
    { kind: "headline", block: layout.headline },
    { kind: "body", block: layout.body },
    { kind: "cta", block: layout.cta },
  ];

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
      style={{ aspectRatio: ratio, containerType: "inline-size" }}
    >
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-2 p-[5%]">
        {POSITIONS.map((pos) => {
          const cellBlocks = blocks.filter((b) => b.block.position === pos);
          return (
            <div key={pos} className={`flex flex-col gap-1.5 ${POS_CLASSES[pos]}`}>
              {cellBlocks.map(({ kind, block }) => (
                <BlockView
                  key={kind}
                  kind={kind}
                  block={block}
                  active={active === kind}
                  onClick={() => setActive(kind)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlockView({
  kind,
  block,
  active,
  onClick,
}: {
  kind: keyof Layout;
  block: TextBlock;
  active: boolean;
  onClick: () => void;
}) {
  if (!block.text) return null;
  const isCta = kind === "cta";
  const padding = isCta ? "0.5em 1em" : block.bg ? "0.25em 0.5em" : "0";
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: SIZE_PX[block.size],
        color: block.color,
        fontFamily: block.fontFamily,
        textAlign: block.align as Align,
        background: block.bg ?? "transparent",
        padding,
        borderRadius: isCta ? "9999px" : block.bg ? "0.25em" : 0,
        outline: active ? "2px dashed rgba(255,255,255,0.6)" : "none",
        outlineOffset: 4,
        lineHeight: 1.15,
        fontWeight: kind === "headline" ? 700 : isCta ? 600 : 400,
        maxWidth: "90%",
        cursor: "pointer",
      }}
      className="text-left"
    >
      {block.text}
    </button>
  );
}

function BlockTabs({
  active,
  onChange,
}: {
  active: keyof Layout;
  onChange: (k: keyof Layout) => void;
}) {
  const tabs: { key: keyof Layout; label: string }[] = [
    { key: "headline", label: "Headline" },
    { key: "body", label: "Body" },
    { key: "cta", label: "CTA" },
  ];
  return (
    <div className="flex gap-1 rounded-lg border border-neutral-800 bg-neutral-950 p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex-1 rounded px-3 py-1.5 text-xs ${
            active === t.key ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      <p className="text-[10px] uppercase tracking-wider text-neutral-500">{title}</p>
      {children}
    </div>
  );
}

function ColorRow({
  value,
  onChange,
  palette,
  allowEmpty,
}: {
  value: string;
  onChange: (c: string) => void;
  palette: string[];
  allowEmpty?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {palette.map((c, i) => {
          const isEmpty = c === "";
          const isActive = value.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={`${c}-${i}`}
              onClick={() => onChange(c)}
              className={`h-6 w-6 rounded border ${
                isActive ? "ring-2 ring-white ring-offset-1 ring-offset-neutral-950" : "border-neutral-700"
              } ${isEmpty ? "bg-[linear-gradient(45deg,transparent_46%,#ef4444_46%,#ef4444_54%,transparent_54%)]" : ""}`}
              style={isEmpty ? undefined : { backgroundColor: c }}
              title={isEmpty ? "none" : c}
            />
          );
        })}
      </div>
      <div className="flex gap-2">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="h-8 w-12 cursor-pointer rounded border border-neutral-800 bg-neutral-900 p-1"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={allowEmpty ? "(none)" : "#3366ff"}
          className="flex-1 rounded border border-neutral-800 bg-neutral-900 px-2 py-1 font-mono text-xs outline-none focus:border-neutral-500"
        />
      </div>
    </div>
  );
}

function fontOptions(brandFonts: string[]): { value: string; label: string }[] {
  const system = [
    { value: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif", label: "System Sans" },
    { value: "ui-serif, Georgia, Cambria, 'Times New Roman', serif", label: "System Serif" },
    { value: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace", label: "System Mono" },
    { value: "Inter, system-ui, sans-serif", label: "Inter" },
    { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
    { value: "Georgia, serif", label: "Georgia" },
  ];
  const brand = brandFonts
    .filter((f) => f && !/^-/.test(f) && !/^system-ui$/i.test(f))
    .map((f) => ({ value: `${f}, system-ui, sans-serif`, label: `${f} (brand)` }));
  return [...brand, ...system];
}

export { defaultLayout };

"use client";

import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

type DotStyle =
  | "square"
  | "dots"
  | "rounded"
  | "extra-rounded"
  | "classy"
  | "classy-rounded";
type Format = "PNG" | "JPG" | "SVG";

const SIZES = [
  { label: "256", value: 256 },
  { label: "512", value: 512 },
  { label: "1024", value: 1024 },
  { label: "2048", value: 2048 },
] as const;

const FORMATS: Format[] = ["PNG", "JPG", "SVG"];

const DOT_STYLES: { label: string; value: DotStyle }[] = [
  { label: "Square", value: "square" },
  { label: "Dots", value: "dots" },
  { label: "Rounded", value: "rounded" },
  { label: "Extra Round", value: "extra-rounded" },
  { label: "Classy", value: "classy" },
  { label: "Classy Round", value: "classy-rounded" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
      {children}
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>{label}</SectionLabel>
      <div className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5">
        <div className="relative flex-shrink-0">
          <div
            className="h-5 w-5 rounded-md border border-zinc-700"
            style={{ background: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          className="flex-1 bg-transparent font-mono text-sm text-zinc-200 outline-none"
          maxLength={7}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function SegmentGrid({
  cols,
  children,
}: {
  cols: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl py-2 text-xs font-medium transition-colors ${
        active
          ? "bg-zinc-100 text-zinc-900"
          : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

export default function Home() {
  const [data, setData] = useState("");
  const [qrColor, setQrColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(512);
  const [format, setFormat] = useState<Format>("PNG");
  const [dotStyle, setDotStyle] = useState<DotStyle>("square");
  const [logo, setLogo] = useState("");

  const previewRef = useRef<HTMLDivElement>(null);
  const qrInstance = useRef<any>(null);
  const qrLib = useRef<any>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    import("qr-code-styling").then((mod) => {
      qrLib.current = mod.default;
    });
  }, []);

  useEffect(() => {
    if (!previewRef.current) return;

    const run = () => {
      if (!qrLib.current || !previewRef.current) return;

      if (!data) {
        previewRef.current.innerHTML = "";
        qrInstance.current = null;
        return;
      }

      const options = {
        width: 280,
        height: 280,
        data,
        dotsOptions: { color: qrColor, type: dotStyle },
        backgroundOptions: { color: bgColor },
        image: logo || undefined,
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: 0.3,
          margin: 5,
          crossOrigin: "anonymous" as const,
        },
        qrOptions: {
          errorCorrectionLevel: (logo ? "H" : "M") as "H" | "M",
        },
      };

      if (!qrInstance.current) {
        qrInstance.current = new qrLib.current(options);
        previewRef.current.innerHTML = "";
        qrInstance.current.append(previewRef.current);
      } else {
        qrInstance.current.update(options);
      }
    };

    if (qrLib.current) {
      run();
    } else {
      // Library may still be loading — retry shortly
      const t = setTimeout(run, 300);
      return () => clearTimeout(t);
    }
  }, [data, qrColor, bgColor, dotStyle, logo]);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  async function handleDownload() {
    if (!data || !qrLib.current) return;
    try {
      const extMap: Record<Format, string> = { PNG: "png", JPG: "jpeg", SVG: "svg" };
      const ext = extMap[format];

      const qrExport = new qrLib.current({
        width: size,
        height: size,
        data,
        dotsOptions: { color: qrColor, type: dotStyle },
        backgroundOptions: { color: bgColor },
        image: logo || undefined,
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: 0.3,
          margin: 5,
          crossOrigin: "anonymous" as const,
        },
        qrOptions: {
          errorCorrectionLevel: (logo ? "H" : "M") as "H" | "M",
        },
      });

      const blob = await qrExport.getRawData(ext);
      if (!blob) throw new Error("no data");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qrcode-${size}.${format.toLowerCase()}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${size}px ${format}`);
    } catch {
      toast.error("Something went wrong");
    }
  }

  const ready = data.length > 0;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 md:px-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
            QR Generator
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Customize and export your QR code
          </p>
        </div>

        {/* URL Input */}
        <input
          type="text"
          value={data}
          onChange={(e) => setData(e.target.value)}
          placeholder="Enter a URL or text…"
          className="mb-5 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-zinc-600"
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Preview */}
          <div className="md:sticky md:top-8 md:self-start">
            <div
              className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-zinc-800"
              style={{ background: bgColor }}
            >
              {/* Always in DOM so ref stays valid; hidden via CSS when empty */}
              <div
                ref={previewRef}
                style={{ display: data ? "flex" : "none" }}
                className="h-full w-full items-center justify-center"
              />
              {!data && <QrPlaceholder />}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4">
            <ColorField label="QR Color" value={qrColor} onChange={setQrColor} />
            <ColorField label="Background" value={bgColor} onChange={setBgColor} />

            {/* Dot Shape */}
            <div className="flex flex-col gap-1.5">
              <SectionLabel>Shape</SectionLabel>
              <SegmentGrid cols={3}>
                {DOT_STYLES.map((s) => (
                  <Chip
                    key={s.value}
                    active={dotStyle === s.value}
                    onClick={() => setDotStyle(s.value)}
                  >
                    {s.label}
                  </Chip>
                ))}
              </SegmentGrid>
            </div>

            {/* Logo */}
            <div className="flex flex-col gap-1.5">
              <SectionLabel>Logo</SectionLabel>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              {logo ? (
                <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5">
                  <img
                    src={logo}
                    alt="logo"
                    className="h-7 w-7 flex-shrink-0 rounded object-contain"
                  />
                  <span className="flex-1 truncate text-xs text-zinc-400">
                    Logo uploaded
                  </span>
                  <button
                    onClick={() => setLogo("")}
                    className="text-xs text-zinc-500 transition-colors hover:text-zinc-200"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900 py-3 text-xs text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
                >
                  <UploadIcon />
                  Upload image
                </button>
              )}
            </div>

            {/* Export Size */}
            <div className="flex flex-col gap-1.5">
              <SectionLabel>Export Size</SectionLabel>
              <SegmentGrid cols={4}>
                {SIZES.map((s) => (
                  <Chip
                    key={s.value}
                    active={size === s.value}
                    onClick={() => setSize(s.value)}
                  >
                    {s.label}
                  </Chip>
                ))}
              </SegmentGrid>
            </div>

            {/* Format */}
            <div className="flex flex-col gap-1.5">
              <SectionLabel>Format</SectionLabel>
              <SegmentGrid cols={3}>
                {FORMATS.map((f) => (
                  <Chip
                    key={f}
                    active={format === f}
                    onClick={() => setFormat(f)}
                  >
                    {f}
                  </Chip>
                ))}
              </SegmentGrid>
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={!ready}
              className={`mt-2 rounded-xl py-3 text-sm font-medium transition-colors ${
                ready
                  ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                  : "cursor-not-allowed bg-zinc-900 text-zinc-600"
              }`}
            >
              {ready ? `Download ${format}` : "Download"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function QrPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-3 text-zinc-700">
      <svg
        width="52"
        height="52"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="3" height="3" />
        <rect x="18" y="18" width="3" height="3" />
        <rect x="14" y="18" width="3" height="3" />
        <rect x="18" y="14" width="3" height="3" />
      </svg>
      <span className="text-xs">Enter text to preview</span>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

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

// ─── Electron particle background ─────────────────────────────────────────────

function ElectronBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 65;
    const MAX_DIST = 160;

    const pts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 1.3 + 0.4,
    }));

    function frame() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(34,211,238,${(1 - d / MAX_DIST) * 0.09})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34,211,238,0.28)";
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }

      animId = requestAnimationFrame(frame);
    }

    frame();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.55 }}
    />
  );
}

// ─── Small reusable UI pieces ─────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
      {children}
    </span>
  );
}

const CHECKERBOARD =
  "repeating-conic-gradient(#3a3a3a 0% 25%, #262626 0% 50%) 0 0 / 8px 8px";

function ColorField({
  label,
  value,
  onChange,
  transparent = false,
  onTransparentToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  transparent?: boolean;
  onTransparentToggle?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 backdrop-blur-sm">
        {/* Color swatch / picker */}
        <div className="relative flex-shrink-0">
          <div
            className="h-4 w-4 overflow-hidden rounded border border-zinc-700"
            style={{ background: transparent ? CHECKERBOARD : value }}
          />
          {!transparent && (
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          )}
        </div>

        {/* Hex input */}
        <input
          type="text"
          value={transparent ? "Transparent" : value.toUpperCase()}
          readOnly={transparent}
          onChange={(e) => {
            if (transparent) return;
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          className={`flex-1 bg-transparent font-mono text-xs outline-none ${
            transparent ? "cursor-default text-zinc-500 italic" : "text-zinc-200"
          }`}
          maxLength={7}
          spellCheck={false}
        />

        {/* α toggle */}
        {onTransparentToggle && (
          <button
            onClick={onTransparentToggle}
            title={transparent ? "Remove transparency" : "Set transparent"}
            className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
              transparent
                ? "border border-cyan-500/40 bg-cyan-500/20 text-cyan-400"
                : "text-zinc-600 hover:text-zinc-300"
            }`}
          >
            α
          </button>
        )}
      </div>
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
      className={`rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
        active
          ? "bg-zinc-100 text-zinc-900"
          : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

function QrPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-3 text-zinc-700">
      <svg
        width="48"
        height="48"
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
      width="13"
      height="13"
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [data, setData] = useState("");
  const [qrColor, setQrColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [qrTransparent, setQrTransparent] = useState(false);
  const [bgTransparent, setBgTransparent] = useState(false);
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
    function run() {
      if (!qrLib.current || !previewRef.current) return;

      if (!data) {
        previewRef.current.innerHTML = "";
        qrInstance.current = null;
        return;
      }

      const options = {
        width: 420,
        height: 420,
        data,
        dotsOptions: {
          color: qrTransparent ? "rgba(0,0,0,0)" : qrColor,
          type: dotStyle,
        },
        backgroundOptions: {
          color: bgTransparent ? "rgba(0,0,0,0)" : bgColor,
        },
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
    }

    if (qrLib.current) {
      run();
    } else {
      const t = setTimeout(run, 300);
      return () => clearTimeout(t);
    }
  }, [data, qrColor, bgColor, qrTransparent, bgTransparent, dotStyle, logo]);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleDownload() {
    if (!data || !qrLib.current) return;

    if (format === "JPG" && (bgTransparent || qrTransparent)) {
      toast.error("JPG doesn't support transparency — use PNG or SVG.");
      return;
    }

    try {
      const extMap: Record<Format, string> = { PNG: "png", JPG: "jpeg", SVG: "svg" };
      const ext = extMap[format];

      const qrExport = new qrLib.current({
        width: size,
        height: size,
        data,
        dotsOptions: {
          color: qrTransparent ? "rgba(0,0,0,0)" : qrColor,
          type: dotStyle,
        },
        backgroundOptions: {
          color: bgTransparent ? "rgba(0,0,0,0)" : bgColor,
        },
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
    <main className="relative flex h-screen flex-col overflow-hidden bg-zinc-950">
      <ElectronBackground />

      {/* Header */}
      <header className="relative z-10 flex-shrink-0 pt-6 pb-2 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
          QR Generator
        </h1>
        <p className="mt-0.5 text-xs text-zinc-500">
          Customize and export your QR code
        </p>
      </header>

      {/* URL Input — mobile only; desktop version lives inside the left column */}
      <div className="relative z-10 flex-shrink-0 px-6 pt-3 pb-3 md:hidden">
        <input
          type="text"
          value={data}
          onChange={(e) => setData(e.target.value)}
          placeholder="Enter a URL or text…"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none backdrop-blur-sm transition focus:border-zinc-600"
        />
      </div>

      {/* Two-column content — fills remaining height */}
      <div className="relative z-10 flex flex-1 overflow-hidden gap-6 px-6 md:px-14 pb-3">
        {/* Left: URL input + QR preview stacked */}
        <div className="hidden md:flex flex-1 flex-col gap-3 overflow-hidden">
          {/* URL input — same width as the QR preview */}
          <input
            type="text"
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="Enter a URL or text…"
            className="flex-shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none backdrop-blur-sm transition focus:border-zinc-600"
          />

          {/* QR preview — fills remaining height as a square */}
          <div className="flex flex-1 min-h-0 items-center justify-center">
            <div
              className="flex items-center justify-center overflow-hidden rounded-2xl border border-zinc-800"
              style={{
                background: bgTransparent ? CHECKERBOARD : bgColor,
                height: "100%",
                aspectRatio: "1",
                maxWidth: "100%",
              }}
            >
              <div
                ref={previewRef}
                style={{ display: data ? "block" : "none", width: "100%", height: "100%" }}
                className="[&>canvas]:!w-full [&>canvas]:!h-auto"
              />
              {!data && <QrPlaceholder />}
            </div>
          </div>
        </div>

        {/* Right: Controls — split into top / bottom groups to fill height */}
        <div className="w-full md:w-72 flex-shrink-0 flex flex-col justify-between overflow-y-auto">
          {/* Top controls */}
          <div className="flex flex-col gap-3">
            <ColorField
              label="QR Color"
              value={qrColor}
              onChange={setQrColor}
              transparent={qrTransparent}
              onTransparentToggle={() => setQrTransparent((v) => !v)}
            />
            <ColorField
              label="Background"
              value={bgColor}
              onChange={setBgColor}
              transparent={bgTransparent}
              onTransparentToggle={() => setBgTransparent((v) => !v)}
            />

            {/* Shape */}
            <div className="flex flex-col gap-1">
              <Label>Shape</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {DOT_STYLES.map((s) => (
                  <Chip
                    key={s.value}
                    active={dotStyle === s.value}
                    onClick={() => setDotStyle(s.value)}
                  >
                    {s.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Logo */}
            <div className="flex flex-col gap-1">
              <Label>Logo</Label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              {logo ? (
                <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2">
                  <img
                    src={logo}
                    alt="logo"
                    className="h-6 w-6 flex-shrink-0 rounded object-contain"
                  />
                  <span className="flex-1 truncate text-xs text-zinc-400">
                    Logo uploaded
                  </span>
                  <button
                    onClick={() => setLogo("")}
                    className="text-[11px] text-zinc-500 transition-colors hover:text-zinc-200"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/60 py-2.5 text-xs text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
                >
                  <UploadIcon />
                  Upload image
                </button>
              )}
            </div>
          </div>

          {/* Bottom controls — pushed to bottom via justify-between */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label>Export Size</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {SIZES.map((s) => (
                  <Chip
                    key={s.value}
                    active={size === s.value}
                    onClick={() => setSize(s.value)}
                  >
                    {s.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label>Format</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {FORMATS.map((f) => (
                  <Chip
                    key={f}
                    active={format === f}
                    onClick={() => setFormat(f)}
                  >
                    {f}
                  </Chip>
                ))}
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={!ready}
              className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${
                ready
                  ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                  : "cursor-not-allowed bg-zinc-900/80 text-zinc-600"
              }`}
            >
              {ready ? `Download ${format}` : "Download"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 flex-shrink-0 py-3 text-center">
        <p className="text-xs text-zinc-600">
          Built with ❤️ by{" "}
          <a
            href="https://acloe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Acloe
          </a>
        </p>
      </footer>
    </main>
  );
}

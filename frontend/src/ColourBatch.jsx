import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const MAX_IMAGES = 50;
const MAX_PROXY_SIDE = 1200;
const MAX_WEBGL_TEXTURES = 20;
const MAX_CACHED_WEBGL_TEXTURES = MAX_WEBGL_TEXTURES - 1;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

const tokens = {
  paper: '#F2EFE9',
  paperAlt: '#E9E6DF',
  ink: '#0D0D0C',
  mute: '#A09A8E',
  line: 'rgba(13,13,12,0.12)',
  lineStrong: 'rgba(13,13,12,0.24)',
  soft: 'rgba(13,13,12,0.04)',
  accent: '#7CC4FF',
};

const NEUTRAL_ADJUSTMENTS = {
  brightness: 0,
  contrast: 1,
  saturation: 1,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  hueShift: 0,
  vibrance: 0,
  gamma: 1,
  lift: { r: 0, g: 0, b: 0 },
  gain: { r: 1, g: 1, b: 1 },
  vignette: 0,
  grainAmount: 0,
  grainSize: 1,
};

const PRESETS = [
  { id: 'original', name: 'Original', category: 'Base', adjustments: { ...NEUTRAL_ADJUSTMENTS } },
  {
    id: 'cinematic-teal-orange',
    name: 'Cinematic Teal & Orange',
    category: 'Film',
    adjustments: {
      brightness: 0.05,
      contrast: 1.15,
      saturation: 0.9,
      temperature: -800,
      vibrance: 0.2,
      lift: { r: 0, g: 0.02, b: 0.06 },
      gain: { r: 1.05, g: 0.95, b: 0.85 },
      vignette: 0.3,
    },
  },
  {
    id: 'kodak-portra',
    name: 'Kodak Portra',
    category: 'Film',
    adjustments: {
      brightness: 0.08,
      contrast: 1.05,
      saturation: 0.85,
      temperature: 400,
      shadows: 0.08,
      gamma: 1.05,
      lift: { r: 0.03, g: 0.02, b: 0.01 },
      gain: { r: 1.02, g: 1, b: 0.95 },
    },
  },
  {
    id: 'cross-process',
    name: 'Cross Process',
    category: 'Film',
    adjustments: {
      brightness: 0.03,
      contrast: 1.1,
      saturation: 1.1,
      hueShift: 15,
      temperature: -200,
      lift: { r: 0, g: 0.05, b: 0 },
      gain: { r: 1.1, g: 0.9, b: 1.05 },
    },
  },
  {
    id: 'faded-vintage',
    name: 'Faded Vintage',
    category: 'Mood',
    adjustments: {
      brightness: 0.06,
      contrast: 0.85,
      saturation: 0.7,
      temperature: 300,
      shadows: 0.12,
      gamma: 1.1,
      lift: { r: 0.04, g: 0.03, b: 0.02 },
    },
  },
  {
    id: 'natural-boost',
    name: 'Natural Boost',
    category: 'Clean',
    adjustments: {
      contrast: 1.08,
      vibrance: 0.25,
      temperature: 50,
      saturation: 1.05,
      gamma: 0.98,
    },
  },
  {
    id: 'studio-clean',
    name: 'Studio Clean',
    category: 'Clean',
    adjustments: {
      contrast: 1.1,
      saturation: 1,
      temperature: 0,
      gamma: 0.95,
      highlights: 0.05,
      shadows: -0.02,
    },
  },
  {
    id: 'film-grain-light',
    name: 'Film Grain Light',
    category: 'Film',
    description: 'subtle film grain over a clean neutral grade',
    adjustments: {
      contrast: 1.05,
      saturation: 0.95,
      temperature: 100,
      gamma: 1.02,
      grainAmount: 0.04,
      grainSize: 1,
    },
  },
  {
    id: 'film-grain-heavy',
    name: 'Film Grain Heavy',
    category: 'Film',
    description: 'pronounced grain with a warm slightly lifted base, feels like pushed 35mm film',
    adjustments: {
      contrast: 1.1,
      saturation: 0.85,
      temperature: 200,
      shadows: 0.05,
      gamma: 1.05,
      lift: { r: 0.02, g: 0.02, b: 0.02 },
      grainAmount: 0.09,
      grainSize: 1.5,
    },
  },
  {
    id: 'urban-natural',
    name: 'Urban Natural',
    category: 'Mood',
    description: 'clean city shooting in natural light, subtle cool shadows, gentle depth, nothing pushed too far',
    adjustments: {
      brightness: 0.02,
      contrast: 1.08,
      saturation: 0.95,
      temperature: -150,
      tint: 0,
      highlights: 0.06,
      shadows: -0.03,
      vibrance: 0.15,
      gamma: 0.98,
      lift: { r: 0, g: 0, b: 0.02 },
      gain: { r: 0.98, g: 0.99, b: 1.02 },
      vignette: 0.2,
      grainAmount: 0.02,
      grainSize: 1,
    },
  },
  {
    id: 'matte-brown',
    name: 'Matte Brown',
    category: 'Mood',
    description: 'warm matte finish with lifted shadows and a faded brown tone, popular in lifestyle and travel photography',
    adjustments: {
      brightness: 0.03,
      contrast: 0.9,
      saturation: 0.8,
      temperature: 400,
      shadows: 0.1,
      highlights: -0.05,
      gamma: 1.08,
      lift: { r: 0.05, g: 0.04, b: 0.02 },
      gain: { r: 1, g: 0.97, b: 0.9 },
      vignette: 0.2,
    },
  },
  {
    id: 'forest-green',
    name: 'Forest & Green',
    category: 'Mood',
    description: 'nature shooting, boosts greens and earthy tones, lifted shadows for foliage detail, warm without being orange',
    adjustments: {
      brightness: 0.03,
      contrast: 1.06,
      saturation: 1.05,
      temperature: 200,
      tint: 0.02,
      highlights: 0.04,
      shadows: 0.06,
      vibrance: 0.2,
      gamma: 1.02,
      lift: { r: 0.01, g: 0.03, b: 0.01 },
      gain: { r: 0.97, g: 1.04, b: 0.95 },
      vignette: 0.15,
      grainAmount: 0.02,
      grainSize: 1,
    },
  },
  {
    id: 'seoul-soft',
    name: 'Seoul Soft',
    category: 'Mood',
    description: 'soft pastel-adjacent skin-friendly grade, popular in Korean street and portrait photography',
    adjustments: {
      brightness: 0.08,
      contrast: 0.92,
      saturation: 0.88,
      temperature: 150,
      tint: 0.03,
      shadows: 0.07,
      highlights: 0.05,
      gamma: 1.06,
      lift: { r: 0.03, g: 0.02, b: 0.03 },
      vibrance: 0.15,
    },
  },
  {
    id: 'candlelight-diner',
    name: 'Candlelight Diner',
    category: 'Mood',
    description: 'restaurant and indoor warm light, rich warm shadows, slight matte finish, keeps skin tones natural',
    adjustments: {
      brightness: 0.04,
      contrast: 1.05,
      saturation: 0.92,
      temperature: 600,
      tint: -0.02,
      highlights: -0.04,
      shadows: 0.06,
      vibrance: 0.1,
      gamma: 1.04,
      lift: { r: 0.04, g: 0.02, b: 0 },
      gain: { r: 1.06, g: 1, b: 0.9 },
      vignette: 0.25,
      grainAmount: 0.03,
      grainSize: 1,
    },
  },
  {
    id: 'sunset-film',
    name: 'Sunset Film',
    category: 'Film',
    description: 'warm golden tones with light grain, feels like a summer disposable camera shot',
    adjustments: {
      brightness: 0.06,
      contrast: 1.08,
      saturation: 1,
      temperature: 800,
      tint: -0.02,
      highlights: 0.12,
      shadows: 0.04,
      gamma: 1.03,
      lift: { r: 0.04, g: 0.02, b: 0 },
      gain: { r: 1.08, g: 0.98, b: 0.88 },
      vignette: 0.2,
      grainAmount: 0.03,
      grainSize: 1,
    },
  },
];

function normalisePreset(preset) {
  const adjustments = preset?.adjustments || {};
  return {
    ...NEUTRAL_ADJUSTMENTS,
    ...adjustments,
    lift: { ...NEUTRAL_ADJUSTMENTS.lift, ...(adjustments.lift || {}) },
    gain: { ...NEUTRAL_ADJUSTMENTS.gain, ...(adjustments.gain || {}) },
  };
}

function isAcceptedImageFile(file) {
  return ACCEPTED_TYPES.has((file.type || '').toLowerCase()) || ACCEPTED_EXTENSIONS.test(file.name || '');
}

function releaseImageResources(image) {
  [image?.proxyDataUrl, image?.gradedDataUrl].forEach((url) => {
    if (typeof url === 'string' && url.startsWith('blob:')) URL.revokeObjectURL(url);
  });
}

function MonoLabel({ children, size = 10, color, className = '' }) {
  return (
    <span
      className={`font-['JetBrains_Mono',ui-monospace,monospace] font-medium uppercase tracking-[0.08em] ${className}`}
      style={{ fontSize: size, color }}
    >
      {children}
    </span>
  );
}

function IOSStatusBar({ dark = false }) {
  const c = dark ? '#fff' : '#000';

  return (
    <div className="relative z-20 flex w-full items-center justify-center gap-[154px] px-6 pb-[19px] pt-[21px]">
      <div className="flex h-[22px] flex-1 items-center justify-center pt-[1.5px]">
        <span
          className="font-[-apple-system,'SF_Pro',system-ui] text-[17px] font-[590] leading-[22px]"
          style={{ color: c }}
        >
          9:41
        </span>
      </div>
      <div className="flex h-[22px] flex-1 items-center justify-center gap-[7px] pr-px pt-px">
        <svg width="19" height="12" viewBox="0 0 19 12" aria-hidden="true">
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill={c} />
          <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill={c} />
          <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill={c} />
          <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill={c} />
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12" aria-hidden="true">
          <path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z" fill={c} />
          <path d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z" fill={c} />
          <circle cx="8.5" cy="10.5" r="1.5" fill={c} />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13" aria-hidden="true">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={c} strokeOpacity="0.35" fill="none" />
          <rect x="2" y="2" width="20" height="9" rx="2" fill={c} />
          <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill={c} fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

function AppShell({ children }) {
  return (
    <div className="relative h-[100dvh] w-full max-w-[430px] overflow-hidden bg-[#F2EFE9] font-[-apple-system,system-ui,sans-serif] shadow-[0_24px_60px_rgba(0,0,0,0.18)] antialiased sm:h-[874px] sm:rounded-[34px]">
      {children}
    </div>
  );
}

function CornerBrackets({ color = tokens.accent }) {
  const cornerBase = 'absolute h-2.5 w-2.5';
  const lineBase = 'absolute bg-current';

  return (
    <div className="pointer-events-none absolute inset-1" style={{ color }}>
      <div className={`${cornerBase} left-0 top-0`}>
        <div className={`${lineBase} left-0 top-0 h-px w-2.5`} />
        <div className={`${lineBase} left-0 top-0 h-2.5 w-px`} />
      </div>
      <div className={`${cornerBase} right-0 top-0 scale-x-[-1]`}>
        <div className={`${lineBase} left-0 top-0 h-px w-2.5`} />
        <div className={`${lineBase} left-0 top-0 h-2.5 w-px`} />
      </div>
      <div className={`${cornerBase} bottom-0 left-0 scale-y-[-1]`}>
        <div className={`${lineBase} left-0 top-0 h-px w-2.5`} />
        <div className={`${lineBase} left-0 top-0 h-2.5 w-px`} />
      </div>
      <div className={`${cornerBase} bottom-0 right-0 scale-[-1]`}>
        <div className={`${lineBase} left-0 top-0 h-px w-2.5`} />
        <div className={`${lineBase} left-0 top-0 h-2.5 w-px`} />
      </div>
    </div>
  );
}

function Header({ imagesCount, selectedCount, onAddMore }) {
  return (
    <div
      className="relative z-20 border-b border-[rgba(13,13,12,0.12)] bg-[#F2EFE9] px-[18px] pb-2.5"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 18px)' }}
    >
      <div className="flex items-end justify-between">
        <button
          type="button"
          onClick={imagesCount ? onAddMore : undefined}
          className="min-h-8 appearance-none bg-transparent p-0 text-[#0D0D0C] disabled:cursor-default disabled:text-[#A09A8E]"
          disabled={!imagesCount}
        >
          <MonoLabel size={10}>{imagesCount ? '+ ADD MORE' : 'COLOURBATCH'}</MonoLabel>
        </button>
        <MonoLabel size={10} color={tokens.mute}>
          16:9 - sRGB
        </MonoLabel>
      </div>
      <div className="mt-1.5 flex items-baseline justify-between">
        <h1 className="m-0 font-['Space_Grotesk',system-ui] text-[26px] font-medium leading-none tracking-normal text-[#0D0D0C]">
          NEW BATCH
        </h1>
        <MonoLabel size={10} color={tokens.mute}>
          {String(selectedCount).padStart(2, '0')}/{String(imagesCount || MAX_IMAGES).padStart(2, '0')}
        </MonoLabel>
      </div>
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-x-[18px] z-40 border border-[rgba(13,13,12,0.18)] bg-[#0D0D0C] px-3 py-2 text-[#F2EFE9] shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 92px)' }}
    >
      <MonoLabel size={9} color="#F2EFE9">
        {message}
      </MonoLabel>
    </div>
  );
}

async function loadImage(file) {
  const objectUrl = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = 'async';
  img.src = objectUrl;

  try {
    if (img.decode) await img.decode();
    else {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
    }
  } catch {
    await new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  return img;
}

async function canvasToDataUrl(canvas, type) {
  const mime = type === 'image/png' ? 'image/png' : 'image/jpeg';

  if (canvas.convertToBlob) {
    const blob = await canvas.convertToBlob({ type: mime, quality: 0.86 });
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  return canvas.toDataURL(mime, 0.86);
}

async function createProxy(file) {
  const img = await loadImage(file);
  const longestSide = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height);
  const scale = Math.min(1, MAX_PROXY_SIDE / longestSide);
  const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
  const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(width, height)
    : Object.assign(document.createElement('canvas'), { width, height });
  const context = canvas.getContext('2d', { alpha: file.type === 'image/png' });

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(img, 0, 0, width, height);

  return canvasToDataUrl(canvas, file.type);
}

const VERTEX_SHADER_SOURCE = `#version 300 es
in vec2 aPosition;
out vec2 vTexCoord;

void main() {
  vTexCoord = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

uniform sampler2D uImage;
uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;
uniform float uTemperature;
uniform float uTint;
uniform float uHighlights;
uniform float uShadows;
uniform float uHueShift;
uniform float uVibrance;
uniform float uGamma;
uniform vec3 uLift;
uniform vec3 uGain;
uniform float uVignette;
uniform float u_grain_amount;
uniform float u_grain_size;
uniform float u_grain_seed;

in vec2 vTexCoord;
out vec4 outColor;

float luminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 rgbToHsl(vec3 color) {
  float maxChannel = max(max(color.r, color.g), color.b);
  float minChannel = min(min(color.r, color.g), color.b);
  float hue = 0.0;
  float sat = 0.0;
  float light = (maxChannel + minChannel) * 0.5;
  float delta = maxChannel - minChannel;

  if (delta > 0.00001) {
    sat = light > 0.5 ? delta / (2.0 - maxChannel - minChannel) : delta / (maxChannel + minChannel);
    if (maxChannel == color.r) {
      hue = (color.g - color.b) / delta + (color.g < color.b ? 6.0 : 0.0);
    } else if (maxChannel == color.g) {
      hue = (color.b - color.r) / delta + 2.0;
    } else {
      hue = (color.r - color.g) / delta + 4.0;
    }
    hue /= 6.0;
  }

  return vec3(hue, sat, light);
}

float hueToRgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
  if (t < 1.0 / 2.0) return q;
  if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
  return p;
}

vec3 hslToRgb(vec3 hsl) {
  if (hsl.y <= 0.00001) return vec3(hsl.z);
  float q = hsl.z < 0.5 ? hsl.z * (1.0 + hsl.y) : hsl.z + hsl.y - hsl.z * hsl.y;
  float p = 2.0 * hsl.z - q;
  return vec3(
    hueToRgb(p, q, hsl.x + 1.0 / 3.0),
    hueToRgb(p, q, hsl.x),
    hueToRgb(p, q, hsl.x - 1.0 / 3.0)
  );
}

void main() {
  vec4 texel = texture(uImage, vTexCoord);
  vec3 color = texel.rgb;
  float lum = luminance(color);
  float shadowMask = 1.0 - smoothstep(0.0, 0.55, lum);
  float highlightMask = smoothstep(0.45, 1.0, lum);

  color += uBrightness;
  color = (color - 0.5) * uContrast + 0.5;

  lum = luminance(color);
  color = mix(vec3(lum), color, uSaturation);

  float temp = uTemperature / 10000.0;
  color += vec3(temp * 0.85, temp * 0.28, -temp * 0.85);

  float tint = uTint / 100.0;
  color += vec3(tint * 0.5, -tint, tint * 0.5);

  lum = luminance(color);
  shadowMask = 1.0 - smoothstep(0.0, 0.55, lum);
  highlightMask = smoothstep(0.45, 1.0, lum);
  color += uHighlights * highlightMask;
  color += uShadows * shadowMask;

  vec3 hsl = rgbToHsl(clamp(color, 0.0, 1.0));
  hsl.x = fract(hsl.x + uHueShift / 360.0);
  color = hslToRgb(hsl);

  float maxChannel = max(max(color.r, color.g), color.b);
  float minChannel = min(min(color.r, color.g), color.b);
  float saturationAmount = clamp(maxChannel - minChannel, 0.0, 1.0);
  float vibranceBoost = uVibrance * (1.0 - saturationAmount);
  lum = luminance(color);
  color = mix(vec3(lum), color, 1.0 + vibranceBoost);

  lum = luminance(color);
  shadowMask = 1.0 - smoothstep(0.0, 0.55, lum);
  highlightMask = smoothstep(0.45, 1.0, lum);
  color += uLift * shadowMask;
  color *= mix(vec3(1.0), uGain, highlightMask);

  float distanceFromCentre = distance(vTexCoord, vec2(0.5));
  float vignetteMask = smoothstep(0.35, 0.78, distanceFromCentre);
  color *= 1.0 - vignetteMask * uVignette;

  color = clamp(color, 0.0, 1.0);
  color = pow(color, vec3(1.0 / max(uGamma, 0.001)));
  color = clamp(color, 0.0, 1.0);

  float grain = hash(vTexCoord * u_grain_size + u_grain_seed) - 0.5;
  color.rgb += grain * u_grain_amount;
  color.rgb = clamp(color.rgb, 0.0, 1.0);

  outColor = vec4(clamp(color, 0.0, 1.0), texel.a);
}
`;

class WebGLGradingEngine {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.gl = this.canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });

    if (!this.gl) throw new Error('WebGL 2 is not available in this browser.');

    const gl = this.gl;
    const vertexShader = this.createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    this.program = this.createProgram(vertexShader, fragmentShader);
    this.uniforms = this.getUniformLocations();
    this.positionBuffer = gl.createBuffer();
    this.textureCache = new Map();
    this.textureUseCounter = 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
  }

  createTexture() {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  }

  createShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(error || 'Shader compilation failed.');
    }

    return shader;
  }

  createProgram(vertexShader, fragmentShader) {
    const gl = this.gl;
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(error || 'Shader linking failed.');
    }

    return program;
  }

  getUniformLocations() {
    const names = [
      'uImage',
      'uBrightness',
      'uContrast',
      'uSaturation',
      'uTemperature',
      'uTint',
      'uHighlights',
      'uShadows',
      'uHueShift',
      'uVibrance',
      'uGamma',
      'uLift',
      'uGain',
      'uVignette',
      'u_grain_amount',
      'u_grain_size',
      'u_grain_seed',
    ];

    return Object.fromEntries(names.map((name) => [name, this.gl.getUniformLocation(this.program, name)]));
  }

  async loadDataUrl(dataUrl) {
    const img = new Image();
    img.decoding = 'async';
    img.src = dataUrl;
    if (img.decode) await img.decode();
    else {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
    }
    return img;
  }

  uploadImageToTexture(texture, img) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  }

  getCachedTexture(cacheKey) {
    if (!cacheKey) return null;
    const cached = this.textureCache.get(cacheKey);
    if (!cached) return null;
    cached.lastUsed = ++this.textureUseCounter;
    return cached;
  }

  cacheTexture(cacheKey, img, protectedKeys = new Set()) {
    const cached = this.getCachedTexture(cacheKey);
    if (cached) return cached;

    const texture = this.createTexture();
    this.uploadImageToTexture(texture, img);
    const entry = {
      texture,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      lastUsed: ++this.textureUseCounter,
    };
    this.textureCache.set(cacheKey, entry);
    this.evictTextures(protectedKeys);
    return entry;
  }

  evictTextures(protectedKeys = new Set()) {
    const gl = this.gl;
    while (this.textureCache.size > MAX_CACHED_WEBGL_TEXTURES) {
      let oldestKey = null;
      let oldestUse = Infinity;

      for (const [key, entry] of this.textureCache.entries()) {
        if (protectedKeys.has(key)) continue;
        if (entry.lastUsed < oldestUse) {
          oldestUse = entry.lastUsed;
          oldestKey = key;
        }
      }

      if (!oldestKey) {
        for (const [key, entry] of this.textureCache.entries()) {
          if (entry.lastUsed < oldestUse) {
            oldestUse = entry.lastUsed;
            oldestKey = key;
          }
        }
      }

      const entry = this.textureCache.get(oldestKey);
      if (entry?.texture) gl.deleteTexture(entry.texture);
      this.textureCache.delete(oldestKey);
    }
  }

  releaseTexture(cacheKey) {
    const entry = this.textureCache.get(cacheKey);
    if (entry?.texture) this.gl.deleteTexture(entry.texture);
    this.textureCache.delete(cacheKey);
  }

  drawTexture(texture, width, height, preset, type = 'image/jpeg', quality = 0.9, options = {}) {
    const gl = this.gl;
    const adjustments = normalisePreset(preset || PRESETS[0]);
    const grainSeed = typeof options.grainSeed === 'number' ? options.grainSeed : Math.random();

    this.canvas.width = width;
    this.canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    this.setUniforms(adjustments, grainSeed);

    const position = gl.getAttribLocation(this.program, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return this.canvas.toDataURL(type, quality);
  }

  drawImage(img, preset, type = 'image/jpeg', quality = 0.9, options = {}) {
    const gl = this.gl;
    const texture = this.createTexture();
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    try {
      this.uploadImageToTexture(texture, img);
      return this.drawTexture(texture, width, height, preset, type, quality, options);
    } finally {
      gl.deleteTexture(texture);
    }
  }

  setUniforms(adjustments, grainSeed) {
    const gl = this.gl;
    gl.uniform1i(this.uniforms.uImage, 0);
    gl.uniform1f(this.uniforms.uBrightness, adjustments.brightness);
    gl.uniform1f(this.uniforms.uContrast, adjustments.contrast);
    gl.uniform1f(this.uniforms.uSaturation, adjustments.saturation);
    gl.uniform1f(this.uniforms.uTemperature, adjustments.temperature);
    gl.uniform1f(this.uniforms.uTint, adjustments.tint);
    gl.uniform1f(this.uniforms.uHighlights, adjustments.highlights);
    gl.uniform1f(this.uniforms.uShadows, adjustments.shadows);
    gl.uniform1f(this.uniforms.uHueShift, adjustments.hueShift);
    gl.uniform1f(this.uniforms.uVibrance, adjustments.vibrance);
    gl.uniform1f(this.uniforms.uGamma, adjustments.gamma);
    gl.uniform3f(this.uniforms.uLift, adjustments.lift.r, adjustments.lift.g, adjustments.lift.b);
    gl.uniform3f(this.uniforms.uGain, adjustments.gain.r, adjustments.gain.g, adjustments.gain.b);
    gl.uniform1f(this.uniforms.uVignette, adjustments.vignette);
    gl.uniform1f(this.uniforms.u_grain_amount, adjustments.grainAmount);
    gl.uniform1f(this.uniforms.u_grain_size, adjustments.grainSize);
    gl.uniform1f(this.uniforms.u_grain_seed, grainSeed);
  }

  async grade(dataUrl, preset, options = {}) {
    if (!preset || preset.id === 'original') return dataUrl;

    const cached = this.getCachedTexture(options.cacheKey);
    if (cached) {
      return this.drawTexture(cached.texture, cached.width, cached.height, preset, 'image/jpeg', 0.9, options);
    }

    const img = await this.loadDataUrl(dataUrl);
    if (options.cacheKey) {
      const entry = this.cacheTexture(options.cacheKey, img, options.protectedKeys);
      return this.drawTexture(entry.texture, entry.width, entry.height, preset, 'image/jpeg', 0.9, options);
    }

    return this.drawImage(img, preset, 'image/jpeg', 0.9, options);
  }

  async gradeFile(file, preset) {
    const img = await loadImage(file);
    return this.drawImage(img, preset || PRESETS[0], 'image/jpeg', 0.95, { grainSeed: 0.5 });
  }

  dispose() {
    const gl = this.gl;
    for (const entry of this.textureCache.values()) {
      if (entry.texture) gl.deleteTexture(entry.texture);
    }
    this.textureCache.clear();
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.program) gl.deleteProgram(this.program);
  }
}

function waitForFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

function makeExportFileName(fileName, presetId) {
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const safeBase = baseName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'colourbatch-export';
  return `${safeBase}-${presetId || 'original'}.jpg`;
}

function downloadDataUrl(dataUrl, fileName) {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function LazyProxyImage({ image, activePresetId, onVisibilityChange }) {
  const frameRef = useRef(null);
  const currentSrcRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(null);
  const [previousSrc, setPreviousSrc] = useState(null);
  const displaySrc = activePresetId === 'original'
    ? image.proxyDataUrl
    : image.gradedDataUrl || image.proxyDataUrl;

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return undefined;

    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      onVisibilityChange?.(image.id, true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
        onVisibilityChange?.(image.id, entry.isIntersecting);
      },
      { rootMargin: '180px 0px' },
    );

    observer.observe(node);
    return () => {
      onVisibilityChange?.(image.id, false);
      observer.disconnect();
    };
  }, [image.id, onVisibilityChange]);

  useEffect(() => {
    if (!visible || !displaySrc) return undefined;

    let alive = true;
    const decoder = new Image();
    decoder.decoding = 'async';
    decoder.src = displaySrc;

    const markDecoded = () => {
      if (!alive) return;
      const previous = currentSrcRef.current;
      if (previous && previous !== displaySrc) setPreviousSrc(previous);
      currentSrcRef.current = displaySrc;
      setCurrentSrc(displaySrc);

      if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = window.setTimeout(() => setPreviousSrc(null), 220);
    };

    if (decoder.decode) decoder.decode().then(markDecoded).catch(markDecoded);
    else decoder.onload = markDecoded;

    return () => {
      alive = false;
    };
  }, [displaySrc, visible]);

  useEffect(() => () => {
    if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
  }, []);

  return (
    <div ref={frameRef} className="absolute inset-0 bg-[#E9E6DF]">
      {currentSrc ? (
        <>
          {previousSrc && previousSrc !== currentSrc && (
            <img
              src={previousSrc}
              alt=""
              className="absolute inset-0 block h-full w-full animate-[cb-fade-out_200ms_ease_forwards] object-cover"
              draggable={false}
            />
          )}
          <img
            key={currentSrc}
            src={currentSrc}
            alt=""
            className="absolute inset-0 block h-full w-full animate-[cb-fade-in_200ms_ease] object-cover"
            draggable={false}
          />
        </>
      ) : (
        <div className="flex h-full w-full items-end justify-between bg-[linear-gradient(135deg,rgba(13,13,12,0.04),rgba(13,13,12,0.10))] p-1">
          <MonoLabel size={8} color={tokens.mute}>
            proxy
          </MonoLabel>
          <MonoLabel size={8} color={tokens.mute}>
            load
          </MonoLabel>
        </div>
      )}
    </div>
  );
}

function ImageCard({ image, activePresetId, order, onToggle, onOpen, onVisibilityChange }) {
  return (
    <div className="min-w-0">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(image.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen(image.id);
          }
        }}
        className="relative aspect-[1/1.15] cursor-pointer overflow-hidden bg-[#E9E6DF] transition-transform duration-150 active:scale-[0.985]"
        style={{
          outline: image.selected ? `2px solid ${tokens.accent}` : `0.5px solid ${tokens.line}`,
          outlineOffset: image.selected ? -2 : 0,
          transform: image.selected ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        <LazyProxyImage image={image} activePresetId={activePresetId} onVisibilityChange={onVisibilityChange} />
        <div className="pointer-events-none absolute inset-0 bg-black/0" />
        {image.selected && <CornerBrackets />}
        <label
          className="absolute right-1 top-1 z-10 flex h-8 w-8 cursor-pointer items-center justify-center bg-black/55"
          onClick={(event) => event.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={image.selected}
            onChange={(event) => onToggle(image.id, event.target.checked)}
            onClick={(event) => event.stopPropagation()}
            className="h-4 w-4 cursor-pointer accent-[#7CC4FF]"
            aria-label={`Select ${image.fileName}`}
          />
        </label>
        <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
          <MonoLabel size={9} color={image.selected ? tokens.accent : '#fff'} className="bg-black/55 px-1 py-0.5">
            {image.id.slice(-4).toUpperCase()}
          </MonoLabel>
          {image.selected && (
            <MonoLabel size={9} color={tokens.ink} className="min-w-4 bg-[#7CC4FF] px-[5px] py-0.5 text-center">
              {String(order).padStart(2, '0')}
            </MonoLabel>
          )}
        </div>
      </div>
      <MonoLabel size={9} color={tokens.mute} className="mt-[5px] block truncate">
        {image.fileName}
      </MonoLabel>
    </div>
  );
}

function UploadDropZone({ onFiles }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    onFiles(event.dataTransfer.files);
  };

  return (
    <div
      role="region"
      aria-label="Image upload"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className="mx-[18px] mt-3 flex min-h-[calc(100dvh-220px)] flex-col items-center justify-center border border-dashed p-6 text-center transition-colors sm:min-h-[520px]"
      style={{
        borderColor: dragging ? tokens.accent : tokens.lineStrong,
        background: dragging ? 'rgba(124,196,255,0.10)' : tokens.soft,
      }}
    >
      <MonoLabel size={10} color={tokens.mute}>
        SOURCE - CAMERA ROLL
      </MonoLabel>
      <div className="mt-5 font-['Space_Grotesk',system-ui] text-[24px] font-medium leading-none tracking-normal text-[#0D0D0C]">
        Drop images here
      </div>
      <MonoLabel size={10} color={tokens.mute} className="mt-3 max-w-[240px] leading-5">
        Drag multiple JPG, JPEG, PNG, or WEBP files here, or select up to 50 frames.
      </MonoLabel>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-8 cursor-pointer bg-[#0D0D0C] px-4 py-3 text-[#F2EFE9] transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#7CC4FF] focus:ring-offset-2 focus:ring-offset-[#F2EFE9]"
      >
        <MonoLabel size={10} color={tokens.paper}>
          + SELECT FILES
        </MonoLabel>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => {
          onFiles(event.target.files);
          event.target.value = '';
        }}
      />
    </div>
  );
}

function PresetBar({ activePresetId, onSelectPreset, previews }) {
  const barRef = useRef(null);

  const focusPreset = useCallback((presetId) => {
    window.requestAnimationFrame(() => {
      const button = barRef.current?.querySelector(`[data-preset-id="${presetId}"]`);
      button?.focus();
      button?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }, []);

  const movePreset = useCallback((direction) => {
    const currentIndex = PRESETS.findIndex((preset) => preset.id === activePresetId);
    const nextIndex = (currentIndex + direction + PRESETS.length) % PRESETS.length;
    const nextPresetId = PRESETS[nextIndex].id;
    onSelectPreset(nextPresetId);
    focusPreset(nextPresetId);
  }, [activePresetId, focusPreset, onSelectPreset]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      movePreset(1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      movePreset(-1);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      onSelectPreset(PRESETS[0].id);
      focusPreset(PRESETS[0].id);
    }
    if (event.key === 'End') {
      event.preventDefault();
      onSelectPreset(PRESETS[PRESETS.length - 1].id);
      focusPreset(PRESETS[PRESETS.length - 1].id);
    }
  }, [focusPreset, movePreset, onSelectPreset]);

  return (
    <div className="border-b border-[rgba(13,13,12,0.08)] px-[18px] py-2">
      <div className="mb-2 flex items-center justify-between">
        <MonoLabel size={10} color={tokens.mute}>
          PRESET - LOOK
        </MonoLabel>
        <MonoLabel size={10} color={tokens.mute}>
          WEBGL 2
        </MonoLabel>
      </div>
      <div
        ref={barRef}
        role="toolbar"
        aria-label="Preset selector"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex gap-1.5 overflow-x-auto pb-1 focus:outline-none focus:ring-2 focus:ring-[#7CC4FF] focus:ring-offset-2 focus:ring-offset-[#F2EFE9]"
      >
        {PRESETS.map((preset) => {
          const active = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              data-preset-id={preset.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectPreset(preset.id)}
              className="min-w-[76px] touch-manipulation appearance-none bg-transparent p-0 text-left focus:outline-none focus:ring-2 focus:ring-[#7CC4FF] active:opacity-75"
            >
              <div
                className="relative h-[48px] overflow-hidden bg-[#E9E6DF]"
                style={{
                  outline: active ? `2px solid ${tokens.accent}` : `0.5px solid ${tokens.line}`,
                  outlineOffset: active ? -2 : 0,
                }}
              >
                {previews[preset.id] ? (
                  <img src={previews[preset.id]} alt="" className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <div className="h-full w-full bg-[linear-gradient(135deg,rgba(13,13,12,0.05),rgba(13,13,12,0.14))]" />
                )}
                <div className="absolute bottom-1 left-1 bg-black/55 px-1 py-0.5">
                  <MonoLabel size={8} color={active ? tokens.accent : '#fff'}>
                    {preset.category}
                  </MonoLabel>
                </div>
              </div>
              <MonoLabel size={8} color={active ? tokens.ink : tokens.mute} className="mt-1 block truncate">
                {preset.name}
              </MonoLabel>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Lightbox({ image, activePreset, hasPrevious, hasNext, onClose, onNavigate }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setShowOriginal(false);
    setClosing(false);
  }, [image?.id, activePreset?.id]);

  const requestClose = useCallback(() => {
    setClosing((current) => {
      if (current) return current;
      closeTimerRef.current = window.setTimeout(onClose, 180);
      return true;
    });
  }, [onClose]);

  useEffect(() => {
    if (!image) return undefined;

    const previouslyFocused = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onNavigate(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onNavigate(1);
      }
      if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll('button:not(:disabled), [tabindex]:not([tabindex="-1"])');
        const items = Array.from(focusable || []);
        if (!items.length) return;

        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [image, onNavigate, requestClose]);

  if (!image) return null;

  const gradedSrc = activePreset?.id === 'original' || image.gradedPresetId !== activePreset?.id
    ? image.proxyDataUrl
    : image.gradedDataUrl || image.proxyDataUrl;
  const displaySrc = showOriginal ? image.proxyDataUrl : gradedSrc;
  const canCompare = activePreset?.id !== 'original';

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Image comparison"
      className={`absolute inset-0 z-50 flex origin-center flex-col bg-black ${closing ? 'animate-[cb-lightbox-out_180ms_ease-in_forwards]' : 'animate-[cb-lightbox-in_180ms_ease-out]'}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        className="flex items-center justify-between px-[18px] pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 18px)' }}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={requestClose}
          className="appearance-none bg-transparent p-0 text-left focus:outline-none focus:ring-2 focus:ring-[#7CC4FF]"
        >
          <MonoLabel size={10} color="#F2EFE9">
            CLOSE
          </MonoLabel>
        </button>
        <button
          type="button"
          onClick={() => setShowOriginal((current) => !current)}
          disabled={!canCompare}
          className="appearance-none bg-transparent p-0 text-right focus:outline-none focus:ring-2 focus:ring-[#7CC4FF] disabled:opacity-35"
        >
          <MonoLabel size={10} color="#F2EFE9">
            {showOriginal ? 'SHOW GRADED' : 'SHOW ORIGINAL'}
          </MonoLabel>
        </button>
      </div>
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-[18px] py-2"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) requestClose();
        }}
      >
        {hasPrevious && (
          <button
            type="button"
            onClick={() => onNavigate(-1)}
            className="absolute left-[18px] top-1/2 z-10 -translate-y-1/2 bg-black/55 px-2 py-2 text-[#F2EFE9] focus:outline-none focus:ring-2 focus:ring-[#7CC4FF]"
            aria-label="Previous image"
          >
            <MonoLabel size={10} color="#F2EFE9">
              PREV
            </MonoLabel>
          </button>
        )}
        <img src={displaySrc} alt="" className="max-h-full max-w-full object-contain" draggable={false} />
        {hasNext && (
          <button
            type="button"
            onClick={() => onNavigate(1)}
            className="absolute right-[18px] top-1/2 z-10 -translate-y-1/2 bg-black/55 px-2 py-2 text-[#F2EFE9] focus:outline-none focus:ring-2 focus:ring-[#7CC4FF]"
            aria-label="Next image"
          >
            <MonoLabel size={10} color="#F2EFE9">
              NEXT
            </MonoLabel>
          </button>
        )}
      </div>
      <div className="px-[18px]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        <div className="mb-1 flex items-center justify-between gap-3">
          <MonoLabel size={10} color="#F2EFE9" className="min-w-0 truncate">
            {showOriginal ? 'Original' : activePreset?.name || 'Original'}
          </MonoLabel>
          <MonoLabel size={10} color="rgba(242,239,233,0.65)">
            {showOriginal ? 'SOURCE' : 'GRADED'}
          </MonoLabel>
        </div>
        <MonoLabel size={10} color="rgba(242,239,233,0.65)" className="block truncate">
          {image.fileName}
        </MonoLabel>
      </div>
    </div>
  );
}

export default function ColourBatchArtifact() {
  const fileInputRef = useRef(null);
  const toastTimerRef = useRef(null);
  const gradingEngineRef = useRef(null);
  const gradingRunRef = useRef(0);
  const previewRunRef = useRef(0);
  const imagesRef = useRef([]);
  const previousImagesRef = useRef([]);
  const visibleImageIdsRef = useRef(new Set());

  const [images, setImages] = useState([]);
  const [activePresetId, setActivePresetId] = useState('original');
  const [lightboxImageId, setLightboxImageId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [visibleImageIds, setVisibleImageIds] = useState(() => new Set());
  const [presetPreviews, setPresetPreviews] = useState({});
  const [toast, setToast] = useState('');
  const [webglError, setWebglError] = useState('');

  const activePreset = useMemo(
    () => PRESETS.find((preset) => preset.id === activePresetId) || PRESETS[0],
    [activePresetId],
  );
  const selectedCount = useMemo(() => images.filter((image) => image.selected).length, [images]);
  const selectedOrder = useMemo(() => {
    const ids = images.filter((image) => image.selected).map((image) => image.id);
    return new Map(ids.map((id, index) => [id, index + 1]));
  }, [images]);
  const firstProxyDataUrl = images[0]?.proxyDataUrl || '';
  const lightboxImage = useMemo(
    () => images.find((image) => image.id === lightboxImageId) || null,
    [images, lightboxImageId],
  );
  const lightboxIndex = useMemo(
    () => images.findIndex((image) => image.id === lightboxImageId),
    [images, lightboxImageId],
  );

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2800);
  }, []);

  const getGradingEngine = useCallback(() => {
    try {
      if (!gradingEngineRef.current) gradingEngineRef.current = new WebGLGradingEngine();
    } catch (error) {
      setWebglError('WebGL 2 is not available. Use Chrome or Firefox for colour grading and export.');
      throw error;
    }
    return gradingEngineRef.current;
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => () => {
    gradingRunRef.current += 1;
    previewRunRef.current += 1;
    imagesRef.current.forEach(releaseImageResources);
    previousImagesRef.current = [];
    visibleImageIdsRef.current = new Set();
    gradingEngineRef.current?.dispose();
    gradingEngineRef.current = null;
  }, []);

  useEffect(() => {
    const currentIds = new Set(images.map((image) => image.id));
    previousImagesRef.current.forEach((image) => {
      if (!currentIds.has(image.id)) {
        releaseImageResources(image);
        gradingEngineRef.current?.releaseTexture(image.id);
      }
    });
    previousImagesRef.current = images;
  }, [images]);

  useEffect(() => {
    if (!firstProxyDataUrl) {
      setPresetPreviews({});
      return undefined;
    }

    const runId = previewRunRef.current + 1;
    previewRunRef.current = runId;
    let frameId = 0;
    let index = 0;

    setPresetPreviews({ original: firstProxyDataUrl });

    const processNext = async () => {
      if (previewRunRef.current !== runId) return;
      const preset = PRESETS.filter((item) => item.id !== 'original')[index];
      index += 1;
      if (!preset) return;

      try {
        const preview = await getGradingEngine().grade(firstProxyDataUrl, preset);
        if (previewRunRef.current === runId) {
          setPresetPreviews((current) => ({ ...current, [preset.id]: preview }));
        }
      } catch {
        setWebglError('WebGL 2 is not available. Use Chrome or Firefox for colour grading and export.');
        if (previewRunRef.current === runId) showToast('Preset previews could not be generated.');
        return;
      }

      frameId = window.requestAnimationFrame(processNext);
    };

    frameId = window.requestAnimationFrame(processNext);

    return () => {
      previewRunRef.current += 1;
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [firstProxyDataUrl, getGradingEngine, showToast]);

  useEffect(() => {
    if (activePresetId === 'original' || visibleImageIds.size === 0) return undefined;
    if (webglError) return undefined;

    let cancelled = false;
    let frameId = 0;
    const timerId = window.setTimeout(() => {
      const runId = gradingRunRef.current + 1;
      gradingRunRef.current = runId;
      const protectedKeys = new Set(visibleImageIds);
      const queue = imagesRef.current.filter((image) => (
        visibleImageIds.has(image.id) && image.gradedPresetId !== activePresetId
      ));
      let index = 0;

      const processNext = async () => {
        if (cancelled || gradingRunRef.current !== runId) return;
        const image = queue[index];
        index += 1;
        if (!image) return;

        try {
          const gradedDataUrl = await getGradingEngine().grade(image.proxyDataUrl, activePreset, {
            cacheKey: image.id,
            protectedKeys,
          });
          if (!cancelled && gradingRunRef.current === runId) {
            setImages((current) => current.map((item) => (
              item.id === image.id ? { ...item, gradedDataUrl, gradedPresetId: activePresetId } : item
            )));
          }
        } catch {
          setWebglError('WebGL 2 is not available. Use Chrome or Firefox for colour grading and export.');
          if (!cancelled && gradingRunRef.current === runId) showToast('Colour grading failed in this browser.');
          return;
        }

        frameId = window.requestAnimationFrame(processNext);
      };

      frameId = window.requestAnimationFrame(processNext);
    }, 100);

    return () => {
      cancelled = true;
      gradingRunRef.current += 1;
      window.clearTimeout(timerId);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [activePreset, activePresetId, getGradingEngine, showToast, visibleImageIds, webglError]);

  const handleFiles = useCallback(async (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const accepted = incoming.filter(isAcceptedImageFile);
    if (accepted.length !== incoming.length) showToast('Only JPG, JPEG, PNG, and WEBP files are supported.');

    let filesToAdd = accepted;
    const remainingSlots = MAX_IMAGES - imagesRef.current.length;
    if (remainingSlots <= 0) {
      showToast('50 image cap reached.');
      return;
    }

    if (accepted.length > remainingSlots) {
      filesToAdd = accepted.slice(0, remainingSlots);
      showToast('50 image cap reached. Extra images were not added.');
    }

    const processed = (await Promise.all(
      filesToAdd.map(async (file) => {
        try {
          return {
            id: `${Date.now().toString(36)}-${globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).slice(2)}`,
            file,
            fileName: file.name,
            proxyDataUrl: await createProxy(file),
            gradedDataUrl: null,
            gradedPresetId: null,
            selected: false,
          };
        } catch {
          return null;
        }
      }),
    )).filter(Boolean);

    if (processed.length !== filesToAdd.length) {
      showToast('Some images could not be processed.');
    }

    setImages((current) => [...current, ...processed]);
  }, [showToast]);

  const toggleSelected = useCallback((id, selected) => {
    setImages((current) => current.map((image) => (
      image.id === id ? { ...image, selected } : image
    )));
  }, []);

  const handleVisibilityChange = useCallback((id, isVisible) => {
    const current = visibleImageIdsRef.current;
    if (isVisible && current.has(id)) return;
    if (!isVisible && !current.has(id)) return;

    const next = new Set(current);
    if (isVisible) next.add(id);
    else next.delete(id);

    visibleImageIdsRef.current = next;
    gradingEngineRef.current?.evictTextures(next);
    setVisibleImageIds(next);
  }, []);

  const handlePresetSelect = useCallback((presetId) => {
    setActivePresetId(presetId);
    gradingRunRef.current += 1;
  }, []);

  const openAddMore = useCallback(() => fileInputRef.current?.click(), []);

  const closeLightbox = useCallback(() => setLightboxImageId(null), []);

  const navigateLightbox = useCallback((direction) => {
    const currentImages = imagesRef.current;
    if (currentImages.length < 2) return;

    const currentIndex = currentImages.findIndex((image) => image.id === lightboxImageId);
    const nextIndex = currentIndex === -1
      ? 0
      : (currentIndex + direction + currentImages.length) % currentImages.length;

    setLightboxImageId(currentImages[nextIndex].id);
  }, [lightboxImageId]);

  const handleExport = useCallback(async (scope) => {
    if (isExporting) return;

    const currentImages = imagesRef.current;
    const targets = scope === 'selected'
      ? currentImages.filter((image) => image.selected)
      : currentImages;

    if (!targets.length) {
      showToast(scope === 'selected' ? 'Select at least one image to export.' : 'No images to export.');
      return;
    }

    const failed = [];
    setIsExporting(true);
    setExportProgress({ current: 0, total: targets.length });

    for (let index = 0; index < targets.length; index += 1) {
      const image = targets[index];
      await waitForFrame();

      try {
        const dataUrl = await getGradingEngine().gradeFile(image.file, activePreset);
        downloadDataUrl(dataUrl, makeExportFileName(image.fileName, activePreset.id));
      } catch (error) {
        console.error(`ColourBatch export failed for ${image.fileName}`, error);
        failed.push(image.fileName);
      } finally {
        setExportProgress({ current: index + 1, total: targets.length });
      }
    }

    setIsExporting(false);

    if (failed.length) {
      const failedNames = failed.slice(0, 3).join(', ');
      const suffix = failed.length > 3 ? ` +${failed.length - 3} more` : '';
      showToast(`Export finished. Failed: ${failedNames}${suffix}`);
      return;
    }

    showToast(`Exported ${targets.length} image${targets.length === 1 ? '' : 's'}.`);
  }, [activePreset, getGradingEngine, isExporting, showToast]);

  return (
    <div className="flex min-h-[100dvh] touch-manipulation items-stretch justify-center bg-[#1A1814] font-['Space_Grotesk',system-ui,-apple-system,sans-serif] text-[#F2EFE9] sm:items-center sm:p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600&display=swap');
        @keyframes cb-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cb-fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes cb-lightbox-in {
          from { opacity: 0; transform: scale(0.985); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes cb-lightbox-out {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.985); }
        }
      `}</style>

      <AppShell>
        <div className="relative flex h-full flex-col bg-[#F2EFE9] text-[#0D0D0C]">
          <Header imagesCount={images.length} selectedCount={selectedCount} onAddMore={openAddMore} />

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[116px] [-webkit-overflow-scrolling:touch]">
            {images.length > 0 && (
              <PresetBar
                activePresetId={activePresetId}
                onSelectPreset={handlePresetSelect}
                previews={presetPreviews}
              />
            )}
            {webglError && (
              <div className="border-b border-[rgba(13,13,12,0.08)] bg-[#E9E6DF] px-[18px] py-2">
                <MonoLabel size={9} color={tokens.ink}>
                  {webglError}
                </MonoLabel>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(event) => {
                handleFiles(event.target.files);
                event.target.value = '';
              }}
            />

            {images.length === 0 ? (
              <UploadDropZone onFiles={handleFiles} />
            ) : (
              <div className="px-[18px] pt-3">
                <div className="flex items-center justify-between pb-3">
                  <MonoLabel size={10} color={tokens.mute}>
                    SOURCE - CAMERA ROLL
                  </MonoLabel>
                  <MonoLabel
                    size={10}
                    color={selectedCount ? tokens.ink : tokens.mute}
                    className={selectedCount ? 'bg-[#7CC4FF] px-1.5 py-[3px]' : 'px-1.5 py-[3px]'}
                  >
                    {String(selectedCount).padStart(2, '0')} SELECTED
                  </MonoLabel>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {images.map((image) => (
                    <ImageCard
                      key={image.id}
                      image={image}
                      activePresetId={activePresetId}
                      order={selectedOrder.get(image.id) || 0}
                      onToggle={toggleSelected}
                      onOpen={setLightboxImageId}
                      onVisibilityChange={handleVisibilityChange}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className="absolute inset-x-0 bottom-0 z-30 border-t border-[rgba(13,13,12,0.12)] bg-[#F2EFE9]/95 px-[18px] pt-3.5 backdrop-blur"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)' }}
          >
            {isExporting && (
              <MonoLabel size={10} color={tokens.mute} className="mb-2 block">
                Exporting {exportProgress.current}/{exportProgress.total}...
              </MonoLabel>
            )}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleExport('all')}
                disabled={!images.length || isExporting}
                className="flex min-h-[64px] cursor-not-allowed touch-manipulation flex-col items-start bg-[rgba(13,13,12,0.04)] px-3 py-3 text-[#A09A8E] transition enabled:cursor-pointer enabled:bg-[#0D0D0C] enabled:text-[#F2EFE9] enabled:active:scale-[0.98]"
              >
                <span className="font-['Space_Grotesk',system-ui] text-[15px] font-medium leading-none tracking-normal">
                  Export All
                </span>
                <MonoLabel size={9} color="currentColor" className="mt-2 opacity-70">
                  {String(images.length).padStart(2, '0')} FRAMES
                </MonoLabel>
              </button>
              <button
                type="button"
                onClick={() => handleExport('selected')}
                disabled={!selectedCount || isExporting}
                className="flex min-h-[64px] cursor-not-allowed touch-manipulation flex-col items-start bg-[rgba(13,13,12,0.04)] px-3 py-3 text-[#A09A8E] transition enabled:cursor-pointer enabled:bg-[#0D0D0C] enabled:text-[#F2EFE9] enabled:active:scale-[0.98]"
              >
                <span className="font-['Space_Grotesk',system-ui] text-[15px] font-medium leading-none tracking-normal">
                  Export Selected
                </span>
                <MonoLabel size={9} color="currentColor" className="mt-2 opacity-70">
                  {selectedCount ? `${String(selectedCount).padStart(2, '0')} READY` : 'PICK >= 1'}
                </MonoLabel>
              </button>
            </div>
          </div>

          <Toast message={toast} />
          <Lightbox
            image={lightboxImage}
            activePreset={activePreset}
            hasPrevious={images.length > 1 && lightboxIndex > -1}
            hasNext={images.length > 1 && lightboxIndex > -1}
            onClose={closeLightbox}
            onNavigate={navigateLightbox}
          />
        </div>
      </AppShell>

      <div className="sr-only" aria-hidden="true">
        Active preset: {activePresetId}. Export: {isExporting ? 'active' : 'idle'}.
        {exportProgress.current}/{exportProgress.total}
      </div>
    </div>
  );
}

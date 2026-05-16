# Batch Colour Grading App -- Staged Build Prompts

Paste your HTML prototype code where indicated, then use each stage
as a separate message in one conversation. Wait for a working artifact
at each stage before sending the next.

---

## Stage 1: Convert HTML to React + File Upload + Image Grid

Paste this as your first message:

```
Here is my existing UI prototype as HTML:

[PASTE YOUR HTML PROTOTYPE CODE HERE]

Convert this to a single React JSX artifact. Keep the existing design,
layout, colours, typography, and spacing as close to the original as
possible. Do not redesign the UI. Use Tailwind utility classes where
the original uses inline styles or custom CSS, but match the visual
output exactly.

Then add these functional features:

1. FILE UPLOAD
   - The upload area (drag-and-drop zone or button, whichever exists in
     the prototype) should accept multiple files: .jpg, .jpeg, .png, .webp
   - After upload, the drop zone should collapse to a small "+ Add more"
     button (keep it consistent with the existing header style)
   - Cap at 50 images. Show a toast/message if exceeded.

2. PROXY GENERATION
   - On upload, generate a downsampled proxy for each image (max 1200px
     on longest side) using an offscreen canvas
   - Store the proxy as a data URL in state
   - Never display the full-resolution original in the grid

3. IMAGE GRID
   - Display proxy thumbnails in the existing grid layout from the prototype
   - Show the filename (truncated) below each image
   - Add a checkbox overlay in the top-right corner of each image card
     for batch selection
   - Lazy-load images using IntersectionObserver (only decode images
     visible in the viewport)

4. STATE SHAPE
   Use this as the base state structure (adapt naming to fit the prototype):

   const [images, setImages] = useState([]);
   // Each image: { id, file, fileName, proxyDataUrl, gradedDataUrl, selected }

   const [activePresetId, setActivePresetId] = useState('original');
   const [lightboxImageId, setLightboxImageId] = useState(null);
   const [isExporting, setIsExporting] = useState(false);
   const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

Do not add colour grading functionality yet. Images should display
as-is (original) in the grid. Just get the upload, proxy pipeline,
grid display, and selection checkboxes working.
```

---

## Stage 2: WebGL Grading Engine + Preset Switching

After Stage 1 works, send this:

```
Add the colour grading engine and preset system to the existing artifact.
Do not change the layout or design. Wire the grading into the existing
preset bar/selector from the UI.

COLOUR GRADING ENGINE

All grading runs via a WebGL 2 fragment shader on a single shared
offscreen canvas. Never create multiple WebGL contexts.

Each preset is a JSON config:

{
  "id": "cinematic-teal-orange",
  "name": "Cinematic Teal & Orange",
  "category": "Film",
  "adjustments": {
    "brightness": 0.05,
    "contrast": 1.15,
    "saturation": 0.9,
    "temperature": -800,
    "tint": 0,
    "highlights": 0.1,
    "shadows": -0.05,
    "hueShift": 0,
    "vibrance": 0.2,
    "gamma": 1.0,
    "lift": { "r": 0.0, "g": 0.02, "b": 0.06 },
    "gain": { "r": 1.05, "g": 0.95, "b": 0.85 },
    "vignette": 0.3
  }
}

SHADER PARAMETERS (implement all as uniforms in a single GLSL fragment shader):

- brightness: additive offset to RGB
- contrast: multiply around midpoint (0.5)
- saturation: luminance-based desaturation/boost
  (luminance weights: R=0.2126, G=0.7152, B=0.0722)
- temperature: shift blue-yellow balance
  (negative = cooler/bluer, positive = warmer/yellower)
- tint: shift green-magenta balance
- highlights: target bright regions (luminance > 0.5) with smooth
  falloff using smoothstep
- shadows: target dark regions (luminance < 0.5) with smooth falloff
- hueShift: convert to HSL, rotate hue, convert back
- vibrance: boost saturation more for low-saturation pixels,
  less for already-saturated ones
- gamma: power curve applied to RGB after all other adjustments
- lift: additive RGB offset applied proportionally to shadow regions
- gain: multiplicative RGB scaling applied proportionally to highlight regions
- vignette: darken edges based on distance from centre using
  smoothstep falloff

PROCESSING FLOW:
1. Upload proxy image as a WebGL texture
2. Set all uniform values from the active preset
3. Draw a fullscreen quad
4. Read result via canvas.toDataURL()
5. Store as gradedDataUrl in the image's state entry

RENDERING APPROACH:
- Use requestAnimationFrame to process images sequentially
  (one per frame) to avoid blocking the main thread
- When the user switches presets, re-grade all visible images
- Debounce preset switching by 100ms

PRESET LIBRARY (include all 12):

Film category:
- Cinematic Teal & Orange: brightness 0.05, contrast 1.15,
  saturation 0.9, temperature -800, vibrance 0.2,
  lift {r:0, g:0.02, b:0.06}, gain {r:1.05, g:0.95, b:0.85},
  vignette 0.3
- Kodak Portra: brightness 0.08, contrast 1.05, saturation 0.85,
  temperature 400, shadows 0.08, gamma 1.05,
  lift {r:0.03, g:0.02, b:0.01}, gain {r:1.02, g:1.0, b:0.95}
- Fuji Velvia: contrast 1.25, saturation 1.3, vibrance 0.3,
  temperature 100, shadows -0.05, gamma 0.95,
  gain {r:1.0, g:1.05, b:1.08}
- Cross Process: brightness 0.03, contrast 1.1, saturation 1.1,
  hueShift 15, temperature -200,
  lift {r:0, g:0.05, b:0}, gain {r:1.1, g:0.9, b:1.05}

Mood category:
- Golden Hour: brightness 0.1, contrast 1.05, saturation 1.05,
  temperature 1200, highlights 0.15, gamma 1.05,
  gain {r:1.1, g:1.0, b:0.85}
- Moody Noir: brightness -0.05, contrast 1.3, saturation 0.3,
  temperature -400, shadows -0.1, vignette 0.5,
  lift {r:0, g:0, b:0.04}
- Faded Vintage: brightness 0.06, contrast 0.85, saturation 0.7,
  temperature 300, shadows 0.12, gamma 1.1,
  lift {r:0.04, g:0.03, b:0.02}
- Dreamy Pastel: brightness 0.12, contrast 0.9, saturation 0.75,
  temperature 200, highlights 0.1, gamma 1.08,
  lift {r:0.03, g:0.02, b:0.03}

Clean category:
- Bright & Airy: brightness 0.15, contrast 0.95, saturation 0.9,
  temperature 200, highlights 0.1, gamma 1.05
- High Contrast B&W: contrast 1.4, saturation 0.0, gamma 0.9,
  shadows -0.05, highlights 0.1
- Natural Boost: contrast 1.08, vibrance 0.25, temperature 50,
  saturation 1.05, gamma 0.98
- Studio Clean: contrast 1.1, saturation 1.0, temperature 0,
  gamma 0.95, highlights 0.05, shadows -0.02

For any parameter not listed in a preset, default to the neutral
value (0 for additive params, 1.0 for multiplicative params,
{r:0,g:0,b:0} for lift, {r:1,g:1,b:1} for gain).

PRESET BAR:
- Wire the existing preset selector in the UI to switch activePresetId
- If the prototype has thumbnail previews per preset, generate them
  by grading the first uploaded image with each preset
- Include "Original" as the first option (no grading applied)
- When switching presets, update all visible images in the grid
```

---

## Stage 3: Export Pipeline + Lightbox

After Stage 2 works, send this:

```
Add the export pipeline and lightbox comparison to the existing artifact.
Do not change the layout or design.

EXPORT PIPELINE:

1. "Export All" button: process every image at FULL RESOLUTION
   (use the original File object, not the proxy) through the same
   WebGL shader with the active preset's uniforms
2. "Export Selected" button: same as above but only for images
   with selected === true. Disable this button when nothing is selected.
3. Processing flow:
   - Set isExporting to true
   - For each image: decode the full-res File to an Image element,
     upload as WebGL texture, apply grade, read back via
     canvas.toDataURL('image/jpeg', 0.95)
   - Trigger a browser download for each result
     (use a dynamically created <a> tag with download attribute)
   - Update exportProgress { current, total } after each image
   - Show progress in the UI (e.g. "Exporting 3/12...")
   - Set isExporting to false when done
4. Use requestAnimationFrame or setTimeout(0) between each image
   to keep the UI responsive during export
5. If any single image fails, log the error, skip it, continue
   with the rest, and report which filenames failed at the end

LIGHTBOX:

1. Clicking any image in the grid opens a lightbox overlay
2. The lightbox shows the image larger (fit to viewport with padding)
3. Include a toggle or slider to compare original vs graded:
   - Option A: a horizontal slider the user drags to reveal
     original on one side and graded on the other
   - Option B: a button that toggles between the two
   Choose whichever fits the existing UI style better.
4. Show the preset name and filename in the lightbox
5. Close on clicking outside, pressing Escape, or an X button
6. Left/right arrow keys or buttons to navigate between images
```

---

## Stage 4: Polish + Performance

After Stage 3 works, send this:

```
Polish the existing artifact. Do not change the core functionality
or layout.

PERFORMANCE:
- When switching presets, only re-grade images currently visible
  in the viewport (use IntersectionObserver). Grade off-screen
  images lazily as the user scrolls to them.
- Keep a maximum of 20 WebGL textures alive. Evict the least
  recently used off-screen textures when the limit is reached.
- Revoke all object URLs and data URLs when images are removed
  or when the component unmounts.

TRANSITIONS:
- Crossfade images (~200ms) when switching presets instead of
  a hard swap
- Smooth lightbox open/close animation (fade + scale)

ERROR HANDLING:
- If WebGL is not available, show a clear message suggesting
  Chrome or Firefox
- If a dropped file is not a valid image type, skip it and show
  a brief notification
- If the user tries to upload more than 50 images total, show
  a message and ignore the excess files

EMPTY STATE:
- Make sure the upload zone looks good and has clear instructions
  when no images are loaded

ACCESSIBILITY:
- All interactive elements should be keyboard navigable
- Lightbox should trap focus while open
- Escape closes the lightbox
- Preset switching should work with arrow keys when the preset
  bar is focused

Review the full artifact and fix any bugs or visual inconsistencies.
```

---

## Notes

- Each stage should produce a testable artifact. Upload a few
  test images after each stage to verify it works before moving on.
- If any stage produces code that is too long for a single response,
  ask Claude to continue where it left off.
- If the WebGL shader has visual bugs (wrong colours, all black,
  etc.), ask Claude to add a debug mode that logs the uniform
  values and shows a test pattern to isolate the issue.
- The preset values above are starting points. After Stage 2 works,
  you can tweak individual numbers by asking Claude to adjust
  specific presets.

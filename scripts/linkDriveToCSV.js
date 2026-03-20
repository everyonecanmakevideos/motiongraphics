const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const CSV_PATH = path.join(__dirname, "..", "results.csv");
const OUTPUT_PATH = path.join(__dirname, "..", "results_drive_ready.csv");

const TOKEN_PATH = path.join(__dirname, "..", "token.json");
const CREDENTIALS_PATH = path.join(__dirname, "..", "credentials.json");

// ---------------- TITLES ----------------

const PROMPT_TITLES = {
  1: "Circle Fade In",
  2: "Circle Scale In",
  3: "Circle Slide Left",
  4: "Circle Slide Up",
  5: "Circle Drop Gravity",
  6: "Circle Rotate 360",
  7: "Circle Opacity Pulse",
  8: "Circle Blur Focus",
  9: "Circle Glow Effect",
  10: "Circle Color Morph",

  11: "Rectangle Fade In",
  12: "Rectangle Scale In",
  13: "Rectangle Slide Right",
  14: "Rectangle Width Expand",
  15: "Rectangle Height Grow",
  16: "Rectangle Rotate 90",
  17: "Rectangle Shadow Grow",
  18: "Rectangle Border Pulse",
  19: "Rectangle Gradient Shift",
  20: "Rectangle Skew Transform",

  21: "Triangle Fade In",
  22: "Triangle Scale In",
  23: "Triangle Slide Down",
  24: "Triangle Rotate 120",
  25: "Triangle Flip Vertical",
  26: "Triangle Color Cycle",
  27: "Triangle Stroke Animation",
  28: "Triangle Glow Pulse",
  29: "Triangle Scale Directional",
  30: "Triangle Opacity Wave",

  31: "Line Fade In",
  32: "Line Draw On Horizontal",
  33: "Line Draw On Vertical",
  34: "Line Thickness Pulse",
  35: "Line Rotate Sweep",
  36: "Line Color Gradient Shift",
  37: "Line Dash Animation",
  38: "Line Glow Effect",
  39: "Diagonal Line Slide",
  40: "Line Length Oscillate",

  41: "Square Fade In",
  42: "Square Rotate Diamond",
  43: "Square Scale Corners",
  44: "Square Split Four",
  45: "Square Shadow Direction",

  46: "Pentagon Fade In",
  47: "Pentagon Rotate",
  48: "Pentagon Stroke Draw",

  49: "Star Five Points Fade",
  50: "Star Rotate Sparkle",
  51: "Circle Breathing Loop",
  52: "Circle Stretch React",
  53: "Circle Split Merge",
  54: "Circle Color Breathing Combo",
  55: "Circle Rotate Scale Combine",
  56: "Circle Opacity Fade Pulse",
  57: "Circle Bounce Physics",
  58: "Circle Glow Intensity Wave",
  59: "Circle Border Grow Transform",
  60: "Circle Ellipse Morph",
  61: "Rectangle Width Wave",
  62: "Rectangle Corner Round",
  63: "Rectangle 3D Rotate",
  64: "Rectangle Shadow Travel",
  65: "Rectangle Gradient Rotate",
  66: "Rectangle Skew Dance",
  67: "Rectangle Split Grid",
  68: "Rectangle Border Pulse Color",
  69: "Rectangle Perspective Tilt",
  70: "Rectangle Opacity Pattern",
  71: "Triangle Spin Wobble",
  72: "Triangle Point Morph",
  73: "Triangle Color Vertex",
  74: "Triangle 3D Flip",
  75: "Triangle Stroke Fill",
  76: "Triangle Shatter Reform",
  77: "Triangle Breathing Glow",
  78: "Triangle Corner Round",
  79: "Triangle Extrude Effect",
  80: "Triangle Orbit Path",
  81: "Line Multi-Segment Draw",
  82: "Line Thickness Wave",
  83: "Line Color Gradient Flow",
  84: "Line Dotted Dash Morph",
  85: "Line Spiral Draw",
  86: "Line Glow Intensity Build",
  87: "Line Angle Sweep",
  88: "Line Split Multi",
  89: "Line Perpendicular Cross",
  90: "Line Neon Flicker",
  91: "Square Perspective Cube",
  92: "Square Corner Detach",
  93: "Square Inflate Deflate",
  94: "Square Checkerboard Fill",
  95: "Square Shadow Lift",
  96: "Pentagon Star Morph",
  97: "Pentagon Spin Vertices",
  98: "Pentagon Wave Distort",
  99: "Star Rotate Layers",
  100: "Star Explode Particles",

  101: "Three Shapes Center Bounce",
  102: "Shapes Horizontal Align Pulse",
  103: "Sequential Shape Reveal",
  104: "Bar Chart Three Bars",
  105: "Bar Chart with Counter",
  106: "Circles Orbit Center",
  107: "Square Grid Appear Sequential",
  108: "Triangles Point Inward",
  109: "Line Star Burst",
  110: "Rectangles Layered Slide",
  111: "Circle Chain Connected",
  112: "Shapes Size Progression",
  113: "Triangle Spinning Formation",
  114: "Square Border Sequential Build",
  115: "Circles Merge Split",
  116: "Pentagon Ring Rotate",
  117: "Bar Graph Comparison",
  118: "Staggered Timing Variation",
  119: "Circles Shadow Depth",
  120: "Lines Form Grid",
  121: "Shapes Gradient Overlap",
  122: "Pulse Wave Through Row",
  123: "Rectangles Aspect Ratio",
  124: "Triangle Stack Pyramid",
  125: "Color Cycling Coordination",
  126: "Opacity Fade Pattern",
  127: "Rotation Direction Contrast",
  128: "Scale Coordination Inverse",
  129: "Line Star Formation",
  130: "Rectangles Bridge Build",
  131: "Circles Radial Expand",
  132: "Sequential Color Fill",
  133: "Triangle Wave Motion",
  134: "Squares Perspective Depth",
  135: "Circle Orbit Complex",
  136: "Bar Graph Race",
  137: "Glow Pulse Synchronize",
  138: "Rotation Speed Variation",
  139: "Lines Grid Fade In",
  140: "Shapes Bounce Sequence",
  141: "Concentric Rings Expand",
  142: "Rectangle Cascade Fall",
  143: "Triangles Mirror Symmetry",
  144: "Grid Cells Sequential",
  145: "Shadow Direction Wave",
  146: "Lines Perpendicular Weave",
  147: "Shapes Color Sync",
  148: "Rectangles Interlock",
  149: "Opacity Gradient Cascade",
  150: "Complex Coordinated Finale"
};

// ---------------- AUTH ----------------

async function auth() {

  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_id, client_secret, redirect_uris } = creds.installed;

  const oAuth = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  oAuth.setCredentials(token);

  return oAuth;
}

function buildLink(id) {
  return `https://drive.google.com/file/d/${id}/view`;
}

// ---------------- MAIN ----------------

async function run() {

  const authClient = await auth();
  const drive = google.drive({ version: "v3", auth: authClient });

  const res = await drive.files.list({
    pageSize: 1000,
    fields: "files(id,name)"
  });

  const files = res.data.files;

  const videoMap = {};
  const codeMap = {};

  for (const index in PROMPT_TITLES) {

    const title = PROMPT_TITLES[index];

    const video = files.find(f => f.name === `${title}.mp4`);
    const code = files.find(f => f.name === `${title}.tsx`);

    if (video) videoMap[index] = buildLink(video.id);
    if (code) codeMap[index] = buildLink(code.id);
  }

  let csv = fs.readFileSync(CSV_PATH, "utf8");

  csv = csv.replace(/outputs\/video_(\d+)\.mp4/g, (_, i) => {

    const link = videoMap[i];
    return link ? link : "MISSING_VIDEO";
  });

  csv = csv.replace(/outputs\/code_(\d+)\.tsx/g, (_, i) => {

    const link = codeMap[i];
    return link ? link : "MISSING_CODE";
  });

  fs.writeFileSync(OUTPUT_PATH, csv);

  console.log("✅ CSV created:", OUTPUT_PATH);
}

run();
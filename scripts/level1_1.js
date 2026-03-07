const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { google } = require("googleapis");

// ==================== CONFIG ====================

// Level 1.1 prompt titles (51-100, 0-based index)
const PROMPT_TITLES = [
  "Circle Breathing Loop",
  "Circle Stretch React",
  "Circle Split Merge",
  "Circle Color Breathing Combo",
  "Circle Rotate Scale Combine",
  "Circle Opacity Fade Pulse",
  "Circle Bounce Physics",
  "Circle Glow Intensity Wave",
  "Circle Border Grow Transform",
  "Circle Ellipse Morph",
  "Rectangle Width Wave",
  "Rectangle Corner Round",
  "Rectangle 3D Rotate",
  "Rectangle Shadow Travel",
  "Rectangle Gradient Rotate",
  "Rectangle Skew Dance",
  "Rectangle Split Grid",
  "Rectangle Border Pulse Color",
  "Rectangle Perspective Tilt",
  "Rectangle Opacity Pattern",
  "Triangle Spin Wobble",
  "Triangle Point Morph",
  "Triangle Color Vertex",
  "Triangle 3D Flip",
  "Triangle Stroke Fill",
  "Triangle Shatter Reform",
  "Triangle Breathing Glow",
  "Triangle Corner Round",
  "Triangle Extrude Effect",
  "Triangle Orbit Path",
  "Line Multi-Segment Draw",
  "Line Thickness Wave",
  "Line Color Gradient Flow",
  "Line Dotted Dash Morph",
  "Line Spiral Draw",
  "Line Glow Intensity Build",
  "Line Angle Sweep",
  "Line Split Multi",
  "Line Perpendicular Cross",
  "Line Neon Flicker",
  "Square Perspective Cube",
  "Square Corner Detach",
  "Square Inflate Deflate",
  "Square Checkerboard Fill",
  "Square Shadow Lift",
  "Pentagon Star Morph",
  "Pentagon Spin Vertices",
  "Pentagon Wave Distort",
  "Star Rotate Layers",
  "Star Explode Particles"
];

// Local folder with all outputs
const OUTPUT_DIR = path.join(__dirname, "..", "outputs");

// OAuth config
const SCOPES = ["https://www.googleapis.com/auth/drive"];
const CREDENTIALS_PATH = path.join(__dirname, "..", "credentials.json");
const TOKEN_PATH = path.join(__dirname, "..", "token.json");

// Drive folder names
const ROOT_FOLDER_NAME = "Automation";
const LEVEL_FOLDER_NAME = "LEVEL 1.1: SINGLE SHAPE COMPLEX ANIMATIONS";
const CODE_FOLDER_NAME = "Code";
const VIDEOS_FOLDER_NAME = "Videos";

// ==================== AUTH ====================

async function loadCredentialsAndAuthorize() {
  const content = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
  const credentials = JSON.parse(content);

  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  return await getAccessToken(oAuth2Client);
}

function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("\nAuthorize this app by visiting this URL:\n");
  console.log(authUrl);
  console.log(
    "\nAfter you click Allow, copy ONLY the 'code' parameter and paste it below.\n"
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question("Enter the authorization code: ", (codeInput) => {
      rl.close();
      const code = codeInput.trim();

      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error("Error getting token:", err.message);
          return reject(err);
        }
        oAuth2Client.setCredentials(token);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2), "utf-8");
        console.log("✅ Token saved to", TOKEN_PATH);
        resolve(oAuth2Client);
      });
    });
  });
}

// ==================== DRIVE FOLDER HELPERS ====================

async function ensureFolder(drive, name, parentId = null) {
  const qParts = [
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    `name = '${name.replace(/'/g, "\\'")}'`,
  ];

  if (parentId) {
    qParts.push(`'${parentId}' in parents`);
  } else {
    qParts.push("'root' in parents");
  }

  const res = await drive.files.list({
    q: qParts.join(" and "),
    fields: "files(id, name)",
    spaces: "drive",
    pageSize: 1,
  });

  if (res.data.files?.length > 0) {
    console.log("✅ Found folder:", res.data.files[0].name, "->", res.data.files[0].id);
    return res.data.files[0].id;
  }

  const fileMetadata = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };

  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  const createRes = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id, name",
  });

  console.log("📁 Created folder:", createRes.data.name, "->", createRes.data.id);
  return createRes.data.id;
}

// ==================== UTILS ====================

function makeSafeFileName(title, ext) {
  const base = title
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return base + ext;
}

function getTitleForIndex(index) {
  const idx = index - 51; // 51-based → 0-based array index
  if (idx < 0 || idx >= PROMPT_TITLES.length) return null;
  return PROMPT_TITLES[idx];
}

function getIndexFromFileName(fileName) {
  const match = fileName.match(/_(\d+)\./);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (isNaN(num) || num < 51 || num > 100) return null;
  return num;
}

function guessMimeType(ext) {
  const lower = ext.toLowerCase();
  if (lower === ".mp4") return "video/mp4";
  if (lower === ".tsx") return "text/plain";
  return "application/octet-stream";
}

// ==================== DRIVE UPLOAD ====================

async function uploadFileToFolder(auth, localPath, driveName, folderId) {
  const drive = google.drive({ version: "v3", auth });

  const ext = path.extname(driveName);
  const mimeType = guessMimeType(ext);

  const requestBody = {
    name: driveName,
    parents: [folderId],
  };

  const res = await drive.files.create({
    requestBody,
    media: {
      mimeType,
      body: fs.createReadStream(localPath),
    },
    fields: "id, name, parents",
  });

  console.log("✅ Uploaded:", res.data.name, "->", res.data.id);
  return res.data.id;
}

// ==================== MAIN ====================

async function run() {
  const auth = await loadCredentialsAndAuthorize();
  console.log("🚀 Authorized successfully");

  if (!fs.existsSync(OUTPUT_DIR)) {
    throw new Error(`❌ Output directory missing: ${OUTPUT_DIR}`);
  }

  const drive = google.drive({ version: "v3", auth });

  // Create folder structure:
  // Automation /
  //   LEVEL 1.1: SINGLE SHAPE COMPLEX ANIMATIONS /
  //     Code/
  //     Videos/
  console.log("\n📁 Creating folder structure...");
  
  const automationFolderId = await ensureFolder(drive, ROOT_FOLDER_NAME, null);
  const levelFolderId = await ensureFolder(
    drive,
    LEVEL_FOLDER_NAME,
    automationFolderId
  );
  const codeFolderId = await ensureFolder(
    drive,
    CODE_FOLDER_NAME,
    levelFolderId
  );
  const videosFolderId = await ensureFolder(
    drive,
    VIDEOS_FOLDER_NAME,
    levelFolderId
  );

  console.log("\n📂 Folder structure ready:");
  console.log(`  Automation/${LEVEL_FOLDER_NAME}/`);
  console.log(`    ├── Code/ (${codeFolderId})`);
  console.log(`    └── Videos/ (${videosFolderId})`);

  const files = fs.readdirSync(OUTPUT_DIR);
  const targetFiles = files.filter((f) => /\.(tsx|mp4)$/i.test(f));

  if (targetFiles.length === 0) {
    console.log("❌ No .tsx or .mp4 files found in:", OUTPUT_DIR);
    return;
  }

  console.log(`\n📤 Uploading ${targetFiles.length} files...`);

  let uploaded = 0;
  for (const file of targetFiles) {
    const index = getIndexFromFileName(file);
    if (!index) {
      console.warn(`⏭️ Skipping ${file} (invalid name format)`);
      continue;
    }

    const title = getTitleForIndex(index);
    if (!title) {
      console.warn(`⏭️ Skipping ${file} (no title for #${index})`);
      continue;
    }

    const ext = path.extname(file);
    const safeName = makeSafeFileName(title, ext);
    const localPath = path.join(OUTPUT_DIR, file);

    let targetFolderId;
    if (ext.toLowerCase() === ".tsx") {
      targetFolderId = codeFolderId;
      console.log(`💻 ${index}: "${safeName}" → Code/`);
    } else if (ext.toLowerCase() === ".mp4") {
      targetFolderId = videosFolderId;
      console.log(`🎥 ${index}: "${safeName}" → Videos/`);
    } else {
      console.warn(`⏭️ Skipping ${file} (bad extension)`);
      continue;
    }

    try {
      await uploadFileToFolder(auth, localPath, safeName, targetFolderId);
      uploaded++;
    } catch (err) {
      console.error(`❌ Failed ${file}:`, err.message);
    }
  }

  console.log(`\n🎉 Upload complete! ${uploaded}/${targetFiles.length} files uploaded`);
  console.log(`📁 Drive: Automation/${LEVEL_FOLDER_NAME}/`);
}

run().catch((err) => {
  console.error("💥 Script failed:", err);
  process.exit(1);
});

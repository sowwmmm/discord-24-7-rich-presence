const {
  Client,
  CustomStatus,
  RichPresence,
} = require("discord.js-selfbot-v13");

const fs = require("fs");
const yaml = require("js-yaml");
const dotenv = require("dotenv");
const http = require("http");

dotenv.config();

console.log("========================================");
console.log("🚀 Starting Discord RPC");
console.log("========================================");

// =========================
// Load config
// =========================

let config;

try {
  console.log("📂 Loading config.yml...");

  config = yaml.load(
    fs.readFileSync("./config.yml", "utf8")
  );

  console.log("✅ config.yml loaded successfully");
  console.log("📋 Config keys:", Object.keys(config || {}));
} catch (err) {
  console.error("❌ Failed to load config.yml");
  console.error(err);
  process.exit(1);
}

const client = new Client();

// =========================
// HTTP server
// =========================

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot is running!\n");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 HTTP server listening on port ${PORT}`);
});

// =========================
// Create activities
// =========================

const activities = [];

console.log("");
console.log("========================================");
console.log("🎮 Loading activities");
console.log("========================================");

if (Array.isArray(config.activities)) {
  console.log(`📋 Found ${config.activities.length} configured activities`);

  for (let i = 0; i < config.activities.length; i++) {
    const activity = config.activities[i];

    console.log("");
    console.log(`---------- Activity ${i + 1} ----------`);

    console.log("Application ID :", activity.application_id);
    console.log("Type           :", activity.type);
    console.log("Name           :", activity.name);
    console.log("Details        :", activity.details);
    console.log("State          :", activity.state);

    console.log("");
    console.log("🖼️ Asset configuration:");
    console.log("Large Image Key :", activity.largeImageKey);
    console.log("Large Image Text:", activity.largeImageText);
    console.log("Small Image Key :", activity.smallImageKey);
    console.log("Small Image Text:", activity.smallImageText);

    console.log("");
    console.log("🔗 URL:", activity.url);

    try {
      const rich = new RichPresence(client)
        .setApplicationId(activity.application_id)
        .setType(activity.type ?? 0)
        .setName(activity.name || "My Cool Presence")
        .setDetails(activity.details || "")
        .setState(activity.state || "")
        .setAssetsLargeImage(activity.largeImageKey || null)
        .setAssetsLargeText(activity.largeImageText || "")
        .setAssetsSmallImage(activity.smallImageKey || null)
        .setAssetsSmallText(activity.smallImageText || "")
        .setURL(activity.url || null)
        .setStartTimestamp(new Date());

      if (activity.buttons && Array.isArray(activity.buttons)) {
        console.log("🔘 Buttons:", activity.buttons);

        rich.setButtons(activity.buttons);
      }

      const json = rich.toJSON();

      console.log("");
      console.log("📦 Generated RichPresence:");
      console.log(JSON.stringify(json, null, 2));

      console.log("");
      console.log("🖼️ Assets actually generated:");

      if (json.assets) {
        console.log(JSON.stringify(json.assets, null, 2));
      } else {
        console.log("⚠️ NO ASSETS FOUND IN toJSON()");
      }

      activities.push(json);

      console.log("✅ Activity added successfully");
    } catch (err) {
      console.error(`❌ Failed to create activity ${i + 1}`);
      console.error(err);
    }
  }
}

// =========================
// Backwards compatibility
// =========================

if (activities.length === 0) {
  console.log("");
  console.log("⚠️ No activities found.");
  console.log("🔄 Trying legacy config format...");

  try {
    const rich = new RichPresence(client)
      .setApplicationId(config.application_id)
      .setType(config.type || 0)
      .setName(config.name || "My Cool Presence")
      .setDetails(config.details || "")
      .setState(config.state || "Available")
      .setAssetsLargeImage(config.largeImageKey || null)
      .setAssetsLargeText(config.largeImageText || "")
      .setAssetsSmallImage(config.smallImageKey || null)
      .setAssetsSmallText(config.smallImageText || "")
      .setURL(config.url || null)
      .setStartTimestamp(new Date());

    if (config.buttons && Array.isArray(config.buttons)) {
      rich.setButtons(config.buttons);
    }

    const json = rich.toJSON();

    console.log("📦 Legacy RichPresence:");
    console.log(JSON.stringify(json, null, 2));

    activities.push(json);

    console.log("✅ Legacy activity added");
  } catch (err) {
    console.error("❌ Failed to create legacy activity");
    console.error(err);
  }
}

// =========================
// Custom status
// =========================

let customStatus;

console.log("");
console.log("========================================");
console.log("📝 Custom status");
console.log("========================================");

if (config.custom_status) {
  console.log("Custom status:", config.custom_status);
  console.log("Custom emoji :", config.custom_emoji || "(none)");

  try {
    customStatus = new CustomStatus(client, {
      state: config.custom_status,
      emoji: config.custom_emoji
        ? { name: config.custom_emoji }
        : undefined,
    });

    console.log("✅ Custom status created");
    console.log(
      JSON.stringify(customStatus.toJSON(), null, 2)
    );
  } catch (err) {
    console.error("❌ Failed to create custom status");
    console.error(err);
  }
} else {
  console.log("ℹ️ Custom status disabled");
}

// =========================
// Debug summary before login
// =========================

console.log("");
console.log("========================================");
console.log("📊 PRE-LOGIN SUMMARY");
console.log("========================================");

console.log("Activities:", activities.length);

activities.forEach((activity, index) => {
  console.log("");
  console.log(`Activity ${index + 1}:`);
  console.log("Application ID:", activity.application_id);
  console.log("Type:", activity.type);
  console.log("Name:", activity.name);
  console.log("Details:", activity.details);
  console.log("State:", activity.state);
  console.log("Assets:", JSON.stringify(activity.assets, null, 2));
});

// =========================
// Discord ready
// =========================

client.on("ready", async () => {
  console.log("");
  console.log("========================================");
  console.log("✅ DISCORD READY");
  console.log("========================================");

  console.log("Username:", client.user.username);
  console.log("User ID :", client.user.id);

  try {
    const presenceActivities = [...activities];

    if (customStatus) {
      console.log("➕ Adding custom status...");
      presenceActivities.push(customStatus.toJSON());
    }

    console.log("");
    console.log("========================================");
    console.log("📡 FINAL PRESENCE");
    console.log("========================================");

    console.log(
      JSON.stringify(presenceActivities, null, 2)
    );

    console.log("");
    console.log("🖼️ FINAL ASSETS:");

    presenceActivities.forEach((activity, index) => {
      console.log(`Activity ${index + 1}:`);

      if (activity.assets) {
        console.log(
          JSON.stringify(activity.assets, null, 2)
        );
      } else {
        console.log("⚠️ No assets");
      }
    });

    client.user.setPresence({
      activities: presenceActivities,
      status: "online",
    });

    console.log("");
    console.log("✅ setPresence() called successfully");
    console.log(`✅ ${presenceActivities.length} activities are now active!`);
  } catch (err) {
    console.error("");
    console.error("❌ FAILED TO SET PRESENCE");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
  }
});

// =========================
// Login
// =========================

console.log("");
console.log("🔐 Logging into Discord...");

client
  .login(process.env.TOKEN)
  .then(() => {
    console.log("✅ Login request completed");
  })
  .catch((err) => {
    console.error("❌ Login failed");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
  });

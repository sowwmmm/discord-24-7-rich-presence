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

const config = yaml.load(fs.readFileSync("./config.yml", "utf8"));

const client = new Client();

/**
 * Simple HTTP server
 */
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot is running!\n");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 HTTP server listening on port ${PORT}`);
});

/**
 * Create activities
 */
const activities = [];

/**
 * Support multi-activity config
 * Each activity can have its own application_id.
 */
if (Array.isArray(config.activities)) {
  for (const activity of config.activities) {
    const rich = new RichPresence(client)
      .setApplicationId(
        activity.application_id || config.application_id
      )
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
      rich.setButtons(activity.buttons);
    }

    activities.push(rich.toJSON());
  }
}

/**
 * Backwards compatibility:
 * If config.activities doesn't exist, use the old config format.
 */
if (activities.length === 0) {
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

  activities.push(rich.toJSON());
}

/**
 * Custom status
 */
let customStatus;

if (config.custom_status) {
  customStatus = new CustomStatus(client, {
    state: config.custom_status,
    emoji: config.custom_emoji
      ? { name: config.custom_emoji }
      : undefined,
  });
}

/**
 * Discord ready
 */
client.on("ready", async () => {
  console.log(`✅ ${client.user.username} is ready!`);

  try {
    const presenceActivities = [...activities];

    if (customStatus) {
      presenceActivities.push(customStatus.toJSON());
    }

    client.user.setPresence({
      activities: presenceActivities,
      status: "online",
    });

    console.log(`✅ ${presenceActivities.length} activities are now active!`);
  } catch (err) {
    console.error("❌ Failed to set presence:", err.message);
  }
});

/**
 * Login
 */
client
  .login(process.env.TOKEN)
  .catch(() => {
    console.error("❌ Invalid or missing token. Check your .env file.");
  });

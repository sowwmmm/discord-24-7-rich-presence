const {
  Client,
  CustomStatus,
  RichPresence,
} = require("discord.js-selfbot-v13");

const fs = require("fs");
const yaml = require("js-yaml");
const dotenv = require("dotenv");
const http = require("http");

const config = yaml.load(fs.readFileSync("./config.yml", "utf8"));

dotenv.config();

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
 * Create custom status
 */
const customStatus = new CustomStatus(client, {
  state: config.custom_status || "🔥 Watching tutorials",
  emoji: config.custom_emoji
    ? { name: config.custom_emoji }
    : undefined,
});

/**
 * Create rich presence
 */
const rich = new RichPresence(client)
  .setApplicationId(config.application_id)
  .setType(config.type || 0)
  .setName(config.name || "My Cool Presence")
  .setDetails(config.details || "No details set")
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

/**
 * Discord ready
 */
client.on("ready", async () => {
  console.log(`✅ ${client.user.username} is ready!`);

  try {
    client.user.setPresence({
      activities: [
        rich.toJSON()
      ],
      status: "online",
    });

    console.log("✅ Rich Presence is now active!");
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

import Logger from "#utils/Logger";
import inquirer from "inquirer";
import { getAllBots, getBotById, saveBot } from "repository/BotRepository";
import {
  getAllGoogleAccounts,
  saveGoogleAccount,
} from "repository/GoogleAccountRepository";

export async function getSearchPreferences() {
  const preferences = await inquirer.prompt([
    {
      type: "list",
      name: "searchType",
      message: "🔍 How would you like to discover videos?",
      choices: [
        { name: "🔎 Search by keyword", value: "keyword" },
        { name: "🔥 Browse trending page", value: "trending" },
      ],
      default: "keyword",
    },
    {
      type: "input",
      name: "keyword",
      message: "✨ Enter your search keyword:",
      when: (answers) => answers.searchType === "keyword",
      validate: (input) => (input.trim() ? true : "❌ Keyword cannot be empty"),
      default: "crypto buy",
    },
    {
      type: "list",
      name: "commentType",
      message: "💭 How would you like to comment?",
      choices: [
        { name: "🤖 Generate AI comments", value: "ai" },
        { name: "📝 Copy Comments From Comments", value: "copy" },
        { name: "✍️  Manual comments", value: "manual" },
      ],
      default: "manual",
    },
    {
      type: "list",
      name: "manualCommentType",
      message: "📝 Choose your comment source:",
      when: (answers) => answers.commentType === "manual",
      choices: [
        { name: "📄 Load from CSV file", value: "csv" },
        { name: "⌨️  Type directly", value: "direct" },
      ],
      default: "csv",
    },
    {
      type: "input",
      name: "comment",
      message: "✨ Enter your comment:",
      when: (answers) =>
        answers.commentType === "manual" &&
        answers.manualCommentType === "direct",
      validate: (input) => (input.trim() ? true : "❌ Comment cannot be empty"),
    },
  ]);

  return preferences;
}

export async function getUserBotPreference() {
  const botInfo = await inquirer.prompt([
    {
      type: "list",
      name: "botAction",
      message: "🤖 Do you want to create a new bot or select an existing one?",
      choices: [
        { name: "Create a new bot", value: "create" },
        { name: "Select an existing bot", value: "select" },
      ],
      default: "create",
    },
    {
      type: "input",
      name: "botUsername",
      message: "🤖 Enter the bot username:",
      when: (answers) => answers.botAction === "create",
      validate: (input) =>
        input.trim() ? true : "❌ Username cannot be empty",
    },
    {
      type: "confirm",
      name: "useExistingGoogleAccount",
      message: "🌐 Do you want to use an existing Google account?",
      when: (answers) => answers.botAction === "create",
      default: false,
    },
    {
      type: "list",
      name: "existingGoogleAccount",
      message: "📧 Select an existing Google account:",
      when: (answers) => answers.useExistingGoogleAccount,
      choices: async () => {
        const accounts = await getAllGoogleAccounts();
        return accounts.map((account) => ({
          name: account.email,
          value: account.id,
        }));
      },
    },
    {
      type: "input",
      name: "newGoogleEmail",
      message: "📧 Enter a new Google email:",
      when: (answers) =>
        answers.botAction === "create" && !answers.useExistingGoogleAccount,
      validate: (input) => (input.trim() ? true : "❌ Email cannot be empty"),
    },
    {
      type: "input",
      name: "newGooglePassword",
      message: "🔒 Enter a new Google password:",
      when: (answers) =>
        answers.botAction === "create" && !answers.useExistingGoogleAccount,
      validate: (input) =>
        input.trim() ? true : "❌ Password cannot be empty",
    },
    {
      type: "list",
      name: "selectedBot",
      message: "📦 Select an existing bot:",
      when: (answers) => answers.botAction === "select",
      choices: async () => {
        const bots = await getAllBots();
        return bots.map((bot) => ({
          name: bot.username,
          value: bot.id,
        }));
      },
    },
  ]);

  // Handle bot creation
  let botId = null;
  if (botInfo.botAction === "create") {
    let googleAccountId;

    if (botInfo.useExistingGoogleAccount) {
      googleAccountId = botInfo.existingGoogleAccount;
    } else {
      // Save new Google account first
      const newGoogleAccount = await saveGoogleAccount(
        botInfo.newGoogleEmail,
        botInfo.newGooglePassword
      );
      googleAccountId = newGoogleAccount.get("id");

      Logger.info(
        `✅ Google account "${newGoogleAccount.get("email")}" has been created.`
      );
    }

    // Save the bot with the associated Google account ID
    const bot = await saveBot(botInfo.botUsername, googleAccountId);
    botId = bot.get("id");
  } else if (botInfo.botAction === "select") {
    // Load the selected bot's information
    const selectedBot = await getBotById(botInfo.selectedBot);

    if (selectedBot) {
      botId = selectedBot.id;
      Logger.info(`✅ Bot "${selectedBot.username}" has been selected.`);
      Logger.info(`📧 Google account: ${selectedBot.google_account.email}`);
    } else {
      Logger.error(`❌ Failed to load the selected bot.`);
    }
  }

  return botId;
}

export async function getExecutionMode() {
  const { mode } = await inquirer.prompt([
    {
      type: "list",
      name: "mode",
      message: "🛠️ Choose mode:",
      choices: [
        { name: "🕵️ Bot Detection Mode", value: "botDetection" },
        { name: "🔒 Sandbox Mode", value: "sandbox" },
        { name: "🚀 Normal Mode", value: "none" },
      ],
      default: "none",
    },
  ]);

  // Si l'utilisateur choisit le mode "botDetection", on lui demande quel type de navigateur il veut utiliser
  if (mode === "botDetection") {
    const { browserType } = await inquirer.prompt([
      {
        type: "list",
        name: "browserType",
        message: "🌐 Choose browser configuration:",
        choices: [
          { name: "🦾 Pupeteer Real Browser", value: "realBrowser" },
          { name: "🕶️ Pupeteer  ReBrowser", value: "reBrowser" },
          {
            name: "🕵️ Pupeteer  Undetectable Browser",
            value: "undetectableBrowser",
          },
          { name: "🕵️ Peputeer Browser", value: "PeputeerBrowser" },
        ],
        default: "realBrowser",
      },
    ]);

    return { mode, browserType };
  }
  return { mode };
}

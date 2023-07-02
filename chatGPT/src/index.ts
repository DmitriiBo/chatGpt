import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';
import { OpenAiService } from './OpenAI';

dotenv.config();

const telegramBotService = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const openaiApi = new OpenAIApi(new Configuration({ apiKey: process.env.OPEN_AI_TOKEN }));
const openAIService = new OpenAiService(openaiApi, process.env.CHAT_GPT_MODEL);

telegramBotService.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (!msg.from) {
    telegramBotService.sendMessage(chatId, 'Sorry, I can`t identify your account');

    return;
  }

  if (!msg.text) {
    telegramBotService.sendMessage(chatId, 'I can`t do anything with an empty message');

    return;
  }

  if (msg.text === '/reset') {
    openAIService.resetContextForUser(msg.from.id);

    telegramBotService.sendMessage(chatId, 'Контекст сброшен');

    return;
  }

  const temporaryMessage = await telegramBotService.sendMessage(chatId, 'AI Model is thinking...');

  openAIService.createCompletion({
    userId: msg.from.id, text: msg.text, userName: msg.from.username || msg.from.first_name,
  })
    .then((data) => {
      telegramBotService.sendMessage(chatId, data);
    })
    .catch((error) => telegramBotService.sendMessage(chatId, error))
    .finally(() => telegramBotService.deleteMessage(chatId, temporaryMessage.message_id));
});

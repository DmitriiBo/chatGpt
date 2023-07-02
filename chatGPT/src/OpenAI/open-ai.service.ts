import { OpenAIApi } from 'openai';
import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from 'openai/api';
import { CreateCompletionOptions } from './open-ai.types';

export class OpenAiService {
  private currentMessages: Record<number, ChatCompletionRequestMessage[]> = [];

  constructor(
      private readonly openAIApi: OpenAIApi,
      private readonly model: string,
  ) {}

  resetContextForUser(userId: number) {
    this.currentMessages[userId].length = 0;
  }

  async createCompletion(options: CreateCompletionOptions): Promise<string> {
    this.addUserMessage(options);

    try {
      const completion = await this.openAIApi.createChatCompletion({
        model: this.model,
        messages: this.currentMessages[options.userId],
        user: options.userName,
      });

      const answer = completion?.data?.choices[0].message?.content;

      if (!answer) {
        return 'I haven`t recieved an answer from the ChatGPT server';
      }

      this.addAssistantMessage({
        ...options,
        text: answer,
      });

      return answer;
    } catch (error: unknown) {
      return String(error);
    }
  }

  private addAssistantMessage(options: CreateCompletionOptions) {
    this.addNewMessage('assistant', options);
  }

  private addUserMessage(options: CreateCompletionOptions) {
    this.addNewMessage('user', options);
  }

  private addNewMessage(
    role: ChatCompletionRequestMessageRoleEnum,
    options: CreateCompletionOptions,
  ) {
    const { userId, userName, text } = options;

    if (!this.currentMessages[userId]) {
      this.currentMessages[userId] = [];
    }

    this.currentMessages[userId].push({
      role,
      name: userName,
      content: text,
    });
  }
}

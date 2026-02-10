import {
  GOOGLE_API_KEY,
  QIAN_WEN_API_KEY,
  QIAN_WEN_API_URL,
  QIAN_WEN_TEXT_MODEL_NAME,
  GOOGLE_IMAGE_API_KEY,
} from "@/constants/env";
import { GoogleGenAI } from "@google/genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

export const qianWenModel = new ChatOpenAI({
  model: QIAN_WEN_TEXT_MODEL_NAME,
  apiKey: QIAN_WEN_API_KEY,
  temperature: 0.7,
  maxTokens: 1024,
  streaming: true, // 这里存在兼容性问题，千问模型在开启流式输出的后，导致id丢失，在调用tools的时候失败
  configuration: {
    baseURL: QIAN_WEN_API_URL,
  },
  verbosity: "low",
  modelKwargs: {
    parallel_tool_calls: false,
  },
});



export const googleModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: GOOGLE_API_KEY,
  temperature: 0.7,
  streaming: true,
});

export const googleImageModel = new ChatGoogleGenerativeAI({
  model: "gemini-3-pro-image-preview",
  apiKey: GOOGLE_IMAGE_API_KEY,
  temperature: 0.7,
  streaming: true,
});

export const googleGenAIEmbeddings = new GoogleGenAI({
  apiKey: GOOGLE_API_KEY,
});

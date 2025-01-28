import OpenAI from "openai";

export function getOpenAIClient(): OpenAI {
  const openai = new OpenAI({
    apiKey: process.env["OPENAI_API_KEY"],
    baseURL: process.env["OPENAI_BASE_URL"] || "https://api.openai.com/v1"
  });

  return openai;
}

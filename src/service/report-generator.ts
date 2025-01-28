import { AnalysisResponse } from "@/types/report";
import { OpenAI } from "openai";

export async function checkProjectAnalyzable(client: OpenAI, projectName: string): Promise<{
  analyzable: boolean;
  reason?: string;
}> {
  const completion = await client.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a Web3 project analysis expert. You need to determine if the given project name or URL points to a Web3 project.
        Criteria for analysis:
        1. Whether the project existed before January 1, 2024
        2. Whether it is a Web3-related project
        
        Notes:
        1. As long as the project existed before January 1, 2024, it can be analyzed
        2. If the input is a URL, please automatically extract the project name
        3. If it is indeed impossible to determine, then suggest the user provide more specific information`
      },
      {
        role: "user",
        content: `Please determine if "${projectName}" is a Web3 project that can be analyzed.
        Return JSON format:
        {
          "analyzable": boolean,
          "reason": "If not analyzable, provide specific reasons and suggestions here"
        }`
      }
    ],
    model: "gpt-4-1106-preview",
    temperature: 0.5,
    response_format: { type: "json_object" }
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error("Check result is empty");
  }
  return JSON.parse(content);
}

export async function generateProjectAnalysis(client: OpenAI, projectName: string): Promise<AnalysisResponse> {
  const checkResult = await checkProjectAnalyzable(client, projectName);
  if (!checkResult.analyzable) {
    const errorMessage = checkResult.reason || "The project cannot be analyzed at this time, possibly due to its recent launch or insufficient information";
    const error = new Error(errorMessage);
    error.name = 'ProjectNotAnalyzableError';
    throw error;
  }

  const completion = await client.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a professional Web3 project analyst. Your task is to provide a detailed project analysis, focusing particularly on the investment analysis section.
        Analysis focus:
        1. What practical problems does the project solve and how does it solve them
        2. Specific implementations of technological innovations and application scenarios
        3. Development of the ecosystem and future plans
        4. User value and actual adoption
        5. Sustainability and innovation of the token economic model
        6. In-depth investment analysis and strategy recommendations`
      },
      {
        role: "user",
        content: `Please conduct a detailed analysis of the ${projectName} project, adhering strictly to the following JSON format. Each analysis field must be at least 300 words, with a particularly detailed discussion in the investment analysis section:
        {
          "summary": {
            "description": "Project overview (at least 300 words)",
            "imageDescription": "A single sentence describing the project's core value"
          },
          "coreAnalysis": {
            "technology": "Technology analysis (at least 300 words)",
            "ecosystem": "Ecosystem analysis (at least 300 words)",
            "tokenomics": "Tokenomics analysis (at least 300 words)"
          },
          "investmentAnalysis": {
            "competitiveAdvantage": "Competitive advantage analysis (at least 300 words, including: 1. Market position and share analysis 2. Detailed explanation of core strengths 3. Comparison with competitors 4. Growth potential assessment 5. Analysis of the project's moat)",
            "risks": "Risk analysis (at least 300 words, including: 1. Detailed technical risk analysis 2. Market risk analysis 3. Regulatory risk assessment 4. Competitive risk analysis 5. Operational risk considerations 6. Potential black swan events)",
            "investmentStrategy": "Investment strategy analysis (at least 300 words, including: 1. Short-term investment strategy 2. Long-term布局建议 3. Specific entry timing analysis 4. Position management advice 5. Risk hedging plan 6. Exit strategy formulation)"
          },
          "socialLinks": {
            "website": "Official website URL",
            "twitter": "Twitter URL",
            "telegram": "Telegram group URL",
            "discord": "Discord URL",
            "github": "Github repository URL",
            "docs": "Technical documentation URL"
          }
        }
        
        Analysis requirements:
        1. Strictly adhere to the JSON structure, do not change or omit any fields
        2. Each analysis field must be at least 300 words, particularly the investment analysis section
        3. The investment analysis requires more specific and actionable recommendations
        4. Use professional but easy-to-understand language
        5. Focus on logic and readability
        6. Analyze based on the project's fundamentals
        7. Ensure that each investment analysis sub-item fully covers the required analysis points`
      }
    ],
    model: "gpt-4-1106-preview",
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: "json_object" }
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error("AI response is empty");
  }
  return JSON.parse(content);
} 
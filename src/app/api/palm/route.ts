import { NextRequest, NextResponse } from "next/server";
import { TextServiceClient } from "@google-ai/generativelanguage";
import { GoogleAuth } from "google-auth-library";
const removeMd = require("remove-markdown");

const MODEL_NAME = "models/text-bison-001";
const API_KEY: string = process.env.PALM_KEY!;

const auth = new GoogleAuth().fromAPIKey(API_KEY);

const client = new TextServiceClient({
  authClient: auth,
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    console.log(json.days);
    const promptString = `create a study plan for topic in days:
topic: ${json.topics}
days: ${json.days}
provide topics, subtopics and hours to study for each day
provide response in the form of json array`;
    const stopSequences: any[] = [];

    const result = await client.generateText({
      model: MODEL_NAME,
      temperature: 0.7,
      candidateCount: 1,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
      stopSequences: stopSequences,
      safetySettings: [
        { category: "HARM_CATEGORY_DEROGATORY", threshold: 1 },
        { category: "HARM_CATEGORY_TOXICITY", threshold: 1 },
        { category: "HARM_CATEGORY_VIOLENCE", threshold: 2 },
        { category: "HARM_CATEGORY_SEXUAL", threshold: 2 },
        { category: "HARM_CATEGORY_MEDICAL", threshold: 2 },
        { category: "HARM_CATEGORY_DANGEROUS", threshold: 2 },
      ],
      prompt: {
        text: promptString,
      },
    });

    let res = result[0].candidates![0].output?.replace("```json", "");
    res = res?.replace("```", "");
    res = removeMd(res);

    return new NextResponse(JSON.stringify(res), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    let error_response = {
      status: "error",
      message: err,
    };
    return new NextResponse(JSON.stringify(error_response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

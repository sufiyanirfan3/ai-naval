import { Message } from "@/types";
import type { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";
import pineconeStore from "@/utils/pineconeStore";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function translate(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { messages, userName } = req.body;

  const translatedText = await askOpenAI({ messages, userName });

  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify({ translatedText }));
}

async function askOpenAI({
  messages,
  userName,
}: {
  messages: Message[];
  userName: string;
}) {
  const pinecone = await pineconeStore();

  console.log("messages req: ", messages);

  // updated the message content to include context snippets
  var updatedMsgContent;
  if (messages?.length > 0) {
    const lastMsgContent = messages[messages.length - 1].content;

    const data = await pinecone.similaritySearch(lastMsgContent, 3);

    console.log("pinecone data.length: ", data.length);

    // updatedMsgContent = `${lastMsgContent}`;
    updatedMsgContent = `
    user question/statement: ${lastMsgContent}
    context snippets:
    ---
    1) ${data?.[0]?.pageContent}
    ---
    2) ${data?.[1]?.pageContent}
    ---
    3) ${data?.[2]?.pageContent}
    `;

    console.log(updatedMsgContent)

    messages[messages.length - 1].content = updatedMsgContent;
  }

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-0301",
      messages: [
        {
          role: "system",
          content: `
        Act as a conversational AI chatbot. Your name is salesforce assistant. The user's name is ${userName}.
        Introduce youself to ${userName}. Don't mention context snippets when replying to user and only mention yourself by your first name. Answer only according to current context. Dont take into account previous messages they are just for reference.
        `,
        },
        {
          role: "user",
          content: `${updatedMsgContent}`,
        },
          ...(messages || [
            {
              role: "user",
              content: "Hi There!",
            },
          ]),
      ],
    });

    return response?.data?.choices?.[0]?.message?.content;
  } catch (e: any) {
    console.log("error in response: ", e);
    return "There was an error in processing the ai response.";
  }
}

import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import {
  ChatOpenAI,
  DallEAPIWrapper,
  OpenAIEmbeddings,
} from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createRetrieverTool } from "langchain/tools/retriever";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import "./config.js";

const createVectorStore = async () => {
  const loader = new CheerioWebBaseLoader(
    "https://en.wikipedia.org/wiki/Bouldering",
    "https://en.wikipedia.org/wiki/Route_setter",
    "https://www.nomadbouldering.com.au/bouldering-blog/what-is-it-route-setting",
    "https://natureclimbing.com/blogs/news/mastering-the-art-of-setting-a-captivating-bouldering-route?srsltid=AfmBOoogcBQsLVYZrPfwU2s-bXGN9K47xKlUBKpmA8LaZ_tnEkK-1zVo",
    "https://kitkaclimbing.com/blog/tips-for-route-setting-avoid-common-mistakes",
  );
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 20,
  });
  const splitDocs = await splitter.splitDocuments(docs);

  const embeddings = new OpenAIEmbeddings();
  const vectorStore = await MemoryVectorStore.fromDocuments(
    splitDocs,
    embeddings,
  );

  return vectorStore;
};

const createAgent = async (vectorStore) => {
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a rock climbing and bouldering expert named Alice. You are helping to set bouldering routes at a bouldering gym. For context, Bouldering is a type of rock climbing performed on small rock formations or indoor climbing walls without the use of ropes or harnesses, typically up to 4-5 meters high. The focus is on short, powerful movements that test strength, technique, and problem-solving skills. Bouldering routes, called "problems," vary in difficulty and style, requiring climbers to solve movement sequences to reach the top. Route setting involves designing these problems, creating a mix of challenges through strategic placement of holds to offer varying levels of difficulty, often combining balance, strength, and technical skills. You need to create an image and return the url for that image.`,
    ],
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const imageGenerationTool = new DallEAPIWrapper({
    n: 1,
    model: "dall-e-3",
  });

  const searchTool = new TavilySearchResults();

  const retriever = vectorStore.asRetriever();

  const retrieverTool = createRetrieverTool(retriever, {
    name: "bouldering_and_route_setting_search",
    description: "Search for information about bouldering and route setting. For any questions about bouldering and route setting, you must use this tool first."
  })

  const tools = [imageGenerationTool, retrieverTool, searchTool];

  const agent = await createOpenAIFunctionsAgent({
    llm: model,
    memory: vectorStore,
    prompt,
    tools,
  });

  const executor = new AgentExecutor({
    agent,
    tools,
  });

  return executor;
};

const initializeAgent = async () => {
  const vectorStore = await createVectorStore();
  return await createAgent(vectorStore);
};

export const agent = await initializeAgent();

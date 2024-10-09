import express from "express";
import { agent } from "./agent.js";
import axios from "axios";
import "./config.js";

const app = express();
const port = 3000;

app.get("/", async (req, res) => {
  // const imageURL = await imageGenerationTool.invoke(agentResponse.output);
  // console.log(imageURL);
  // const imageURL =
  //   "https://oaidalleapiprodscus.blob.core.windows.net/private/org-2YG0cgAw5ZdYXJbT7sbnWrkX/user-eYERZYuhO0vpXajeDET8TGHr/img-yaShKGohRFOULkgVYdU19Bt1.png?st=2024-09-12T00%3A19%3A39Z&se=2024-09-12T02%3A19%3A39Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=d505667d-d6c1-4a0a-bac7-5c84a87759f8&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-09-11T23%3A23%3A04Z&ske=2024-09-12T23%3A23%3A04Z&sks=b&skv=2024-08-04&sig=zfEFvVPLOM%2B5%2BJ3fQ3pP5wtJqJmElZV73308agX03KA%3D";
  const input = `Human says: I want an image of a v1 boulder route set.`;

  const agentResponse = await agent.invoke({
    input,
  });

  // console.log(agentResponse.output);
  // res.send(agentResponse.output);

  const urlPattern = /(https?:\/\/[^\s\)]+)/g;
  const urls = agentResponse.output.match(urlPattern);
  const imageURL = urls.length ? urls[0] : null;
  console.log(imageURL);
  try {
    const response = await axios({
      url: imageURL,
      method: "GET",
      responseType: "stream",
    });

    res.setHeader("Content-Type", response.headers["content-type"]);

    response.data.pipe(res);
  } catch (error) {
    console.error("Error fetching the image:", error);
    res.status(500).send("Error fetching the image");
  }
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});

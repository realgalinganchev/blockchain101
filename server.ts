import express, { Express, Request, Response } from "express";
import { addTransaction, mine, mempool } from "./Miner";
import Blockchain from "./Blockchain";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import cors from "cors";
import Block from './react-setup/src/components/BlockClass';
import path from "path";
import BlockClass from "./react-setup/src/components/BlockClass";
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Blockchain101 API",
      version: "1.0.0",
      description: "API documentation for Blockchain101",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: [path.join(__dirname, "swagger.js")],
};

const app: Express = express();
app.use(express.json());
app.use(express.static("public"));
app.use(cors());
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const blockchain = Blockchain.instance;

app.post('/transaction', (req: Request, res: Response) => {
  addTransaction(req.body);
  res.sendStatus(200);
});

app.get("/blockchain", (_req: Request, res: Response) => {
  res.json(blockchain.chain);
});

app.get("/mempool", (req, res) => {
  res.json(mempool);
});

app.get('/mine', (_req: Request, res: Response) => {
  const newBlock = mine();
  res.json(newBlock);
});


app.listen(3000, () => console.log("Listening on port 3000"));

app.use(express.static("client"));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client", "index.html"));
});

import path from "path";
import cors from "cors";
import express, { Express } from "express";
import routes from "./routes";
import { initializeBlockchain, initializeMempool } from "./services/blockchain";

require("dotenv").config();

const app: Express = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:9000",
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  })
);

app.use("/", routes);

initializeBlockchain().then(() => {
  initializeMempool().then(() => {
    app.listen(9001, () => console.log("Listening on port 9001"));
  });
});

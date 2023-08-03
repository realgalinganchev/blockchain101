import path from "path";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import express, { Express } from "express";
import routes from "./routes";
import { swaggerDocs } from "./constants/swagger";
import { initializeBlockchain, initializeMempool } from "./services/blockchain";

require("dotenv").config();

const app: Express = express();

app.use(express.json());
app.use(express.static("public"));
app.use(
  cors({
    origin: "http://localhost:9000",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.static("client"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/", routes);

initializeBlockchain().then(() => {
  initializeMempool().then(() => {
    app.listen(9001, () => console.log("Listening on port 9001"));
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client", "index.html"));
});

import cors from "cors";
import express, { Express } from "express";
import routes from "./routes";
import { limits } from "./middleware/security";
import { initializeBlockchain, initializeMempool } from "./services/blockchain";

require("dotenv").config();

const app: Express = express();

// Behind Caddy -> nginx in production (TRUST_PROXY_HOPS=2), so rate limits see the
// visitor's IP instead of the proxy's. Locally there is no proxy.
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? 0));

app.use(express.json({ limit: "16kb" }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:9000",
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  })
);
app.use(limits.global);

app.use("/", routes);

initializeBlockchain().then(() => {
  initializeMempool().then(() => {
    app.listen(9001, () => console.log("Listening on port 9001"));
  });
});

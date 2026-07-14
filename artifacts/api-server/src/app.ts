import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// In production the frontend is on Vercel and the API is on Render, so we
// need to allow cross-origin requests. CORS_ORIGIN env var lets you lock this
// down to your exact Vercel URL once you know it; defaults to all origins.
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;

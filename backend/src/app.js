import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

const app = new express();

// Configure CORS so that credentials (cookies) can be used from the frontend.
// When credentials are included, Access-Control-Allow-Origin must be a specific
// origin value (not '*'). To make development easier you can set
// CORS_ORIGIN=http://localhost:5173 (or a comma-separated list). If
// CORS_ORIGIN is '*' we reflect the request origin which produces a
// specific Access-Control-Allow-Origin header for each request.
const corsOptions = {};
const corsEnv = process.env.CORS_ORIGIN || "*";
if (corsEnv.trim() === "*") {
    // reflect request origin — safe for development when using credentials
    corsOptions.origin = true;
} else {
    const allowed = corsEnv.split(",").map(s => s.trim());
    corsOptions.origin = function (origin, callback) {
        // allow non-browser requests with no origin (e.g., curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowed.indexOf(origin) !== -1) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
    };
}
corsOptions.credentials = true;

app.use(cors(corsOptions));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev")); //HTTP request logger middleware for node.js 



//routes import

import userRouter from "./routes/user.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import videoRouter from "./routes/video.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);


export default app;

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config(); // ✅ VERY IMPORTANT

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*",
  }),
);

const authRouter = require("./routes/User");
const projectRouter = require("./routes/Project");
const contactRouter = require("./routes/Contact");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URL)
      .then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  console.log("✅ MongoDB connected");
  return cached.conn;
}

connectDB();

app.use("/users", authRouter);
app.use("/projects", projectRouter);
app.use("/contact", contactRouter);

app.get("/", (req, res) => {
  res.send("🚀 Server is online");
});

/* ---------- EXPORT (NO app.listen) ---------- */
module.exports = app;
// app.listen(process.env.PORT, () => {
//   console.log("Server is running perfectly on PORT:", process.env.PORT);
// });

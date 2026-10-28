import mongoose from "mongoose";

mongoose.set("bufferCommands", false);

export const historyEnabled = () => process.env.HISTORY_ENABLED === "true";

export const historyAvailable = () =>
  historyEnabled() && mongoose.connection.readyState === 1;

export async function connectDB() {
  if (!historyEnabled()) return;

  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pixmamba",
      {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      },
    );

    console.log("MongoDB history connected");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);

    for (const [address, server] of error.reason?.servers ?? []) {
      console.error(
        "Atlas server:",
        address,
        "Error:",
        server.error?.message ?? "No individual error",
      );
    }

    console.warn(
      "MongoDB unavailable; image enhancement remains available. Retrying in 30s.",
    );

    const timer = setTimeout(connectDB, 30000);
    timer.unref();
  }
}

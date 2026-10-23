if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET is required in production.");
}
const authConfig = {
  secret: process.env.AUTH_SECRET || "todo-speckit-dev-secret",
};

export default authConfig;

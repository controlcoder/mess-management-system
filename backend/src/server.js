import "dotenv/config";
// Must be imported before app.js so every date calculation uses IST.
import "./config/timezone.js";
import app from "./app.js";
const PORT = process.env.PORT || 8888;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
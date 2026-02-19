require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors")
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 5000;
const path = require("path");
const { corsOption } = require(path.join(__dirname, 'config', 'corsOptions'));
const authRoutes = require("./routes/auth.routes");
const contactRoutes = require("./routes/contact.routes");
const { connectDB } = require("./config/dbConnect");




connectDB()
app.use(cors(corsOption));
app.use(cookieParser())
app.use(express.json());


// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/contact", require("./routes/contact.routes"));



app.use("/", express.static(path.join(__dirname, "public")));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "./views/index.html"))
})
app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
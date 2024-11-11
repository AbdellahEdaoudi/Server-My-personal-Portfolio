require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors")
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 200;
const path = require("path");
const { corsOption } = require(path.join(__dirname, 'config', 'corsOptions'));
const { connectDB } = require("./config/dbConnect");
const contactController = require('./controllers/contactController');
const AuthController = require("./controllers/AuthController");



connectDB()
app.use(cors(corsOption));
app.use(cookieParser())
app.use(express.json());
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Contact Routes
app.get('/contact', contactController.getAllContacts);
app.post('/Contact', contactController.createContact);
app.delete('/Contact', contactController.deleteAllContacts);
app.delete('/Contact/:id', contactController.deleteContactById);
// Auth Routes
app.post("/register", AuthController.registerUser);
app.post("/login", AuthController.loginUser);
app.post("/refresh", AuthController.refresh);
app.post("/logout", AuthController.logout);


app.use("/",express.static(path.join(__dirname,"public")));
app.get('/',(req,res)=>{
  res.sendFile(path.join(__dirname,"./Views/index.html"))
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
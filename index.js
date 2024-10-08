require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors")
const cookieParser = require('cookie-parser');
const PORT = 200 || process.env.PORT;
const path = require("path");
const { corsOption } = require('./config/corsoptions');
const { connectDB } = require("./config/dbConnect");
const contactController = require('./controllers/contactController');


connectDB()
app.use(cors(corsOption));
app.use(cookieParser())
app.use(express.json());
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Contact Routes
app.get('/Contact', contactController.getAllContacts);
app.post('/Contact', contactController.createContact);
app.delete('/Contact', contactController.deleteAllContacts);
app.delete('/Contact/:id', contactController.deleteContactById);



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
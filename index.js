require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const app = express();
app.use(express.json());
const Contact = require("./Contact");
// const { required } = require("nodemon/lib/config");
const PORT = 200 || process.env.PORT;
const path = require("path")


// CORS middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

mongoose.set('strictQuery', true);
// mongoose.connect("mongodb://127.0.0.1:27017/Contact_Prtfl")
mongoose.connect(process.env.DATABASE_URL)
    .then(() => {
        console.log(`Auth-Service DB Connected`);
    })
    .catch(err => {
        console.error(err);
    });

app.listen(PORT, () => {
    console.log(`Auth-Service at ${PORT}`);
});


app.get('/Contact', async (req, res) => {

    try {
        const Conatacte = await Contact.find();
        res.json(Conatacte)

    } catch (error) {
        res.json(error)
    }

})
app.post('/Contact', async (req, res) => {

    try {
        const pConatact = new Contact(req.body);
        const Conatacte = await pConatact.save();
        res.json(Conatacte);

    } catch (error) {
        res.json(error)
    }

})
// Delete all contacts // Delete all contacts
app.delete('/Contact', async (req, res) => {
    try {
        await Contact.deleteMany();
        res.json({ message: 'All contacts deleted successfully' });
    } catch (error) {
        res.json(error);
    }
});
// Delete a contact by _id
app.delete('/Contact/:id', async (req, res) => {
    try {
        const deletedContact = await Contact.findByIdAndDelete({ _id: req.params.id });
        if (!deletedContact) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        res.json({ message: 'Contact deleted successfully', deletedContact });
    } catch (error) {
        res.json(error);
    }
});

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
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const app = express();
app.use(express.json());
const Contact = require("./Contact");
// const { required } = require("nodemon/lib/config");
const PORT = 200 || process.env.PORT;


// CORS middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://ed-portfolio-six.vercel.app');
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

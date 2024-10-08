// controllers/contactController.js
const Contact = require('../models/Contact');

// Get all contacts
exports.getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.find();
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new contact
exports.createContact = async (req, res) => {
    try {
        const newContact = new Contact(req.body);
        const savedContact = await newContact.save();
        res.status(201).json(savedContact);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete all contacts
exports.deleteAllContacts = async (req, res) => {
    try {
        await Contact.deleteMany();
        res.json({ message: 'All contacts deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a contact by ID
exports.deleteContactById = async (req, res) => {
    try {
        const deletedContact = await Contact.findByIdAndDelete(req.params.id);
        if (!deletedContact) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        res.json({ message: 'Contact deleted successfully', deletedContact });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

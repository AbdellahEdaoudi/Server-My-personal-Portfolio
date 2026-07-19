const Contact = require('../models/contact.model');
const cloudinary = require('../config/cloudinary');

// Helper: extract Cloudinary public_id from URL
const extractPublicId = (imageUrl) => {
    if (!imageUrl) return null;
    try {
        // URL format: https://res.cloudinary.com/<cloud>/image/upload/v<version>/<folder>/<public_id>.<ext>
        const matches = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
        return matches ? matches[1] : null;
    } catch {
        return null;
    }
};

// Get all contacts
exports.getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().select('-__v').lean();
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new contact
exports.createContact = async (req, res) => {
    try {
        const { subject, email, message, image } = req.body;

        // Check if all fields are present
        if (!subject || !email || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Validate lengths to prevent huge payloads
        if (subject.length > 100) {
            return res.status(400).json({ error: "Subject is too long (max 100 chars)" });
        }
        if (email.length > 100) {
            return res.status(400).json({ error: "Email is too long (max 100 chars)" });
        }
        if (message.length > 5000) {
            return res.status(400).json({ error: "Message is too long (max 5000 chars)" });
        }

        let imageUrl = null;
        if (image) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(image, {
                    folder: 'contact_attachments',
                });
                imageUrl = uploadResponse.secure_url;
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError);
                return res.status(500).json({ error: "Failed to upload image" });
            }
        }

        const newContact = new Contact({
            subject,
            email,
            message,
            ...(imageUrl && { image: imageUrl })
        });
        const savedContact = await newContact.save();
        res.status(201).json(savedContact);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete all contacts (and their Cloudinary images)
exports.deleteAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.find({ image: { $exists: true, $ne: null } });

        // Delete all Cloudinary images in parallel
        const deletePromises = contacts.map(contact => {
            const publicId = extractPublicId(contact.image);
            if (publicId) {
                return cloudinary.uploader.destroy(publicId).catch(err =>
                    console.error(`Failed to delete image ${publicId}:`, err)
                );
            }
        }).filter(Boolean);

        await Promise.all(deletePromises);
        await Contact.deleteMany();

        res.json({ message: 'All contacts deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a contact by ID (and its Cloudinary image)
exports.deleteContactById = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        // Delete image from Cloudinary if it exists
        if (contact.image) {
            const publicId = extractPublicId(contact.image);
            if (publicId) {
                await cloudinary.uploader.destroy(publicId).catch(err =>
                    console.error(`Failed to delete image ${publicId}:`, err)
                );
            }
        }

        await Contact.findByIdAndDelete(req.params.id);
        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

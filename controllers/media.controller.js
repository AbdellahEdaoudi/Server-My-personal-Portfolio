const cloudinary = require('../config/cloudinary');

exports.getAllImages = async (req, res) => {
    try {
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'contact_attachments/',
            max_results: 100
        });

        res.json({
            success: true,
            images: result.resources,
            next_cursor: result.next_cursor
        });
    } catch (error) {
        console.error("Cloudinary fetch error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch images from Cloudinary" });
    }
};

exports.deleteImage = async (req, res) => {
    try {
        const { public_id } = req.body;

        if (!public_id) {
            return res.status(400).json({ success: false, message: "public_id is required" });
        }

        const result = await cloudinary.uploader.destroy(public_id);
        
        if (result.result === 'ok') {
            res.json({ success: true, message: "Image deleted successfully" });
        } else {
            res.status(400).json({ success: false, message: "Failed to delete image", result });
        }
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        res.status(500).json({ success: false, message: "Error deleting image" });
    }
};

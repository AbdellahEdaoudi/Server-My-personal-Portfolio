const IpAddress = require("../models/IpAddress");
const axios = require("axios");


exports.saveIpAddress = async (req, res) => {
  try {
    const ip = 
        req.headers['cf-connecting-ip'] ||  
        req.headers['x-real-ip'] ||
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress || '';

    let ipRecord = await IpAddress.findOne({ ipaddress: ip });

    if (ipRecord) {
      const lastTimestamp = ipRecord.timestamps[ipRecord.timestamps.length - 1];
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

      // Add a new timestamp only if the last one is older than 12 hours
      if (!lastTimestamp || new Date(lastTimestamp) < twelveHoursAgo) {
        ipRecord.timestamps.push(new Date());
        await ipRecord.save();
      }

      return res.status(200).json({ message: "Record updated", ipRecord });
    } else {
      ipRecord = new IpAddress({ ipaddress: ip, timestamps: [new Date()] });
      await ipRecord.save();
      return res.status(201).json({ message: "New IP added", ipRecord });
    }
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllIpAddresses = async (req, res) => {
  try {
    const ipRecords = await IpAddress.find();

    const ipDetailsPromises = ipRecords.map(async (record) => {
      try {
        const response = await axios.get(`https://ipinfo.io/${record.ipaddress}/json?token=b95ac9c7c9a7d6`);
        return { ...record.toObject(), ipInfo: response.data };
      } catch (error) {
        console.error(`Error fetching data for IP: ${record.ipaddress}`, error.message);
        return { ...record.toObject(), ipInfo: { error: "Failed to fetch IP info" } };
      }
    });

    const detailedIpRecords = await Promise.all(ipDetailsPromises);
    return res.status(200).json(detailedIpRecords);
  } catch (error) {
    console.error("Error fetching IP addresses:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteIpAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedIp = await IpAddress.findByIdAndDelete(id);

    if (!deletedIp) {
      return res.status(404).json({ message: "IP record not found" });
    }

    return res.status(200).json({ message: "IP record deleted successfully", deletedIp });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

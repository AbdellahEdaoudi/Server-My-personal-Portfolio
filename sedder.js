const faker = require('faker');
const Contact = require('./Contact'); // Ensure the correct path to your model

const seedContacts = async () => {
  try {
    // Optionally delete all existing contacts
    await Contact.deleteMany({});

    // Generate 50 random messages
    for (let i = 0; i < 122; i++) {
      const newContact = new Contact({
        name: faker.name.findName(),
        email: faker.internet.email(),
        msg: faker.lorem.sentences(),
      });
      await newContact.save();
    }

    return { message: 'Messages added successfully' };
  } catch (error) {
    throw new Error('Error generating messages:', error);
  }
};

module.exports = seedContacts;

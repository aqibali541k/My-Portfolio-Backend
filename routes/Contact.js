const express = require("express");
const contactRouter = express.Router();
const Contact = require("../models/contactSchema");
/* ================= CREATE CONTACT ================= */
contactRouter.post("/create", async (req, res) => {
  try {
    const contact = await Contact.create(req.body);
    res.json({ message: "Contact created", contact });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Contact creation failed" });
  }
});

/* ================= GET ALL CONTACT ================= */
contactRouter.get("/all", async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.json({ contacts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load contacts" });
  }
});

/* ================= DELETE CONTACT ================= */
contactRouter.delete("/:id", async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: "Contact deleted", contact });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Contact deletion failed" });
  }
});

module.exports = contactRouter;

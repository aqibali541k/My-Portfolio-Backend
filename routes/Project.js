const express = require("express");
const multer = require("multer");
const Project = require("../models/projectSchema");
const verifyToken = require("../middlewares/verifyToken");
const { cloudinary } = require("../middlewares/cloudinary");
const isAdmin = require("../middlewares/isAdmin");

const projectRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* ================= CREATE PROJECT (ADMIN) ================= */
projectRouter.post(
  "/create",
  verifyToken,
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, description, techStack, liveUrl, githubUrl } = req.body;

      if (!title || !description || !liveUrl) {
        return res.status(400).json({
          message: "Title, description and liveUrl are required",
        });
      }

      let image = "";
      let imagePublicId = "";

      if (req.file) {
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "projects" }, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            })
            .end(req.file.buffer);
        });

        image = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      }

      const project = await Project.create({
        title,
        description,
        techStack: techStack ? JSON.parse(techStack) : [],
        liveUrl,
        githubUrl,
        image,
        imagePublicId,
        createdBy: req.user.id,
      });

      res.status(201).json({
        message: "Project created successfully",
        project,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Project creation failed" });
    }
  },
);

/* ================= GET ALL PROJECTS (PUBLIC) ================= */
projectRouter.get("/all", async (req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 });
  res.json({ projects });
});

/* /* ================= UPDATE PROJECT (ADMIN) ================= */
projectRouter.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("image"), // ✅ VERY IMPORTANT
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const { title, description, liveUrl, githubUrl, techStack } = req.body;

      // ✅ TEXT FIELDS
      if (title) project.title = title;
      if (description) project.description = description;
      if (liveUrl) project.liveUrl = liveUrl;
      if (githubUrl) project.githubUrl = githubUrl;

      // ✅ TECH STACK (FormData string → array)
      if (techStack) {
        project.techStack = JSON.parse(techStack);
      }

      // ✅ IMAGE UPDATE
      if (req.file) {
        // purani image delete
        if (project.imagePublicId) {
          await cloudinary.uploader.destroy(project.imagePublicId);
        }

        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "projects" }, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            })
            .end(req.file.buffer);
        });

        project.image = uploadResult.secure_url;
        project.imagePublicId = uploadResult.public_id;
      }

      await project.save();

      res.json({
        message: "Project updated successfully",
        project,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Project update failed" });
    }
  },
);

module.exports = projectRouter;

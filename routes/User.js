const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const User = require("../models/userSchema");
const verifyToken = require("../middlewares/verifyToken");
const { cloudinary } = require("../middlewares/cloudinary");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* ================= REGISTER ================= */
router.post("/register", upload.single("image"), async (req, res) => {
  try {
    const { firstName, lastName, dob, email, password } = req.body;

    if (!firstName || !lastName || !dob || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    let image = "";
    let imagePublicId = "";

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "users" }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          })
          .end(req.file.buffer);
      });

      image = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      dob,
      email,
      password: hashedPassword,
      image,
      imagePublicId,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_KEY, {
      expiresIn: "1d",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        dob: user.dob,
        email: user.email,
        image: user.image,
        role: user.email === process.env.ADMIN_EMAIL ? "admin" : "user",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_KEY, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        dob: user.dob,
        email: user.email,
        image: user.image,
        role: user.email === process.env.ADMIN_EMAIL ? "admin" : "user",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

/* ================= PROFILE ================= */
router.get("/profile", verifyToken, async (req, res) => {
  const user = req.user;

  res.json({
    user: {
      ...user.toObject(),
      role: user.email === process.env.ADMIN_EMAIL ? "admin" : "user",
    },
  });
});

/* ================= UPDATE ================= */
router.put("/update", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const update = {};

    /* -------- SAFE FIELD UPDATES -------- */
    if (req.body.firstName) update.firstName = req.body.firstName;
    if (req.body.lastName) update.lastName = req.body.lastName;
    if (req.body.email) update.email = req.body.email;
    if (req.body.dob) update.dob = req.body.dob;

    /* -------- PASSWORD -------- */
    if (req.body.password) {
      update.password = await bcrypt.hash(req.body.password, 10);
    }

    /* -------- IMAGE UPLOAD -------- */
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "users" }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          })
          .end(req.file.buffer);
      });

      update.image = uploadResult.secure_url;
      update.imagePublicId = uploadResult.public_id;
    }

    /* -------- NOTHING TO UPDATE -------- */
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    /* -------- UPDATE USER -------- */
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
});

/* ================= ALL USERS (ADMIN ONLY) ================= */
router.get("/all", verifyToken, async (req, res) => {
  if (req.user.email !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({ message: "Admin access only" });
  }

  const users = await User.find().select("firstName lastName email dob image");

  res.json({ users });
});

module.exports = router;
// const express = require("express");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const multer = require("multer");
// const User = require("../models/userSchema");
// const verifyToken = require("../middlewares/verifyToken");
// const isAdmin = require("../middlewares/isAdmin");
// const { cloudinary } = require("../middlewares/cloudinary");

// const router = express.Router();
// const upload = multer({ storage: multer.memoryStorage() });

// /* ================= ADMIN REGISTER ================= */
// router.post("/register", upload.single("image"), async (req, res) => {
//   try {
//     const { firstName, lastName, dob, email, password } = req.body;

//     if (email !== process.env.ADMIN_EMAIL) {
//       return res.status(403).json({ message: "Only admin can register" });
//     }

//     const exists = await User.findOne({ email });
//     if (exists) {
//       return res.status(400).json({ message: "Admin already exists" });
//     }

//     let image = "";
//     let imagePublicId = "";

//     if (req.file) {
//       const uploadResult = await new Promise((resolve, reject) => {
//         cloudinary.uploader
//           .upload_stream({ folder: "admin" }, (err, result) => {
//             if (err) reject(err);
//             else resolve(result);
//           })
//           .end(req.file.buffer);
//       });

//       image = uploadResult.secure_url;
//       imagePublicId = uploadResult.public_id;
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       firstName,
//       lastName,
//       dob,
//       email,
//       password: hashedPassword,
//       image,
//       imagePublicId,
//     });

//     const token = jwt.sign({ id: user._id }, process.env.JWT_KEY, {
//       expiresIn: "1d",
//     });

//     res.status(201).json({
//       token,
//       user: { ...user.toObject(), role: "admin" },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Register failed" });
//   }
// });

// /* ================= ADMIN LOGIN ================= */
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (email !== process.env.ADMIN_EMAIL) {
//       return res.status(403).json({ message: "Admin only" });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     const match = await bcrypt.compare(password, user.password);
//     if (!match) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     const token = jwt.sign({ id: user._id }, process.env.JWT_KEY, {
//       expiresIn: "1d",
//     });

//     res.json({
//       token,
//       user: { ...user.toObject(), role: "admin" },
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Login failed" });
//   }
// });

// /* ================= PROFILE ================= */
// router.get("/profile", verifyToken, isAdmin, (req, res) => {
//   res.json({
//     user: { ...req.user.toObject(), role: "admin" },
//   });
// });

// /* ================= UPDATE PROFILE ================= */
// router.put(
//   "/update",
//   verifyToken,
//   isAdmin,
//   upload.single("image"),
//   async (req, res) => {
//     try {
//       const update = {};

//       if (req.body.firstName) update.firstName = req.body.firstName;
//       if (req.body.lastName) update.lastName = req.body.lastName;
//       if (req.body.dob) update.dob = req.body.dob;

//       if (req.file) {
//         const uploadResult = await new Promise((resolve, reject) => {
//           cloudinary.uploader
//             .upload_stream({ folder: "admin" }, (err, result) => {
//               if (err) reject(err);
//               else resolve(result);
//             })
//             .end(req.file.buffer);
//         });

//         update.image = uploadResult.secure_url;
//         update.imagePublicId = uploadResult.public_id;
//       }

//       const user = await User.findByIdAndUpdate(
//         req.user.id,
//         { $set: update },
//         { new: true },
//       ).select("-password");

//       res.json({ user });
//     } catch (err) {
//       res.status(500).json({ message: "Update failed" });
//     }
//   },
// );

// module.exports = router;

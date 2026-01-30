// const adminAuth = (req, res, next) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     if (req.user.email !== process.env.ADMIN_EMAIL) {
//       return res.status(403).json({ message: "Admin only" });
//     }

//     next();
//   } catch (err) {
//     console.error("adminAuth error:", err.message);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// module.exports = adminAuth;
const adminAuth = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ message: "Admin only" });
    }

    next();
  } catch (err) {
    console.error("adminAuth error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = adminAuth;

// middleware/requireLogin.js
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = mongoose.model("users");

module.exports = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ 
      message: "You must be logged in" 
    });
  }

  // Extract token - handle both "Bearer <token>" and just "<token>"
  const token = authorization.startsWith("Bearer ") 
    ? authorization.replace("Bearer ", "") 
    : authorization;

  jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
    if (err) {
      return res.status(401).json({ 
        message: "You must be logged in" 
      });
    }

    const { id } = payload;
    const user = await User.findById(id);

    if (!user) {
      return res.status(401).json({ 
        message: "User not found" 
      });
    }

    req.user = { id: user._id, email: user.email };
    next();
  });
};






























































// // middleware/requireLogin.js
// const jwt = require("jsonwebtoken");
// const mongoose = require("mongoose");
// const User = mongoose.model("users");

// module.exports = (req, res, next) => {
//   const { authorization } = req.headers;

//   if (!authorization) {
//     return res.status(401).json({ 
//       message: "You must be logged in" 
//     });
//   }

//   const token = authorization.replace("Bearer ", "");

//   jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
//     if (err) {
//       return res.status(401).json({ 
//         message: "You must be logged in" 
//       });
//     }

//     const { id } = payload;
//     const user = await User.findById(id);

//     if (!user) {
//       return res.status(401).json({ 
//         message: "User not found" 
//       });
//     }

//     req.user = { id: user._id, email: user.email };
//     next();
//   });
// };
import jwt from 'jsonwebtoken';
import User from '../modules/user/user.model.js';

export const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Identity Required"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    const user = await User.findById(decoded.id).select("-password").populate("role");

    if (!user) return next(new Error("Invalid Identity"));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Protocol Denied"));
  }
};
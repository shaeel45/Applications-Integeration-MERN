const User = require("../models/User.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const signUp = async (req, res) => {
  const { name, email, password } = req.body;
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = new User({
  name,
  email,
  password, // plain text; model will hash it
});
await user.save();


    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Sign-up error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const JWT_SECRET = process.env.JWT_SECRET;

  try {
const user = await User.findOne({ email });
if (!user) {
  console.log("User not found with email:", email); // Add this line
  return res.status(400).json({ message: "Invalid email or password" });
}

    console.log("Login email:", email);
console.log("Entered password:", password);
console.log("Stored hash:", user.password);
const isPasswordValid = await bcrypt.compare(password, user.password);
console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token, user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving users", error: error.message });
  }
};

module.exports = { getAllUsers, login, signUp };

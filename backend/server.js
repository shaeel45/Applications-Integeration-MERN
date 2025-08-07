const express = require("express")
const cors = require("cors")
const session = require('express-session');
const dotenv = require('dotenv')
const connectDB = require('./db.js')
const userRoutes = require("./Routes/userRoutes.js");
const facebookRoutes = require("./Routes/facebookRoutes.js");
const postRoutes = require("./Routes/postRoutes.js");
const threadRoutes = require("./Routes/threadRoutes.js");
const LinkedinRoutes = require("./Routes/LinkedinRoutes.js");
const redditRoutes = require("./Routes/redditRoutes.js");
const mastodonRoutes = require("./Routes/mastodonRoutes.js");
const schedulerService = require('./services/schedulerService');
const { default: axios } = require("axios");

const app = express();
dotenv.config();
app.use(express.json());
connectDB();

// Initialize scheduler service
schedulerService.initializeScheduler();

app.use(cors({
  origin: "*", // Allow all origins (replace '*' with specific origins if needed)
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}));
app.use(session({
  secret: process.env.MASTODON_CLIENT_SECRET, // use a strong secret in production!
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if using HTTPS
}));
app.use('/uploads', express.static(`${__dirname}/uploads`));

// API Routes
app.use('/api', facebookRoutes);
app.use('/api', userRoutes);
app.use("/api", LinkedinRoutes);
app.use("/api", postRoutes);
app.use("/api", threadRoutes);
app.use('/api/reddit', redditRoutes);
app.use("/api/mastodon", mastodonRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Reach Way API is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
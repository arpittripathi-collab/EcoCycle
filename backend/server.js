import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './database/db.js';

// Import all routes
import authRoute from "./routes/auth.js";
import itemsRoute from "./routes/items.js";
import matchRoute from "./routes/match.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to Database
connectDB();

// API Routes
app.use("/api/auth", authRoute);
app.use("/api/items", itemsRoute);
app.use("/api/match", matchRoute);

app.get('/', (req, res) => {
  res.send('EcoCycle/Donor-Receiver API is running.');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
import  express from 'express';
import dotenv from 'dotenv';
import connectDB from './database/db.js';
import authRoute from "./routes/route.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

connectDB();

app.use("/api",authRoute)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.send('EcoCycle API');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});



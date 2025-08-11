require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authMiddleware = require('./src/middleware/authMiddleware');

const app = express();
const port = 5000;

// CORS Config
app.use(cors({
    origin: "https://rentix.vercel.app",
    credentials: true
}));
app.use(express.json());

// Body parser
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

const apiRouter = require('./src/routes/index');
app.use('/api', apiRouter);

// Shedules
require('./src/jobs/scheduler').init()

app.listen(port || 5000, () => {
    console.log(`BACKEND SERVER ARE RUNNING ON ${port}`);
});

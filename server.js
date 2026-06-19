require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Routes
const userRoutes = require('./routes/userRoutes');
const toolsRoute = require('./routes/toolsRoute');
const notificationRoute = require('./routes/notificationRoute');
const dashboardRoute = require('./routes/dashboardRoute');
const exchangeRoute = require('./routes/exchangeRoute');
const cartRoute = require('./routes/cartRoute');
const problemRoute = require('./routes/problemRoute');
const solutionRoute = require('./routes/solutionRoute');


// Middleware
const upload = require('./middleware/upload');
const { connectDB } = require('./config/db');
connectDB();
const app = express();

// === Middleware ===
app.use(express.json()); // Parses application/json
app.use(express.urlencoded({ extended: true })); // Parses x-www-form-urlencoded
app.use(cors());

// === Swagger Documentation ===
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// === Ensure Uploads Directory Exists ===
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// === File Upload Route ===
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/api/get-image/${req.file.filename}`;
  res.status(200).json({ message: 'File uploaded successfully', fileUrl });
});

// === Static File Serving ===
app.use('/api/get-image', express.static(uploadsDir));

// === API Routes ===
app.use('/api/users', userRoutes);
app.use('/api/tools', toolsRoute);
app.use('/api/exchange', exchangeRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/cart', cartRoute);
app.use('/api/problem', problemRoute);
app.use('/api/solution', solutionRoute);

// === Root Route ===
app.get("/",(req,res)=>{
  res.send(`<html>
    <h1 style="text-align:center;color:green">Server is Running at port 4000</h1>
    <p style="text-align:center"><a href="/api-docs">View API Documentation</a></p>
    </html>`)
})
// === Global Error Handler ===
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// === Start Server ===
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

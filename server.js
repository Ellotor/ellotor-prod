require('dotenv').config();  // To load variables from a .env file
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const axios = require('axios');  
const Admin = require('./models/admin');  
const cors = require('cors'); 

// ✅ Added imports for cron, excel, mail
const cron = require("node-cron");
const ExcelJS = require("exceljs");
const nodemailer = require("nodemailer");
const fs = require("fs");
const User = require('./models/user'); // already used later

const app = express();
const port = process.env.PORT; 

// CORS configuration
const corsOptions = {
  origin: 'https://ellotor-prod-6.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, 
};

app.use(cors(corsOptions));
app.use(express.static('public'));
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('MongoDB connection error:', err));

// ------------------ Admin setup (unchanged) ------------------
const checkAdmin = async () => {
  try {
    console.log('Checking if admin exists...');
    const admin = await Admin.findOne({ username: 'admin' });
    if (!admin) {
      console.log('Admin not found. Creating default admin...');
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      const newAdmin = new Admin({
        username: 'admin',
        password: hashedPassword,
        firstTimeLogin: true 
      });
      await newAdmin.save();
      console.log('Admin created with default password');
    } else {
      console.log('Admin already exists.');
    }
  } catch (err) {
    console.log('Error checking or creating admin:', err);
  }
};
checkAdmin();

// ------------------ Routes (unchanged) ------------------
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');  
});

app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username: 'admin' });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    const isPasswordValid = await admin.comparePassword(password);
    if (isPasswordValid) {
      if (admin.firstTimeLogin) {
        return res.json({
          message: 'Access granted',
          firstTimeLogin: true,
          redirectTo: '/change-password.html'
        });
      } else {
        return res.json({
          message: 'Access granted',
          redirectTo: '/admin.html'
        });
      }
    } else {
      return res.status(401).json({ message: 'Incorrect password' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/admin/change-password', async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Both old and new passwords are required' });
    }
    const admin = await Admin.findOne({ username: 'admin' });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    const isOldPasswordValid = await admin.comparePassword(oldPassword);
    if (!isOldPasswordValid) {
      return res.status(401).json({ message: 'Incorrect old password' });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedNewPassword;
    admin.firstTimeLogin = false; 
    await admin.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ------------------ User routes (unchanged) ------------------
app.post('/submitData', async (req, res) => {
  try {
    const user = new User({
      stand: req.body.stand,
      action: req.body.action,
      name: req.body.name,
      mobile: req.body.mobile,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      paymentMode: req.body.paymentMode,
      securityAmount: req.body.securityAmount,
      rideSelections: req.body.rideSelections,
    });

    if (!user.tokenNo) {
      const lastUser = await mongoose.model('User').findOne().sort({ createdAt: -1 }).limit(1);
      if (lastUser && lastUser.tokenNo) {
        const lastTokenNo = parseInt(lastUser.tokenNo.slice(1)); 
        user.tokenNo = `T${lastTokenNo + 1}`;  
      } else {
        user.tokenNo = 'T1';
      }
    }
    await user.save();
    res.json({ message: 'Data saved successfully', tokenNo: user.tokenNo });
  } catch (error) {
    res.status(500).json({ message: 'Error saving data', error: error.message });
  }
});

app.get('/getDataByTokenOrMobile', (req, res) => {
  res.set('Cache-Control', 'no-cache');  
  const token = req.query.token;
  const mobile = req.query.mobile;
  const stand = req.query.stand;

  let query = {};
  if (token) query.tokenNo = token;
  if (mobile) query.mobile = mobile;
  if (stand) query.stand = stand;

  User.find(query).lean()
    .then(result => {
      if (result.length > 0) res.json(result);
      else res.status(404).json({ message: 'No data found for the provided criteria.' });
    })
    .catch(err => res.status(500).json({ message: 'Error fetching data', error: err.message }));
});

app.put('/updateData/:tokenNo', async (req, res) => {
  const tokenNo = req.params.tokenNo;  
  const updateData = req.body;         

  try {
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No data provided to update.' });
    }
    const { endTime, finalBill, finalPaymentMode, penalty, comments } = updateData;
    if (!endTime || !finalBill || !finalPaymentMode || !penalty || !comments) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { tokenNo: tokenNo },          
      { $set: updateData },           
      { new: true, runValidators: true } 
    );
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found with the provided tokenNo' });
    }
    res.json({ message: 'Data updated successfully', updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error updating data', error: error.message });
  }
});

app.get('/getAllData', (req, res) => {
  User.find({})
    .then(data => res.json(data))
    .catch(err => res.status(500).json({ message: 'Error fetching data', error: err }));
});

app.delete('/deleteAllUsers', async (req, res) => {
  try {
    const result = await User.deleteMany({});
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No users found to delete' });
    }
    res.json({ message: 'All users deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting users', error: err.message });
  }
});

// ------------------ ✅ NEW CRON JOB ------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function processData() {
  try {
    const data = await User.find();
    if (data.length === 0) {
      console.log("No data to process");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");
    worksheet.columns = [
      { header: "Token No", key: "tokenNo", width: 15 },
      { header: "Name", key: "name", width: 30 },
      { header: "Mobile", key: "mobile", width: 20 },
      { header: "Stand", key: "stand", width: 20 },
      { header: "Action", key: "action", width: 20 },
      { header: "Start Time", key: "startTime", width: 20 },
      { header: "End Time", key: "endTime", width: 20 },
      { header: "Payment Mode", key: "paymentMode", width: 20 },
      { header: "Security Amount", key: "securityAmount", width: 20 },
      { header: "Ride Selections", key: "rideSelections", width: 30 },
      { header: "Created At", key: "createdAt", width: 30 }
    ];

    data.forEach((item) => worksheet.addRow(item.toObject()));

    const filePath = "/tmp/report.xlsx";
    await workbook.xlsx.writeFile(filePath);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "receiver@example.com", // 👈 change this
      subject: "Daily Data Report",
      text: "Attached is the daily report.",
      attachments: [{ filename: "report.xlsx", path: filePath }],
    });

    console.log("Mail sent successfully!");
    fs.unlinkSync(filePath);

    await User.deleteMany({});
    console.log("All user data deleted after mailing.");
  } catch (err) {
    console.error("Error processing data:", err);
  }
}

// ✅ Run every midnight IST
cron.schedule("0 0 * * *", () => {
  console.log("Running scheduled job at midnight IST...");
  processData();
}, {
  timezone: "Asia/Kolkata"
});

// ------------------ Keep app alive ------------------
const keepAppAlive = () => {
  setInterval(() => {
    axios.get(`https://ellotor-prod-6.onrender.com/`)
      .then(response => console.log('Ping successful:', response.status))
      .catch(error => console.error('Ping failed:', error.message));
  }, 300000);  
};
keepAppAlive();

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

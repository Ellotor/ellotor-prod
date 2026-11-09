require('dotenv').config();  // To load variables from a .env file
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const axios = require('axios');  // Import axios to send ping requests
const Admin = require('./models/admin');  // Import the Admin model
const cors = require('cors'); 

const app = express();
const port = process.env.PORT; // Allow port to be set by environment variable
// CORS configuration
const corsOptions = {
  origin: 'https://ellotor-prod-6.onrender.com', // Allow only this frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true,  // Allow credentials (cookies, etc.)
};


// Enable CORS for the API
app.use(cors(corsOptions));
// Serve static files from the 'public' directory
app.use(express.static('public'));

// Middleware to parse JSON
app.use(bodyParser.json());

// MongoDB connection using environment variable
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Check if the admin exists on first run
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
                firstTimeLogin: true // Mark as first-time login
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

// Call checkAdmin() once on server startup
checkAdmin();

// Root route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');  // Serve the index.html file
});

// Route to authenticate admin login
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({ username: 'admin' });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const isPasswordValid = await admin.comparePassword(password);
        console.log('Password match:', isPasswordValid);  // Debugging log
        
        if (isPasswordValid) {
            // Check if this is the first-time login
            if (admin.firstTimeLogin) {
                return res.json({
                    message: 'Access granted',
                    firstTimeLogin: true,  // Indicate that it's the first-time login
                    redirectTo: '/change-password.html'  // Prompt to change password
                });
            } else {
                return res.json({
                    message: 'Access granted',
                    redirectTo: '/admin.html'  // Regular admin page if not first-time login
                });
            }
        } else {
            return res.status(401).json({ message: 'Incorrect password' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Route to change admin password
app.post('/admin/change-password', async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    try {
        // Check if both oldPassword and newPassword are provided
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Both old and new passwords are required' });
        }

        // Find the admin user
        const admin = await Admin.findOne({ username: 'admin' });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Check if the old password matches the stored password
        const isOldPasswordValid = await admin.comparePassword(oldPassword);
        if (!isOldPasswordValid) {
            return res.status(401).json({ message: 'Incorrect old password' });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the admin's password
        admin.password = hashedNewPassword;
        admin.firstTimeLogin = false; // Set firstTimeLogin to false after changing password
        await admin.save();

        // Respond with success
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Import the User model
const User = require('./models/user'); // Importing the updated model for saving user data
const TrainRide = require('./models/trainRide');

// POST endpoint to handle form submissions
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

        // Manually generate tokenNo before saving if it's undefined
        if (!user.tokenNo) {
            const lastUser = await mongoose.model('User').findOne().sort({ createdAt: -1 }).limit(1);
            
            // Check if lastUser is found
            if (lastUser && lastUser.tokenNo) {
                const lastTokenNo = parseInt(lastUser.tokenNo.slice(1)); // Remove the 'T' and get the number
                user.tokenNo = `T${lastTokenNo + 1}`;  // Generate the new token number
            } else {
                // If no users are found, start with token T1
                user.tokenNo = 'T1';
            }
        }

        console.log("Before save, tokenNo:", user.tokenNo);  // Debugging line
        await user.save();
        console.log("After save, tokenNo:", user.tokenNo);  // Debugging line

        res.json({ message: 'Data saved successfully', tokenNo: user.tokenNo });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ message: 'Error saving data', error: error.message });
    }
});

app.get('/getDataByTokenOrMobile', (req, res) => {
    res.set('Cache-Control', 'no-cache');  
    const token = req.query.token;
    const mobile = req.query.mobile;
    const stand = req.query.stand;

    let query = {};

    // Add token to query if provided
    if (token) {
        query.tokenNo = token;
    }

    // Add mobile to query if provided
    if (mobile) {
        query.mobile = mobile;
    }

    // Add stand to query if provided
    if (stand) {
        query.stand = stand;
    }

    console.log('Constructed Query:', query); // Log the query to inspect it

    User.find(query).lean()
        .then(result => {
            if (result.length > 0) {
                res.json(result);  // Return the matching data as JSON
            } else {
                res.status(404).json({ message: 'No data found for the provided criteria.' });
            }
        })
        .catch(err => {
            console.error('Error fetching data:', err);
            res.status(500).json({ message: 'Error fetching data', error: err.message });
        });
});


// Endpoint to update data based on tokenNo
app.put('/updateData/:tokenNo', async (req, res) => {
    const tokenNo = req.params.tokenNo;  // Token number from URL parameter
    const updateData = req.body;         // Data to be updated

    try {
        // Ensure the update data is not empty
        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No data provided to update.' });
        }

        // Validate that the necessary fields are present
        const { endTime, finalBill, finalPaymentMode, penalty, comments } = updateData;

        if (!endTime || !finalBill || !finalPaymentMode || !penalty || !comments) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
		console.log("Updating user with tokenNo:", tokenNo);
        // Find the user by tokenNo and update it with the provided data
        const updatedUser = await User.findOneAndUpdate(
            { tokenNo: tokenNo },          // Find user by tokenNo
            { $set: updateData },           // Set the updated values
            { new: true, runValidators: true } // Return the updated document and run validation
        );
		console.log("Updated user:", updatedUser); 
        // Check if user was found and updated
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found with the provided tokenNo' });
        }

        res.json({ message: 'Data updated successfully', updatedUser });
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ message: 'Error updating data', error: error.message });
    }
});



// Endpoint to get all saved data (for the current page)
app.get('/getAllData', (req, res) => {
    // Fetch all form data
    User.find({})
        .then(data => {
            res.json(data);  // Return the data as JSON
        })
        .catch(err => {
            console.error('Error fetching all data:', err);
            res.status(500).json({ message: 'Error fetching data', error: err });
        });
});

// Endpoint to delete all users
app.delete('/deleteAllUsers', async (req, res) => {
    try {
        // Use the `deleteMany()` method to delete all users
        const result = await User.deleteMany({});

        // Check if any documents were deleted
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'No users found to delete' });
        }

        // Respond with success message
        res.json({ message: 'All users deleted successfully' });
    } catch (err) {
        console.error('Error deleting users:', err);
        res.status(500).json({ message: 'Error deleting users', error: err.message });
    }
});

// Train Ride Routes
app.get('/train/current', async (req, res) => { /* latest */ });
app.get('/train/history', async (req, res) => { /* latest */ });
app.get('/train/search', async (req, res) => { /* latest */ });
app.get('/train/booked', async (req, res) => { /* latest */ });
app.put('/train/startRide', async (req, res) => {
    try {

        const ride = await TrainRide.findOne({ status: 'Open' });

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'No open ride found'
            });
        }

        // Prevent ride start with zero bookings
        if (!ride.bookedSeats || ride.bookedSeats === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot start ride. No seats have been booked yet.'
            });
        }

        ride.status = 'Started';
        ride.startTime = new Date();

        await ride.save();

        res.json({
            success: true,
            message: `Ride ${ride.rideNo} started successfully`,
            startTime: ride.startTime
        });

    } catch (error) {

        console.error('START RIDE ERROR:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/train/currentRide', async (req, res) => {
    try {

		let ride = await TrainRide.findOne({
			status: 'Started'
		});
		
		if (!ride) {
		
			ride = await TrainRide.findOne({
				status: 'Open'
			}).sort({ rideNo: 1 });
		}

        if (!ride) {

            ride = await TrainRide.create({
                rideNo: 1,
                bookedSeats: 0,
                passengers: [],
                status: 'Open'
            });
        }

        res.json(ride);

    } catch (err) {

        console.error('CURRENT RIDE ERROR:', err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

app.get('/train/nextRide', async (req, res) => {
    try {
        // Find the current active ride
        let currentRide = await TrainRide.findOne({
            status: 'Started'
        });

        if (!currentRide) {
            currentRide = await TrainRide.findOne({
                status: 'Open'
            }).sort({ rideNo: 1 });
        }

        if (!currentRide) {
            currentRide = await TrainRide.create({
                rideNo: 1,
                bookedSeats: 0,
                passengers: [],
                status: 'Open'
            });
        }

        // Find the next ride
        let nextRide = await TrainRide.findOne({
            rideNo: currentRide.rideNo + 1
        });

        // If it doesn't exist, return its expected initial details
        if (!nextRide) {
            return res.json({
                _id: null,
                rideNo: currentRide.rideNo + 1,
                status: 'Open',
                bookedSeats: 0
            });
        }

        res.json(nextRide);

    } catch (err) {
        console.error('NEXT RIDE ERROR:', err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

app.post('/train/bookPassenger', async (req, res) => {
    try {

        const {
            rideId,
            passengerName,
            mobile,
            tickets,
            rideType
        } = req.body;

        if (!passengerName || !mobile || !tickets) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const ticketCount = Number(tickets);
        const amount = ticketCount * 100;

        // CURRENT OPEN/STARTED RIDE
		let currentRide = await TrainRide.findOne({
			status: 'Started'
		});
		
		if (!currentRide) {
		
			currentRide = await TrainRide.findOne({
				status: 'Open'
			}).sort({ rideNo: 1 });
		}

        if (!currentRide) {
            return res.status(404).json({
                success: false,
                message: 'No active ride found'
            });
        }

        // NEXT RIDE BOOKING
        if (rideType === 'next') {

            let nextRide = await TrainRide.findOne({
                rideNo: currentRide.rideNo + 1
            });

            if (!nextRide) {

                nextRide = await TrainRide.create({
                    rideNo: currentRide.rideNo + 1,
                    bookedSeats: 0,
                    passengers: [],
                    status: 'Open',
                    startTime: null,
                    endTime: null
                });
            }

            nextRide.passengers.push({
                passengerName,
                mobile,
                tickets: ticketCount,
                amount
            });

            nextRide.bookedSeats += ticketCount;

            await nextRide.save();

            return res.json({
                success: true,
                rideNo: nextRide.rideNo,
                totalBookedSeats: nextRide.bookedSeats,
                message: `${ticketCount} seat(s) booked for Ride ${nextRide.rideNo}`
            });
        }

        // CURRENT RIDE BOOKING
        currentRide.passengers.push({
            passengerName,
            mobile,
            tickets: ticketCount,
            amount
        });

        currentRide.bookedSeats += ticketCount;

        await currentRide.save();

        return res.json({
            success: true,
            rideNo: currentRide.rideNo,
            totalBookedSeats: currentRide.bookedSeats,
            message: `${ticketCount} seat(s) booked successfully`
        });

    } catch (error) {

        console.error('BOOK PASSENGER ERROR:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
app.put('/train/endRide', async (req, res) => {
    try {

        const currentRide = await TrainRide.findOne({
            status: 'Started'
        });

        if (!currentRide) {
            return res.status(404).json({
                success: false,
                message: 'No started ride found'
            });
        }

        currentRide.status = 'Completed';
        currentRide.endTime = new Date();

        await currentRide.save();

        let nextRide = await TrainRide.findOne({
            rideNo: currentRide.rideNo + 1
        });

        if (!nextRide) {

            nextRide = await TrainRide.create({
                rideNo: currentRide.rideNo + 1,
                bookedSeats: 0,
                passengers: [],
                status: 'Open',
                startTime: null,
                endTime: null
            });
        } else {

            nextRide.status = 'Open';
            await nextRide.save();
        }

        res.json({
            success: true,
            message: `Ride ${currentRide.rideNo} ended successfully. Ride ${nextRide.rideNo} is now available.`
        });

    } catch (error) {

        console.error('END RIDE ERROR:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all rides for Admin page
app.get('/train/allRides', async (req, res) => {
    try {
        const rides = await TrainRide.find({})
            .sort({ rideNo: 1 })
            .lean();

        res.json(rides);

    } catch (error) {
        console.error('ERROR FETCHING ALL RIDES:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Delete all ride records
app.delete('/train/deleteAllRides', async (req, res) => {
    try {
        const result = await TrainRide.deleteMany({});

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: 'No ride records found to delete'
            });
        }

        res.json({
            message: 'All ride records deleted successfully',
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('ERROR DELETING RIDES:', error);

        res.status(500).json({
            message: 'Error deleting rides',
            error: error.message
        });
    }
});

// Function to keep the app alive
const keepAppAlive = () => {
  setInterval(() => {
    axios.get(`https://ellotor-prod-6.onrender.com/`)
      .then(response => {
        console.log('Ping successful:', response.status);
      })
      .catch(error => {
        console.error('Ping failed:', error.message);
      });
  }, 300000);  // 5 minutes (in milliseconds)
};

// Start keeping the app alive when the server starts
keepAppAlive();

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

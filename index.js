
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require('fs');
const { type } = require("os");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

app.use(express.json());
app.use(cors());

// Database connection with MongoDB
const port = process.env.PORT || 4000;
mongoose.connect(process.env.MONGO_URI);


// API creation
app.get("/", (req, res) => {
    res.send("express app is running");
});

// Check if the upload directory exists, if not, create it
const imageUploadPath = './upload/images';
if (!fs.existsSync(imageUploadPath)) {
    fs.mkdirSync(imageUploadPath, { recursive: true });
}

// IMG STORAGE ENGINE
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imageUploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// Creating static folder for images
app.use('/images', express.static('upload/images'));

// Creating upload endpoint for images
app.post("/upload", upload.single('product'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: 0, message: 'No file uploaded' });
    }
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    });
});

//Schema for creating products

const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    },
    reviews: [
        {
            username: String,
            review: String,
            date: { type: Date, default: Date.now }
        }
    ]
});





app.post('/addproduct',async (req,res)=>{
    let products = await Product.find({});
    let id;
    if (products.length>0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id =last_product.id+1;
    }else{
        id=1;
    }
    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        price:req.body.price,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    
    res.json({
        success:true,
        name:req.body.name,
    })
    
})

//CREATING API FOR DELETING PRODUCTS

app.post('/removeproduct',async (req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name,
    })
    
})

//CREATING API FOR getting all productts

app.get('/allproducts',async(req,res)=>{
    let products = await Product.find({});
    console.log("All products fetched");
    res.send(products);
})

//SCHEMA CREATING FOR USER MODEL

const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        match: /.+\@.+\..+/ // Simple regex for email format
    },
    password: {
        type: String,
        required: true,
    },
    cartData: {
        type: Object,
        default: {}
    },
    date: {
        type: Date,
        default: Date.now,
    }
});
// Complaint Schema
const ComplaintSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    complaint: {
        type: String,
        required: true,
    },
    submittedAt: {
        type: Date,
        required: true,
    },
    email: {
        type: String,
        required: true, // Ensure this is set to true
    },
});

const Complaint = mongoose.model('Complaint', ComplaintSchema);




// Pre-save hook to hash the password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = function(password) {
    return bcrypt.compare(password, this.password);
};

const Users = mongoose.model('Users', userSchema);
module.exports = Users;



// Creating Endpoint for registering the user

app.post('/signup',async(req,res)=>{


    let check = await Users.findOne({email:req.body.email});
    if (check) {
        return res.status(400).json({success:false,errors:"existing user found with same email address"});
    }

    let cart = {};
    for (let i = 0; i < 300; i++) {
      cart[i]=0;
        
    }
    const user = new  Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })

    await user.save();


    const data  = {
        user:{
            id:user.id
        }
    }


    const token = jwt.sign(data,'secret_ecom');
    res.json({success:true,token})
})
//Creating endpoint for user login
app.post('/login', async (req, res) => {
    let user = await Users.findOne({ email: req.body.email });
    if (user) {
        // Use the comparePassword method to check the password
        const isMatch = await user.comparePassword(req.body.password); 
        if (isMatch) {
            const data = {
                user: {
                    id: user.id
                }
            };
            const token = jwt.sign(data, 'secret_ecom');
            res.json({ success: true, token });
        } else {
            res.json({ success: false, errors: "Wrong Password" });
        }
    } else {
        res.json({ success: false, errors: "Wrong Email Id Or User Not Registered (Sign Up)" });
    }
});

// Creating endpoint for newcollections and popular items

app.get('/popular',async (req,res)=>{

    let products = await Product.find({category:"sweets"});
    let popular  = products.slice(0,4);
    console.log("Popular in Ladoos fetched");
    res.send(popular);
    
})
///middleware
const fetchUser = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).send({ error: "Please authenticate using a valid token" });
    }

    try {
        const secretKey = process.env.JWT_SECRET || 'secret_ecom'; // Use environment variable
        const data = jwt.verify(token, secretKey);
        const user = await Users.findById(data.user.id).select('email name');  // Fetch the user's email and name

        if (!user) {
            return res.status(404).send({ error: "User not found" });
        }

        req.user = user; // Attach the user object to the request
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).send({ error: "Invalid token. Please authenticate." });
    }
};



//creating API to addreviews
// Update your add review API to handle rating
app.post('/addreview', fetchUser, async (req, res) => {
    try {
        const { productId, review, rating } = req.body; // Get the rating from the request
        const user = await Users.findOne({ _id: req.user.id });
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Find the product and add the review
        const product = await Product.findOne({ id: productId });
        if (product) {
            product.reviews.push({
                username: user.name,
                review: review,
                rating: rating // Store the rating
            });
            await product.save();
            res.json({ success: true, message: 'Review added' });
        } else {
            res.status(404).json({ success: false, message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});


//creating api to fetch review 
app.get('/reviews/:productId', async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.productId });
        if (product) {
            res.json({ success: true, reviews: product.reviews });
        } else {
            res.status(404).json({ success: false, message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});





//creating endpoint for adding products in cartdata
app.post('/addtocart', fetchUser, async (req, res) => {
    try {
        console.log('User ID from token:', req.user.id); // Debugging: Check what user ID is being used

        // Use _id if id is not the correct field in your Users schema
        let userData = await Users.findOne({ _id: req.user.id });
        
        if (!userData) {
            return res.status(404).send({ error: "User not found" });
        }

        console.log('User data found:', userData); // Debugging: Check if user data is found

        // Initialize cartData if it doesn't exist
        if (!userData.cartData) {
            userData.cartData = {};
        }

        // Initialize cartData for the item if it doesn't exist
        if (!userData.cartData[req.body.itemId]) {
            userData.cartData[req.body.itemId] = 0;
        }

        // Increment the cartData for the item
        userData.cartData[req.body.itemId] += 1;

        // Save the updated user data
        await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });

        res.send("Added");
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});


//creating endpoint for removing products from cartData
app.post('/removefromcart', fetchUser, async (req, res) => {
    try {
        console.log('User ID from token:', req.user.id); // Debugging: Check what user ID is being used

        // Use _id if id is not the correct field in your Users schema
        let userData = await Users.findOne({ _id: req.user.id });
        
        if (!userData) {
            return res.status(404).send({ error: "User not found" });
        }

        console.log('User data found:', userData); // Debugging: Check if user data is found

        // Check if cartData and the item exist
        if (userData.cartData && userData.cartData[req.body.itemId]) {
            // Decrement the cartData for the item
            userData.cartData[req.body.itemId] -= 1;

            // If the quantity is 0 or less, remove the item from cartData
            if (userData.cartData[req.body.itemId] <= 0) {
                delete userData.cartData[req.body.itemId];
            }

            // Save the updated user data
            await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });

            res.send("Removed");
        } else {
            // Item does not exist in cart
            return res.status(400).send({ error: "Item not found in cart" });
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});
app.get('/cart', fetchUser, async (req, res) => {
    try {
        let userData = await Users.findOne({ _id: req.user.id });
        if (!userData) {
            return res.status(404).send({ error: "User not found" });
        }
        res.send({ success: true, cartData: userData.cartData });
    } catch (error) {
        console.error('Error fetching cart data:', error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

// Assuming you are using Express and MongoDB (or any other database)



// Complaints Endpoint
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

// Middleware to parse JSON body
app.use(bodyParser.json());

// Create a transporter for Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
        user: 'rawooldipesh0@gmail.com', // Your email address
        pass: 'hkhi zcgj uaiy pytl', // Your email password or app password
    },
});

// POST endpoint to handle complaints
// POST endpoint to handle complaints
app.post('/complaints', fetchUser, async (req, res) => {
    const { complaint, submittedAt } = req.body;

    try {
        // Fetch the user's details using the user ID from the token
        const user = await Users.findById(req.user.id).select('email name'); // Select only email and name

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Create a new complaint document
        const newComplaint = new Complaint({
            username: user.name,
            complaint,
            submittedAt,
            email: user.email, // Include the user's email

        });

        // Save the complaint to the database
        await newComplaint.save();

        // Prepare the email options
        const mailOptions = {
            from: 'dipeshrawool4@gmail.com',
            to: user.email, // Use the user's email fetched from the database
            subject: 'Complaint Received',
            text: `Hello ${user.name},\n\nThank you for your complaint submitted on ${submittedAt}.\n\nYour complaint: ${complaint}\n\nWe will get back to you soon.\n\nBest regards,\nBhakti Snacks`,
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        // Log the complaint data
        console.log('Complaint Data:', {
            username: user.name, 
            complaint,
            submittedAt,
            email: user.email,
        });

        res.status(200).json({ success: true, message: 'Complaint submitted successfully and email sent' });
    } catch (error) {
        console.error('Error handling complaint:', error);
        res.status(500).json({ success: false, message: 'Error handling complaint' });
    }
});
app.post('/payment-success', fetchUser, async (req, res) => {
    const { razorpayPaymentId, products, orderId, userDetails } = req.body;

    try {
        // Find the user by the token's user ID
        const user = await Users.findById(req.user.id).select('email name');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Create the email message
        const productDetails = products.map(product => `${product.name}: ${product.quantity} @ ₹${product.price}`).join('\n');
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: user.email, // User's email from the database
            subject: 'Order Confirmation',
            text: `Hello ${user.name},\n\nYour order has been successfully placed!\n\nOrder ID: ${orderId}\nPayment ID: ${razorpayPaymentId}\n\nProducts:\n${productDetails}\n\nTotal Amount: ₹${products.reduce((sum, product) => sum + (product.price * product.quantity), 0)}\n\nWe will reach out to you via WhatsApp for delivery updates. Feel free to contact us if you have any queries.\n\nThank you for shopping with us!\n\nBest regards,\nBhakti Snacks`,
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        // Return success response
        res.status(200).json({ success: true, message: 'Payment confirmed, email sent successfully.' });
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
        res.status(500).json({ success: false, message: 'Error handling payment success.' });
    }
});




const Order = mongoose.model('Order', {
    orderId: String,
    userDetails: {
        name: String,
        email: String,
        address: String,
        phone: String,
        city: String,
        state: String,
        postalCode: String
    },
    products: [{
        productId: String,    
        name: String,         
        price: Number,        
        quantity: Number      
    }],
    amount: Number,
    date: {
        type: Date,
        default: Date.now,
    }
});






const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: 'rzp_test_sPVTX7JY4cH2fC', // Replace with your Razorpay Key ID
  key_secret: '0RJ2YDNWmU00bjTY7tFHfVrp', // Replace with your Razorpay Secret Key
});

app.post('/create-order', async (req, res) => {
    const { amount, userDetails, products } = req.body; // Accept products from the request

    const options = {
        amount: amount * 100, // Razorpay expects the amount in paise (so multiply by 100)
        currency: "INR",
    };

    try {
        const order = await razorpay.orders.create(options);

        // Save the order details in the database
        const newOrder = new Order({
            orderId: order.id,
            userDetails,
            products, // Save product details (array of products with id, name, price, and quantity)
            amount: amount,
        });

        await newOrder.save();

        res.json({ order });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).send({ error: 'Error creating order' });
    }
});


app.get('/myorders', fetchUser, async (req, res) => {
    try {
        console.log('Fetching orders for user:', req.user.email);  // Log user email

        // Fetch orders for the authenticated user using their email
        const orders = await Order.find({ 'userDetails.email': req.user.email });
        
        if (!orders || orders.length === 0) {
            console.log('No orders found for user:', req.user.email);
            return res.status(404).json({ success: false, message: "No orders found" });
        }

        console.log('Orders fetched successfully:', orders);  // Log fetched orders
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching user orders:', error);  // Log error
        res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
});


app.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find();  // Fetch all orders from the database
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
});




app.get('/getuser', fetchUser, async (req, res) => {
    try {
        const user = await Users.findById(req.user.id).select('-password');
        res.json({ success: true, user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).send({ success: false, error: 'Internal Server Error' });
    }
});



app.listen(port, (error) => {
    if (!error) {
        console.log("server running on port:" + port);
    } else {
        console.log("error:" + error);
    }
});

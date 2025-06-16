
# 🍫 Healthy Snacks Website - Backend

This is the backend server built using **Node.js**, **Express.js**, and **MongoDB** for managing product data, file uploads, and order placement.

## 🌐 Live API
🔗 [Backend Render API](https://healthy-snacks-website-backend.onrender.com)

## 🧰 Tech Stack
- Node.js
- Express.js
- MongoDB + Mongoose
- Multer (for image uploads)
- Nodemailer (for email notifications)

## 📦 API Endpoints
| Method | Route             | Description                      |
|--------|------------------|----------------------------------|
| POST   | `/upload`         | Upload product image             |
| POST   | `/addproduct`     | Add new product (Admin only)     |
| POST   | `/removeproduct`  | Delete a product                 |
| GET    | `/allproducts`    | Get all products                 |
| GET    | `/popular`        | Get 4 popular products (sweets)  |
| POST   | `/placeorder`     | Place an order                   |
| GET    | `/orders`         | View all orders (Admin)          |

## ⚙️ Environment Variables

On Render, environment variables (like the MongoDB URI) are set via the dashboard.

For local development, create a `.env` file:
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/snacks

> Ensure your MongoDB Atlas instance is running and accessible.

## 📁 Directory Structure

backend/
│
├── node_modules/            # Backend project dependencies
├── upload/                  # Directory for storing uploaded files
│
├── .env                     # Environment variables (e.g., database URL, API keys)
├── .gitignore               # Files/folders to be ignored by Git
├── index.js                 # Entry point for the backend server (e.g., Express app)
├── package.json             # Backend dependencies and scripts
├── package-lock.json        # Lock file for dependencies
└── Readme.md                # Backend documentation


## 🧪 Running Locally

### 1. Clone the repository

git clone https://github.com/your-username/healthy-snacks-website-backend.git
cd healthy-snacks-website-backend

2. Install dependencies
npm install

3. Set up .env
Create a .env file and add:
MONGODB_URL=your_mongodb_connection_string

4. Run the server
node index.js
The server will start on http://localhost:4000

📄 License
MIT License.
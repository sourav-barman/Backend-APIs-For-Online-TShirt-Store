require("dotenv").config();
const app = require("./app");
const connectWithDb = require("./config/db");
const cloudinary = require("cloudinary");

//connect with Database
connectWithDb();

//cloudinary config goes here
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });


app.listen(process.env.PORT, () => {
    console.log(`Server is running at port: ${process.env.PORT}`);
});
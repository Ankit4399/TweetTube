import dotenv from 'dotenv'
import connectToDB from './db/dbConnect.js'
import app from './app.js'

dotenv.config() // load .env from project root (or set path: './.env' if needed)

connectToDB()
.then(() => {
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
        console.log(`\n✅ Server is running on port ${port}`);
        console.log(`📍 API Base URL: http://localhost:${port}/api/v1\n`);
    })
})
.catch((error) => {
    console.log("❌ PostgreSQL connection failed!!!: ", error);
    console.log("\n💡 Make sure:");
    console.log("   1. PostgreSQL is running");
    console.log("   2. .env file exists with correct database credentials");
    console.log("   3. Database 'tweettube' exists\n");
    process.exit(1);
})
















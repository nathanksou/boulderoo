import { MongoClient } from "mongodb";
import "./config.js";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbname = "bank";

const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log(`Connected to the ${dbname} database`);
  } catch (err) {
    console.error(`Error connecting to the database: ${err}`);
  } finally {
    await client.close();
  }
};

connectToDatabase();

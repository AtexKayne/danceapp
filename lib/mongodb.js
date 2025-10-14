import { MongoClient } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";

// ... existing connection setup ...

// After creating the MongoClient, attach it to Vercel's pool manager
if (process.env.NODE_ENV === "development") {
    if (!globalWithMongo._mongoClient) {
        globalWithMongo._mongoClient = new MongoClient(uri, options);
    }
    client = globalWithMongo._mongoClient;
} else {
    client = new MongoClient(uri, options);
    attachDatabasePool(client);
}
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import SiteLog from './src/models/SiteLog.js';

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const logs = await SiteLog.find({});
    
    // Group by project + date (YYYY-MM-DD)
    const grouped = {};
    for (const log of logs) {
      const dateKey = log.date.toISOString().split('T')[0];
      const key = `${log.project.toString()}_${dateKey}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(log);
    }

    for (const key in grouped) {
      const group = grouped[key];
      if (group.length > 1) {
        console.log(`Found ${group.length} duplicate logs for ${key}. Merging...`);
        // Sort by creation time (ascending)
        group.sort((a, b) => a.createdAt - b.createdAt);
        
        const primary = group[0];
        
        for (let i = 1; i < group.length; i++) {
          const duplicate = group[i];
          
          // Merge activities
          const timeStr = duplicate.createdAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
          primary.activities = primary.activities + `\n\n--- Update (${timeStr}) ---\n` + duplicate.activities;
          
          // Merge labour
          if (duplicate.labour && duplicate.labour.length > 0) {
            duplicate.labour.forEach(newL => {
              const existing = primary.labour.find(l => l.trade === newL.trade);
              if (existing) {
                existing.present += newL.present;
              } else {
                primary.labour.push(newL);
              }
            });
          }
          
          // Merge materials & photos
          if (duplicate.materials && duplicate.materials.length > 0) primary.materials.push(...duplicate.materials);
          if (duplicate.photos && duplicate.photos.length > 0) primary.photos.push(...duplicate.photos);
          
          // Delete the duplicate
          await SiteLog.deleteOne({ _id: duplicate._id });
          console.log(`Deleted duplicate ${duplicate._id}`);
        }
        
        await primary.save();
        console.log(`Successfully saved merged primary log ${primary._id}`);
      }
    }
    
    // Ensure index is created
    console.log("Dropping old index...");
    try {
      await mongoose.connection.collection('sitelogs').dropIndex('project_1_date_1');
    } catch(e) {}
    
    console.log("Creating unique index...");
    await mongoose.connection.collection('sitelogs').createIndex({ project: 1, date: 1 }, { unique: true });
    console.log("Index created successfully.");

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();

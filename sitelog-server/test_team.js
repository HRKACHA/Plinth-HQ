import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import Project from './src/models/Project.js';
import InviteToken from './src/models/InviteToken.js';

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sitelog').then(async () => {
  try {
    const orgId = "667083049b1e8a001a1f0a20"; // Need to fetch an org ID or just test for first user
    const firstUser = await User.findOne();
    if (!firstUser) {
        console.log("No users found");
        process.exit(0);
    }
    const org = firstUser.organisation;
    
    // test listMembers
    console.log("Testing listMembers for org:", org);
    const members = await User.find({ organisation: org }).lean();
    const projects = await Project.find({ organisation: org, isDeleted: false });
    
    console.log(`Found ${members.length} members and ${projects.length} projects`);
    
    const membersWithProjects = members.map(m => {
      const project = projects.find(p => p.team && p.team.some(t => t && t.user && t.user.toString() === m._id.toString()));
      return {
        ...m,
        projectId: project ? project._id : null,
        projectName: project ? project.name : null
      };
    });
    console.log("Success listMembers!");
    
    // test listInvites
    console.log("Testing listInvites...");
    const invites = await InviteToken.find({ organisation: org }).populate('invitedBy', 'name email').lean();
    console.log("Success listInvites!", invites.length);
    
    // test listProjects (just the query)
    console.log("Testing listProjects...");
    const projQuery = await Project.find({ organisation: org, isDeleted: false });
    console.log("Success listProjects!", projQuery.length);

  } catch (err) {
    console.error("ERROR CAUGHT:", err);
  } finally {
    mongoose.disconnect();
  }
});

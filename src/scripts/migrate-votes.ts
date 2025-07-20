import mongoose from 'mongoose';
import Argument from '../models/Argument';

export async function migrateVotesToUpvoteDownvote() {
  try {
    console.log('Starting migration: converting votes to upvotes/downvotes...');
    
    const argumentsToMigrate = await Argument.find({
      $or: [
        { upvotes: { $exists: false } },
        { downvotes: { $exists: false } }
      ]
    });

    console.log(`Found ${argumentsToMigrate.length} arguments to migrate`);

    for (const argument of argumentsToMigrate) {
      const oldVotes = (argument as any).votes || 0;
      
      await Argument.updateOne(
        { _id: argument._id },
        {
          $set: {
            upvotes: Math.max(0, oldVotes), 
            downvotes: 0,
            upvotedBy: (argument as any).votedBy || [],
            downvotedBy: []
          },
          $unset: {
            votes: 1,
            votedBy: 1
          }
        }
      );
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  require('dotenv').config();
  
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  mongoose.connect(mongoUri)
    .then(() => {
      console.log('Connected to MongoDB');
      return migrateVotesToUpvoteDownvote();
    })
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

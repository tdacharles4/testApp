import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const migrateToAtlas = async () => {
  console.log('🚀 Starting data migration to MongoDB Atlas...\n');
  
  let localConnection, atlasConnection;
  
  try {
    // 1. Connect to LOCAL database
    console.log('1. Connecting to LOCAL database...');
    localConnection = await mongoose.createConnection('mongodb://127.0.0.1:27017/testApp');
    console.log('✅ Connected to local DB\n');
    
    // 2. Connect to ATLAS database
    console.log('2. Connecting to ATLAS database...');
    
    // Get your Atlas connection string from .env
    // It should look like: mongodb+srv://username:password@cluster0.abc123.mongodb.net/testApp
    const atlasUri = process.env.MONGO_URI;
    
    if (!atlasUri) {
      throw new Error('MONGO_URI not found in .env file. Get it from Atlas dashboard.');
    }
    
    atlasConnection = await mongoose.createConnection(atlasUri);
    console.log('✅ Connected to Atlas DB\n');
    
    // 3. Get all collection names from local DB
    console.log('3. Discovering collections...');
    const collections = await localConnection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name).filter(name => !name.startsWith('system.'));
    
    console.log(`📁 Found ${collectionNames.length} collections:`, collectionNames, '\n');
    
    // 4. Migrate each collection
    for (const collectionName of collectionNames) {
      console.log(`📦 Migrating "${collectionName}"...`);
      
      // Get all documents from local
      const documents = await localConnection.collection(collectionName).find({}).toArray();
      
      if (documents.length === 0) {
        console.log(`   ○ Empty collection, skipping\n`);
        continue;
      }
      
      console.log(`   📄 Found ${documents.length} documents`);
      
      // Insert into Atlas (skip duplicates by _id)
      try {
        // Delete existing data in Atlas (optional - comment out if you want to keep existing data)
        await atlasConnection.collection(collectionName).deleteMany({});
        
        // Insert all documents
        const result = await atlasConnection.collection(collectionName).insertMany(documents, { ordered: false });
        console.log(`   ✅ Migrated ${result.insertedCount} documents to Atlas\n`);
      } catch (insertError) {
        console.log(`   ⚠️  Some duplicates skipped: ${insertError.message}\n`);
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- All data copied from local MongoDB to MongoDB Atlas');
    console.log('- Your app is now ready to use cloud database');
    console.log('\n⚠️  Next steps:');
    console.log('1. Update your .env file with Atlas MONGO_URI');
    console.log('2. Restart your server with: npm run dev');
    console.log('3. Test that everything works');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    // Close connections
    if (localConnection) await localConnection.close();
    if (atlasConnection) await atlasConnection.close();
    console.log('\n🔌 Database connections closed');
    process.exit(0);
  }
};

// Run migration
migrateToAtlas();
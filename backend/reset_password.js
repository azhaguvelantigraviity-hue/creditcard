const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const resetPassword = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sbi_sales';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB:', uri);

        // Define a simple User schema just for this script
        const userSchema = new mongoose.Schema({ name: String, email: String, password: String, role: String }, { strict: false });
        const User = mongoose.model('User', userSchema);

        // List all users first
        const users = await User.find({}, 'name email role');
        console.log('\n=== All Users ===');
        users.forEach(u => console.log(`  Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`));

        // Reset the admin password
        const targetEmail = 'azhaguvel.antigraviity@gmail.com';
        const newPassword = 'Admin@1234';

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);

        const result = await User.updateOne({ email: targetEmail }, { $set: { password: hashed } });

        if (result.matchedCount === 0) {
            console.log(`\nNo user found with email: ${targetEmail}`);
            console.log('Please check the email list above and update the targetEmail in this script.');
        } else {
            console.log(`\n✅ Password reset successfully!`);
            console.log(`   Email:    ${targetEmail}`);
            console.log(`   Password: ${newPassword}`);
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

resetPassword();

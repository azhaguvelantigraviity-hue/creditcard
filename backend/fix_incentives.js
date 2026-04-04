const mongoose = require('mongoose');
const Sale = require('./models/Sale');
const Incentive = require('./models/Incentive');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const fixIncentives = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sbi_sales';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB:', uri);

        const approvedSales = await Sale.find({ status: 'Approved' });
        console.log(`Found ${approvedSales.length} approved sales.`);

        let createdCount = 0;
        let updatedCount = 0;

        for (const sale of approvedSales) {
            const existingIncentive = await Incentive.findOne({ saleId: sale._id });
            
            if (!existingIncentive) {
                // Create new incentive for sale that was previously ignored (below target)
                await Incentive.create({
                    saleId: sale._id,
                    sellerId: sale.sellerId,
                    amount: 200,
                    status: 'Credited',
                    payoutDate: sale.date || new Date()
                });
                createdCount++;
            } else if (existingIncentive.amount !== 200) {
                // Ensure amount is correctly set to 200
                existingIncentive.amount = 200;
                await existingIncentive.save();
                updatedCount++;
            }
        }

        console.log(`Migration completed. Created: ${createdCount}, Updated: ${updatedCount}.`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

fixIncentives();

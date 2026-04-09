const Lead = require('../models/Lead');

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Private
const createLead = async (req, res) => {
    const { name, phoneNumber, email, status, assignedTo, notes, cardType } = req.body;

    try {
        const lead = await Lead.create({
            name,
            phoneNumber,
            email,
            status,
            assignedTo,
            notes: notes ? [{ text: notes }] : [],
            cardType
        });

        res.status(201).json(lead);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all leads (Admin: all, Seller: assigned)
// @route   GET /api/leads
// @access  Private
const getLeads = async (req, res) => {
    try {
        const matchQuery = req.user.role === 'admin' ? {} : { assignedTo: req.user._id };
        
        const leads = await Lead.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'calllogs',
                    localField: '_id',
                    foreignField: 'leadId',
                    as: 'calls'
                }
            },
            {
                $addFields: {
                    lastCall: { $arrayElemAt: [{ $slice: ['$calls', -1] }, 0] }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'lastCall.sellerId',
                    foreignField: '_id',
                    as: 'lastCallSeller'
                }
            },
            {
                $addFields: {
                    'lastCall.sellerName': { $arrayElemAt: ['$lastCallSeller.name', 0] }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'assignedTo',
                    foreignField: '_id',
                    as: 'assignedToUser'
                }
            },
            {
                $addFields: {
                    assignedTo: { $arrayElemAt: ['$assignedToUser', 0] }
                }
            },
            { $project: { calls: 0, lastCallSeller: 0, assignedToUser: 0 } }
        ]);

        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update lead status
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);

        if (lead) {
            lead.status = req.body.status || lead.status;
            if (req.body.note) {
                lead.notes.push({ text: req.body.note });
            }
            
            const updatedLead = await lead.save();
            res.json(updatedLead);
        } else {
            res.status(404).json({ message: 'Lead not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createLead,
    getLeads,
    updateLead
};

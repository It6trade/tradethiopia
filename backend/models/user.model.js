const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    points: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
    },
    username: {
        type: String,
        required: true, // Required
        index: true, // Add index for faster queries
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'HR', 'hr', 'Enisra', 'sales', 'salesmanager', 'tradextv', 'customerservice', 'SocialmediaManager', 'socialmedia', 'Socialmedia', 'CustomerSuccessManager', 'TETV', 'IT', 'ITAdmin', 'ITManager', 'ITTeamLeader', 'ITLeader', 'ITStaff', 'ITOfficer', 'IT Team Leader', 'IT Staff', 'IT Manager', 'itadmin', 'itmanager', 'itteamleader', 'itleader', 'itstaff', 'itofficer', 'supervisor', 'Instructor', 'EventManager', 'COO', 'coo', 'COO2', 'coo2', 'COO 2', 'coo_2', '2coo', 'CEO', 'ceo', 'TradeXTV', 'finance', 'reception', 'TessbinAdmin', 'tessbinadmin', 'Tessbin', 'tessbin', 'Tessbin Admin', 'employee'],
        default: 'sales',
        index: true, // Add index for faster queries
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive',
        index: true, // Add index for faster queries
    },
    fullName: {
        type: String,
        required: false, // Optional
    },
    altEmail: {
        type: String,
        default: '',
    },
    altPhone: {
        type: String,
        default: '',
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        default: 'male',
    },
    employmentType: {
        type: String,
        enum: ['full-time', 'part-time', 'remote', 'contract', 'intern'],
        required: false, // Optional
    },

    department: {
        type: String,
        default: '',
    },
    jobTitle: {
        type: String,
        required: false, // Optional
    },
    salary: {
        type: Number,
        required: false,
        default: 0,
    },

    education: {
        type: String,
        required: false, // Optional
    },
    location: {
        type: String,
        required: false, // Optional
    },
    phone: {
        type: String,
        required: false, // Optional
    },
    additionalLanguages: {
        type: String,
        default: '',
    },
    notes: {
        type: String,
        default: '',
    },
    bio: {
        type: String,
        default: '',
    },
    website: {
        type: String,
        default: '',
    },
    twitter: {
        type: String,
        default: '',
    },
    linkedin: {
        type: String,
        default: '',
    },
    facebook: {
        type: String,
        default: '',
    },
    telegram: {
        type: String,
        default: '',
    },
    digitalId: {
        type: String, // Assuming this is a string identifier
        required: false, // Optional
    },
    punchId: {
        type: String,
        trim: true,
        default: undefined,
    },
    punchEmployeeName: {
        type: String,
        trim: true,
        default: undefined,
    },
    photo: {
        type: mongoose.Schema.Types.Mixed, // Supports various types (e.g., URL, file path)
        required: false, // Optional
    },
    infoStatus: {
        type: String,
        default: 'pending',
        required: false, // Optional
    },
    trainingStatus: {
        type: String,
        required: false, // Optional: 'off', 'completed', 'on'
    },
    examStatus: {
        type: String,
        default: 'off',
        required: false, // Optional: 'off', 'completed', 'on'
    },
    examBypass: {
        type: Boolean,
        default: false,
    },
    hireDate: {
        type: Date,
        required: false, // Optional
    },
    guarantorFile: {
        type: mongoose.Schema.Types.Mixed, // Supports various types (e.g., URL, file path)
        required: false, // Optional
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
    personalInformation: {
        dateOfBirth: { type: Date, default: null },
        nationality: { type: String, trim: true, default: '' },
        maritalStatus: {
            type: String,
            enum: ['', 'single', 'married', 'divorced', 'widowed'],
            default: '',
        },
        nationalIdOrPassport: { type: String, trim: true, default: '' },
        placeOfBirth: {
            city: { type: String, trim: true, default: '' },
            region: { type: String, trim: true, default: '' },
            kebele: { type: String, trim: true, default: '' },
        },
        presentAddress: {
            region: { type: String, trim: true, default: '' },
            cityOrTown: { type: String, trim: true, default: '' },
            subCityOrWoreda: { type: String, trim: true, default: '' },
            kebele: { type: String, trim: true, default: '' },
            houseNumber: { type: String, trim: true, default: '' },
        },
        tinNumber: { type: String, trim: true, default: '' },
        salaryBankAccountNumber: { type: String, trim: true, default: '' },
        educationRecords: [{
            level: { type: String, trim: true, default: '' },
            institution: { type: String, trim: true, default: '' },
            fieldOfStudy: { type: String, trim: true, default: '' },
            graduationYear: { type: String, trim: true, default: '' },
        }],
        emergencyContact: {
            fullName: { type: String, trim: true, default: '' },
            relationship: { type: String, trim: true, default: '' },
            phone: { type: String, trim: true, default: '' },
            alternativePhone: { type: String, trim: true, default: '' },
            address: { type: String, trim: true, default: '' },
        },
        documentChecklist: {
            nationalId: { type: Boolean, default: false },
            cv: { type: Boolean, default: false },
            medicalCertificate: { type: Boolean, default: false },
            employmentContract: { type: Boolean, default: false },
            educationalCredentials: { type: Boolean, default: false },
            passportPhoto: { type: Boolean, default: false },
            policeClearance: { type: Boolean, default: false },
            bankAccountDetails: { type: Boolean, default: false },
        },
        declarationAccepted: { type: Boolean, default: false },
        status: {
            type: String,
            enum: ['draft', 'submitted', 'approved', 'returned'],
            default: 'draft',
            index: true,
        },
        submittedAt: { type: Date, default: null },
        hrDecision: {
            decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
            reviewerName: { type: String, trim: true, default: '' },
            reviewerEmail: { type: String, trim: true, lowercase: true, default: '' },
            decision: { type: String, enum: ['', 'approved', 'returned'], default: '' },
            note: { type: String, trim: true, default: '' },
            decidedAt: { type: Date, default: null },
        },
        history: [{
            action: { type: String, required: true },
            actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            actorRole: { type: String, default: '' },
            note: { type: String, trim: true, default: '' },
            occurredAt: { type: Date, default: Date.now },
        }],
    },
}, {
    timestamps: true,
});

// A terminal identity may belong to only one TradeEthiopia employee. Sparse
// keeps employees without a configured Punch ID valid during rollout.
userSchema.index({ punchId: 1 }, { unique: true, sparse: true });

userSchema.pre('save', async function (next) {
    if (this.role && /tessbin/i.test(this.role) && !this.department) {
        this.department = 'Tessbin';
    }
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, codiceFiscale, userType } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            email,
            password, // Password hashing handled in model middleware
            firstName,
            lastName,
            codiceFiscale,
            userType
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                userType: user.userType,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            res.json({
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                userType: user.userType,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const { OAuth2Client } = require('google-auth-library');

// @desc    Real Google Login
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        // Verify Google ID Token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, given_name, family_name, picture } = payload;

        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
            // Auto-create user on first Google login
            user = await User.create({
                email,
                firstName: given_name || email.split('@')[0],
                lastName: family_name || 'Google User',
                password: Math.random().toString(36).slice(-8), // Dummy password for model requirement
                userType: 'PRIVATE',
                status: 'ACTIVE'
            });
        }

        res.json({
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            userType: user.userType,
            token: generateToken(user._id),
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ message: 'Autenticazione Google fallita', error: error.message });
    }
};

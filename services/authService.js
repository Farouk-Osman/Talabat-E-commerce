const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const userModel = require('../models/userModel');
const ApiError = require('../utils/apiError');

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const signToken = (id) => jwt.sign({ id }, SECRET_KEY, { expiresIn: EXPIRES_IN });

const signup = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) throw new ApiError('name, email and password required', 400);
    const existing = await userModel.findOne({ email });
    if (existing) throw new ApiError('Email already in use', 400);
    const user = await userModel.create({ name, email, password, role });
    const token = signToken(user._id);
    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json({ status: 'success', token, data: { user: userObj } });
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError('Please provide email and password', 400);
    const user = await userModel.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) throw new ApiError('Incorrect email or password', 401);
    const token = signToken(user._id);
    const userObj = user.toObject();
    delete userObj.password;
    res.status(200).json({ status: 'success', token, data: { user: userObj } });
});

module.exports = { signup, login, signToken };
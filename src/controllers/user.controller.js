import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from '../utils/error.js'
import { apiResponse } from '../utils/apiResponse.js'
import User from "../models/user.model.js";


export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
        throw new apiError(400, "All feilds are required")
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
        throw new apiError(409, "User with this email already exists")
    }

    const user = new User({
        name,
        email,
        password
    })

    try {
        await user.validate()
    } catch (error) {
        const validationErrors = [];
        for (const key in error.errors) {
            validationErrors.push(error.errors[key].message);
        }
        throw new apiError(400, validationErrors.join(', '));
    }

    await user.save()
    user.password = undefined

    res.status(201).json(
        new apiResponse(201, user, "User created successfully")
    )
})

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        throw new apiError(400, 'All feilds are required')
    }

    const user = await User.findOne({ email }).select("+password")

    if (!user) {
        throw new apiError(404, "User does not exists")
    }

    const isCorrectPassword = await user.isPasswordCorrect(password)

    if (!isCorrectPassword) {
        throw new apiError(401, 'Invalid user credentials')
    }

    user.password = undefined

    const accessToken = await user.generateAccessToken()
    console.log(accessToken);
    const options = {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
        secure: process.env.NODE_ENV === "Development" ? false : true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }

    res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .json(new apiResponse(201, user, `Welcome back ${user.name}`))
})

export const logoutUser = asyncHandler(async (req, res) => {
    const options = {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
        secure: process.env.NODE_ENV === "Development" ? false : true,
    }

    res
        .status(200)
        .clearCookie("accessToken", options)
        .json(
            new apiResponse(200, '', "logout successfully")
        )
})

export const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select("password");

    if (!user) {
        throw new apiError(404, "User does not exist");
    }

    if (req.body?.name) {
        user.name = req.body.name;
    }

    if (req.body?.oldPassword && req.body?.newPassword) {
        const isCorrectPassword = await user.isPasswordCorrect(req.body.oldPassword)
        if (!isCorrectPassword) {
            throw new apiError(400, "The old password does not match");
        }
        user.password = req.body.newPassword;
    } else if (req.body?.newPassword) {
        throw new apiError(400, "Old password is required to set a new password");
    }

    await user.save({ validateBeforeSave: false });
    user.password = undefined

    res.status(200).json(new apiResponse(200, user, "User updated successfully"));
})

export const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new apiError(404, 'user does not exist')
    }

    res.status(200).json(
        new apiResponse(200, user, 'user fetched successfully')
    )
})

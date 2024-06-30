import { apiError } from "../utils/error.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { apiResponse } from "../utils/apiResponse.js"
import JWT from 'jsonwebtoken'

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken
    if (!token) {
        throw new apiError(400, "Please log in again")
    }
    const userDetails = await JWT.verify(token, process.env.ACCESS_TOKEN_SECRET)

    req.user = userDetails

    next()
})

export const checkTokenValidity = asyncHandler(async (req, res) => {
    const token = req.cookies?.accessToken
    let isValid = false;
    if (token) {
        try {
            await JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);
            isValid = true;
        } catch (error) {
            isValid = false;
        }
    }

    res.status(200).json(
        new apiResponse(200, isValid, `authorized ${isValid}`)
    )
})
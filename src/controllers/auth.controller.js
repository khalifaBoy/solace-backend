import prisma from "../config/database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import crypto from "node:crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.service.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // Validate email
    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Validate password
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    // Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate secure verification token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Store only the SHA-256 hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Token expires in 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Create user and verification token
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: false,

        verificationTokens: {
          create: {
            token: hashedToken,
            expiresAt,
          },
        },
      },

      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(
        user.email,
        user.name,
        rawToken
      );
    } catch (emailError) {
      console.error("Verification email failed:", emailError);

      return res.status(503).json({
        success: false,
        message: "Account created, but verification email could not be sent. Please try again later.",
        user: {
          id: user.id,
          email: user.email,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Account created. Please verify your email.",
      user,
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
};


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!user.emailVerified) {
  return res.status(403).json({
    success: false,
    message: "Please verify your email before logging in",
  });
}

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
};


// Get currently authenticated user
export async function getCurrentUser(req, res) {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("Get Current User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve user",
    });
  }
}

// Update authenticated user's profile
export async function updateProfile(req, res) {
  try {
    const userId = req.user.userId;
    const { name, email } = req.body;

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Check whether another user already uses this email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        email: normalizedEmail,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
}

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // Hash incoming token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find token in database
    const verificationToken =
      await prisma.verificationToken.findUnique({
        where: {
          token: hashedToken,
        },
      });

    if (!verificationToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid or already used verification token",
      });
    }

    // Check expiration
    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({
        where: {
          id: verificationToken.id,
        },
      });

      return res.status(400).json({
        success: false,
        message: "Verification link has expired",
      });
    }

    // Verify user and delete token atomically
    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: verificationToken.userId,
        },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      }),

      prisma.verificationToken.delete({
        where: {
          id: verificationToken.id,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });

  } catch (error) {
    console.error("Email verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Email verification failed",
    });
  }
};



export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Return the same response for unknown and unverified accounts.
    if (user && user.emailVerified) {
      const rawToken = crypto.randomBytes(32).toString("hex");

      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Invalidate previous reset tokens and create a new one.
      await prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.deleteMany({
          where: { userId: user.id },
        });

        await tx.passwordResetToken.create({
          data: {
            token: hashedToken,
            expiresAt,
            userId: user.id,
          },
        });
      });

      try {
        await sendPasswordResetEmail(
          user.email,
          user.name,
          rawToken
        );
      } catch (emailError) {
        console.error("Password reset email failed:", emailError);

        // Remove the unusable token if email delivery failed.
        await prisma.passwordResetToken.deleteMany({
          where: {
            userId: user.id,
            token: hashedToken,
          },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "If an account exists with this email, a password reset link will be sent.",
    });

  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== "string" || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    // Validate the expected 64-character hexadecimal token.
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Hash the incoming token.
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: {
        token: hashedToken,
      },
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    if (resetToken.expiresAt <= new Date()) {
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return res.status(400).json({
        success: false,
        message: "Password reset link has expired",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and invalidate all outstanding reset tokens atomically.
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          password: hashedPassword,
        },
      });

      await tx.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });

  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  }
};
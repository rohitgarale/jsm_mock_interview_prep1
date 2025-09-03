"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// ===============================
// SESSION COOKIE
// ===============================
export async function setSessionCookie(idToken: string) {
    const cookieStore = await cookies();

    const sessionCookie = await auth.createSessionCookie(idToken, {
        expiresIn: SESSION_DURATION * 1000,
    });

    cookieStore.set("session", sessionCookie, {
        maxAge: SESSION_DURATION,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
    });
}

export async function signOut() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
}

// ===============================
// AUTH ACTIONS
// ===============================
export async function signUp(params: SignUpParams) {
    const { uid, name, email } = params;

    try {
        const userRef = db.collection("users").doc(uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            return { success: false, message: "User already exists. Please sign in." };
        }

        // Create Firestore record
        await userRef.set({
            name,
            email,
            createdAt: Date.now(),
        });

        return {
            success: true,
            message: "Account created successfully. Please sign in.",
        };
    } catch (error: any) {
        console.error("Error creating user:", error);

        if (error.code === "auth/email-already-exists") {
            return { success: false, message: "This email is already in use" };
        }

        return {
            success: false,
            message: "Failed to create account. Please try again.",
        };
    }
}

export async function signIn(params: SignInParams) {
    const { email, idToken } = params;

    try {
        const userRecord = await auth.getUserByEmail(email);
        if (!userRecord) {
            return {
                success: false,
                message: "User does not exist. Create an account.",
            };
        }

        await setSessionCookie(idToken);

        return { success: true, message: "Logged in successfully" };
    } catch (error: any) {
        console.error("Error signing in:", error);

        return {
            success: false,
            message: "Failed to log into account. Please try again.",
        };
    }
}

// ===============================
// GET CURRENT USER
// ===============================
export async function getCurrentUser(): Promise<User | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) return null;

    try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

        const authUser = await auth.getUser(decodedClaims.uid);
        const userDoc = await db.collection("users").doc(decodedClaims.uid).get();
        const firestoreData = userDoc.exists ? userDoc.data() : {};

        return {
            id: authUser.uid,
            email: authUser.email,
            name: firestoreData?.name || authUser.displayName || "",
            ...firestoreData,
        } as User;
    } catch (error: any) {
        if (error.code === "auth/user-not-found") {
            // ❌ Can't delete cookie here, just return null
            return null;
        }
        console.error("Error in getCurrentUser:", error);
        return null;
    }
}


// ===============================
// IS AUTHENTICATED
// ===============================
export async function isAuthenticated() {
    const user = await getCurrentUser();
    return !!user;
}

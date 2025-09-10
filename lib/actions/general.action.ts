"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db, auth } from "@/firebase/admin"; // ✅ ensure `admin` is exported in firebase/admin
import { feedbackSchema } from "@/constants";

// ============================================================================
// HELPER: Firestore-safe timestamps
// ============================================================================
const now = () => admin.firestore.Timestamp.now();

// ============================================================================
// CREATE FEEDBACK
// ============================================================================
export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript, feedbackId } = params;

    try {
        const formattedTranscript = transcript
            .map(
                (sentence: { role: string; content: string }) =>
                    `- ${sentence.role}: ${sentence.content}\n`
            )
            .join("");

        const { object } = await generateObject({
            model: google("gemini-2.0-flash-001", {
                structuredOutputs: false,
            }),
            schema: feedbackSchema,
            prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
            system:
                "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
        });

        const feedback = {
            interviewId: interviewId,
            userId: userId,
            totalScore: object.totalScore,
            categoryScores: object.categoryScores,
            strengths: object.strengths,
            areasForImprovement: object.areasForImprovement,
            finalAssessment: object.finalAssessment,
            createdAt: now(), // ✅ FIX
        };

        let feedbackRef;

        if (feedbackId) {
            feedbackRef = db.collection("feedback").doc(feedbackId);
        } else {
            feedbackRef = db.collection("feedback").doc();
        }

        await feedbackRef.set(feedback);

        return { success: true, feedbackId: feedbackRef.id };
    } catch (error) {
        console.error("Error saving feedback:", error);
        return { success: false };
    }
}

// ============================================================================
// GET INTERVIEW BY ID
// ============================================================================
export async function getInterviewById(id: string): Promise<Interview | null> {
    if (!id || typeof id !== "string" || id.trim() === "") {
        console.error("❌ Invalid interview ID provided:", id);
        return null;
    }

    const cleanId = id.trim();

    try {
        console.log("🔍 Fetching interview with ID:", cleanId);

        const interview = await db.collection("interviews").doc(cleanId).get();

        if (!interview.exists) {
            console.log("⚠️ Interview not found:", cleanId);
            return null;
        }

        const data = interview.data();
        console.log("✅ Interview found:", cleanId);

        return {
            id: interview.id,
            ...data,
        } as Interview;
    } catch (error) {
        console.error("❌ Error fetching interview:", error);
        return null;
    }
}

// ============================================================================
// GET FEEDBACK BY INTERVIEW ID
// ============================================================================
export async function getFeedbackByInterviewId(
    params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
    const { interviewId, userId } = params;

    try {
        const querySnapshot = await db
            .collection("feedback")
            .where("interviewId", "==", interviewId)
            .where("userId", "==", userId)
            .limit(1)
            .get();

        if (querySnapshot.empty) return null;

        const feedbackDoc = querySnapshot.docs[0];
        return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return null;
    }
}

// ============================================================================
// GET LATEST INTERVIEWS
// ============================================================================
export async function getLatestInterviews(
    params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;

    try {
        const interviews = await db
            .collection("interviews")
            .where("finalized", "==", true)
            .where("userId", "!=", userId)
            .orderBy("userId")
            .orderBy("createdAt", "desc")
            .limit(limit)
            .get();

        return interviews.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Interview[];
    } catch (error) {
        console.error("Error fetching latest interviews:", error);

        try {
            const interviews = await db
                .collection("interviews")
                .where("finalized", "==", true)
                .orderBy("createdAt", "desc")
                .limit(limit * 2)
                .get();

            const filtered = interviews.docs
                .filter((doc) => doc.data().userId !== userId)
                .slice(0, limit)
                .map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

            return filtered as Interview[];
        } catch (fallbackError) {
            console.error("Fallback query also failed:", fallbackError);
            return [];
        }
    }
}

// ============================================================================
// GET INTERVIEWS BY USER
// ============================================================================
export async function getInterviewsByUserId(
    userId: string
): Promise<Interview[] | null> {
    try {
        const interviews = await db
            .collection("interviews")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();

        return interviews.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Interview[];
    } catch (error) {
        console.error("Error fetching user interviews:", error);
        return [];
    }
}

// ============================================================================
// CREATE INTERVIEW (basic)
// ============================================================================
export async function createInterview(
    userId: string,
    data?: Partial<Interview>
): Promise<Interview> {
    if (!userId) {
        throw new Error("❌ Cannot create interview without userId");
    }

    try {
        const interviewRef = await db.collection("interviews").add({
            userId,
            createdAt: now(), // ✅ FIX
            updatedAt: now(), // ✅ FIX
            finalized: false,
            ...data,
        });

        const interviewDoc = await interviewRef.get();

        return {
            id: interviewDoc.id,
            ...interviewDoc.data(),
        } as Interview;
    } catch (error) {
        console.error("Error creating interview:", error);
        throw new Error("Failed to create interview");
    }
}

// ============================================================================
// CREATE ENHANCED INTERVIEW
// ============================================================================
export async function createEnhancedInterview(
    userId: string,
    interviewData: {
        title: string;
        jobRole: string;
        category?: string;
        difficulty?: "Easy" | "Medium" | "Hard";
        tags?: string[];
        estimatedDuration?: number;
        isPublic?: boolean;
        role?: string;
        type?: string;
        techstack?: string;
    }
): Promise<{ success: boolean; interviewId?: string; error?: string }> {
    if (!userId) {
        return { success: false, error: "UserId is required" };
    }

    try {
        console.log("🔄 Creating enhanced interview for userId:", userId);

        const tags =
            interviewData.tags ||
            (interviewData.techstack
                ? interviewData.techstack.split(",").map((t) => t.trim())
                : []);

        const interview = {
            userId,
            title: interviewData.title,
            jobRole: interviewData.jobRole,
            category: interviewData.category || interviewData.type || "Technical",
            difficulty: interviewData.difficulty || "Medium",
            tags,
            estimatedDuration: interviewData.estimatedDuration || 30,
            finalized: false,
            isPublic: interviewData.isPublic || false,
            createdAt: now(), // ✅ FIX
            updatedAt: now(), // ✅ FIX
            role: interviewData.role || interviewData.jobRole,
            type: interviewData.type || interviewData.category || "Technical",
            techstack: interviewData.techstack || tags.join(", "),
        };

        const interviewRef = await db.collection("interviews").add(interview);
        console.log("✅ Enhanced interview created with ID:", interviewRef.id);

        return { success: true, interviewId: interviewRef.id };
    } catch (error) {
        console.error("❌ Error creating enhanced interview:", error);
        return { success: false, error: "Failed to create interview" };
    }
}

// ============================================================================
// FINALIZE INTERVIEW
// ============================================================================
export async function finalizeInterview(
    interviewId: string,
    updates?: Partial<Interview>
): Promise<{ success: boolean; error?: string }> {
    if (!interviewId) {
        return { success: false, error: "Interview ID is required" };
    }

    try {
        await db.collection("interviews").doc(interviewId).update({
            finalized: true,
            updatedAt: now(), // ✅ FIX
            ...updates,
        });

        console.log("✅ Interview finalized:", interviewId);
        return { success: true };
    } catch (error) {
        console.error("❌ Error finalizing interview:", error);
        return { success: false, error: "Failed to finalize interview" };
    }
}

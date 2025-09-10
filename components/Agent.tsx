"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
    INACTIVE = "INACTIVE",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
    FINISHED = "FINISHED",
    ERROR = "ERROR",
}

interface SavedMessage {
    role: "user" | "system" | "assistant";
    content: string;
}

interface Message {
    type: string;
    transcriptType?: string;
    role: "user" | "system" | "assistant";
    transcript: string;
}

interface AgentProps {
    userName: string;
    userId: string;
    interviewId: string;
    feedbackId?: string;
    type: "generate" | "interview";
    questions?: string[];
}

const Agent = ({
                   userName,
                   userId,
                   interviewId,
                   feedbackId,
                   type,
                   questions,
               }: AgentProps) => {
    const router = useRouter();
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [lastMessage, setLastMessage] = useState<string>("");
    const [error, setError] = useState<string>("");

    useEffect(() => {
        const onCallStart = () => {
            console.log("Call started successfully");
            setCallStatus(CallStatus.ACTIVE);
            setError(""); // Clear any previous errors
        };

        const onCallEnd = () => {
            console.log("Call ended");
            setCallStatus(CallStatus.FINISHED);
        };

        const onMessage = (message: Message) => {
            if (message.type === "transcript" && message.transcriptType === "final") {
                const newMessage = {
                    role: message.role,
                    content: message.transcript
                };
                setMessages((prev) => [...prev, newMessage]);
            }
        };

        const onSpeechStart = () => {
            console.log("Speech started");
            setIsSpeaking(true);
        };

        const onSpeechEnd = () => {
            console.log("Speech ended");
            setIsSpeaking(false);
        };

        const onError = (error: any) => {
            console.error("Vapi Error:", error);
            setCallStatus(CallStatus.ERROR);
            setError(error?.message || "An error occurred during the call");
            setIsSpeaking(false);
        };

        // Register event listeners
        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("message", onMessage);
        vapi.on("speech-started", onSpeechStart);
        vapi.on("speech-ended", onSpeechEnd);
        vapi.on("error", onError);

        // Cleanup function
        return () => {
            vapi.off("call-start", onCallStart);
            vapi.off("call-end", onCallEnd);
            vapi.off("message", onMessage);
            vapi.off("speech-started", onSpeechStart);
            vapi.off("speech-ended", onSpeechEnd);
            vapi.off("error", onError);
        };
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            setLastMessage(messages[messages.length - 1].content);
        }

        const handleGenerateFeedback = async (messages: SavedMessage[]) => {
            console.log("Generating feedback...");

            try {
                const { success, feedbackId: id } = await createFeedback({
                    interviewId: interviewId!,
                    userId: userId!,
                    transcript: messages,
                    feedbackId,
                });

                if (success && id) {
                    router.push(`/interview/${interviewId}/feedback`);
                } else {
                    console.error("Error saving feedback");
                    router.push("/");
                }
            } catch (error) {
                console.error("Error generating feedback:", error);
                router.push("/");
            }
        };

        if (callStatus === CallStatus.FINISHED) {
            if (type === "generate") {
                router.push("/");
            } else {
                handleGenerateFeedback(messages);
            }
        }
    }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);
        setError("");

        try {
            if (type === "generate") {
                // For generate type, use assistant configuration
                await vapi.start({
                    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
                    // Note: variableValues might not be supported in web SDK
                    // If you need dynamic variables, consider using the API route approach
                });
            } else {
                // For interview type, use the interviewer configuration
                let assistantConfig;

                if (questions && questions.length > 0) {
                    const formattedQuestions = questions
                        .map((question) => `- ${question}`)
                        .join("\n");

                    // If interviewer is an object with dynamic questions
                    assistantConfig = {
                        ...interviewer,
                        // Add questions to the system message or first message
                        firstMessage: `Hello ${userName}! I'll be conducting your interview today. Here are the questions we'll be covering:\n\n${formattedQuestions}\n\nLet's begin with the first question.`,
                    };
                } else {
                    assistantConfig = interviewer;
                }

                await vapi.start(assistantConfig);
            }
        } catch (error: any) {
            console.error("Failed to start call:", error);
            setCallStatus(CallStatus.ERROR);
            setError(error?.message || "Failed to start the call. Please try again.");
        }
    };

    // Alternative approach using API route (uncomment if needed)
    /*
    const handleCallWithAPI = async () => {
      setCallStatus(CallStatus.CONNECTING);
      setError("");

      try {
        // Get assistant configuration from API route
        const response = await fetch('/api/vapi/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type,
            questions,
            userName,
            userId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get assistant configuration');
        }

        const { assistantConfig } = await response.json();

        // Start the call with the web SDK
        await vapi.start(assistantConfig);
      } catch (error: any) {
        console.error("Failed to start call:", error);
        setCallStatus(CallStatus.ERROR);
        setError(error?.message || "Failed to start the call. Please try again.");
      }
    };
    */

    const handleDisconnect = () => {
        try {
            vapi.stop();
            setCallStatus(CallStatus.FINISHED);
            setIsSpeaking(false);
        } catch (error) {
            console.error("Error disconnecting call:", error);
            setCallStatus(CallStatus.FINISHED);
        }
    };

    const handleRetry = () => {
        setCallStatus(CallStatus.INACTIVE);
        setError("");
        setMessages([]);
        setLastMessage("");
        setIsSpeaking(false);
    };

    const getButtonText = () => {
        switch (callStatus) {
            case CallStatus.INACTIVE:
                return "Start Call";
            case CallStatus.CONNECTING:
                return "Connecting...";
            case CallStatus.ERROR:
                return "Retry";
            case CallStatus.FINISHED:
                return "Call Ended";
            default:
                return "Call";
        }
    };

    return (
        <>
            <div className="call-view">
                {/* AI Interviewer Card */}
                <div className="card-interviewer">
                    <div className="avatar">
                        <Image
                            src="/ai-avatar.png"
                            alt="AI Interviewer"
                            width={65}
                            height={54}
                            className="object-cover"
                        />
                        {isSpeaking && <span className="animate-speak" />}
                    </div>
                    <h3>AI Interviewer</h3>
                </div>

                {/* User Profile Card */}
                <div className="card-border">
                    <div className="card-content">
                        <Image
                            src="/user-avatar.png"
                            alt="User Profile"
                            width={539}
                            height={539}
                            className="rounded-full object-cover size-[120px]"
                        />
                        <h3>{userName}</h3>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="error-display bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error: </strong>
                    {error}
                </div>
            )}

            {/* Transcript Display */}
            {messages.length > 0 && (
                <div className="transcript-border">
                    <div className="transcript">
                        <p
                            key={lastMessage}
                            className={cn(
                                "transition-opacity duration-500 opacity-0",
                                "animate-fadeIn opacity-100"
                            )}
                        >
                            {lastMessage}
                        </p>
                    </div>
                </div>
            )}

            {/* Call Controls */}
            <div className="w-full flex justify-center">
                {callStatus !== CallStatus.ACTIVE ? (
                    <button
                        className={cn(
                            "relative btn-call",
                            callStatus === CallStatus.ERROR && "bg-red-500 hover:bg-red-600",
                            callStatus === CallStatus.CONNECTING && "opacity-75 cursor-not-allowed"
                        )}
                        onClick={callStatus === CallStatus.ERROR ? handleRetry : handleCall}
                        disabled={callStatus === CallStatus.CONNECTING || callStatus === CallStatus.FINISHED}
                    >
            <span
                className={cn(
                    "absolute animate-ping rounded-full opacity-75",
                    callStatus !== CallStatus.CONNECTING && "hidden"
                )}
            />

                        <span className="relative">
              {getButtonText()}
            </span>
                    </button>
                ) : (
                    <button className="btn-disconnect" onClick={handleDisconnect}>
                        End Call
                    </button>
                )}
            </div>

            {/* Status Indicator */}
            <div className="text-center mt-4 text-sm text-gray-600">
                Status: <span className="font-semibold">{callStatus}</span>
                {callStatus === CallStatus.ACTIVE && (
                    <div className="flex items-center justify-center mt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                        <span>Call in progress</span>
                    </div>
                )}
            </div>
        </>
    );
};

export default Agent;
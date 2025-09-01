import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils"; // 👈 Tailwind helper for conditional classes

enum CallStatus {
    INACTIVE = "INACTIVE",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
    FINISHED = "FINISH",
}

interface AgentProps {
    userName: string;
}

const Agent = ({ userName }: AgentProps) => {
    const callStatus = CallStatus.FINISHED; // example
    const isSpeaking = true;

    const messages = [
        "Whats your name?",
        "My name is John Doe, nice to meet you!",
    ];

    const lastMessage = messages[messages.length - 1];

    return (
        <>
            <div className="call-view">
                <div className="card-interviewer">
                    <div className="avatar ">
                        <Image
                            src="/ai-avatar.png"
                            alt="vapi"
                            width={65}
                            height={54}
                            className="object-cover"
                        />
                        {isSpeaking && <span className="animate-speak " />}
                    </div>
                    <h3>AI Interviewer</h3>
                </div>

                <div className="card-border">
                    <div className="card-content ">
                        <Image
                            src="/user-avatar.png"
                            alt="user avatar"
                            width={540}
                            height={540}
                            className="rounded-full object-cover size-[120px]"
                        />
                        <h3>{userName}</h3>
                    </div>
                </div>
            </div>

            {messages.length > 0 && (
                <div className="transcript-border">
                    <div className="transcript">
                        <p
                            key={lastMessage}
                            className={cn(
                                "animate-fadeIn transition-opacity duration-500"
                            )}
                        >
                            {lastMessage}
                        </p>
                    </div>
                </div>
            )}

            <div className="w-full flex justify-center">
                {callStatus !== CallStatus.ACTIVE ? (
                    <button className="relative btn-call">
                        {/* ping animation only while connecting */}
                        <span
                            className={cn(
                                "absolute animate-ping rounded-full opacity-75",
                                callStatus !== CallStatus.CONNECTING && "hidden"
                            )}
                        />
                        <span>
              {callStatus === CallStatus.INACTIVE ||
              callStatus === CallStatus.FINISHED
                  ? "Call"
                  : "...."}
            </span>
                    </button>
                ) : (
                    <button className="btn-disconnect">End</button>
                )}
            </div>
        </>
    );
};

export default Agent;

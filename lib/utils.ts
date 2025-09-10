import { interviewCovers, mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

/**
 * Normalize a tech name (case-insensitive, strip ".js", spaces, etc.)
 * Returns either a mapped value, the cleaned key, or "default".
 */
const normalizeTechName = (tech: string): string => {
    if (!tech) return "default";

    const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");

    return mappings[key as keyof typeof mappings] || key || "default";
};

/**
 * Check if an icon URL exists.
 */
const checkIconExists = async (url: string) => {
    try {
        const response = await fetch(url, { method: "HEAD" });
        return response.ok;
    } catch {
        return false;
    }
};

/**
 * Build an array of logos (with fallback if URL missing).
 */
export const getTechLogos = async (techArray?: string[]) => {
    if (!Array.isArray(techArray) || techArray.length === 0) {
        return [];
    }

    const logoURLs = techArray.map((tech) => {
        const normalized = normalizeTechName(tech);

        return {
            tech,
            url: `${techIconBaseURL}/${normalized}/${normalized}-original.svg`,
        };
    });

    const results = await Promise.all(
        logoURLs.map(async ({ tech, url }) => ({
            tech,
            url: (await checkIconExists(url)) ? url : "/tech.svg", // fallback local placeholder
        }))
    );

    return results;
};

/**
 * Pick a random interview cover.
 */
export const getRandomInterviewCover = () => {
    const randomIndex = Math.floor(Math.random() * interviewCovers.length);
    return `/covers${interviewCovers[randomIndex]}`;
};

const extractSections = (text) => {
    const lowerText = text.toLowerCase();

    const getSection = (startKeyword, endKeywords) => {
        const startIndex = lowerText.indexOf(startKeyword);
        if (startIndex === -1) return "";

        let endIndex = text.length;

        for (let keyword of endKeywords) {
            const idx = lowerText.indexOf(keyword, startIndex + 1);
            if (idx !== -1 && idx < endIndex) {
                endIndex = idx;
            }
        }

        return text.substring(startIndex, endIndex).trim();
    };

    return {
        skills: getSection("skills", ["education", "projects", "experience"]),
        education: getSection("education", ["skills", "projects", "experience"]),
        projects: getSection("projects", ["skills", "education", "experience"]),
        experience: getSection("experience", ["skills", "education", "projects"]),
    };
};

module.exports = { extractSections };
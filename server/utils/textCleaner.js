const cleanText = (text) => {
    return text
        .replace(/\r\n/g, " ")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

module.exports = { cleanText };
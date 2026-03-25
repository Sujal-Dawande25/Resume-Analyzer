import axios from "axios";

const API = axios.create({
    baseURL: "https://resume-analyzer-45kb.onrender.com"
});

export const uploadResume = (formData) => API.post("/upload", formData);
import axios from "axios";

const API = axios.create({
    baseURL: "https://resume-analyzer-45kb.onrender.com"
    //  baseURL: "http://localhost:5000"
});

export const uploadResume = (formData) => API.post("/upload", formData);
// src/lib/api.js
import axios from "axios";

export const API = "https://dashbord-back.onrender.com"; // 🧩 même adresse que celle de FastAPI

export const http = axios.create({
  baseURL: API,
  timeout: 15000,
});

export default http;

// src/lib/api.js
import axios from "axios";

export const API = "http://127.0.0.1:8000"; // 🧩 même adresse que celle de FastAPI

export const http = axios.create({
  baseURL: API,
  timeout: 15000,
});

export default http;

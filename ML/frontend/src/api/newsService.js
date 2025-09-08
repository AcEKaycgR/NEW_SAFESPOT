import axios from "axios";
const HOST = '172.20.10.13';
const PORT = '8000';
const API_URL = `http://${HOST}:${PORT}/news`;

export const fetchNews = async (params = {}) => {
  const response = await axios.get(API_URL, { params });
  return response.data.data || [];
};
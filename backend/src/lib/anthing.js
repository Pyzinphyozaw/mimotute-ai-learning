import { ENV } from "./env.js";
import axios from 'axios'

let ANYTHING

export const anything=()=>{
ANYTHING = axios.create({
  baseURL: ENVANYTHINGLLM_URL,
  headers: {
    'Authorization': `Bearer ${ENV.API_KEY}`,
  },
});
}
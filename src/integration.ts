import axios from "axios";
import https from "https";

export async function fetchSkinportItems() {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  const response = await axios.get("https://api.skinport.com/v1/items?app_id=730&currency=EUR", {
    httpsAgent,
  });

  return response.data;
}

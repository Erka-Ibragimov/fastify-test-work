import axios from "axios";

export async function fetchSkinportItems() {
  const response = await axios.get("https://docs.skinport.com/#items");

  return response.data;
}

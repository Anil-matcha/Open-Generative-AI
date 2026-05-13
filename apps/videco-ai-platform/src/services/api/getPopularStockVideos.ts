import axios from "axios";

export const getPopularStockVideos = async (initialPartnerURL: string) => {
    return await axios.get(initialPartnerURL).then((response) => response.data);
};

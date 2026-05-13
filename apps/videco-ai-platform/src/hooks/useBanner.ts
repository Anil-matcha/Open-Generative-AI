export function useBanner() {
    const getBanner = (banner_name: string) => {
        try {
            const bannerStatus = localStorage.getItem(banner_name);

            return bannerStatus ?? false;
        } catch (error) {
            console.log("error..", error);
        }
    };
    const updateBanner = async (banner_name: string, remove: boolean) => {
        try {
            if (remove) {
                localStorage.removeItem(banner_name);
            } else {
                localStorage.setItem(banner_name, "true");
            }

            return true;
        } catch (error) {
            console.log("error..", error);
        }
    };

    return {
        getBanner,
        updateBanner,
    };
}

const NextI18Next = require("next-i18next").default;

module.exports = new NextI18Next({
    otherLanguages: ["en", "nl"],
    defaultLanguage: "en",
    localePath:
        typeof window === "undefined"
            ? require("path").resolve("./public/locales")
            : "/locales",
});

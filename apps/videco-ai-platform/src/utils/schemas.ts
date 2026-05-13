import * as Yup from "yup";

export const SettingsSchema = Yup.object().shape({
    url: Yup.string()
        .min(2, "Too Short!")
        .max(50, "Too Long!")
        .required("Required"),
});

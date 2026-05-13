import axios from "axios";
import FormData from "form-data";
import fetch from "node-fetch";

export const makeAIVoice = async (
    mp3: any,
    text,
    greeting,
    userId,
    userName,
    email,
) => {
    if (!userId || !userName || !email) {
        throw new Error(
            "User data is missing: userId, userName, or email is undefined",
        );
    }
    // Fetch the file from the remote URL
    const response = await fetch(mp3);

    // Convert the response to a Blob
    // const blob = await response.blob();
    const buffer = await response.buffer();

    const form = new FormData();
    form.append("name", userId);
    // form.append(
    //     "sample",
    //     new File([blob], "filename.mp3", { type: "audio/mpeg" }),
    // );
    form.append("sample", buffer, {
        filename: "filename.mp3",
        contentType: "audio/mpeg",
    });
    form.append("consent", `{"fullName": "${userName}", "email": "${email}"}`);
    const options = {
        method: "POST",
        url: "https://api.sws.speechify.com/v1/voices",
        headers: {
            "Content-Type": "multipart/form-data",
            Authorization:
                "Bearer CUrCXPlC2tsSjob0FR8I2NYHFR2aH3IjokOlqaegY-8=",
        },
        data: form,
    };

    const createVoice = await axios.request(options);

    //TODO: Generate text to audio
    const textToAudioptions = {
        method: "POST",
        url: "https://api.sws.speechify.com/v1/audio/speech",
        headers: {
            "Content-Type": "application/json",
            Authorization:
                "Bearer CUrCXPlC2tsSjob0FR8I2NYHFR2aH3IjokOlqaegY-8=",
        },
        data: {
            audio_format: "mp3",
            input: text,
            model: "simba-multilingual",
            options: { loudness_normalization: true },
            voice_id: createVoice.data.id,
        },
    };

    const textToAudio = await axios.request(textToAudioptions);
    return {
        previewData: textToAudio,
        voiceData: createVoice,
    };
};

//greeting is nullable
export const makeTextToVoice = async (text, greeting, voice_id, language) => {
    if (!voice_id || !language) {
        throw new Error(
            "User data is missing: userId, language, greeting is undefined",
        );
    }

    let languageCode = "en";

    switch (language) {
        case "english":
            languageCode = "en";
            break;
        case "french":
            languageCode = "fr-FR";
            break;
        case "german":
            languageCode = "de-DE";
            break;
        case "spanish":
            languageCode = "es-ES";
            break;
        case "portuguese_br":
            languageCode = "pt-BR";
            break;
        case "portuguese":
            languageCode = "pt-PT";
            break;
        case "dutch":
            languageCode = "nl-NL";
            break;
        case "italian":
            languageCode = "it-IT";
            break;
        case "turkish":
            languageCode = "tr-TR";
            break;
        case "swedish":
            languageCode = "sv-SE";
            break;
        case "polish":
            languageCode = "pl-PL";
            break;
        case "danish":
            languageCode = "da-DK";
            break;
        case "norwegian":
            languageCode = "nb-NO";
            break;
        default:
            languageCode = "en";
    }
    //TODO: Generate text to audio
    const textToAudioptions = {
        method: "POST",
        url: "https://api.sws.speechify.com/v1/audio/speech",
        headers: {
            "Content-Type": "application/json",
            Authorization:
                "Bearer CUrCXPlC2tsSjob0FR8I2NYHFR2aH3IjokOlqaegY-8=",
        },
        data: {
            audio_format: "mp3",
            input: greeting ? `${greeting} ${text}` : text,
            language: languageCode,
            model: "simba-multilingual",
            voice_id: voice_id,
        },
    };

    const textToAudio = await axios.request(textToAudioptions);
    return textToAudio;
};

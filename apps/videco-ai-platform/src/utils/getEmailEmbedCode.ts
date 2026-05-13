export const emailProvidersList = () => [
    {
        value: "apollo",
        label: "Apollo",
        fileType: "png",
    },
    {
        value: "activecampaign",
        label: "ActiveCampaign",
        fileType: "png",
    },
    {
        value: "aweber",
        label: "AWeber",
        fileType: "svg",
    },
    {
        value: "brevo",
        label: "Brevo",
        fileType: "png",
    },
    {
        value: "hubspot",
        label: "Hubspot",
        fileType: "svg",
    },
    {
        value: "lemlist",
        label: "Lemlist",
        fileType: "png",
    },
    {
        value: "lagrowthmachine",
        label: "La Growth Machine",
        fileType: "png",
    },
    {
        value: "mailchimp",
        label: "Mailchimp",
        fileType: "svg",
    },
    {
        value: "nethunt",
        label: "Nethunt",
        fileType: "png",
    },
    {
        value: "gohighlevel",
        label: "Go High Level",
        fileType: "png",
    },
    {
        value: "smartlead",
        label: "Smart Lead",
        fileType: "png",
    },
    {
        value: "salesflow",
        label: "Sales Flow",
        fileType: "png",
    },
    {
        value: "woodpecker",
        label: "Woodpecker",
        fileType: "png",
    },
    {
        value: "other",
        label: "Other",
        fileType: "webp",
    },
];

const generateGif = (og_url: string, fname: string) =>
    `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_200,l_play-3-xxl_wefrsh/fl_layer_apply/c_scale,h_400,e_loop/dl_200,vs_30/b_black,co_white,fl_text_no_trim,l_text:Arial_50:${fname}/bo_6px_solid_rgb:05405A,fl_layer_apply,g_south,y_30/${og_url
        .split("/")
        .pop()
        .replace(".m3u8", ".gif")
        .replace(".mov", ".gif")
        .replace(".mp4", ".gif")}`;
export const getEmailEmbedCode = (
    url: string,
    og_url: string,
    provider: string,
) => {
    const gifUrl = `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_400/e_loop/l_image:play-3-xxl_wefrsh.png,w_90,x_0,y_0,g_center/a_0/${og_url
        .split("/")
        .pop()
        .replace(".mp4", ".gif")
        .replace(".mov", ".gif")
        .replace(".m3u8", ".gif")
        .replace(".webm", ".gif")}`;

    const mailchimp = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
<a href="${url}?fname=*|FNAME|*&lname=*|LNAME|*&email=*|EMAIL|*&phone=*|PHONE|*" style="display: inline-block;">
    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
    <br />
    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
</a>
</div>`;

    const brevo = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname={{FIRSTNAME}}&lname={{LASTNAME}}&ai_email={{contact.EMAIL}}" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;
    const woodpecker = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname={{FIRST_NAME}}&lname={{LAST_NAME}}&ai_email={{EMAIL}}" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;

    const hubspot = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
<a href="${url}?fname={{contact.firstname}}&lname={{contact.lastname}}&ai_email={{contact.email}}" style="display: inline-block;">
    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
    <br />
    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
</a>
</div>`;

    const aweber = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
        <a href="${url}?fname={{subscriber.firstname}}&lname={{subscriber.lastname}}&ai_email={{ subscriber.email }}" style="display: inline-block;">
            <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
            <br />
            <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
        </a>
        </div>`;

    const apollo = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname={{first_name}}&lname={{last_name}}&ai_email={{email}}" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;

    const smartlead = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname={{first_name}}&lname={{last_name}}&ai_email={{email}}" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;

    const lemlist = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname={{firstName}}&lname={{lastName}}&ai_email={{email}}" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;

    const gohighlevel = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname={{contact.name}}&lname={{contact.last_name}}&ai_email={{contact.email}}" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;
    const nethunt = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname={{field:First name:}}&lname={{field:Last name:}}&ai_email={{recipient:Email address:}}" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;
    const lagrowthmachine = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname={{firstname}}&lname={{lastname}}&ai_email={{proEmail}}" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;

    const salesflow = `We made a video for you:  ${url}?fname={first_name}&lname={last_name}&ai_email={custom_variable_1|fallback@videco.io}`;

    const activecampaign = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname=%FNAME%&lname=%LNAME%&ai_email=%EMAIL%" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block   background: white; border-radius: 30px;;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;
    const other = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname=%FNAME%&lname=%LNAME%&ai_email=%EMAIL%" style="display: inline-block;  background: white;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1;  background: white;">Watch the video ▶</span>
                </a>
            </div>`;

    if (provider === "mailchimp") {
        return mailchimp;
    }
    if (provider === "nethunt") {
        return nethunt;
    }

    if (provider === "smartlead") {
        return smartlead;
    }

    if (provider === "woodpecker") {
        return woodpecker;
    }

    if (provider === "lemlist") {
        return lemlist;
    }

    if (provider === "brevo") {
        return brevo;
    }

    if (provider === "hubspot") {
        return hubspot;
    }

    if (provider === "apollo") {
        return apollo;
    }
    if (provider === "aweber") {
        return aweber;
    }
    if (provider === "activecampaign") {
        return activecampaign;
    }
    if (provider === "salesflow") {
        return salesflow;
    }
    if (provider === "gohighlevel") {
        return gohighlevel;
    }
    if (provider === "lagrowthmachine") {
        return lagrowthmachine;
    }
    if (provider === "other") {
        return other;
    }

    return mailchimp;
};

export const getEmailEmbedCodeForSimpleVideos = (
    url: string,
    og_url: string,
    provider: string,
) => {
    const gifUrl = `https://res.cloudinary.com/dhd6m0fh3/video/upload/c_scale,h_400/e_loop/l_image:play-3-xxl_wefrsh.png,w_90,x_0,y_0,g_center/a_0/${og_url
        .split("/")
        .pop()
        .replace(".mp4", ".gif")
        .replace(".mov", ".gif")
        .replace(".m3u8", ".gif")
        .replace(".webm", ".gif")}`;

    const mailchimp = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
<a href="${url}?fname=*|FNAME|*&lname=*|LNAME|*&email=*|EMAIL|*&phone=*|PHONE|*" style="display: inline-block;">
    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
    <br />
    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
</a>
</div>`;

    const brevo = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname={{FIRSTNAME}}&lname={{LASTNAME}}" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;
    const woodpecker = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname={{FIRST_NAME}}&lname={{LAST_NAME}}" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;

    const hubspot = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
<a href="${url}?fname={{contact.firstname}}&lname={{contact.lastname}}" style="display: inline-block;">
    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
    <br />
    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
</a>
</div>`;

    const aweber = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
        <a href="${url}?fname={{subscriber.firstname}}&lname={{subscriber.lastname}}" style="display: inline-block;">
            <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
            <br />
            <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
        </a>
        </div>`;

    const apollo = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname={{first_name}}&lname={{last_name}}" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;

    const smartlead = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname={{first_name}}&lname={{last_name}}" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;

    const lemlist = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname={{firstName}}&lname={{lastName}}" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;

    const gohighlevel = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname={{contact.name}}&lname={{contact.last_name}}" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;
    const lagrowthmachine = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname={{firstname}}&lname={{lastname}}" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;

    const salesflow = `We made a video for you:  ${url}?fname={first_name}&lname={last_name}`;

    const activecampaign = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname=%FNAME%&lname=%LNAME%" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;
    const other = `<div style="position: relative; display: inline-block; padding: 5px; background: white;">
                <a href="${url}?fname=%FNAME%&lname=%LNAME%" style="display: inline-block;">
                    <img width="360px" src="${gifUrl}" alt="Watch the video" style="display: block;  background: white; border-radius: 30px;" />
                    <br />
                    <span style="display: block; font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4;">Watch the video ▶</span>
                </a>
            </div>`;

    if (provider === "mailchimp") {
        return mailchimp;
    }

    if (provider === "smartlead") {
        return smartlead;
    }

    if (provider === "woodpecker") {
        return woodpecker;
    }

    if (provider === "lemlist") {
        return lemlist;
    }

    if (provider === "brevo") {
        return brevo;
    }

    if (provider === "hubspot") {
        return hubspot;
    }

    if (provider === "apollo") {
        return apollo;
    }
    if (provider === "aweber") {
        return aweber;
    }
    if (provider === "activecampaign") {
        return activecampaign;
    }
    if (provider === "salesflow") {
        return salesflow;
    }
    if (provider === "gohighlevel") {
        return gohighlevel;
    }
    if (provider === "lagrowthmachine") {
        return lagrowthmachine;
    }
    if (provider === "other") {
        return other;
    }

    return mailchimp;
};

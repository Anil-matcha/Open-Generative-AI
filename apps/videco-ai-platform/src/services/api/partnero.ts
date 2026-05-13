import axios from "axios";

export const signupTracking = async (email: string, name: string) => {
    const options = {
        method: "POST",
        url: "https://api.partnero.com/v1/customers",
        headers: {
            accept: "application/json",
            "content-type": "application/json",
            Authorization:
                "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI1IiwianRpIjoiZWU0MWFmNGZhZDZjNGYwNzQ4OGQ0MGJiM2JmOWZmYjNiMmVhMDM5MzEzY2Y4NGUyYWMzNmEzN2FkZTkzZjBjYjFhYmM1NWQ1MDNlMzA2MTUiLCJpYXQiOjE3MzA0ODg5NTYuNTE2NjQzLCJuYmYiOjE3MzA0ODg5NTYuNTE2NjQ2LCJleHAiOjQ4ODYxNjI1NTYuNTExMzM5LCJzdWIiOiI5MTc4Iiwic2NvcGVzIjpbXX0.lhulKj5wruGelC_YitvkguTD-_6a9oQIG1BBxe3hEBF6w8jcZ8uDUR7ZSaFiGhQ7ZrLUJmhSvlAMBwDwgXlnF4owP7_FAMVx6EgNCRRdYZWxvb-BbqNp_E7XON-ao3f0osMgCwfKBPDPSZSAP5wFsgaV7pxR_xedDWKxpaHMOAmChM7oa50Y_XPPtW3q0fwmXfJTaF_9x8Mgw_fRTDLRpx0-DYPdulxwBQLFAAsgpH1plgiE0wj_5fAGoiq_wwr5MnNV3BvANKHzu1K-lu3cZ_Y5cACFnEL1XMcvOyN29yH0JguzmfRVV78r6HZuJ3ytfhNWnwvnyAJbr09r8Cu7OYx8x-jY-k8z5q7Ph5XPG3oPHWMixYycrlJRLZLjfC8iE7Ae9dIbxYeZlibRsF-k1gyKQTtKqP6m05Ev6u_ixpbFh2crmPV0w18lNusUm-LbixvtssRHSOBcE_cW5wE_yXss2XVhm-AfCd1suQ8nt-LkvzqvsfBllSMRjt_0Ldp49iaANa8FmWUnWRjUrHwP536rdaavRbJlMm1IR3EZIF-Q4__pgGM0WVBdNVDG3WdpNPGB3EL9O62nNJzKkKG0WYnYmjYta7PefO6QIKOrghINwgq1-55mc6mY7QeN1WG0EDxi4wKSl1ldlIljhfXdtGQDyVgs_WbeY1kPZKwQbow",
        },
        data: {
            product_type: "monthly", // optional
            action: "sale",
        },
    };
    return await axios
        .request({
            ...options,
            data: {
                email: email ?? "",
                name: name ?? "",
            },
        })
        .then(function (response) {
            console.log(response.data);
        });
};

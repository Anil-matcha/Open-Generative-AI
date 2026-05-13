import { useRouter } from "next/router";

export function usePersonalizedContent() {
    const router = useRouter();
    const MERGE_TAGS = [
        "|FNAME|",
        "|LNAME|",
        "|EMAIL|",
        "|JOB_TITLE|",
        "|COMPANY|",
        "|PHONE|",
        "|COUNTRY|",
    ];

    const MERGE_TAGS_FALLBACK = [
        { tag: "|FNAME|", fallback: "There" },
        { tag: "|LNAME|", fallback: "Friend" },
        { tag: "|EMAIL|", fallback: "" },
        { tag: "|JOB_TITLE|", fallback: "Your profession" },
        { tag: "|COMPANY|", fallback: "Your company" },
        { tag: "|PHONE|", fallback: "" },
        { tag: "|COUNTRY|", fallback: "" },
    ];

    const routerQuery = [
        "fname",
        "lname",
        "email",
        "job_title",
        "company",
        "phone",
        "country",
    ];
    const personalizedContent = (title: string) => {
        //replace the merge tags with the values from the query params and return the personalized title and fallback values
        MERGE_TAGS.forEach((tag, index) => {
            if (router.query[routerQuery[index]]) {
                title = title?.replace(
                    tag,
                    router.query[routerQuery[index]] as string,
                );
            } else {
                title = title?.replace(
                    tag,
                    MERGE_TAGS_FALLBACK[index].fallback,
                );
            }
        });

        return title;
    };

    return {
        personalizedContent,
    };
}

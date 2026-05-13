import moment from "moment";

export const isTrialExpired = (trialStart: string, status: string) => {
    // trialEnd format is like 2024-04-30 this. return true if trail is ended else false. Trial should end after 14 days. compare trialEnd with current date.
    const currentDate = moment(new Date());
    const trialEndDate = moment(new Date(trialStart));

    return currentDate.diff(trialEndDate, "days") > 7 ? true : false;
};
export const isRestExpired = (resetStart: string) => {
    // trialEnd format is like 2024-04-30 this. return true if trail is ended else false. Trial should end after 14 days. compare trialEnd with current date.
    const currentDate = moment(new Date());
    const trialEndDate = moment(new Date(resetStart));

    return currentDate.diff(trialEndDate, "days") > 30 ? true : false;
};

export const daysLeftInTrial = (trialStart: string) => {
    // trialEnd format is like 2024-04-30 this. return true if trail is ended else false. Trial should end after 14 days. compare trialEnd with current date.
    const currentDate = moment(new Date());
    const trialEndDate = moment(new Date(trialStart));

    return 7 - currentDate.diff(trialEndDate, "days");
};

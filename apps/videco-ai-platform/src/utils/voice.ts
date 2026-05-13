const supportedLanguages = {
    en: "english",
    fr: "french",
    sp: "spanish",
    de: "german",
    pt_br: "portuguese_br",
    pt_pt: "portuguese",
    nl: "dutch",
    it: "italian",
    tr: "turkish",
    se: "swedish",
    pl: "polish",
    dk: "danish",
    no: "norwegian",
};

const CLONE_HELPER_TEXT_EN =
    "Hello There, If I had superpowers, I would fly through space at the speed of light, rescue kittens from tall trees, drink coffee with aliens on Mars, and still make it back in time for breakfast. Who knows, maybe I’d even teach a robot how to dance!";
const CLONE_HELPER_TEXT_DE =
    "Hallo, wenn ich Superkräfte hätte, würde ich mit Lichtgeschwindigkeit durch den Weltraum fliegen, Kätzchen aus hohen Bäumen retten, mit Außerirdischen auf dem Mars Kaffee trinken und es immer noch rechtzeitig zum Frühstück zurückschaffen. Wer weiß, vielleicht würde ich sogar einem Roboter das Tanzen beibringen!";

const CLONE_HELPER_TEXT_FR =
    "Bonjour ! Si j'avais des superpouvoirs, je volerais dans l'espace à la vitesse de la lumière, je sauverais des chatons coincés dans de grands arbres, je boirais un café avec des extraterrestres sur Mars, et je serais quand même de retour à temps pour le petit-déjeuner. Qui sait, je pourrais même apprendre à un robot à danser !";

const CLONE_HELPER_TEXT_SP =
    "¡Hola! Si tuviera superpoderes, volaría por el espacio a la velocidad de la luz, rescataría gatitos de árboles altos, tomaría café con extraterrestres en Marte, y aún así llegaría a tiempo para el desayuno. ¿Quién sabe? ¡Quizás incluso le enseñaría a un robot a bailar!";

const CLONE_HELPER_TEXT_PT_BR =
    "Olá! Se eu tivesse superpoderes, eu voaria pelo espaço na velocidade da luz, resgataria gatinhos de árvores altas, tomaria café com alienígenas em Marte e ainda voltaria a tempo para o café da manhã. Quem sabe, talvez eu até ensinasse um robô a dançar!";
const CLONE_HELPER_TEXT_PT_PT =
    "Olá, Se eu tivesse superpoderes, voaria pelo espaço à velocidade da luz, salvaria gatinhos de árvores altas, beberia café com extraterrestres em Marte e ainda chegaria a tempo do pequeno-almoço. Quem sabe, talvez até ensinasse um robot a dançar!";
const CLONE_HELPER_TEXT_NL =
    "Hallo daar, Als ik superkrachten had, zou ik met de snelheid van het licht door de ruimte vliegen, katjes uit hoge bomen redden, koffie drinken met aliens op Mars en nog op tijd terug zijn voor het ontbijt. Wie weet zou ik zelfs een robot leren dansen!";
const CLONE_HELPER_TEXT_IT =
    "Ciao a tutti, se avessi dei superpoteri, volerei nello spazio alla velocità della luce, salverei dei gattini da alberi altissimi, berrei un caffè con gli alieni su Marte e tornerei comunque in tempo per la colazione. Chissà, forse insegnerei anche a un robot a ballare!";
const CLONE_HELPER_TEXT_TR =
    "Merhaba, Eğer süper güçlerim olsaydı, uzayda ışık hızında uçar, yüksek ağaçlardan kedi yavrularını kurtarır, Mars'ta uzaylılarla kahve içer ve yine de kahvaltıya zamanında yetişirdim. Kim bilir, belki bir robota nasıl dans edileceğini bile öğretirdim!";
const CLONE_HELPER_TEXT_SE =
    "Hallå där, om jag hade superkrafter skulle jag flyga genom rymden med ljusets hastighet, rädda kattungar från höga träd, dricka kaffe med utomjordingar på Mars och ändå hinna tillbaka i tid till frukosten. Vem vet, kanske skulle jag till och med lära en robot att dansa!";
const CLONE_HELPER_TEXT_PL =
    "Witaj, Gdybym miał supermoce, latałbym w kosmosie z prędkością światła, ratowałbym kocięta z wysokich drzew, piłbym kawę z kosmitami na Marsie i wciąż zdążyłbym na śniadanie. Kto wie, może nawet nauczyłbym robota tańczyć!";
const CLONE_HELPER_TEXT_DK =
    "Hejsa, hvis jeg havde superkræfter, ville jeg flyve gennem rummet med lysets hastighed, redde killinger ned fra høje træer, drikke kaffe med rumvæsner på Mars og stadig nå tilbage i tide til morgenmaden. Hvem ved, måske ville jeg endda lære en robot at danse!";
const CLONE_HELPER_TEXT_NO =
    "Hallo, hvis jeg hadde superkrefter, ville jeg fly gjennom verdensrommet med lysets hastighet, redde kattunger fra høye trær, drikke kaffe med romvesener på Mars og likevel rekke tilbake i tide til frokost. Hvem vet, kanskje jeg til og med ville lære en robot å danse!";

export const greetings = {
    en: ["Hello", "Hey", "Hi", "Dear"],
    fr: ["Bonjour", "Hé", "Salut"],
    de: ["Hallo", "Hi", "Guten Tag"],
    sp: ["Hola", "¿Aló?", "Buenas"],
    pt_br: ["Olá", "Ei", "Oi"],
    pt_pt: ["Olá", "Ei", "Hei"],
    nl: ["Hallo", "Dag", "Hoi"],
    it: ["Ciao", "Ehi", "Buongirono"],
    tr: ["Merhaba", "Selam.", "Alo"],
    se: ["Hej", "Hallå", "God dag"],
    pl: ["Witam", "Cześć", "Witaj"],
    dk: ["Hej", "Goddag", "Hejsa"],
    no: ["Hei", "Hallo", "God dag"],
};
const voice_text = {
    en: "Hello, This is your cloned voice. How are you?",
    fr: "Bonjour, c'est votre voix clonée. Comment allez-vous ?",
    de: "Hallo, hier ist deine geklonte Stimme. Wie geht es dir?",
    sp: "Hola, esta es tu voz clonada. ¿Como estas?",
    pt_br: "Olá, aqui é sua voz clonada. Como você está?",
    pt_pt: "Olá, esta é a tua voz clonada. Como é que está?",
    nl: "Hallo, dit is je gekloonde stem. Hoe gaat het met je?",
    it: "Ciao, questa è la tua voce clonata. Come stai?",
    tr: "Merhaba, ben klonlanmış sesiniz. Nasılsınız?",
    se: "Hej, det här är din klonade röst. Hur är det med dig?",
    pl: "Halo, tu twój sklonowany głos. Jak się masz?",
    dk: "Hej, dette er din klonede stemme. Hvordan har du det?",
    no: "Hallo, dette er din klonede stemme. Hvordan går det med deg?",
};

export const the_greeting = (language, custom: any = false) => {
    switch (language) {
        case supportedLanguages.en:
            return custom ? custom : greetings.en[0];
        case supportedLanguages.fr:
            return custom ? custom : greetings.fr[0];
        case supportedLanguages.sp:
            return custom ? custom : greetings.sp[0];
        case supportedLanguages.pt_br:
            return custom ? custom : greetings.pt_br[0];
        case supportedLanguages.pt_pt:
            return custom ? custom : greetings.pt_pt[0];
        case supportedLanguages.nl:
            return custom ? custom : greetings.nl[0];
        case supportedLanguages.it:
            return custom ? custom : greetings.it[0];
        case supportedLanguages.tr:
            return custom ? custom : greetings.tr[0];
        case supportedLanguages.se:
            return custom ? custom : greetings.se[0];
        case supportedLanguages.pl:
            return custom ? custom : greetings.pl[0];
        case supportedLanguages.de:
            return custom ? custom : greetings.de[0];
        case supportedLanguages.dk:
            return custom ? custom : greetings.dk[0];
        case supportedLanguages.no:
            return custom ? custom : greetings.no[0];
        default:
            return custom ? custom : greetings.en[0];
    }
};

export const the_text = (language) => {
    switch (language) {
        case supportedLanguages.en:
            return voice_text.en;
        case supportedLanguages.fr:
            return voice_text.fr;
        case supportedLanguages.sp:
            return voice_text.sp;
        case supportedLanguages.pt_br:
            return voice_text.pt_br;
        case supportedLanguages.pt_pt:
            return voice_text.pt_pt;
        case supportedLanguages.nl:
            return voice_text.nl;
        case supportedLanguages.it:
            return voice_text.it;
        case supportedLanguages.tr:
            return voice_text.tr;
        case supportedLanguages.se:
            return voice_text.se;
        case supportedLanguages.de:
            return voice_text.de;
        case supportedLanguages.pl:
            return voice_text.pl;
        case supportedLanguages.dk:
            return voice_text.dk;
        case supportedLanguages.no:
            return voice_text.no;
        default:
            return voice_text.en;
    }
};

export const reader = (language) => {
    switch (language) {
        case supportedLanguages.en:
            return CLONE_HELPER_TEXT_EN;
        case supportedLanguages.fr:
            return CLONE_HELPER_TEXT_FR;
        case supportedLanguages.sp:
            return CLONE_HELPER_TEXT_SP;
        case supportedLanguages.de:
            return CLONE_HELPER_TEXT_DE;
        case supportedLanguages.pt_br:
            return CLONE_HELPER_TEXT_PT_BR;
        case supportedLanguages.pt_pt:
            return CLONE_HELPER_TEXT_PT_PT;
        case supportedLanguages.nl:
            return CLONE_HELPER_TEXT_NL;
        case supportedLanguages.it:
            return CLONE_HELPER_TEXT_IT;
        case supportedLanguages.tr:
            return CLONE_HELPER_TEXT_TR;
        case supportedLanguages.se:
            return CLONE_HELPER_TEXT_SE;
        case supportedLanguages.pl:
            return CLONE_HELPER_TEXT_PL;
        case supportedLanguages.dk:
            return CLONE_HELPER_TEXT_DK;
        case supportedLanguages.no:
            return CLONE_HELPER_TEXT_NO;
        default:
            return CLONE_HELPER_TEXT_EN;
    }
};

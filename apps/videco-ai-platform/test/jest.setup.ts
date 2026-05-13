import "isomorphic-unfetch";
import nock from "nock";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

afterAll(() => {
    nock.cleanAll();
    nock.restore();
});

window.matchMedia = jest.fn().mockImplementation((query) => {
    return {
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
    };
});

window.scroll = jest.fn();
window.alert = jest.fn();

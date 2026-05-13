import { render } from "@testing-library/react";

import { Footer } from "./index";

describe("Footer component testing with testing-library", () => {
    it("renders without crashing", () => {
        const component = render(<Footer />);

        expect(component).toBeTruthy();
    });
});

import { render } from "@testing-library/react";
import { Logo } from "./index";

describe("Logo component testing with testing-library", () => {
    const component = render(<Logo />);

    it("renders without crashing", () => {
        expect(component).toBeTruthy();
    });
});

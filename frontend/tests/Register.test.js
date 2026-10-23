// Feature 1 — Spec: features/feature-1-user-auth.md
import { flushPromises } from "@vue/test-utils";
import Register from "../src/views/Register.vue";
import Auth from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";
vi.mock("../src/services/authServices.js", () => ({ default: { registerUser: vi.fn() } }));
let wrapper, router;
beforeEach(async () => {
  vi.clearAllMocks(); localStorage.clear();
  ({ wrapper, router } = await mountWithPlugins(Register));
});
afterEach(() => wrapper.unmount());
async function submit(values = {}) {
  const fields = { "First name": "Jane", "Last name": "Doe", Email: "jane@example.com", Username: "jdoe", Password: "password123", "Confirm password": "password123", ...values };
  for (const field of wrapper.findAllComponents({ name: "VTextField" })) {
    await field.find("input").setValue(fields[field.props("label")]);
  }
  await wrapper.find("form").trigger("submit"); await flushPromises();
}
describe("Feature 1 — Registration", () => {
  describe("US-1.1 — Registration", () => {
    it("User registers with valid information", async () => {
      Auth.registerUser.mockResolvedValue({ data: { fName: "Jane", token: "token" } });
      await submit();
      expect(Auth.registerUser).toHaveBeenCalledWith(expect.objectContaining({ email: "jane@example.com" }));
      expect(JSON.parse(localStorage.getItem("user")).token).toBe("token");
      expect(router.currentRoute.value.name).toBe("home");
    });
    for (const [title, values, message] of [
      ["User submits registration with missing email", { Email: "" }, "Email is required."],
      ["User submits registration with invalid email format", { Email: "notanemail" }, "Enter a valid email address."],
      ["User submits registration with missing username", { Username: " " }, "Username is required."],
      ["User submits registration with password too short", { Password: "short", "Confirm password": "short" }, "Password must be at least 8 characters."],
      ["User submits registration with mismatched passwords", { "Confirm password": "different" }, "Passwords do not match."],
    ]) it(title, async () => {
      await submit(values); expect(Auth.registerUser).not.toHaveBeenCalled(); expect(wrapper.text()).toContain(message);
    });
    for (const [field, message] of [["username", "Username is already taken."], ["email", "Email is already registered."]]) {
      it(`User registers with a duplicate ${field}`, async () => {
        Auth.registerUser.mockRejectedValue({ response: { data: { message } } });
        await submit(); expect(wrapper.findComponent({ name: "VAlert" }).text()).toContain(message);
      });
    }
  });
});

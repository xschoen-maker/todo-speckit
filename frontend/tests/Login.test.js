// Feature 1 — Spec: features/feature-1-user-auth.md
import { flushPromises } from "@vue/test-utils";
import Login from "../src/views/Login.vue";
import Auth from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";
vi.mock("../src/services/authServices.js", () => ({ default: { loginUser: vi.fn() } }));
let wrapper, router;
beforeEach(async () => { vi.clearAllMocks(); localStorage.clear(); ({ wrapper, router } = await mountWithPlugins(Login)); });
afterEach(() => wrapper.unmount());
async function submit(username = "jdoe", password = "password123") {
  await wrapper.findAll("input")[0].setValue(username); await wrapper.findAll("input")[1].setValue(password);
  await wrapper.find("form").trigger("submit"); await flushPromises();
}
describe("Feature 1 — Login", () => {
  describe("US-1.2 — Sign in", () => {
    it("User signs in with valid credentials", async () => {
      Auth.loginUser.mockResolvedValue({ data: { token: "valid", fName: "Jane" } }); await submit();
      expect(JSON.parse(localStorage.getItem("user")).token).toBe("valid"); expect(router.currentRoute.value.name).toBe("home");
    });
    it("User signs in with invalid password", async () => {
      Auth.loginUser.mockRejectedValue({ response: { data: { message: "Invalid username or password." } } }); await submit();
      expect(wrapper.findComponent({ name: "VAlert" }).text()).toContain("Invalid username or password.");
      expect(localStorage.getItem("user")).toBeNull();
    });
    it("User signs in with missing username", async () => {
      await submit(""); expect(Auth.loginUser).not.toHaveBeenCalled(); expect(wrapper.text()).toContain("Username is required.");
    });
    it("User signs in with missing password", async () => {
      await submit("jdoe", ""); expect(Auth.loginUser).not.toHaveBeenCalled(); expect(wrapper.text()).toContain("Password is required.");
    });
    it("shows loading while the login request is pending", async () => {
      let finish; Auth.loginUser.mockReturnValue(new Promise(resolve => { finish = resolve; }));
      await submit(); expect(wrapper.find('button[type="submit"]').classes()).toContain("v-btn--loading");
      finish({ data: { token: "valid" } }); await flushPromises();
    });
  });
});

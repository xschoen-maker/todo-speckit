// Feature 4 — Spec: features/feature-4-user-profile-management.md
import { flushPromises } from "@vue/test-utils";
import Menu from "../src/components/MenuBar.vue";
import Users from "../src/services/userServices.js";
import Auth from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";
vi.mock("../src/services/userServices.js", () => ({ default: { getUser: vi.fn(), updateUser: vi.fn() } }));
vi.mock("../src/services/authServices.js", () => ({ default: { logoutUser: vi.fn() } }));
const user = { userId: 1, fName: "Jane", lName: "Doe", email: "jane@example.com", username: "jdoe", token: "token" };
const dialog = { props: ["modelValue"], template: '<section v-if="modelValue" role="dialog"><slot /></section>' };
const menu = { props: ["modelValue"], template: '<div><slot name="activator" :props="{ onClick: () => $emit(\'update:modelValue\', !modelValue) }" /><section v-if="modelValue"><slot /></section></div>' };
let wrapper, router;
beforeEach(async () => {
  vi.clearAllMocks(); localStorage.setItem("user", JSON.stringify(user)); Users.getUser.mockResolvedValue({ data: { ...user, id: 1 } });
  ({ wrapper, router } = await mountWithPlugins(Menu, { global: { stubs: {
    VMenu: menu, VDialog: dialog, VAppBar: { template: '<header><slot /></header>' },
  } } }));
});
afterEach(() => wrapper?.unmount());
async function button(text) { await wrapper.findAll("button").find(b => b.text() === text).trigger("click"); await flushPromises(); }
async function edit() { await wrapper.find('[aria-label="Open profile"]').trigger("click"); await button("Edit Profile"); }
async function field(label, value) { await wrapper.findAllComponents({ name: "VTextField" }).find(f => f.props("label") === label).find("input").setValue(value); }
describe("Feature 4 — Profile menu", () => {
  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      await wrapper.find('[aria-label="Open profile"]').trigger("click");
      for (const text of ["Jane Doe", "jdoe", "jane@example.com", "Edit Profile", "Log out"]) expect(wrapper.text()).toContain(text);
    });
  });
  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      await edit(); expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
      expect(wrapper.findAll("input").map(i => i.element.value)).toContain("Jane");
    });
    it("User cancels the edit profile dialog", async () => {
      await edit(); await field("First name", "Changed"); await button("Cancel");
      expect(Users.updateUser).not.toHaveBeenCalled(); expect(JSON.parse(localStorage.getItem("user")).fName).toBe("Jane");
    });
    it("User saves profile changes", async () => {
      await edit(); await field("First name", "Janet"); Users.updateUser.mockResolvedValue({ data: { ...user, id: 1, fName: "Janet" } }); await button("Save");
      expect(Users.updateUser).toHaveBeenCalledWith(1, expect.objectContaining({ fName: "Janet" }));
      const stored = JSON.parse(localStorage.getItem("user")); expect(stored).toMatchObject({ fName: "Janet", userId: 1, token: "token" });
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    });
    for (const [name, values, message] of [
      ["User saves profile with invalid email format", { Email: "notanemail" }, "Enter a valid email address."],
      ["User saves profile with mismatched passwords", { "New password (optional)": "password123", "Confirm password": "different" }, "Passwords do not match."],
      ["User saves profile with a password that is too short", { "New password (optional)": "short", "Confirm password": "short" }, "Password must be at least 8 characters."],
    ]) it(name, async () => {
      await edit(); for (const [label, value] of Object.entries(values)) await field(label, value); await button("Save");
      expect(Users.updateUser).not.toHaveBeenCalled(); expect(wrapper.text()).toContain(message);
    });
    it("Profile update API returns an error", async () => {
      await edit(); Users.updateUser.mockRejectedValue({ response: { data: { message: "Unable to save." } } }); await button("Save");
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true); expect(wrapper.text()).toContain("Unable to save.");
    });
  });
  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      await wrapper.find('[aria-label="Open profile"]').trigger("click"); Auth.logoutUser.mockResolvedValue({});
      await wrapper.findAllComponents({ name: "VListItem" }).find(i => i.props("title") === "Log out").trigger("click"); await flushPromises();
      expect(Auth.logoutUser).toHaveBeenCalled(); expect(localStorage.getItem("user")).toBeNull(); expect(router.currentRoute.value.name).toBe("login");
    });
  });
  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", () => { expect(wrapper.text()).not.toContain("Sign out"); });
  });
});

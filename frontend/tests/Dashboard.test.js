// Feature 2 — Spec: features/feature-2-todo-list-management.md
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import Lists from "../src/services/listServices.js";
import { mountWithPlugins } from "./testUtils.js";
vi.mock("../src/services/listServices.js", () => ({ default: {
  getLists: vi.fn(), createList: vi.fn(), updateList: vi.fn(), deleteList: vi.fn(),
} }));
export const dialogStub = { props: ["modelValue"], template: '<section v-if="modelValue" role="dialog"><slot /></section>' };
let wrapper;
beforeEach(async () => {
  vi.clearAllMocks(); Lists.getLists.mockResolvedValue({ data: [{ id: 1, name: "Groceries" }] });
  ({ wrapper } = await mountWithPlugins(Dashboard, { global: { stubs: { VDialog: dialogStub } } })); await flushPromises();
});
afterEach(() => wrapper.unmount());
async function button(text) {
  const found = wrapper.findAll("button").find(b => b.text() === text);
  expect(found, `button ${text}`).toBeTruthy(); await found.trigger("click"); await flushPromises();
}
async function field(label, value) {
  const control = wrapper.findAllComponents({ name: "VTextField" }).find(f => f.props("label") === label);
  await control.find("input").setValue(value);
}
describe("Feature 2 — Lists dashboard", () => {
  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      await button("+ New List"); await field("List name", "New list");
      Lists.createList.mockResolvedValue({ data: { id: 2, name: "New list" } });
      Lists.getLists.mockResolvedValue({ data: [{ id: 2, name: "New list" }] });
      await button("Create"); expect(Lists.createList).toHaveBeenCalledWith({ name: "New list" });
      expect(wrapper.text()).toContain("New list"); expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    });
    it("User creates a list with an empty name", async () => {
      await button("+ New List"); await field("List name", " "); await button("Create");
      expect(Lists.createList).not.toHaveBeenCalled(); expect(wrapper.text()).toContain("List name is required.");
    });
  });
  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", () => { expect(wrapper.text()).toContain("Groceries"); });
    it("User has no lists", async () => {
      Lists.getLists.mockResolvedValue({ data: [] });
      wrapper.unmount(); ({ wrapper } = await mountWithPlugins(Dashboard)); await flushPromises();
      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });
  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", () => {
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });
  });
  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      await wrapper.find('[aria-label="Edit list"]').trigger("click"); await flushPromises();
      await field("List name", "Shopping"); Lists.updateList.mockResolvedValue({ data: {} });
      Lists.getLists.mockResolvedValue({ data: [{ id: 1, name: "Shopping" }] }); await button("Save");
      expect(Lists.updateList).toHaveBeenCalledWith(1, { name: "Shopping" }); expect(wrapper.text()).toContain("Shopping");
    });
    it("User deletes a list", async () => {
      await wrapper.find('[aria-label="Delete list"]').trigger("click"); await flushPromises();
      Lists.deleteList.mockResolvedValue({}); Lists.getLists.mockResolvedValue({ data: [] }); await button("Delete");
      expect(Lists.deleteList).toHaveBeenCalledWith(1); expect(wrapper.text()).not.toContain("Groceries");
    });
  });
});

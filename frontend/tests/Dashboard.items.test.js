// Feature 3 — Spec: features/feature-3-todo-list-item-management.md
import { flushPromises } from "@vue/test-utils";
import Items from "../src/components/ItemsDialog.vue";
import Dashboard from "../src/views/Dashboard.vue";
import Todos from "../src/services/todoServices.js";
import Lists from "../src/services/listServices.js";
import { mountWithPlugins } from "./testUtils.js";
vi.mock("../src/services/todoServices.js", () => ({ default: { getTodos: vi.fn(), createTodo: vi.fn(), updateTodo: vi.fn(), deleteTodo: vi.fn() } }));
vi.mock("../src/services/listServices.js", () => ({ default: { getLists: vi.fn() } }));
const stub = { props: ["modelValue"], template: '<section v-if="modelValue" role="dialog"><slot /></section>' };
const task = { id: 10, title: "Buy milk", completed: false };
let wrapper;
beforeEach(async () => {
  vi.clearAllMocks(); Todos.getTodos.mockResolvedValue({ data: [{ ...task }] });
  ({ wrapper } = await mountWithPlugins(Items, { props: { list: { id: 1, name: "Groceries" } }, global: { stubs: { VDialog: stub } } })); await flushPromises();
});
afterEach(() => wrapper.unmount());
async function button(text) {
  const found = wrapper.findAll("button").find(b => b.text() === text); expect(found).toBeTruthy();
  await found.trigger("click"); await flushPromises();
}
async function title(value) { await wrapper.findAllComponents({ name: "VTextField" }).find(f => f.props("label") === "Todo title").find("input").setValue(value); }
async function date(value) { await wrapper.find('input[type="date"]').setValue(value); }
describe("Feature 5 — Todo due dates (features/feature-5-todo-due-date.md)", () => {
  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      await button("+ Add Item"); await title("Buy milk"); await date("2026-07-15");
      Todos.createTodo.mockResolvedValue({}); Todos.getTodos.mockResolvedValue({ data: [{ ...task, dueDate: "2026-07-15" }] }); await button("Add");
      expect(Todos.createTodo).toHaveBeenCalledWith(1, { title: "Buy milk", dueDate: "2026-07-15" }); expect(wrapper.find('[data-testid="due-date"]').text()).toContain("2026");
    });
  });
  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      await wrapper.find('[aria-label="Edit todo"]').trigger("click"); await flushPromises(); await date("2026-07-20");
      Todos.updateTodo.mockResolvedValue({}); Todos.getTodos.mockResolvedValue({ data: [{ ...task, dueDate: "2026-07-20" }] }); await button("Save");
      expect(Todos.updateTodo).toHaveBeenCalledWith(10, { title: "Buy milk", dueDate: "2026-07-20" }); expect(wrapper.find('[data-testid="due-date"]').exists()).toBe(true);
    });
    it("User clears a due date when editing a todo", async () => {
      Todos.getTodos.mockResolvedValue({ data: [{ ...task, dueDate: "2026-07-20" }] });
      await wrapper.setProps({ list: { id: 2, name: "Other" } }); await flushPromises();
      await wrapper.find('[aria-label="Edit todo"]').trigger("click"); await flushPromises(); expect(wrapper.find('input[type="date"]').element.value).toBe("2026-07-20");
      await date(""); Todos.updateTodo.mockResolvedValue({}); Todos.getTodos.mockResolvedValue({ data: [{ ...task, dueDate: null }] }); await button("Save");
      expect(Todos.updateTodo).toHaveBeenCalledWith(10, { title: "Buy milk", dueDate: null }); expect(wrapper.find('[data-testid="due-date"]').exists()).toBe(false);
    });
  });
  describe("US-5.4 — Spot overdue todos", () => {
    for (const [completed, name] of [[false, "Incomplete todo past due date is styled as overdue"], [true, "Completed todo past due date is not styled as overdue"]]) {
      it(name, async () => {
        vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-23T12:00:00"));
        try {
          Todos.getTodos.mockResolvedValue({ data: [{ ...task, completed, dueDate: "2026-10-22" }] });
          await wrapper.setProps({ list: { id: 2, name: "Other" } }); await flushPromises();
          expect(wrapper.find('[data-testid="due-date"]').classes().includes("text-error")).toBe(!completed);
        } finally { vi.useRealTimers(); }
      });
    }
  });
});
describe("Feature 3 — Todo dialogs", () => {
  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      await button("+ Add Item"); await title("New task"); Todos.createTodo.mockResolvedValue({});
      Todos.getTodos.mockResolvedValue({ data: [{ id: 11, title: "New task", completed: false }] }); await button("Add");
      expect(Todos.createTodo).toHaveBeenCalledWith(1, { title: "New task", dueDate: null }); expect(wrapper.text()).toContain("New task");
    });
    it("User adds a todo with an empty title", async () => {
      await button("+ Add Item"); await title(" "); await button("Add");
      expect(Todos.createTodo).not.toHaveBeenCalled(); expect(wrapper.text()).toContain("Todo title is required.");
    });
    it("Add item is only available inside the items dialog", async () => {
      wrapper.unmount(); Lists.getLists.mockResolvedValue({ data: [{ id: 1, name: "Groceries" }] });
      ({ wrapper } = await mountWithPlugins(Dashboard, { global: { stubs: { VDialog: stub } } })); await flushPromises();
      expect(wrapper.text()).not.toContain("+ Add Item"); expect(wrapper.find('[aria-label="View items for Groceries"]').exists()).toBe(true);
    });
  });
  describe("US-3.2 — View tasks in a list", () => {
    it("List items dialog shows empty state", async () => {
      Todos.getTodos.mockResolvedValue({ data: [] }); await wrapper.setProps({ list: { id: 2, name: "Personal" } }); await flushPromises();
      expect(wrapper.text()).toContain("No todos in this list yet.");
    });
    it("User opens items for different lists", async () => {
      Todos.getTodos.mockResolvedValue({ data: [{ id: 20, title: "Call mom" }] });
      await wrapper.setProps({ list: { id: 2, name: "Personal" } }); await flushPromises();
      expect(Todos.getTodos).toHaveBeenLastCalledWith(2); expect(wrapper.text()).toContain("Call mom"); expect(wrapper.text()).not.toContain("Buy milk");
    });
  });
  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      Todos.updateTodo.mockResolvedValue({}); Todos.getTodos.mockResolvedValue({ data: [{ ...task, completed: true }] });
      await wrapper.find('input[type="checkbox"]').setValue(true); await flushPromises();
      expect(Todos.updateTodo).toHaveBeenCalledWith(10, { completed: true });
      expect(wrapper.find(".text-decoration-line-through").text()).toBe("Buy milk");
    });
  });
  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      await wrapper.find('[aria-label="Edit todo"]').trigger("click"); await flushPromises(); await title("Buy oat milk");
      Todos.updateTodo.mockResolvedValue({}); Todos.getTodos.mockResolvedValue({ data: [{ ...task, title: "Buy oat milk" }] }); await button("Save");
      expect(Todos.updateTodo).toHaveBeenCalledWith(10, { title: "Buy oat milk", dueDate: null }); expect(wrapper.text()).toContain("Buy oat milk");
    });
    it("User deletes a todo", async () => {
      await wrapper.find('[aria-label="Delete todo"]').trigger("click"); await flushPromises();
      Todos.deleteTodo.mockResolvedValue({}); Todos.getTodos.mockResolvedValue({ data: [] }); await button("Delete");
      expect(Todos.deleteTodo).toHaveBeenCalledWith(10); expect(wrapper.text()).not.toContain("Buy milk");
    });
  });
});

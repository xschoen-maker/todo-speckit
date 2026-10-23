// Feature 1 — Spec: features/feature-1-user-auth.md
import client from "../src/services/services.js";
import router from "../src/router.js";
vi.mock("../src/router.js", () => ({ default: { push: vi.fn(), hasRoute: () => true } }));
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
describe("Feature 1 — API session handling", () => {
  describe("US-1.3 — Stay signed in across page loads", () => {
    it("API request includes session token", async () => {
      localStorage.setItem("user", JSON.stringify({ token: "session-token" }));
      let header;
      await client.get("lists", { adapter: async config => {
        header = config.headers.Authorization; return { data: [], status: 200, statusText: "OK", headers: {}, config };
      } });
      expect(header).toBe("Bearer session-token");
    });
    it("Expired or invalid session token", async () => {
      localStorage.setItem("user", JSON.stringify({ token: "expired" }));
      await expect(client.get("lists", { adapter: async () => { throw { response: { status: 401, data: { message: "Unauthorized! Token expired." } } }; } })).rejects.toBeTruthy();
      expect(localStorage.getItem("user")).toBeNull(); expect(router.push).toHaveBeenCalledWith({ name: "login" });
    });
  });
});

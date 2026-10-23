// Feature 1 — Spec: features/feature-1-user-auth.md
import router from "../src/router.js";
beforeEach(() => localStorage.clear());
describe("Feature 1 — Router guards", () => {
  describe("US-1.3 — Stay signed in across page loads", () => {
    it("Signed-in user visits login page", async () => {
      localStorage.setItem("user", JSON.stringify({ token: "valid" }));
      await router.push("/login"); expect(router.currentRoute.value.name).toBe("home");
    });
  });
  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      await router.push("/register");
      await router.push("/"); expect(router.currentRoute.value.name).toBe("login");
    });
  });
});

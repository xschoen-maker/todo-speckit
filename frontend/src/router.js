import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import Login from "./views/Login.vue";
import Register from "./views/Register.vue";
import Utils from "./config/utils.js";

const publicRouteNames = new Set(["login", "register"]);

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/register",
      name: "register",
      component: Register,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "home" },
    },
  ],
});

router.beforeEach((to) => {
  const user = Utils.getStore("user")?.token;

  if (user && to.name === "login") {
    return { name: "home" };
  }

  if (!user && !publicRouteNames.has(to.name)) {
    return { name: "login" };
  }

  return true;
});

export default router;

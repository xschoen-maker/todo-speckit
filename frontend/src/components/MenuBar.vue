<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import Auth from "../services/authServices.js";
import Utils from "../config/utils.js";
const router = useRouter(), user = ref(Utils.getStore("user")), busy = ref(false), error = ref("");
async function logout() {
  busy.value = true; error.value = "";
  try { await Auth.logoutUser(); Utils.removeItem("user"); await router.push({ name: "login" }); }
  catch (e) { error.value = e.response?.data?.message || "Unable to sign out. Try again."; }
  finally { busy.value = false; }
}
</script>
<template>
  <v-app-bar flat border>
    <v-app-bar-title class="text-primary font-weight-bold">Todo</v-app-bar-title>
    <span class="mr-4">{{ user?.fName }} {{ user?.lName }}</span>
    <v-btn class="oc-cta mr-4" color="primary" :loading="busy" @click="logout">Sign out</v-btn>
  </v-app-bar>
  <v-alert v-if="error" type="error">{{ error }}</v-alert>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const loading = ref(false);
const errorMessage = ref("");
const user = computed(() => Utils.getStore("user"));
const firstName = computed(() => user.value?.fName || "there");

async function signOut() {
  errorMessage.value = "";
  loading.value = true;
  try {
    await AuthServices.logoutUser();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to sign out.";
  } finally {
    Utils.removeItem("user");
    loading.value = false;
    router.push({ name: "login" });
  }
}
</script>

<template>
  <v-container class="py-10">
    <v-alert v-if="errorMessage" type="error" class="mb-4">
      {{ errorMessage }}
    </v-alert>
    <h1 class="text-h4 mb-4">Welcome, {{ firstName }}</h1>
    <p class="text-body-1 mb-6">You are signed in. List management arrives in a later feature.</p>
    <v-btn color="primary" variant="elevated" class="oc-cta" :loading="loading" @click="signOut">
      Sign out
    </v-btn>
  </v-container>
</template>

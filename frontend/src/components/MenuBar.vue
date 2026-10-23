<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import Auth from "../services/authServices.js";
import Utils from "../config/utils.js";
import Users from "../services/userServices.js";
import { emailRules } from "../config/validation.js";
const router = useRouter(), user = ref(Utils.getStore("user")), busy = ref(false), error = ref("");
const menu = ref(false), editing = ref(false), form = ref(null);
const fields = reactive({ fName: "", lName: "", email: "", username: "", password: "", confirmPassword: "" });
const required = label => [v => !!v?.trim() || `${label} is required.`];
const passwordRules = [v => !v || v.length >= 8 || "Password must be at least 8 characters."];
const confirmRules = [v => v === fields.password || "Passwords do not match."];
async function editProfile() {
  menu.value = false; editing.value = true; error.value = "";
  Object.assign(fields, user.value, { password: "", confirmPassword: "" });
  busy.value = true;
  try { Object.assign(fields, (await Users.getUser(user.value.userId)).data); }
  catch (e) { error.value = e.response?.data?.message || "Unable to load profile."; }
  finally { busy.value = false; }
}
async function saveProfile() {
  if (!(await form.value.validate()).valid) return;
  busy.value = true; error.value = "";
  const data = { fName: fields.fName.trim(), lName: fields.lName.trim(), email: fields.email.trim(), username: fields.username.trim() };
  if (fields.password) data.password = fields.password;
  try {
    const response = await Users.updateUser(user.value.userId, data);
    user.value = { ...user.value, ...response.data, userId: user.value.userId };
    Utils.setStore("user", user.value); editing.value = false;
  } catch (e) { error.value = e.response?.data?.message || "Unable to save profile."; }
  finally { busy.value = false; }
}
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
    <v-menu v-model="menu" :close-on-content-click="false">
      <template #activator="{ props }"><v-btn v-bind="props" icon="mdi-account-circle" aria-label="Open profile" class="mr-4" /></template>
      <v-card min-width="280" class="pa-4">
        <v-list-item :title="`${user?.fName} ${user?.lName}`">
          <p>{{ user?.username }}</p><p>{{ user?.email }}</p>
        </v-list-item>
        <v-btn color="primary" class="oc-cta mt-2" @click="editProfile">Edit Profile</v-btn>
        <v-list><v-list-item title="Log out" @click="logout" :disabled="busy" /></v-list>
      </v-card>
    </v-menu>
  </v-app-bar>
  <v-alert v-if="error && !editing" type="error">{{ error }}</v-alert>
  <v-dialog v-model="editing" max-width="560">
    <v-card>
      <v-card-title>Edit Profile</v-card-title>
      <v-card-text>
        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
        <v-form ref="form" @submit.prevent="saveProfile">
          <v-text-field v-model="fields.fName" label="First name" :rules="required('First name')" />
          <v-text-field v-model="fields.lName" label="Last name" :rules="required('Last name')" />
          <v-text-field v-model="fields.email" label="Email" type="email" :rules="emailRules" />
          <v-text-field v-model="fields.username" label="Username" :rules="required('Username')" />
          <v-text-field v-model="fields.password" label="New password (optional)" type="password" :rules="passwordRules" autocomplete="new-password" />
          <v-text-field v-model="fields.confirmPassword" label="Confirm password" type="password" :rules="confirmRules" autocomplete="new-password" />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn color="secondary" :disabled="busy" @click="editing = false">Cancel</v-btn>
        <v-btn color="primary" variant="elevated" class="oc-cta" :loading="busy" @click="saveProfile">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

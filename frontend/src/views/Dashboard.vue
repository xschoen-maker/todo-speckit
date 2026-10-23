<script setup>
import { ref, onMounted } from "vue";
import Lists from "../services/listServices.js";
import ItemsDialog from "../components/ItemsDialog.vue";
const itemsList = ref(null);
const lists = ref([]), loading = ref(false), saving = ref(false), error = ref("");
const dialog = ref(false), mode = ref("create"), selected = ref(null), name = ref(""), form = ref(null);
const nameRules = [v => !!v?.trim() || "List name is required.", v => !v || v.trim().length <= 100 || "List name must be 100 characters or fewer."];
async function loadLists() {
  loading.value = true; error.value = "";
  try { lists.value = (await Lists.getLists()).data; }
  catch (e) { error.value = e.response?.data?.message || "Unable to load lists."; }
  finally { loading.value = false; }
}
function openList(action, list = null) {
  mode.value = action; selected.value = list; name.value = list?.name || ""; error.value = ""; dialog.value = true;
}
async function saveList() {
  if (mode.value !== "delete" && !(await form.value.validate()).valid) return;
  saving.value = true; error.value = "";
  try {
    if (mode.value === "delete") await Lists.deleteList(selected.value.id);
    else if (mode.value === "edit") await Lists.updateList(selected.value.id, { name: name.value.trim() });
    else await Lists.createList({ name: name.value.trim() });
    dialog.value = false; await loadLists();
  } catch (e) { error.value = e.response?.data?.message || "Unable to save list."; }
  finally { saving.value = false; }
}
onMounted(loadLists);
</script>
<template>
  <v-container class="py-8" max-width="960">
    <ItemsDialog :list="itemsList" @close="itemsList = null" />
    <v-card elevation="2">
      <v-card-item>
        <h1 class="text-h4">My Lists</h1>
        <template #append><v-btn color="primary" class="oc-cta" @click="openList('create')">+ New List</v-btn></template>
      </v-card-item>
      <v-card-text>
        <v-alert v-if="error && !dialog" type="error" class="mb-4">{{ error }}</v-alert>
        <v-progress-linear v-if="loading" indeterminate aria-label="Loading lists" />
        <p v-else-if="!lists.length">No lists yet. Create your first list.</p>
        <v-list v-else>
          <v-list-item v-for="list in lists" :key="list.id" :title="list.name" :data-list-id="list.id" border rounded="lg" class="mb-2">
            <template #append>
              <v-btn icon="mdi-format-list-checks" size="small" variant="text" :aria-label="`View items for ${list.name}`" @click="itemsList = list" />
              <v-btn icon="mdi-pencil-outline" size="small" variant="text" aria-label="Edit list" @click="openList('edit', list)" />
              <v-btn icon="mdi-delete-outline" size="small" variant="text" aria-label="Delete list" @click="openList('delete', list)" />
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
    <v-dialog v-model="dialog" max-width="480">
      <v-card>
        <v-card-title>{{ mode === 'delete' ? 'Delete list' : mode === 'edit' ? 'Rename list' : 'New list' }}</v-card-title>
        <v-card-text>
          <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
          <p v-if="mode === 'delete'">Delete “{{ selected?.name }}”?</p>
          <v-form v-else ref="form" @submit.prevent="saveList">
            <v-text-field v-model="name" label="List name" :rules="nameRules" autofocus />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn color="secondary" :disabled="saving" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="saving" @click="saveList">{{ mode === 'delete' ? 'Delete' : mode === 'edit' ? 'Save' : 'Create' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

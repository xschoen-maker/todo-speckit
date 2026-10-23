<script setup>
import { ref, watch } from "vue";
import Todos from "../services/todoServices.js";
const props = defineProps({ list: Object });
const emit = defineEmits(["close"]);
const todos = ref([]), loading = ref(false), saving = ref(false), error = ref("");
const dialog = ref(false), mode = ref("add"), selected = ref(null), title = ref(""), form = ref(null);
const rules = [v => !!v?.trim() || "Todo title is required.", v => !v || v.trim().length <= 255 || "Todo title must be 255 characters or fewer."];
async function load() {
  if (!props.list) return;
  const id = props.list.id; loading.value = true; error.value = ""; todos.value = [];
  try { const res = await Todos.getTodos(id); if (props.list?.id === id) todos.value = res.data; }
  catch (e) { if (props.list?.id === id) error.value = e.response?.data?.message || "Unable to load todos."; }
  finally { if (props.list?.id === id) loading.value = false; }
}
watch(() => props.list, () => { dialog.value = false; load(); }, { immediate: true });
function open(action, todo = null) {
  mode.value = action; selected.value = todo; title.value = todo?.title || ""; error.value = ""; dialog.value = true;
}
async function save() {
  if (mode.value !== "delete" && !(await form.value.validate()).valid) return;
  saving.value = true; error.value = "";
  try {
    if (mode.value === "delete") await Todos.deleteTodo(selected.value.id);
    else if (mode.value === "edit") await Todos.updateTodo(selected.value.id, { title: title.value.trim() });
    else await Todos.createTodo(props.list.id, { title: title.value.trim() });
    dialog.value = false; await load();
  } catch (e) { error.value = e.response?.data?.message || "Unable to save todo."; }
  finally { saving.value = false; }
}
async function toggle(todo, completed) {
  saving.value = true; error.value = "";
  try { await Todos.updateTodo(todo.id, { completed }); await load(); }
  catch (e) { error.value = e.response?.data?.message || "Unable to update todo."; }
  finally { saving.value = false; }
}
</script>
<template>
  <v-dialog :model-value="!!list" max-width="800" @update:model-value="v => !v && emit('close')">
    <v-card>
      <v-card-item>
        <h2 class="text-h5">{{ list?.name }} — Items</h2>
        <template #append><v-btn color="primary" class="oc-cta" @click="open('add')">+ Add Item</v-btn></template>
      </v-card-item>
      <v-card-text>
        <v-alert v-if="error && !dialog" type="error" class="mb-4">{{ error }}</v-alert>
        <v-progress-linear v-if="loading" indeterminate aria-label="Loading todos" />
        <p v-else-if="!todos.length">No todos in this list yet.</p>
        <v-list v-else>
          <v-list-item v-for="todo in todos" :key="todo.id" :data-todo-id="todo.id" border rounded="lg" class="mb-2">
            <template #prepend><v-checkbox-btn :model-value="todo.completed" :aria-label="`Complete ${todo.title}`" :disabled="saving" @update:model-value="v => toggle(todo, v)" /></template>
            <span :class="{ 'text-decoration-line-through text-medium-emphasis': todo.completed }">{{ todo.title }}</span>
            <template #append>
              <v-btn icon="mdi-pencil-outline" size="small" variant="text" aria-label="Edit todo" @click="open('edit', todo)" />
              <v-btn icon="mdi-delete-outline" size="small" variant="text" aria-label="Delete todo" @click="open('delete', todo)" />
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions><v-btn color="secondary" @click="emit('close')">Close</v-btn></v-card-actions>
      <v-dialog v-model="dialog" max-width="480">
        <v-card>
          <v-card-title>{{ mode === 'delete' ? 'Delete todo' : mode === 'edit' ? 'Edit todo' : 'Add item' }}</v-card-title>
          <v-card-text>
            <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
            <p v-if="mode === 'delete'">Delete “{{ selected?.title }}”?</p>
            <v-form v-else ref="form" @submit.prevent="save"><v-text-field v-model="title" label="Todo title" :rules="rules" autofocus /></v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn color="secondary" :disabled="saving" @click="dialog = false">Cancel</v-btn>
            <v-btn color="primary" variant="elevated" class="oc-cta" :loading="saving" @click="save">{{ mode === 'delete' ? 'Delete' : mode === 'edit' ? 'Save' : 'Add' }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-dialog>
</template>

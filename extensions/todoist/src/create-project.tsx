import { useState } from "react";
import { ActionPanel, Toast, Form, Icon, render, ToastStyle, showToast, open, SubmitFormAction } from "@raycast/api";
import { AddProjectArgs, colors } from "@doist/todoist-api-typescript";
import useSWR from "swr";
import { SWRKeys } from "./types";
import { handleError, todoist } from "./api";

function CreateProject() {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>();
  const [favorite, setFavorite] = useState<boolean>(false);
  const [colorId, setColorId] = useState<string>();

  const { data, error } = useSWR(SWRKeys.projects, () => todoist.getProjects());

  if (error) {
    handleError({ error, title: "Unable to get projects" });
  }

  const projects = data?.filter((project) => !project.inboxProject);

  function clear() {
    setName("");
    setParentId("");
    setFavorite(false);
  }

  async function submit() {
    const body: AddProjectArgs = { name, favorite };

    if (!body.name) {
      await showToast(ToastStyle.Failure, "The project's name is required");
      return;
    }

    if (parentId) {
      body.parentId = parseInt(parentId);
    }

    if (colorId) {
      body.color = parseInt(colorId);
    }

    const toast = new Toast({ style: ToastStyle.Animated, title: "Creating project..." });
    await toast.show();

    try {
      const { url } = await todoist.addProject(body);
      toast.style = ToastStyle.Success;
      toast.title = "Project created";
      toast.primaryAction = {
        title: "Open in browser",
        shortcut: { modifiers: ["cmd"], key: "o" },
        onAction: () => open(url),
      };
      clear();
    } catch (error) {
      handleError({ error, title: "Unable to create task" });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <SubmitFormAction title="Create Project" onSubmit={submit} icon={Icon.Plus} />
        </ActionPanel>
      }
      isLoading={!data && !error}
    >
      <Form.TextField id="name" title="Name" placeholder="My project" value={name} onChange={setName} />

      <Form.Dropdown id="color" title="Color" value={colorId} onChange={setColorId} storeValue>
        {colors.map(({ name, id }) => (
          <Form.Dropdown.Item value={String(id)} title={name} key={id} />
        ))}
      </Form.Dropdown>

      {projects && projects.length > 0 ? (
        <Form.Dropdown id="parent_id" title="Parent project" value={parentId} onChange={setParentId}>
          <Form.Dropdown.Item value="" title="None" />
          {projects.map(({ id, name }) => (
            <Form.Dropdown.Item value={String(id)} title={name} key={id} />
          ))}
        </Form.Dropdown>
      ) : null}

      <Form.Checkbox id="favorite" label="Mark as favorite?" value={favorite} onChange={setFavorite} />
    </Form>
  );
}

render(<CreateProject />);

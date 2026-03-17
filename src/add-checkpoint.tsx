import { ActionPanel, Action, Icon, List, showToast, Toast, popToRoot } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useState, useEffect } from "react";
import { addCheckpoint, getTodayCheckpoints, deleteCheckpoint } from "./utils/storage";
import { CheckpointForm } from "./components/CheckpointForm";
import { Checkpoint } from "./types";

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadCheckpoints() {
    try {
      const loaded = await getTodayCheckpoints();
      loaded.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setCheckpoints(loaded);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCheckpoints();
  }, []);

  async function handleSubmit() {
    const description = searchText.trim();
    if (!description) return;

    try {
      const checkpoint = await addCheckpoint(description);
      const time = formatTime(checkpoint.timestamp);
      await showToast({
        style: Toast.Style.Success,
        title: "Checkpoint saved",
        message: `${time} — ${description}`,
      });
      popToRoot();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to save checkpoint",
        message: String(error),
      });
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCheckpoint(id);
      await showToast({ style: Toast.Style.Success, title: "Checkpoint deleted" });
      await loadCheckpoints();
    } catch (error) {
      await showFailureToast(error, { title: "Failed to delete checkpoint" });
    }
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="What are you working on?"
      onSearchTextChange={setSearchText}
      filtering={false}
      throttle={false}
    >
      {searchText.trim().length > 0 && (
        <List.Section title="New Checkpoint">
          <List.Item
            icon={Icon.Plus}
            title={`Log: ${searchText.trim()}`}
            actions={
              <ActionPanel>
                <Action title="Save Checkpoint" icon={Icon.CheckCircle} onAction={handleSubmit} />
              </ActionPanel>
            }
          />
        </List.Section>
      )}
      {checkpoints.length > 0 ? (
        <List.Section title={`Today — ${checkpoints.length} checkpoint${checkpoints.length !== 1 ? "s" : ""}`}>
          {checkpoints.map((checkpoint) => (
            <List.Item
              key={checkpoint.id}
              icon={Icon.Clock}
              title={checkpoint.description}
              accessories={[{ text: formatTime(checkpoint.timestamp) }]}
              actions={
                <ActionPanel>
                  <ActionPanel.Section>
                    <Action.Push
                      title="Edit Checkpoint"
                      icon={Icon.Pencil}
                      target={<CheckpointForm checkpoint={checkpoint} onSave={loadCheckpoints} />}
                      shortcut={{ modifiers: ["cmd"], key: "e" }}
                    />
                    <Action.CopyToClipboard
                      title="Copy Description"
                      content={checkpoint.description}
                      shortcut={{ modifiers: ["cmd"], key: "c" }}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section>
                    <Action
                      title="Delete Checkpoint"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      onAction={() => handleDelete(checkpoint.id)}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "backspace" }}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ) : (
        !searchText.trim() && <List.EmptyView icon={Icon.Clock} title="No checkpoints today" />
      )}
    </List>
  );
}

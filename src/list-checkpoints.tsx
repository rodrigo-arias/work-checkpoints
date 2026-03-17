import { ActionPanel, Action, Icon, List, showToast, Toast, confirmAlert, Alert } from "@raycast/api";
import { useEffect, useState } from "react";
import { Checkpoint } from "./types";
import {
  getCurrentWeekCheckpoints,
  deleteCheckpoint,
  clearTodayCheckpoints,
  getJsonFilePath,
} from "./utils/storage";
import { CheckpointForm } from "./components/CheckpointForm";
import { showFailureToast } from "@raycast/utils";

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export default function Command() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadCheckpoints() {
    try {
      const loaded = await getCurrentWeekCheckpoints();
      loaded.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setCheckpoints(loaded);
    } catch (error) {
      await showFailureToast(error, { title: "Failed to load checkpoints" });
    } finally {
      setIsLoading(false);
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

  async function handleClearAll() {
    const confirmed = await confirmAlert({
      title: "Clear All Today's Checkpoints",
      message: "This will delete all checkpoints for today. This action cannot be undone.",
      primaryAction: {
        title: "Clear All",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      try {
        await clearTodayCheckpoints();
        await showToast({ style: Toast.Style.Success, title: "All checkpoints cleared" });
        await loadCheckpoints();
      } catch (error) {
        await showFailureToast(error, { title: "Failed to clear checkpoints" });
      }
    }
  }

  useEffect(() => {
    loadCheckpoints();
  }, []);

  // Group checkpoints by date
  const grouped = new Map<string, Checkpoint[]>();
  for (const checkpoint of checkpoints) {
    const existing = grouped.get(checkpoint.date) ?? [];
    existing.push(checkpoint);
    grouped.set(checkpoint.date, existing);
  }

  // Sort dates descending
  const sortedDates = [...grouped.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search checkpoints...">
      <List.EmptyView
        icon={Icon.Clock}
        title="No Checkpoints This Week"
        description={'Use "Add Checkpoint" to log what you\'re working on'}
      />
      {sortedDates.map((date) => {
        const items = grouped.get(date)!;
        return (
          <List.Section key={date} title={formatDayLabel(date)} subtitle={`${items.length}`}>
            {items.map((checkpoint) => (
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
                      <Action.CopyToClipboard
                        title="Copy JSON File Path"
                        content={getJsonFilePath()}
                        shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
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
                      <Action
                        title="Clear All Today's Checkpoints"
                        icon={Icon.Trash}
                        style={Action.Style.Destructive}
                        onAction={handleClearAll}
                      />
                    </ActionPanel.Section>
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        );
      })}
    </List>
  );
}

import { Form, ActionPanel, Action, useNavigation } from "@raycast/api";
import { useForm, FormValidation, showFailureToast } from "@raycast/utils";
import { Checkpoint } from "../types";
import { updateCheckpoint } from "../utils/storage";

interface CheckpointFormProps {
  checkpoint: Checkpoint;
  onSave?: () => void;
}

interface FormValues {
  description: string;
}

export function CheckpointForm({ checkpoint, onSave }: CheckpointFormProps) {
  const { pop } = useNavigation();

  const { handleSubmit, itemProps } = useForm<FormValues>({
    onSubmit: async (values) => {
      try {
        await updateCheckpoint(checkpoint.id, values.description);
        onSave?.();
        pop();
      } catch (error) {
        showFailureToast(error, { title: "Failed to update checkpoint" });
      }
    },
    validation: {
      description: FormValidation.Required,
    },
    initialValues: {
      description: checkpoint.description,
    },
  });

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Update Checkpoint" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        {...itemProps.description}
        title="Description"
        placeholder="What were you working on?"
        autoFocus
      />
    </Form>
  );
}

import { FC } from "react";
import { Icon } from "@iconify/react";
import { deleteProject } from "@/components/platform/project/actions";
import { toast } from "sonner";
import type { Dictionary } from "@/components/internationalization";

interface DeleteProps {
  id: string | undefined;
  onSuccess?: () => Promise<void>;
  dictionary: Dictionary;
}

const Delete: FC<DeleteProps> = ({ id, onSuccess, dictionary }) => {
  const handleDelete = async () => {
    if (!id) return;

    toast.custom(
      (t) => (
        <div className="bg-red-500 text-white p-3 rounded flex justify-between items-center w-full">
          <span>{dictionary.common.areYouSure || "Are you sure?"}</span>
          <div className="flex gap-2 ms-6">
            <button
              className="px-2 py-1 bg-white text-red-500 rounded text-sm font-medium"
              onClick={async () => {
                toast.dismiss(t);
                try {
                  const result = await deleteProject(id);

                  if (result.success) {
                    toast.success(dictionary.common.success || "Project deleted successfully");
                    if (onSuccess) {
                      await onSuccess();
                    }
                  } else {
                    toast.error(result.error || dictionary.common.error || "Failed to delete project");
                  }
                } catch (error: unknown) {
                  toast.error(error instanceof Error ? error.message : (dictionary.common.error || "An unexpected error occurred"));
                }
              }}
            >
              {dictionary.common.delete}
            </button>
            <button
              className="px-2 py-1 bg-red-600 text-white rounded text-sm font-medium"
              onClick={() => toast.dismiss(t)}
            >
              {dictionary.common.cancel}
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: "bottom-right" }
    );
  };

  return (
    <button
      onClick={handleDelete}
      className="p-3 hover:bg-red-100 dark:hover:bg-red-950 rounded-xl transition-colors text-red-600 border bg-background"
      title={dictionary.common.delete}
    >
      <Icon icon="ph:trash-simple" width={24} />
    </button>
  );
};

export default Delete;

import { type ReactElement, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, type PreviewPageDto } from "../../api-client";
import { mapErrorToMessage } from "../common/errors";
import { Card } from "../common/ui/Card";
import { PageHeader } from "../layout/PageHeader";

type PreviewRouteProps = {
  onUnauthorized: () => void;
};

export function PreviewRoute({
  onUnauthorized,
}: PreviewRouteProps): ReactElement {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [error, setError] = useState("");
  const [data, setData] = useState<PreviewPageDto | null>(null);

  useEffect(() => {
    async function run(): Promise<void> {
      if (!id) {
        setError("Not found.");
        setState("error");
        return;
      }

      setState("loading");
      const result = await api.previewPage(id);

      if (!result.ok) {
        if (result.error.status === 401) {
          onUnauthorized();
          return;
        }

        setError(mapErrorToMessage(result.error));
        setState("error");
        return;
      }

      setData(result.data);
      setState("ready");
    }

    void run();
  }, [id, onUnauthorized]);

  if (state === "loading") {
    return <p className="ui-inline-message">Loading preview...</p>;
  }

  if (state === "error") {
    return (
      <p className="ui-inline-message ui-inline-message--error" role="alert">
        {error}
      </p>
    );
  }

  return (
    <>
      <PageHeader title="Preview page" />
      <Card>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </Card>
    </>
  );
}

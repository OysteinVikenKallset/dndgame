export type SessionStatus = "unknown" | "authenticated" | "unauthenticated";

export type SubmitState = "idle" | "submitting" | "success" | "error";

export type FieldErrors = Record<string, string>;

export type Toast = {
  type: "success" | "info" | "error";
  message: string;
};

export type PageComponent =
  | {
      componentType: "richText";
      props: {
        html: string;
      };
    }
  | {
      componentType: "image";
      props: {
        mediaId: string;
        url: string;
        alt: string;
        caption?: string;
      };
    }
  | {
      componentType: "textImage";
      props: {
        title?: string;
        text: string;
        mediaId: string;
        url: string;
        alt: string;
        layout: "imageLeft" | "imageRight";
      };
    }
  | {
      componentType: "quote";
      props: {
        quote: string;
        author?: string;
      };
    };

export type PageFormValues = {
  title: string;
  slug: string;
  template: "page" | "post";
  showInNav: boolean;
  components: PageComponent[];
  bodyRichText: string;
};

export type SessionStatus = "unknown" | "authenticated" | "unauthenticated";

export type SubmitState = "idle" | "submitting" | "success" | "error";

export type FieldErrors = Record<string, string>;

export type Toast = {
  type: "success" | "info" | "error";
  message: string;
};

export type GridWidth = "100" | "50" | "33" | "25";
export type GridAlign = "left" | "center" | "right";

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
    }
  | {
      componentType: "button";
      props: {
        label: string;
        url: string;
        openInNewTab: boolean;
      };
    }
  | {
      componentType: "headline";
      props: {
        text: string;
        level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      };
    }
  | {
      componentType: "grid";
      props: {
        width: GridWidth;
        contentAlign: GridAlign;
        selfAlign: GridAlign;
        components: PageComponent[];
      };
    };

export type PageFormValues = {
  title: string;
  slug: string;
  template: "page" | "post";
  showTitle: boolean;
  showInNav: boolean;
  components: PageComponent[];
  bodyRichText: string;
};
